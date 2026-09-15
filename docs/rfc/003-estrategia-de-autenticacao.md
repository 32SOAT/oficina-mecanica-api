# RFC 003 — Estratégia de autenticação

| Campo | Valor |
| ----- | ----- |
| Número | 003 |
| Data | 15/08/2026 |
| Status | ✅ Encerrada — Aprovada |
| Autores | Juliana Silveira Amorim do Nascimento |
| Resultado | [ADR 003](../adr/003-auth-cliente-lambda-jwt-role.md) |

> 📅 **Documento reconstruído em 09/2026.** A arquitetura e a divisão de responsabilidades foram definidas pelo grupo em 25/08/2026; a implementação aconteceu em datas diferentes por pessoa. O histórico do Git é a referência oficial.

## 📄 Sumário

Proposta de autenticação em **dois emissores**: uma Lambda que valida CPF e emite JWT com `role: "cliente"`, e o login administrativo já existente no Nest, que passa a emitir `role: "admin"`. Ambos assinam com o mesmo segredo HS256, e a autorização por papel fica nos guards do Nest.

## 📌 Motivação

O enunciado da fase exige proteger rotas sensíveis com autenticação via CPF e criar uma function serverless que valide o CPF, consulte o cliente e devolva um JWT.

O sistema já tinha autenticação: `POST /api/v1/auth/login`, com e-mail, senha e hash, para a equipe da oficina. O requisito novo não substitui esse fluxo, coexiste com ele.

Os dois públicos são estruturalmente diferentes:

| | Admin | Cliente |
| --- | ----- | ------- |
| Tabela | `usuario` | `cliente` |
| Credencial | E-mail e senha com hash | Apenas CPF cadastrado |
| Ciclo de vida | Criação, troca de senha | Nenhum. Existe ou não |
| Rotas | Toda a operação interna | Status da OS, aprovar e reprovar orçamento |

Havia risco concreto de segurança: se os dois papéis compartilhassem o mesmo formato de token sem distinção, um token emitido apenas com CPF poderia alcançar rotas de estoque e de transição interna da OS.

## 📋 Requisitos

| # | Requisito |
| --- | --------- |
| R1 | Autenticação de cliente por CPF, em function serverless |
| R2 | Validação do CPF e consulta de existência e status na base |
| R3 | Emissão de JWT válido para as APIs protegidas |
| R4 | Preservar o login administrativo existente |
| R5 | Token de cliente não pode alcançar rota administrativa |
| R6 | Entrada pública única via API Gateway |
| R7 | Rastreabilidade do ator nas transições de status da OS |

## ⚖️ Critérios de avaliação

1. Cobertura de R1 a R7
2. Impacto sobre o módulo `auth` existente
3. Segurança do isolamento entre papéis
4. Esforço de implementação no prazo da fase
5. Custo de operação

## 🔀 Alternativas avaliadas

### A. Dois emissores, segredo compartilhado, autorização no Nest

Lambda emite token de cliente; Nest emite token de admin. Ambos HS256 com o mesmo `JWT_SECRET`. `parseJwtPayload` aceita os dois formatos e o `RolesGuard` decide o acesso, com default `['admin']` (fail-closed).

Gateway com duas rotas: `POST /auth/cpf` para a Lambda e `ANY /{proxy+}` para o NLB do Nest.

**A favor:** cobre R1 a R7. O módulo Nest não absorve um segundo contrato de login. Autorização fica onde estão os casos de uso. Blast radius do serverless limitado a lookup e emissão.

**Contra:** um segredo emite os dois papéis. Sem `iss` ou `aud`, o isolamento entre emissores é operacional, não criptográfico.

### B. Login de cliente dentro do Nest

Adicionar `POST /api/v1/auth/cpf` ao módulo `auth` existente.

Unificaria a verificação de token e eliminaria o segredo compartilhado. Falha em R1, porque o enunciado exige function serverless. Também misturaria lookup por CPF com o fluxo de senha já estável e acoplaria o login do cliente à disponibilidade do EKS.

### C. Emissor único na Lambda, para os dois papéis

A Lambda passaria a conhecer hash de senha, troca de senha e dois modelos de identidade num handler só. Qualquer regressão no login interno sairia do ciclo de release da API. Rejeitada.

### D. Amazon Cognito

IdP gerenciado, com MFA, refresh token e rotação de chaves resolvidos.

Tecnicamente superior em segurança. Não escolhida porque o cliente aqui **não tem senha nem ciclo de vida de usuário**: a prova de identidade é a existência de um documento já persistido em `cliente`. Usar Cognito exigiria sincronizar a tabela com um user pool e escrever triggers para um fluxo que o produto não tem. O custo de setup não se paga neste recorte.

Permanece como caminho natural se o produto ganhar senha, MFA ou autoatendimento de cadastro.

### E. Authorizer no API Gateway

O Gateway validaria o JWT antes de encaminhar, e o Nest receberia requisição já autorizada.

Não escolhida como **substituto**, porque o Nest ainda precisa de `sub` e `role` para o `RolesGuard` e para gravar o histórico. Duas validações do mesmo contrato divergem com facilidade, em secret, claims ou expiração. A autorização de rota deve ficar onde o domínio é conhecido.

Faz sentido como **defesa em profundidade**, desde que o Nest continue sendo a fonte da autorização. Registrado como evolução.

### F. Kong ou Traefik no cluster

O enunciado permite outros gateways. Kong traria plugins de autenticação e rate limiting.

Não escolhida: o API Gateway HTTP API já é necessário para expor a Lambda. Adicionar Kong no EKS duplicaria a porta de entrada, somaria chart e operação, sem ganho no escopo.

### G. Chaves separadas ou RS256

Segredos distintos por emissor, ou par assimétrico com o Nest validando pela chave pública.

Resolve o principal ponto fraco de A: a Lambda deixaria de poder forjar token de admin. Não adotada agora por exigir duas configurações, rotação e documentação adicional dentro do prazo da fase. **É a evolução mais relevante desta RFC.**

## 📊 Comparação

| Critério | A | B | C | D | E | F | G |
| -------- | - | - | - | - | - | - | - |
| R1 serverless | ✅ | ❌ | ✅ | 🟡 | ✅ | ✅ | ✅ |
| R4 preserva admin | ✅ | ✅ | ❌ | 🟡 | ✅ | ✅ | ✅ |
| R5 isola papéis | 🟡 | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ |
| Esforço | ✅ Baixo | ✅ Baixo | 🟡 | ❌ Alto | 🟡 | ❌ Alto | 🟡 |
| Custo | ✅ | ✅ | ✅ | 🟡 | ✅ | 🟡 | ✅ |

## ✅ Proposta

Adotar a **alternativa A**.

Contrato do token:

| Claim | Cliente | Admin |
| ----- | ------- | ----- |
| `sub` | `cliente.id` | `usuario.id` |
| `role` | `"cliente"` | `"admin"` |
| `cpf` | obrigatório | ausente |
| `email` / `username` | ausentes | obrigatórios |

Regras de autorização:

- `RolesGuard` global com default `['admin']`. Rota nova sem `@Roles` não fica acessível ao cliente por esquecimento.
- `@Roles('cliente')` apenas em consultar status, aprovar e reprovar orçamento.
- `sub` gravado em `historico_status_os.usuario_id`, atendendo R7.

Fluxo detalhado: [sequencia-auth.md](../architecture/sequencia-auth.md).

## ❓ Questões em aberto

| Questão | Encaminhamento |
| ------- | -------------- |
| Chaves separadas ou RS256 | Alternativa G. Evolução prioritária |
| Filtro por dono da OS | Cliente autenticado que conheça o UUID acessa qualquer OS. É IDOR conhecido. Autorização por recurso, não por papel |
| `ator_tipo` no histórico | `usuario_id` pode ser admin ou cliente. Ver [A4](../architecture/modelo-de-dados.md#a4--coluna-ator_tipo-no-histórico) |
| Expiração de 1 h é adequada? | Sem refresh token. Cliente precisa reautenticar |
| CORS com `allow_origins = ["*"]` | Aceitável em laboratório, inadequado em produção |
| Rate limiting em `/auth/cpf` | Não há. Endpoint permite enumeração de CPFs cadastrados |

A última é a mais séria em termos de privacidade: como o endpoint responde 401 para CPF inexistente e 200 para existente, é possível verificar se um CPF é cliente da oficina. Throttling no Gateway mitiga.

## 🏁 Resultado

**Encerrada — Aprovada.** Registrada em [ADR 003](../adr/003-auth-cliente-lambda-jwt-role.md) e implementada em `oficina-mecanica-lambda-auth` (emissão) e no módulo `auth` de `oficina-mecanica-api` (validação e autorização).

## 🔗 Relacionados

- [ADR 003](../adr/003-auth-cliente-lambda-jwt-role.md)
- [Sequência — autenticação](../architecture/sequencia-auth.md)
- [auth.md](../architecture/auth.md)
- [Componentes](../architecture/componentes.md)
