# 🚗 Oficina Mecânica API

API para gestão de oficina mecânica: clientes, veículos, ordens de serviço, serviços, estoque, notificações por e-mail e autenticação.

**Stack:** NestJS · TypeORM · PostgreSQL · JWT · Resend · Datadog · Docker · Kubernetes · ECR

O provisionamento AWS, o EKS, o NLB, o API Gateway e a Lambda não são gerenciados
por este repositório. O fluxo canônico entre os projetos está em
[docs/deployment/cross-repository.md](./docs/deployment/cross-repository.md).

## 🎯 Objetivos

- Código organizado com **Clean Architecture / Hexagonal** (camadas e ports/adapters).
- Qualidade com **testes automatizados** e **CI/CD**.
- Aplicação **containerizada**, com publicação ECR e deploy Kubernetes operado pelo `infra-k8s`.
- Escala automática dos pods sob carga.

## 📦 Entrega

**→ [docs/entrega/README.md](./docs/entrega/README.md)** — vídeo, Swagger, prints, desenho de arquitetura e demais links.

## 🏗️ Arquitetura (resumo)

Monólito modular NestJS (`domain` → `application` → `infrastructure` → `presentation`), com ports entre contextos.

| Documento | Conteúdo |
| --------- | -------- |
| 🧩 [Componentes (C4)](./docs/architecture/componentes.md) | Contexto, contêineres, componentes, implantação na AWS |
| 🧱 [Arquitetura da aplicação](./docs/architecture/README.md) | Camadas, módulos, ports, fluxo de request |
| 🔐 [Autenticação](./docs/architecture/auth.md) | JWT admin (Nest) e cliente CPF ([Lambda](https://github.com/32SOAT/oficina-mecanica-lambda-auth)) |
| ☁️ [Desenho da infra / deploy](./docs/deployment/README.md) | EKS, RDS, ECR, HPA, API Gateway, fluxo entre repositórios |

## 💻 Execução local

**Pré-requisitos:** Node 20.11+ (ou 22), Docker Compose, `.env`.

```bash
cp .env.example .env
nvm use && npm install          # se usar nvm
docker compose up -d db
npm run migration:run
npm run start:dev
```

- API: `http://localhost:3000`
- Swagger: http://localhost:3000/api (Bearer JWT de **admin** via `POST /api/v1/auth/login`)

Auth de **cliente via CPF** e o API Gateway não rodam neste repo. A Lambda
pertence a [oficina-mecanica-lambda-auth](https://github.com/32SOAT/oficina-mecanica-lambda-auth)
e o Gateway a [oficina-mecanica-infra-k8s](https://github.com/32SOAT/oficina-mecanica-infra-k8s).
Localmente o Nest aceita os dois JWTs se o `JWT_SECRET` for o mesmo. Detalhe:
[docs/architecture/auth.md](./docs/architecture/auth.md).

Detalhes, migrations, testes e Resend: **[docs/build](./docs/build/README.md)**.

## 🚀 Deploy e CI/CD

| Cenário | Guia |
| ------- | ---- |
| ☁️ Infraestrutura AWS canônica | [docs/deployment/cross-repository.md](./docs/deployment/cross-repository.md) |
| 🔗 Integração de infraestrutura | [docs/deployment/cross-repository.md](./docs/deployment/cross-repository.md) |
| ☸️ Kubernetes (EKS e Minikube) | [docs/deployment/k8s.md](./docs/deployment/k8s.md) |
| 🗺️ Índice de deploy | [docs/deployment/README.md](./docs/deployment/README.md) |
| ⚙️ Pipelines GitHub Actions | [docs/ci-cd/README.md](./docs/ci-cd/README.md) |

## 📚 Documentação geral

Índice completo: [docs/README.md](./docs/README.md).

| Documentos | Conteúdo |
| ---------- | -------- |
| 📦 **[Entrega](./docs/entrega/README.md)** | Checklist e artefatos da entrega |
| 🧩 [Componentes](./docs/architecture/componentes.md) | C4: contexto, contêineres, componentes, implantação |
| 🧱 [Arquitetura](./docs/architecture/README.md) | Clean/Hexagonal, ports, módulos |
| 🔐 [Autenticação](./docs/architecture/auth.md) | Admin Nest + cliente Lambda/CPF |
| 🔁 [Sequências](./docs/architecture/sequencia-auth.md) | Autenticação e [abertura de OS](./docs/architecture/sequencia-abertura-os.md) |
| 🗄️ [Modelo de dados](./docs/architecture/modelo-de-dados.md) | Justificativa do banco, ER, relacionamentos |
| 📋 [Requisitos](./docs/architecture/requisitos.md) | RF e RNF com metas mensuráveis |
| 📄 [RFCs](./docs/rfc/README.md) | Propostas: nuvem, banco, auth, observabilidade, repositórios |
| 📡 [Observabilidade](./docs/observability/README.md) | Logs, dashboards, monitores; operação em [datadog/README.md](./datadog/README.md) |
| ☁️ [Deploy](./docs/deployment/README.md) | Infra AWS + fluxo de deploy |
| 🔗 [Integração de infraestrutura](./docs/deployment/cross-repository.md) | Provisionamento e deploy nos repositórios owners |
| ☸️ [Kubernetes](./docs/deployment/k8s.md) | EKS e Minikube |
| ⚙️ [CI/CD](./docs/ci-cd/README.md) | GitHub Actions |
| 💻 [Build local](./docs/build/README.md) | npm, Docker Compose, migrations, testes, Resend |
| 📝 [ADRs](./docs/adr/README.md) | Decisões arquiteturais |
| 🔍 [Análises](./docs/analysis/README.md) | SonarQube, OWASP ZAP |
