# ADR 003 — Auth de cliente via Lambda (CPF) e JWT com role


| Campo  | Valor      |
| ------ | ---------- |
| Data   | 15/08/2026 |
| Status | Aceita     |


## 📌 Contexto

A oficina tem **dois públicos** com contratos de autenticação incompatíveis e **duas tabelas** de identidade:

| Quem | Persistência | Como entra | O que o token precisa carregar |
| ---- | ------------ | ---------- | ------------------------------ |
| **Admin** (equipe da oficina) | `usuario` | e-mail + senha (hash, troca de senha) | `sub` = `usuario.id` |
| **Cliente** | `cliente` | só o CPF já cadastrado | `sub` = `cliente.id` |

O login de admin já existia neste repositório (`POST /api/v1/auth/login`), com JWT HS256 e sem claim de papel. As rotas da oficina (estoque, clientes, transições internas da OS, etc.) são operação interna: um token emitido só com CPF **não** pode cair nelas por acidente.

O cliente precisa autenticar para consultar status e aprovar/reprovar orçamento. Esse fluxo não usa senha neste entregável: a prova de identidade é “existe um cliente ativo com esse documento”. Misturar isso no mesmo módulo Nest do admin significaria:

- acoplar hash de senha, `PATCH /auth/password` e lookup por CPF no mesmo handler;
- ou inventar uma tabela única de identidade (`identidade` / `ator_tipo`) só para emitir um token.

Em deploy, a API no EKS já tem um NLB. Faltava uma **porta de entrada única** em que o cliente autenticasse e, em seguida, chamasse as rotas Nest sem descobrir um hostname separado.

A pergunta da ADR é: **onde emite cada JWT**, **como o Nest distingue os papéis** e **como o tráfego chega na API**.

## ✅ Decisão

Mantemos **dois emissores**, um **contrato JWT compartilhado** e **autorização no Nest**.

### Emissão

- **Cliente:** Lambda `POST /auth/cpf` no repositório [oficina-mecanica-lambda-auth](https://github.com/32SOAT/oficina-mecanica-lambda-auth). Consulta o Postgres (`cliente` com documento normalizado, `deleted_at IS NULL`) e assina `{ sub, cpf, role: "cliente" }`. Empacote ZIP (`handler.js`), não imagem Docker.
- **Admin:** permanece `POST /api/v1/auth/login` neste repo. O JWT passa a incluir `role: "admin"` (além de `sub`, `email`, `username`).

### Validação no Nest

- **Mesmo `JWT_SECRET` (HS256)** na Lambda e no Nest. Sem o mesmo segredo, o token de cliente falha na assinatura (`401` “Token inválido ou expirado”) mesmo com payload correto; o de admin passa no guard e só cai no papel (`403` “Acesso negado para este perfil”) — comportamento observado na integração.
- `parseJwtPayload` + `JwtAuthGuard` aceitam os dois formatos. Token legado de admin **sem** `role`, mas com `email` e `username`, continua `admin`. Token com `role: "cliente"` **sem** `cpf` é rejeitado.
- `RolesGuard` global: rota autenticada **sem** `@Roles` = só admin (fail-closed). Status / aprovar / reprovar orçamento = `@Roles('cliente')`. `PATCH /api/v1/auth/password` = `@Roles('admin')`.
- Aprovar/reprovar gravam `req.user.sub` em `historico_status_os.usuario_id` (uuid **sem FK**). Não unificamos identidade no banco (`identidade`, `ator_tipo`).

### Entrada na AWS

API Gateway HTTP API no repo da Lambda:

- `POST /auth/cpf` → Lambda
- `ANY /{proxy+}` → NLB do Nest (`nest_api_url`), incluindo login admin e `/api/v1/estoque`

Não cadastramos rota por endpoint: o proxy cobre o Nest. Login de cliente **não** entra no Swagger deste repo — a rota vive no Gateway.

Detalhe de rotas: [auth.md](../architecture/auth.md).

## 📊 Consequências

### 👍 Positivas

- O módulo Nest de admin (hash, troca de senha, usuários da oficina) não absorve um segundo contrato de login.
- Papel via claim no JWT: o papel vem de **qual fluxo autenticou**, não de uma coluna `role` compartilhada entre tabelas distintas.
- Default fail-closed: rota nova sem `@Roles` não fica aberta ao JWT de cliente.
- Um hostname público para cliente (auth CPF + API). O NLB continua por baixo; o Gateway é a fachada.
- Blast radius do serverless fica no lookup de CPF + emissão; a autorização de negócio permanece no Nest, onde já estão os casos de uso da OS.

### 👎 Negativas / trade-offs

- Dois repositórios, dois endpoints de login e **um segredo compartilhado**. Lambda e Nest precisam estar alinhados; quem possui o secret pode emitir os dois papéis. Tokens antigos invalidam se o secret mudar.
- Sem `iss`/`aud` distintos: a isolação entre emissores é operacional, não criptográfica.
- `historico_status_os.usuario_id` pode guardar uuid de `usuario` ou de `cliente`. Relatórios que façam join precisam das duas tabelas.
- Qualquer cliente autenticado que conheça o UUID da OS acessa status/aprovar/reprovar. **Não há filtro por dono** (`sub` vs `os.cliente_id`) nesta decisão.
- O Gateway não autoriza: só encaminha. Token errado só é recusado no Nest.

## 🔀 Alternativas consideradas


| Alternativa | Por que não foi escolhida agora |
| ----------- | ------------------------------- |
| **Login de cliente no Nest (mesmo módulo `auth`)** | Unificaria a verificação JWT, mas misturaria lookup por CPF com o fluxo de senha já estável. O Nest continuaria sendo o único ponto de entrada; o Gateway não teria função de auth e o login do cliente ficaria acoplado ao deploy do EKS (cold start da API para um POST que só lê `cliente`). |
| **Unificar admin e cliente na Lambda** | A Lambda passaria a conhecer hash de senha, troca de senha e dois modelos (`usuario` vs `cliente`) num único handler. Qualquer regressão no login interno da oficina sairia do ciclo de release da API. |
| **Amazon Cognito (ou IdP gerenciado)** | User pools, clients e triggers resolvem MFA e refresh, mas o cliente aqui não tem senha nem ciclo de vida de usuário no IdP — só um documento já persistido. O custo de setup e de sincronizar `cliente` com o pool não se paga neste recorte. |
| **Authorizer JWT/Lambda no API Gateway (Nest só recebe request já autorizado)** | O Gateway pode checar assinatura, mas o Nest ainda precisa de `sub`/`role` no histórico e no `RolesGuard`. Duas validações do mesmo contrato divergem fácil (secret, claims, expiração). A autorização de rota fica na API, que é quem conhece o domínio. |
| **Tabela `identidade` / coluna `ator_tipo` + FKs no histórico** | Auditoria mais limpa (ator admin vs cliente explícito). Exige migration, backfill e mudança em todos os writes de histórico. O `sub` no `usuario_id` cobre rastreio da ação sem esse custo agora. |
| **Dois `JWT_SECRET` (um admin, um cliente) ou assimétrico (RS256)** | Impede a Lambda de forjar token admin. Exige duas configs, rotação e documentação extra no lab. HS256 compartilhado foi o caminho mais simples de fechar o fluxo ponta a ponta — e o ponto que quebrou na integração quando os secrets divergiram. |
| **RBAC persistido no banco (coluna `role` em `usuario`)** | Admin e cliente não compartilham tabela. Inventar `role` só em `usuario` não descreve o cliente; duplicar a coluna nas duas tabelas não unifica o token. Claim no JWT evita migration. |
| **Filtrar OS pelo dono (`sub` = `cliente_id`) já nesta decisão** | Correto para produção (evita IDOR por UUID). É autorização **por recurso**, não por papel. Fica evolução explícita, não bloqueio desta ADR. |
| **Lambda como container Docker na AWS** | O runtime da function é Node empacotado em ZIP. Docker no repo da Lambda serve só ao Postgres/servidor local de desenvolvimento. |

## 🔮 Evolução prevista (não faz parte desta ADR)

- Filtrar consulta/aprovação da OS pelo `sub` do JWT de cliente.
- `ator_tipo` (ou duas colunas) no histórico.
- `iss`/`aud` (ou chaves distintas) se admin e cliente precisarem de isolamento criptográfico.
- Papéis internos da oficina (mecânico, atendente), se o domínio exigir.
- Authorizer no Gateway como *defesa em profundidade*, desde que o contrato JWT no Nest continue a fonte da autorização de rota.
