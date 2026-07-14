# 🚗 Oficina Mecânica API

API para gestão de oficina mecânica: clientes, veículos, ordens de serviço, serviços, estoque, notificações por e-mail e autenticação.

**Stack:** NestJS · TypeORM · PostgreSQL · JWT · Resend · Docker · Kubernetes · Terraform

## 🎯 Objetivos

- Código organizado com **Clean Architecture / Hexagonal** (camadas e ports/adapters).
- Qualidade com **testes automatizados** e **CI/CD**.
- Aplicação **containerizada**, com **Kubernetes** (HPA) e **Terraform** na AWS.
- Escala automática dos pods sob carga.

## 📦 Entrega

**→ [docs/entrega/README.md](./docs/entrega/README.md)** — vídeo, Swagger, prints, desenho de arquitetura e demais links.

## 🏗️ Arquitetura (resumo)

Monólito modular NestJS (`domain` → `application` → `infrastructure` → `presentation`), com ports entre contextos.

| Documento | Conteúdo |
| --------- | -------- |
| 🧱 [Arquitetura da aplicação](./docs/architecture/README.md) | Camadas, módulos, ports, fluxo de request |
| ☁️ [Desenho da infra / deploy](./docs/deployment/README.md) | EKS, RDS, ECR, HPA, fluxo CI/CD |

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
- Swagger: http://localhost:3000/api (Bearer JWT)

Detalhes, migrations, testes e Resend: **[docs/build](./docs/build/README.md)**.

## 🚀 Deploy e CI/CD

| Cenário | Guia |
| ------- | ---- |
| ☁️ Terraform (EKS, RDS, ECR) | [docs/deployment/infra.md](./docs/deployment/infra.md) |
| ☸️ Kubernetes (EKS e Minikube) | [docs/deployment/k8s.md](./docs/deployment/k8s.md) |
| 🗺️ Índice de deploy | [docs/deployment/README.md](./docs/deployment/README.md) |
| ⚙️ Pipelines GitHub Actions | [docs/ci-cd/README.md](./docs/ci-cd/README.md) |

## 📚 Documentação geral

| Documentos | Conteúdo |
| ---------- | -------- |
| 📦 **[Entrega](./docs/entrega/README.md)** | Checklist e artefatos da entrega |
| 🧱 [Arquitetura](./docs/architecture/README.md) | Clean/Hexagonal, ports, módulos |
| ☁️ [Deploy](./docs/deployment/README.md) | Infra AWS + fluxo de deploy |
| 🏗️ [Terraform](./docs/deployment/infra.md) | Provisionamento AWS |
| ☸️ [Kubernetes](./docs/deployment/k8s.md) | EKS e Minikube |
| ⚙️ [CI/CD](./docs/ci-cd/README.md) | GitHub Actions |
| 💻 [Build local](./docs/build/README.md) | npm, Docker Compose, migrations, testes, Resend |
| 📝 [ADRs](./docs/adr/README.md) | Decisões arquiteturais |
| 🔍 [Análises](./docs/analysis/README.md) | SonarQube, OWASP ZAP |
