# ⚙️ CI/CD (GitHub Actions)

Índice das pipelines. A integração AWS canônica está em
[cross-repository.md](../deployment/cross-repository.md). O
[Deploy Kubernetes](../deployment/k8s.md) cobre o ambiente local.

## 📂 Workflows

| Arquivo | Gatilho | Função |
| ------- | ------- | ------ |
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | PR para `homolog` ou `main` | Check obrigatório `api / gate`: build, testes e build Docker sem push; lint informativo |
| [`.github/workflows/publish-image.yml`](../../.github/workflows/publish-image.yml) | `workflow_dispatch` | Valida uma referência protegida e publica uma imagem imutável no ECR por OIDC |

## 🔄 Validação da API

O workflow `API CI` roda somente em pull requests para `homolog` e `main`. O check `api / gate` executa `npm ci`, lint não bloqueante, `npm run build`, `npm run test:cov` e um build Docker local. Ele não publica imagens nem faz deploy.

## 📦 Publicação manual da imagem

O workflow `Publish API image` recebe o input obrigatório `git_ref`. Ele aceita somente commits que pertençam a `homolog` ou `main`, executa build e testes antes de obter credenciais AWS e publica uma única tag imutável no formato `sha-<SHA completo>`.

A autenticação usa OIDC no environment `image-publishing`; não há access keys persistentes. O workflow lê a URL do ECR no parâmetro SSM `/oficina/shared/ecr/repository-url` e retorna no Job Summary a origem, tag, digest e referência completa `repositório@sha256:...`. Nenhuma tag `latest` é criada.

Publicar uma imagem não altera o cluster. A promoção e o deploy por digest pertencem aos workflows do repositório de infraestrutura.

## 🔐 Secrets e variáveis (GitHub)

Configure em **Settings → Environments → image-publishing** a variável `PUBLISH_ROLE_ARN`. Configure também `AWS_REGION` como variável do repositório ou do environment. A role deve confiar no OIDC do GitHub Actions e permitir somente a publicação no ECR da API e a leitura do parâmetro SSM `/oficina/shared/ecr/repository-url`.

O provisionamento e o deploy Kubernetes canônicos pertencem ao
`oficina-mecanica-infra-k8s`; este repositório publica somente a imagem pelo
workflow `publish-image.yml`. Não use workflows ou scripts Terraform antigos
deste repositório para uma instalação nova.

## 🧭 Quando usar cada fluxo

| Objetivo | Como |
| -------- | ---- |
| ✅ Validar PR (código) | Abrir PR para `homolog` ou `main` → aguardar `api / gate` |
| 📦 Publicar imagem imutável | Workflow `Publish API image` → informar `git_ref` pertencente a uma branch protegida |
| ☁️ Provisionar/alterar AWS | Workflow do `oficina-mecanica-infra-k8s` → `plan` ou `apply` protegido |
| 🚀 Promover/deployar por digest | Usar o fluxo de promoção no repositório de infraestrutura |

## 🔗 Ver também

- ☁️ [Deploy (índice)](../deployment/README.md)
- 💻 [Execução local](../build/README.md) — independente da pipeline
- 🔐 [Lambda auth / Gateway](https://github.com/32SOAT/oficina-mecanica-lambda-auth) — CI própria (`lint` / `test` / `terraform validate`)
