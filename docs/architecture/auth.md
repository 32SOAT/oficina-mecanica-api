# 🔐 Autenticação (admin + cliente)

A API tem **dois logins**. O de cliente não vive neste repositório.

| Quem | Como | Onde | JWT |
| ---- | ---- | ---- | --- |
| **Admin** (oficina) | e-mail + senha | `POST /api/v1/auth/login` neste repo | `{ sub, role: "admin", email, username }` — `sub` é `usuario.id` |
| **Cliente** | CPF | `POST /auth/cpf` no [oficina-mecanica-lambda-auth](https://github.com/32SOAT/oficina-mecanica-lambda-auth) | `{ sub, role: "cliente", cpf }` — `sub` é `cliente.id` |

O **mesmo `JWT_SECRET`** assina os dois tokens. O Nest só verifica a assinatura e o formato (`parseJwtPayload` + `JwtAuthGuard`). Não há coluna `role` no banco: o papel vem de **qual tabela autenticou**.

## Papéis nas rotas

Depois do JWT válido, o `RolesGuard` autoriza:

- Rota autenticada **sem** `@Roles` → só `admin`
- `@Roles('cliente')` → só JWT de cliente
- `@Public()` → sem token (health, login admin, seeding)

Rotas de **cliente**:

- `GET /api/v1/ordens/:id/status`
- `POST /api/v1/ordens/:id/aprovar-orcamento`
- `POST /api/v1/ordens/:id/reprovar-orcamento`

Aprovar/reprovar gravam o `sub` do token em `historico_status_os.usuario_id` (uuid, sem FK). Admin nas outras transições da OS já gravava o `sub` do usuário.

`PATCH /api/v1/auth/password` é `@Roles('admin')`: JWT de cliente autentica, mas recebe **403**.

## API Gateway

Na AWS, a porta de entrada pública é o **HTTP API** do repo da Lambda:

- `POST /auth/cpf` → Lambda
- `ANY /{proxy+}` (`/api/...`, Swagger `/api`) → NLB do Nest, quando `nest_api_url` está setado

Login de admin continua no Nest (`POST /api/v1/auth/login`), acessível pelo Gateway depois do proxy.

Deploy, variáveis e curls: **[README da Lambda](https://github.com/32SOAT/oficina-mecanica-lambda-auth)**. No Academy, a ordem é Nest no ar → hostname do NLB → `terraform apply` da Lambda. Passo a passo: [academy-passo-a-passo.md](../deployment/academy-passo-a-passo.md).

## Fora de escopo (Fase 3)

- Unificar login admin na Lambda
- Coluna `ator_tipo` / duas FKs no histórico
- Filtrar OS só do cliente dono (`sub`)
- Papéis internos (mecânico, atendente)
