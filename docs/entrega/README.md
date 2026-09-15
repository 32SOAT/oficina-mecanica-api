# 📦 Entrega

Artefatos e links da entrega. A seção da Fase 3 é a fonte do PDF único pedido no portal.

---

## 🎯 Fase 3

Vídeo, PDF e links de acesso são anexados no portal do aluno. Aqui ficam os artefatos versionados.

| Repositório | CI/CD | Deploy |
| ----------- | ----- | ------ |
| [oficina-mecanica-api](https://github.com/32SOAT/oficina-mecanica-api) | `ci.yml` em PR para `homolog` e `main`; `publish-image.yml` publica a imagem no ECR por OIDC | Deploy pelo `infra-k8s`, por digest |
| [oficina-mecanica-lambda-auth](https://github.com/32SOAT/oficina-mecanica-lambda-auth) | lint, testes, `terraform validate` | `terraform apply` por ambiente; publica o ARN no SSM |
| [oficina-mecanica-infra-k8s](https://github.com/32SOAT/oficina-mecanica-infra-k8s) | `terraform / gate` e `kubernetes / gate` em PR | Merge em `homolog` → homologação; em `main` → produção |
| [oficina-mecanica-infra-db](https://github.com/32SOAT/oficina-mecanica-infra-db) | `fmt` e `validate` em PR | `apply` automático em `main` |

| Item do portal | Valor |
| -------------- | ----- |
| Repositório: aplicação | https://github.com/32SOAT/oficina-mecanica-api |
| Repositório: Lambda | https://github.com/32SOAT/oficina-mecanica-lambda-auth |
| Repositório: infra Kubernetes | https://github.com/32SOAT/oficina-mecanica-infra-k8s |
| Repositório: infra banco | https://github.com/32SOAT/oficina-mecanica-infra-db |
| Documentação arquitetural | [docs/README.md](../README.md) |
| Diagrama de componentes | [componentes.md](../architecture/componentes.md) |
| Diagramas de sequência | [autenticação](../architecture/sequencia-auth.md), [abertura de OS](../architecture/sequencia-abertura-os.md) |
| RFCs | [docs/rfc](../rfc/README.md) |
| ADRs | [docs/adr](../adr/README.md) |
| Modelo de dados e justificativa do banco | [modelo-de-dados.md](../architecture/modelo-de-dados.md) |
| Requisitos | [requisitos.md](../architecture/requisitos.md) |
| Swagger | `http://localhost:3000/api` localmente; no ambiente, `<api_gateway_endpoint>/api` (output do root do ambiente no `infra-k8s`) |
| Observabilidade | [observability/README.md](../observability/README.md) e [datadog/README.md](../../datadog/README.md); dashboard "Oficina Mecânica - Observabilidade" na conta Datadog |

---

## 📋 Fase 2 (histórico)

## 📋 Pedido no PDF do portal

| Item | Link / valor |
| ---- | ------------ |
| ☁️ **Desenho da arquitetura** (EKS, RDS, ECR, etc.) | [docs/deployment/README.md](../deployment/README.md) |
| 🧱 **Arquitetura da aplicação** | [docs/architecture/README.md](../architecture/README.md) |
| 🎬 **Vídeo demonstrativo** (YouTube) | https://www.youtube.com/watch?v=qgHBsH6hp6g |

### 📘 API (Swagger)

| Ambiente | URL |
| -------- | --- |
| 💻 Local | http://localhost:3000/api |

### 🛣️ Print demonstrativo das rotas

Prints / gravações da execução das principais rotas da API:

**Abertura da ordem de serviço** — `POST /api/v1/ordens` (`201 Created`):

![Abertura da ordem de serviço](./rota-abertura-ordem.gif)

**Consulta status da OS (cliente)** — `GET /api/v1/ordens/:id/status` (JWT `role: cliente`):

![Consulta status da OS](./rota-consulta-status.gif)

**Aprovação / reprovação do orçamento (cliente)** — `POST .../aprovar-orcamento` ou `POST .../reprovar-orcamento` (JWT `role: cliente`):

![Aprovar ou reprovar orçamento](./rota-aprovar-orcamento.gif)

**Listagem de ordens de serviço** — `GET /api/v1/ordens` (filtro opcional `?status=ENTREGUE`):

![Listagem de ordens de serviço](./rota-listagem-ordens.gif)

### ✉️ Envio de e-mail (Resend)

Notificações reais com remetente `notificacoes@fiap.tech` ([configuração](../build/README.md)):

**Mecânicos** — ordem recebida (`RECEBIDA`):

![E-mail mecânicos — OS recebida](./email-mecanicos-recebida.png)

**Mecânicos** — aguardando serviço (`AGUARDANDO_SERVICO`):

![E-mail mecânicos — aguardando serviço](./email-mecanicos-aguardando-servico.png)

**Cliente** — orçamento aguardando aprovação:

![E-mail cliente — orçamento](./email-cliente-orcamento.png)

**Cliente** — caixa de entrada (orçamento + serviço finalizado):

![E-mail cliente — caixa de entrada](./email-cliente-caixa.png)

### 🧪 Print dos testes e análises

Cobertura de testes (`npm run test:cov`):

![Cobertura de testes](./cobertura-testes.png)

SonarQube (Overall Code) — Coverage: **91.0%** · Duplications: **0.0%** ([como rodar](../analysis/README.md)):

![SonarQube Overall Code](./sonar-overall.png)

OWASP ZAP (DAST) — High: 0 · Medium: 0 · Low: 3 · Informational: 4 ([como rodar](../analysis/README.md)):

![Relatório OWASP ZAP](./zap-scan.png)

---

## ➕ Complemento

| Item | Link |
| ---- | ---- |
| 🔐 **Auth cliente (CPF) + API Gateway** | [oficina-mecanica-lambda-auth](https://github.com/32SOAT/oficina-mecanica-lambda-auth) · [auth.md](../architecture/auth.md) |
| 🧩 **Miro** — documentações adicionais (domain storytelling, event-driven) | https://miro.com/app/board/uXjVGupYixo=/?share_link_id=890608508965 |

---

## 📚 Onde está o restante

Índice completo da documentação: **[README do projeto](../../README.md)**.
