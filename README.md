# Oficina Mecânica API

**MVP** para gerenciamento de oficina mecânica: clientes, veículos, ordens de serviço (workflow com status), serviços, estoque e histórico. Escopo enxuto para validar fluxo e modelo de dados antes de evoluir.

Stack: [NestJS](https://nestjs.com/) · TypeORM · PostgreSQL · JWT

## O que a API faz

| Módulo | Responsabilidade |
| ------ | ---------------- |
| **Clientes** | CRUD, busca por documento (CPF/CNPJ) |
| **Veículos** | CRUD, vínculo com cliente por documento |
| **Serviços** | Catálogo de serviços da oficina |
| **Estoque** | Peças/insumos, reposição, operação de saldo |
| **Ordens de serviço** | Criação, orçamento, aprovação, execução, transições de status, relatórios |
| **Usuários** | CRUD de usuários do sistema |
| **Auth** | Login JWT, troca de senha, guard global |

Documentação interativa: **Swagger** em [`/api`](http://localhost:3000/api) (com Bearer auth).

**Arquitetura:** monólito modular NestJS com camadas (domain → application → infrastructure → presentation).

- **Respostas:** use cases retornam entidade de domínio ou read model; mapeamento HTTP só na presentation (`fromDomain` / `fromReadModel`).
- **Erros:** application/infra (e auth: use cases + `JwtAuthGuard`) lançam `NotFoundError`, `BadRequestError`, `UnauthorizedError`, etc.; o `ApplicationExceptionFilter` traduz para HTTP (`ValidationPipe` continua com exceções Nest na borda).

Detalhes em [docs/architecture](./docs/architecture/README.md).

## Início rápido

**Pré-requisitos:** Node 20.11+ (ou 22), Docker Compose, arquivo `.env`.

```bash
cp .env.example .env
nvm use && npm install          # se usar nvm
docker compose up -d db
npm run migration:run
npm run start:dev
```

API em `http://localhost:3000` (porta configurável via `APP_PORT`).

Detalhes de build, Docker, migrations e testes: **[docs/build](./docs/build/README.md)**.

## Autenticação

JWT no header `Authorization: Bearer <token>`. Rotas protegidas por padrão; exceções marcadas com `@Public()`.

**Login:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@oficina.com", "password": "admin123"}'
```

Use o token retornado nas demais requisições. No Swagger, clique em **Authorize** e cole o JWT.

Variáveis: `JWT_SECRET` (obrigatória), `JWT_EXPIRES_IN` (opcional, padrão `1h`). Ver `.env.example`.

## Documentação

| Documento | Conteúdo |
| --------- | -------- |
| [Índice](./docs/README.md) | Entrada para toda a documentação |
| [Arquitetura](./docs/architecture/README.md) | Camadas, ports, mapeamento HTTP, exceções, read models, dívida técnica |
| [Build e execução](./docs/build/README.md) | npm, Docker, migrations, seeding, testes |
| [CI/CD](./docs/ci-cd.md) | Pipeline GitHub Actions: build, testes, imagem Docker, Terraform e deploy no EKS |
| [Análises](./docs/analysis/README.md) | SonarQube, OWASP ZAP |
| [ADRs](./docs/adr/README.md) | Decisões arquiteturais |
| [ADR 001 — Banco de dados](./docs/adr/001-escolha-do-banco-de-dados.md) | Rascunho |
