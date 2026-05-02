# 🚗Oficina Mecânica API

**MVP** (produto mínimo viável) para **gerenciamento de oficina mecânica**: cadastro de clientes e veículos, ordens de serviço, itens (serviços e peças), estoque e histórico de status. O escopo é propositalmente enxuto para validar fluxo e modelo de dados antes de evoluir para funcionalidades mais amplas.

API em [NestJS](https://nestjs.com/) com TypeORM e PostgreSQL.

## 📋 Pré-requisitos


| Ferramenta                       | Uso                                               |
| -------------------------------- | ------------------------------------------------- |
| **Node.js** **20.11+** ou **22** | Build e execução local com npm (veja nota abaixo) |
| **npm**                          | Vem com o Node; use **>= 9** com Node 20+         |
| **Docker** e **Docker Compose**  | Subir PostgreSQL e/ou a aplicação em containers   |


### Versão do Node

Este projeto precisa de **Node ≥ 20.11** (Nest 11, Joi 18, Jest 30, etc.). 

**Fluxo recomendado** — com **[nvm](https://github.com/nvm-sh/nvm)** e o `.nvmrc` na raiz:

```bash
nvm install
nvm use
node -v   # v22.x ou v20.11+
npm install
```

---

## 🚧 Configuração do ambiente

1. **Clone o repositório** e entre na pasta do projeto.
2. **Crie o arquivo `.env`** na raiz (o Git não versiona o `.env`). Copie o exemplo:

```bash
 cp .env.example .env
```

1. **Ajuste as variáveis** em `.env` se necessário (usuário/senha do banco, porta da API, etc.). O arquivo `.env.example` documenta os campos usados pelo Compose e pela aplicação.

**Importante sobre `POSTGRES_HOST`:**

- Ao rodar a **API na sua máquina** e o **PostgreSQL no Docker** (porta publicada), use `POSTGRES_HOST=localhost`.
- Ao rodar a **API dentro do Docker Compose**, o serviço do banco se chama `db`; o `docker-compose.yml` já define `POSTGRES_HOST=db` para o container da app — não precisa mudar isso no `.env` para o Compose, pois as variáveis do serviço `app` sobrescrevem o necessário.

---

## 💻 Desenvolvimento com npm (código na máquina)

### 1. Instalar dependências

```bash
npm install
```

### 2. Ter o PostgreSQL acessível

Escolha uma das formas:

- **Só o banco no Docker** (recomendado para dev local):
  ```bash
  docker compose up -d db
  ```
  No `.env`, use `POSTGRES_HOST=localhost` (e a mesma porta `POSTGRES_PORT` que estiver mapeada, em geral `5432`).
- **PostgreSQL instalado localmente** — configure host, porta, usuário, senha e banco no `.env`.

### 3. Build do projeto

```bash
npm run build
```

Gera a pasta `dist/` com o JavaScript compilado. Esse passo também é necessário antes de rodar **migrations** com os scripts npm (o `migration:run` executa um build prévio automaticamente).

### 4. Migrations (banco de dados)

Com o Postgres no ar e o `.env` apontando para ele (`localhost` se o banco for o container com porta publicada):

```bash
npm run migration:run
```

Esse script roda `npm run build` e em seguida aplica as migrations com o TypeORM.

Para **desfazer a última migration** aplicada:

```bash
npm run migration:revert
```

### 5. Subir o banco (Docker) e a API (npm)

Fluxo típico com **PostgreSQL só no Compose** e **Nest na máquina** (no `.env`, `POSTGRES_HOST=localhost`):

```bash
docker compose up -d db
npm run start:dev
```

O primeiro comando sobe só o serviço `db` em segundo plano; o segundo inicia a API com reload.

### 6. Seeding (popular dados iniciais)

A API possui uma rota para popular automaticamente o banco de dados com dados iniciais, útil para desenvolvimento e testes. Executa o seed das tabelas principais do sistema: Clientes, Veículos, Serviços e Estoque.

- Endpoint:

```bash
POST /api/v1/seeding
```

- Exemplo completo:

```bash
http://localhost:3000/api/v1/seeding
```

⚠️ Importante: A rota não cria ordens de serviço — isso deve ser feito manualmente pelo usuário.

## Comandos da API (referência)


| Modo                  | Comando               | Descrição                    |
| --------------------- | --------------------- | ---------------------------- |
| Desenvolvimento       | `npm run start:dev`   | Recarrega ao salvar arquivos |
| Debug                 | `npm run start:debug` | Igual ao dev, com inspector  |
| Uma execução          | `npm run start`       | Sem watch                    |
| Produção (após build) | `npm run start:prod`  | Executa `node dist/main`     |


A porta vem de `APP_PORT` no `.env` (padrão comum: `3000`).

---

## 🐋 Build e execução com Docker

O `Dockerfile` faz **multi-stage build**: compila a aplicação (`npm run build`) na etapa de build e na imagem final copia só `dist/` e dependências de produção.

### 1. Garantir o `.env` na raiz

O Compose usa variáveis do `.env` para `POSTGRES_`, `APP_PORT`, `NODE_ENV`, etc.

### 2. Build da imagem da aplicação

Na raiz do projeto:

```bash
docker compose build
```

Para forçar rebuild completo (por exemplo, após mudar migrations ou código):

```bash
docker compose build --no-cache
```

### 3. Subir banco e API

```bash
docker compose up -d
```

- **PostgreSQL**: serviço `db`, saudável antes do `app` subir (`depends_on` + healthcheck).
- **API**: serviço `app`, porta mapeada conforme `APP_PORT` (padrão `3000`).

Logs:

```bash
docker compose logs -f app
```

### 4. Migrations dentro do container

A imagem de produção **não** inclui as ferramentas de dev usadas no `npm run build` do host; o `dist/` já vem **da imagem**. Por isso use o TypeORM diretamente **sem** rodar `npm run build` de novo dentro do container:

**Aplicar migrations:**

```bash
docker compose exec app npx typeorm migration:run -d dist/config/app-data-source
```

**Reverter a última migration:**

```bash
docker compose exec app npx typeorm migration:revert -d dist/config/app-data-source
```

**Se você alterou arquivos de migration no repositório**, é preciso **reconstruir a imagem** do `app` para que o `dist/` dentro do container inclua essas alterações; depois suba de novo e rode o `migration:run` como acima.

### 5. Seeding dentro do container

Após subir a aplicação e rodar as migrations, você pode popular o banco executando o endpoint de seed de dentro do container.

**Executar seed:**

```bash
docker compose exec app curl -X POST http://localhost:3000/api/v1/seeding -d '{}'
```

---

## 📊 Testes e qualidade

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura
npm run test:cov

# Lint (com --fix)
npm run lint

# Formatação
npm run format
```

Para e2e com API e banco, garanta que o ambiente (variáveis e Postgres) esteja configurado como o projeto espera (veja `test/` e `jest-e2e.json`).

---

## 🔐 Autenticação

A API utiliza **JWT** (JSON Web Token) para autenticação. O administrador envia email e senha no endpoint de login, recebe um token e o inclui no cabeçalho `Authorization: Bearer <token>` nas requisições protegidas.

### Variáveis de ambiente


| Variável         | Descrição                                                                          | Obrigatória |
| ---------------- | ---------------------------------------------------------------------------------- | ----------- |
| `JWT_SECRET`     | Chave secreta para assinar tokens JWT                                              | Sim         |
| `JWT_EXPIRES_IN` | Tempo de expiração do token (padrão: `1h`). Aceita valores como `30m`, `7d`, `24h` | Não         |


Configure ambas no arquivo `.env`. Consulte `.env.example` para a lista completa.

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@oficina.com", "password": "admin123"}'
```

Resposta esperada:

```json
{
  "data": {
    "user": {
      "id": "uuid-do-admin",
      "username": "admin",
      "email": "admin@oficina.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Usando o token

Inclua o token JWT no cabeçalho `Authorization` com o prefixo `Bearer`. Todas as rotas de clientes exigem autenticação:

```bash
curl http://localhost:3000/api/v1/clientes \
  -H "Authorization: Bearer <seu-token-aqui>"
```

### Alterar senha

O administrador autenticado pode alterar sua própria senha:

```bash
curl -X PATCH http://localhost:3000/api/v1/auth/password \
  -H "Authorization: Bearer <seu-token-aqui>" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "admin123", "newPassword": "novaSenha456"}'
```

### Swagger UI

O Swagger UI disponível em `/api` possui autenticação Bearer habilitada. Clique no botão **Authorize** (ícone de cadeado) no topo da página e cole o token JWT para testar endpoints protegidos diretamente pela interface.

---

## 🔍 Análise de código com SonarQube

O projeto utiliza o SonarQube para análise estática de código e cobertura de testes. Caso ainda não esteja rodando :

```bash
docker compose up -d sonarqube
```

Acesse o painel:

```bash
http://localhost:9000
```

Login padrão:

- usuário: admin
- senha: admin

#### 🔹Rodar análise com Sonar NPM e NPX 

A análise é feita em duas etapas separadas, lembre de substituir de colocar no arquivo sonar-project.properties o token gerado.

1. Gerar cobertura de testes

```bash
npm run test:cov
```

1. Executar o Sonar Scanner (local)

```bash
npx sonar-scanner
```

#### 🔹Rodar o Sonar Scanner via Docker

Alternativamente, você pode rodar o scanner sem instalar nada localmente, lembre de adicionar o token gerado onde está "SEU_TOKEN":

```bash
docker run --rm -e SONAR_HOST_URL="http://host.docker.internal:9000" -e SONAR_LOGIN="SEU_TOKEN" -v ${PWD}:/usr/src sonarsource/sonar-scanner-cli
```

⚠️ No Windows/Mac, use host.docker.internal em vez de localhost para acessar o SonarQube rodando no Docker.

---

## ⚡Resumo rápido


| Objetivo         | npm (local)                                                  | Docker                                                                                |
| ---------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Instalar deps    | `npm install`                                                | (na build da imagem)                                                                  |
| Build            | `npm run build`                                              | `docker compose build`                                                                |
| Subir API + DB   | `docker compose up -d db` e, em seguida, `npm run start:dev` | `docker compose up -d` (sobe `db` e `app`)                                            |
| Migrations       | `npm run migration:run`                                      | `docker compose exec app npx typeorm migration:run -d dist/config/app-data-source`    |
| Revert migration | `npm run migration:revert`                                   | `docker compose exec app npx typeorm migration:revert -d dist/config/app-data-source` |
| Seeding          | `curl -X POST http://localhost:3000/api/v1/seeding -d '{}'`  | `docker compose exec app curl -X POST http://localhost:3000/api/v1/seeding -d '{}'`   |


