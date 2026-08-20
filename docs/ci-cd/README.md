# ⚙️ CI/CD (GitHub Actions)

Índice das pipelines. Configuração detalhada de infra e Kubernetes continua em [Deploy AWS (Terraform)](../deployment/infra.md) e [Deploy Kubernetes](../deployment/k8s.md).

## 📂 Workflows

| Arquivo | Gatilho | Função |
| ------- | ------- | ------ |
| [`.github/workflows/ci-cd.yml`](../../.github/workflows/ci-cd.yml) | PR, push em `main`, `workflow_dispatch` | Lint, build, testes, imagem Docker, deploy EKS |
| [`.github/workflows/infra.yml`](../../.github/workflows/infra.yml) | PR em `infra/**`, `workflow_dispatch` | `terraform fmt/validate/plan/apply/destroy` |

## 🔄 O que a pipeline de aplicação faz (resumo)

1. `npm ci` → lint (não bloqueante no momento) → `npm run build` → `npm test`
2. Build e push da imagem para **ECR** (quando secrets/outputs estão configurados)
3. Render e apply do overlay K8s (`infra/` + `k8s/`) no cluster **EKS**

## 🔐 Secrets e variáveis (GitHub)

Configure em **Settings → Secrets and variables → Actions**. Os workflows referenciam credenciais AWS, URL do ECR e parâmetros do cluster — veja comentários e mensagens de erro em `ci-cd.yml` e `infra.yml`.

## 🧭 Quando usar cada fluxo

| Objetivo | Como |
| -------- | ---- |
| ✅ Validar PR (código) | Abrir PR → workflow `CI/CD` roda build e testes |
| ☁️ Provisionar/alterar AWS | Workflow `Infra (Terraform)` → `plan` ou `apply` |
| 🚀 Deploy completo app + K8s | Push em `main` ou disparo manual do `CI/CD` |

## 🔗 Ver também

- ☁️ [Deploy (índice)](../deployment/README.md)
- 💻 [Execução local](../build/README.md) — independente da pipeline
- 🔐 [Lambda auth / Gateway](https://github.com/32SOAT/oficina-mecanica-lambda-auth) — CI própria (`lint` / `test` / `terraform validate`)
