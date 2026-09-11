# 📚 Documentação

Índice da documentação da plataforma da oficina mecânica. Este repositório concentra a documentação arquitetural que atravessa os quatro repositórios do projeto; cada um dos outros mantém no próprio README o diagrama e os passos de execução específicos e aponta para cá.

| Repositório | Conteúdo |
| ----------- | -------- |
| [oficina-mecanica-api](https://github.com/32SOAT/oficina-mecanica-api) | API NestJS, manifestos Kubernetes, Datadog (em integração) e esta documentação |
| [oficina-mecanica-lambda-auth](https://github.com/32SOAT/oficina-mecanica-lambda-auth) | Lambda de autenticação por CPF e API Gateway |
| [oficina-mecanica-infra-k8s](https://github.com/32SOAT/oficina-mecanica-infra-k8s) | Terraform de EKS, node group, ECR e IAM |
| [oficina-mecanica-infra-db](https://github.com/32SOAT/oficina-mecanica-infra-db) | Terraform de VPC, subnets e RDS |

## 🏗️ Arquitetura

| Documento | Conteúdo |
| --------- | -------- |
| [Componentes](./architecture/componentes.md) | C4: contexto, contêineres na AWS, monitoramento, entrega |
| [Arquitetura da aplicação](./architecture/README.md) | Módulos, camadas, ports e adapters (C3) |
| [Autenticação](./architecture/auth.md) | Rotas por papel, admin e cliente |
| [Sequência: autenticação](./architecture/sequencia-auth.md) | CPF via Lambda e login admin, até a rota protegida |
| [Sequência: abertura de OS](./architecture/sequencia-abertura-os.md) | Transação, eventos, ciclo de vida da OS |
| [Modelo de dados](./architecture/modelo-de-dados.md) | Justificativa do banco, ER, relacionamentos, ajustes propostos |
| [Requisitos](./architecture/requisitos.md) | Requisitos funcionais e não funcionais com metas mensuráveis |

## 📝 Decisões

| Documento | Conteúdo |
| --------- | -------- |
| [RFCs](./rfc/README.md) | Nuvem, banco gerenciado, autenticação, observabilidade, repositórios |
| [ADRs](./adr/README.md) | Banco, e-mail, auth, comunicação, HPA, observabilidade |

## 🔧 Operação

| Documento | Conteúdo |
| --------- | -------- |
| [Build local](./build/README.md) | npm, Docker Compose, migrations, testes, Resend |
| [Deploy](./deployment/README.md) | Infra AWS e fluxo de deploy |
| [Terraform](./deployment/infra.md) | Provisionamento na AWS e no Academy |
| [Kubernetes](./deployment/k8s.md) | EKS e Minikube |
| [CI/CD](./ci-cd/README.md) | GitHub Actions |
| [Observabilidade](./observability/README.md) | Logs, dashboards, monitores, roteiro do vídeo |
| [Análises](./analysis/README.md) | SonarQube e OWASP ZAP |

## 📦 Entrega

[docs/entrega](./entrega/README.md): links, prints e checklist do que vai para o portal.

## 🗂️ Estrutura

```
docs/
├── README.md              este índice
├── architecture/          componentes, sequências, modelo de dados, auth, módulos
├── rfc/                   propostas (001–005)
├── adr/                   decisões (001–006)
├── observability/         o que é monitorado e como
├── deployment/            Terraform, Kubernetes, índice de deploy
├── ci-cd/                 pipelines
├── build/                 execução local
├── analysis/              Sonar e ZAP
└── entrega/               artefatos para o portal
```

Regra de organização: decisão que afeta mais de um repositório fica aqui. Runbook e diagrama de um repositório específico ficam no README daquele repositório.
