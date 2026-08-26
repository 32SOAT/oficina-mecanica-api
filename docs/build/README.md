# 💻 Build e execução (ambiente local)

Guia para **desenvolvimento e execução na sua máquina**: npm, Docker Compose, migrations, seeding e testes.

> **Não é deploy AWS.** Para Terraform (EKS, RDS), Kubernetes e CI/CD, use:
> - [Deploy AWS (Terraform)](../deployment/infra.md)
> - [Deploy Kubernetes](../deployment/k8s.md) (EKS e Minikube)
> - [docs/deployment](../deployment/README.md) · [docs/ci-cd](../ci-cd/README.md)

## ✅ Pré-requisitos

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

## ⚙️ Configuração do ambiente

1. Copie o exemplo de variáveis:

```bash
cp .env.example .env
```

2. Ajuste usuário/senha do banco, porta da API etc. O `.env.example` documenta todos os campos.

**`POSTGRES_HOST`:**

- API na máquina + Postgres no Docker → `POSTGRES_HOST=localhost`
- API no Docker Compose → o serviço `app` já usa `POSTGRES_HOST=db` (não precisa alterar o `.env` para o Compose)

---

## 🚀 Desenvolvimento local (npm)

### ⚡ Fluxo rápido

```bash
docker compose up -d db    # só o banco
npm run migration:run      # build + migrations
npm run start:dev          # API com reload
```

### 📟 Comandos

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

### 🔐 Autenticação local

- **Admin:** `POST /api/v1/auth/login` (e-mail/senha). Cole o Bearer no Swagger.
- **Cliente:** o CPF não é emitido por este repo. A Lambda em [oficina-mecanica-lambda-auth](https://github.com/32SOAT/oficina-mecanica-lambda-auth) gera o JWT. O Nest aceita os dois se `JWT_SECRET` for o mesmo.

Rotas e papéis: [auth.md](../architecture/auth.md).

### 🗄️ Migrations

Com Postgres no ar e `.env` apontando para ele:

```bash
npm run migration:run
```

O script roda `npm run build` antes de aplicar as migrations via TypeORM.

### 🌱 Seeding

Endpoint para popular dados de desenvolvimento (clientes, veículos, serviços, estoque, usuários):

```bash
POST /api/v1/seeding
```

```bash
curl -X POST http://localhost:3000/api/v1/seeding
```

A rota **não** cria ordens de serviço.

---

## ✉️ E-mail (Resend)

A API envia notificações por e-mail quando uma ordem de serviço muda de status. O provedor é o [Resend](https://resend.com); a integração fica no módulo `notificacoes/` (ver [arquitetura — notificações](../architecture/README.md)).

### 1. Conta e API key

1. Crie uma conta em [resend.com](https://resend.com).
2. Em **API Keys**, gere uma chave e copie para o `.env`:

```env
RESEND_API_KEY=re_sua_api_key
```

Sem essa variável a API **não sobe** (`ConfigModule` exige a chave).

### 2. Remetente (`RESEND_FROM`)

| Cenário | Valor sugerido | Observação |
| ------- | -------------- | ---------- |
| **Testes rápidos (sandbox)** | `onboarding@resend.dev` | Só entrega para o **e-mail da conta Resend** — use `RESEND_DEV_REDIRECT_TO` (abaixo) |
| **Domínio próprio** | `notificacoes@seu-dominio.com` | Verifique o domínio em **Domains** no painel Resend (registros DNS SPF/DKIM) |

Exemplo com domínio verificado:

```env
RESEND_FROM=notificacoes@teste-fiap-pos.com
```

### 3. Destinatários operacionais

Endereços fixos para alertas internos da oficina (não são e-mails de clientes):

```env
NOTIFICACAO_EMAIL_MECANICOS=equipe-mecanicos@exemplo.com
NOTIFICACAO_EMAIL_ADMIN=admin@exemplo.com
```

| Variável | Quando é usada |
| -------- | -------------- |
| `NOTIFICACAO_EMAIL_MECANICOS` | OS entra em `RECEBIDA` ou `AGUARDANDO_SERVICO` |
| `NOTIFICACAO_EMAIL_ADMIN` | OS entra em `AGUARDANDO_PECAS_INSUMOS` |

E-mails ao **cliente** usam o endereço cadastrado no cliente da OS (`AGUARDANDO_APROVACAO`, `FINALIZADA`, `REPROVADA`).

### 4. Redirect em desenvolvimento (`RESEND_DEV_REDIRECT_TO`)

Com o sandbox (`onboarding@resend.dev`) ou para evitar enviar para clientes reais durante testes, redirecione **todos** os e-mails para uma caixa de dev:

```env
RESEND_DEV_REDIRECT_TO=fiap-api-pos@outlook.com
```

Com essa variável definida, o adapter reescreve `to`, prefixa o assunto com `[DEV → destinatário-original]` e inclui o destinatário original no corpo. Em produção, **omitir** a variável para enviar ao destinatário real.

### 5. Testar o fluxo

1. Suba a API com Postgres e `.env` configurado.
2. Crie cliente (com e-mail), veículo e OS via API ou seeding.
3. Altere o status da OS (ex.: para `AGUARDANDO_APROVACAO`) com um usuário autenticado.
4. Confira os logs (`ResendNotificacaoAdapter`, `NotificarListener`) e a caixa de entrada (ou a caixa de redirect).

Erro comum no sandbox: *"only send testing emails to your own email"* — configure `RESEND_DEV_REDIRECT_TO` para o e-mail da conta Resend ou use domínio verificado e destinatários permitidos.

### 📋 Variáveis (resumo)

| Variável | Obrigatória | Descrição |
| -------- | ----------- | --------- |
| `RESEND_API_KEY` | Sim | Chave da API Resend |
| `RESEND_FROM` | Não | Remetente (padrão: `onboarding@resend.dev`) |
| `NOTIFICACAO_EMAIL_MECANICOS` | Sim | Alertas para a equipe de mecânicos |
| `NOTIFICACAO_EMAIL_ADMIN` | Sim | Alertas para administração/estoque |
| `RESEND_DEV_REDIRECT_TO` | Não | Redireciona todos os e-mails (recomendado em dev com sandbox) |

Referência completa: `.env.example`.

---

## 🐳 Docker

O `Dockerfile` usa **multi-stage build**: compila na etapa de build e copia só `dist/` + deps de produção na imagem final.

### 🔼 Subir banco e API

```bash
docker compose build          # ou --no-cache após mudar migrations/código
docker compose up -d
docker compose logs -f app
```

- **db** — PostgreSQL (healthcheck antes do `app`)
- **app** — API na porta `APP_PORT` (padrão `3000`)

### 🗄️ Migrations no container

Use o TypeORM direto (o `dist/` já veio da imagem):

```bash
docker compose exec app npx typeorm migration:run -d dist/database/data-source
docker compose exec app npx typeorm migration:revert -d dist/database/data-source
```

Se alterou arquivos de migration no repo, **reconstrua a imagem** antes de rodar de novo.

### 🌱 Seeding no container

```bash
docker compose exec app curl -X POST http://localhost:3000/api/v1/seeding -d '{}'
```

---

## 📌 Resumo rápido

| Objetivo | npm (local) | Docker |
| -------- | ----------- | ------ |
| Instalar deps | `npm install` | (na build da imagem) |
| Build | `npm run build` | `docker compose build` |
| Subir API + DB | `docker compose up -d db` + `npm run start:dev` | `docker compose up -d` |
| Migrations | `npm run migration:run` | `docker compose exec app npx typeorm migration:run -d dist/database/data-source` |
| Revert migration | `npm run migration:revert` | `docker compose exec app npx typeorm migration:revert -d dist/database/data-source` |

---

## 🔗 Referências

- [README principal](../../README.md)
- [Deploy AWS/Kubernetes](../deployment/README.md)
- [Análises de qualidade e segurança](../analysis/README.md)
- [Arquitetura](../architecture/README.md)
