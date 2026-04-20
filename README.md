# Oficina Mecânica API

API em [NestJS](https://nestjs.com/) com TypeORM e PostgreSQL para gestão de oficina mecânica.

## Pré-requisitos

| Ferramenta                      | Uso                                             |
| ------------------------------- | ----------------------------------------------- |
| **Node.js** **20.11+** ou **22** | Build e execução local com npm (veja nota abaixo) |
| **npm**                         | Vem com o Node; use **>= 9** com Node 20+        |
| **Docker** e **Docker Compose** | Subir PostgreSQL e/ou a aplicação em containers |

### Versão do Node (evitar `EBADENGINE` e instalação “lenta” no terminal)

Este projeto precisa de **Node ≥ 20.11** (Nest 11, Joi 18, Jest 30, etc.). Com **Node 16**, o `npm install` gera centenas de linhas `EBADENGINE` — **é o Node errado**, não o projeto.

O repositório inclui um script **`preinstall`**: se a versão for antiga, o install **para na primeira mensagem** (em vez de listar todos os pacotes). Para instalar mesmo assim (não recomendado): `npm install --ignore-scripts`.

**Fluxo recomendado** — com **[nvm](https://github.com/nvm-sh/nvm)** e o `.nvmrc` na raiz:

```bash
nvm install
nvm use
node -v   # v22.x ou v20.11+
npm install
```

Com **[fnm](https://github.com/Schniz/fnm)**:

```bash
fnm install
fnm use
npm install
```

Há um **`.npmrc`** com `audit=false` e `fund=false` para o final do `npm install` ficar mais limpo; você pode rodar `npm audit` quando quiser um relatório.

Avisos `npm WARN deprecated` (ex.: `glob`, `inflight`) vêm de **dependências transitivas**; tendem a sumir quando os mantenedores atualizarem as cadeias — não é algo que você precise corrigir à mão no dia a dia.


---

## Configuração do ambiente

1. **Clone o repositório** e entre na pasta do projeto.
2. **Crie o arquivo `.env`** na raiz (o Git não versiona o `.env`). Copie o exemplo:
  ```bash
   cp .env.example .env
  ```
3. **Ajuste as variáveis** em `.env` se necessário (usuário/senha do banco, porta da API, etc.). O arquivo `.env.example` documenta os campos usados pelo Compose e pela aplicação.

**Importante sobre `POSTGRES_HOST`:**

- Ao rodar a **API na sua máquina** e o **PostgreSQL no Docker** (porta publicada), use `POSTGRES_HOST=localhost`.
- Ao rodar a **API dentro do Docker Compose**, o serviço do banco se chama `db`; o `docker-compose.yml` já define `POSTGRES_HOST=db` para o container da app — não precisa mudar isso no `.env` para o Compose, pois as variáveis do serviço `app` sobrescrevem o necessário.

---

## Desenvolvimento com npm (código na máquina)

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

### 6. Comandos da API (referência)

| Modo                  | Comando               | Descrição                    |
| --------------------- | --------------------- | ---------------------------- |
| Desenvolvimento       | `npm run start:dev`   | Recarrega ao salvar arquivos |
| Debug                 | `npm run start:debug` | Igual ao dev, com inspector  |
| Uma execução          | `npm run start`       | Sem watch                    |
| Produção (após build) | `npm run start:prod`  | Executa `node dist/main`     |

A porta vem de `APP_PORT` no `.env` (padrão comum: `3000`).

---

## Build e execução com Docker

O `Dockerfile` faz **multi-stage build**: compila a aplicação (`npm run build`) na etapa de build e na imagem final copia só `dist/` e dependências de produção.

### 1. Garantir o `.env` na raiz

O Compose usa variáveis do `.env` para `POSTGRES_`*, `APP_PORT`, `NODE_ENV`, etc.

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

---

## Testes e qualidade

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

## Resumo rápido


| Objetivo         | npm (local)                                           | Docker                                                                                |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Instalar deps    | `npm install`                                         | (na build da imagem)                                                                  |
| Build            | `npm run build`                                       | `docker compose build`                                                                |
| Subir API + DB   | `docker compose up -d db` e, em seguida, `npm run start:dev` | `docker compose up -d` (sobe `db` e `app`)                                            |
| Migrations       | `npm run migration:run`                               | `docker compose exec app npx typeorm migration:run -d dist/config/app-data-source`    |
| Revert migration | `npm run migration:revert`                            | `docker compose exec app npx typeorm migration:revert -d dist/config/app-data-source` |
