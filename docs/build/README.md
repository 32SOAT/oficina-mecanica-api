# Build e execução

Guia operacional: ambiente local, Docker, migrations, seeding e testes.

## Pré-requisitos

| Ferramenta | Uso |
| ---------- | --- |
| **Node.js 20.11+** ou **22** | Build e execução local |
| **npm ≥ 9** | Gerenciador de pacotes |
| **Docker** e **Docker Compose** | PostgreSQL e/ou app em containers |

Com **[nvm](https://github.com/nvm-sh/nvm)** e o `.nvmrc` na raiz:

```bash
nvm install
nvm use
npm install
```

## Configuração do ambiente

1. Copie o exemplo de variáveis:

```bash
cp .env.example .env
```

2. Ajuste usuário/senha do banco, porta da API etc. O `.env.example` documenta todos os campos.

**`POSTGRES_HOST`:**

- API na máquina + Postgres no Docker → `POSTGRES_HOST=localhost`
- API no Docker Compose → o serviço `app` já usa `POSTGRES_HOST=db` (não precisa alterar o `.env` para o Compose)

---

## Desenvolvimento local (npm)

### Fluxo rápido

```bash
docker compose up -d db    # só o banco
npm run migration:run      # build + migrations
npm run start:dev          # API com reload
```

### Comandos

| Objetivo | Comando |
| -------- | ------- |
| Instalar deps | `npm install` |
| Build | `npm run build` |
| Dev (watch) | `npm run start:dev` |
| Debug | `npm run start:debug` |
| Execução única | `npm run start` |
| Produção | `npm run start:prod` |
| Migrations | `npm run migration:run` |
| Revert migration | `npm run migration:revert` |
| Testes unitários | `npm run test` |
| Testes e2e | `npm run test:e2e` |
| Cobertura | `npm run test:cov` |
| Lint | `npm run lint` |
| Formatação | `npm run format` |

A porta da API vem de `APP_PORT` no `.env` (padrão: `3000`).

### Migrations

Com Postgres no ar e `.env` apontando para ele:

```bash
npm run migration:run
```

O script roda `npm run build` antes de aplicar as migrations via TypeORM.

### Seeding

Endpoint para popular dados de desenvolvimento (clientes, veículos, serviços, estoque, usuários):

```bash
POST /api/v1/seeding
```

```bash
curl -X POST http://localhost:3000/api/v1/seeding
```

A rota **não** cria ordens de serviço.

---

## Docker

O `Dockerfile` usa **multi-stage build**: compila na etapa de build e copia só `dist/` + deps de produção na imagem final.

### Subir banco e API

```bash
docker compose build          # ou --no-cache após mudar migrations/código
docker compose up -d
docker compose logs -f app
```

- **db** — PostgreSQL (healthcheck antes do `app`)
- **app** — API na porta `APP_PORT` (padrão `3000`)

### Migrations no container

Use o TypeORM direto (o `dist/` já veio da imagem):

```bash
docker compose exec app npx typeorm migration:run -d dist/database/data-source
docker compose exec app npx typeorm migration:revert -d dist/database/data-source
```

Se alterou arquivos de migration no repo, **reconstrua a imagem** antes de rodar de novo.

### Seeding no container

```bash
docker compose exec app curl -X POST http://localhost:3000/api/v1/seeding -d '{}'
```

---

## Resumo rápido

| Objetivo | npm (local) | Docker |
| -------- | ----------- | ------ |
| Instalar deps | `npm install` | (na build da imagem) |
| Build | `npm run build` | `docker compose build` |
| Subir API + DB | `docker compose up -d db` + `npm run start:dev` | `docker compose up -d` |
| Migrations | `npm run migration:run` | `docker compose exec app npx typeorm migration:run -d dist/database/data-source` |
| Revert migration | `npm run migration:revert` | `docker compose exec app npx typeorm migration:revert -d dist/database/data-source` |

---

## Referências

- [README principal](../../README.md)
- [Análises de qualidade e segurança](../analysis/README.md)
- [Arquitetura](../architecture/README.md)
