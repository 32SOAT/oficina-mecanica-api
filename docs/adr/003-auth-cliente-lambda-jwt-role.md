# ADR 003 — Auth de cliente via Lambda (CPF) e JWT com role


| Campo  | Valor      |
| ------ | ---------- |
| Data   | 15/08/2026 |
| Status | Aceita     |


## 📌 Contexto

A Fase 3 pede autenticação do **cliente via CPF**, function serverless que consulta o cliente e emite JWT, e um API Gateway na frente das rotas. A API já tinha login de **admin** (e-mail/senha) em Nest, JWT sem `role`.

Cliente e admin são tabelas diferentes (`cliente` vs `usuario`). Centralizar os dois logins na Lambda misturaria hash de senha, troca de senha e o contrato do PDF.

## ✅ Decisão

- **Cliente:** Lambda `POST /auth/cpf` no repo [oficina-mecanica-lambda-auth](https://github.com/32SOAT/oficina-mecanica-lambda-auth). JWT `{ sub, cpf, role: "cliente" }`.
- **Admin:** permanece `POST /api/v1/auth/login` neste repo. JWT passa a incluir `role: "admin"`.
- **Mesmo `JWT_SECRET`.** O Nest valida o token (`JwtAuthGuard`) e o papel (`RolesGuard`). Default autenticado = admin. Rotas de status/aprovar/reprovar OS = cliente.
- **API Gateway HTTP API** no repo da Lambda: `/auth/cpf` → Lambda; `/{proxy+}` → NLB do Nest (`nest_api_url`).

Não unificamos identidade no banco (`identidade`, `ator_tipo`). O `sub` no histórico da OS basta para a Fase 3.

## 📊 Consequências

### 👍 Positivas

- Atende o PDF sem mover o login de admin.
- Papel no JWT, sem migration.
- Gateway único para o vídeo (CPF + rotas da API).

### 👎 Negativas / trade-offs

- Dois endpoints de login, dois repositórios.
- `historico_status_os.usuario_id` pode guardar uuid de `usuario` ou de `cliente` (sem FK). Join nas duas tabelas; colisão de UUID é irrelevante na prática.
- Qualquer cliente autenticado que saiba o UUID da OS acessa status/aprovar (ainda sem filtro por dono).

Detalhes de rotas e Gateway: [auth.md](../architecture/auth.md).
