# Deploy (AWS / Kubernetes)

Este índice orienta **onde** está cada guia de deploy e resume a infraestrutura provisionada.

## Desenho da arquitetura

```mermaid
flowchart TB
  subgraph Users["Acesso"]
    Client[Cliente HTTP / Swagger]
  end

  subgraph GHA["CI/CD — GitHub Actions"]
    Pipeline[ci-cd.yml · infra.yml]
  end

  subgraph AWS["AWS"]
    ECR[ECR<br/>imagens Docker]

    subgraph VPC["VPC"]
      NLB[Network Load Balancer<br/>Service LoadBalancer]
      subgraph EKS["EKS"]
        Pods[Pods da API<br/>Deployment]
        HPA[HPA<br/>CPU]
      end
      RDS[(RDS PostgreSQL)]
    end
  end

  subgraph Ext["Externos"]
    Resend[Resend — e-mail]
  end

  Client --> NLB
  NLB --> Pods
  HPA -.-> Pods
  Pods --> RDS
  Pods --> Resend
  Pipeline --> ECR
  ECR -.-> Pods
  Pipeline --> EKS
```

| Recurso | Função |
| ------- | ------ |
| **VPC** + subnets | Rede (pública, privada, database) — Terraform em `infra/` |
| **EKS** | Cluster Kubernetes: Deployment, Service, ConfigMap/Secret |
| **HPA** | Escala pods conforme uso de CPU |
| **RDS PostgreSQL** | Banco gerenciado |
| **ECR** | Registro das imagens da API |
| **NLB** | Entrada HTTP para a API no cluster |
| **Resend** | E-mails de notificação da OS |
| **GitHub Actions** | Build, testes, push de imagem e apply no EKS |

---

## Qual guia usar?

| Cenário | Onde ir | O que cobre |
| ------- | ------- | ----------- |
| **Desenvolvimento local** (npm, Docker Compose na máquina) | [docs/build](../build/README.md) | `.env` na raiz, Postgres local, migrations, testes, Resend |
| **Infraestrutura AWS** (Terraform: EKS, RDS, ECR, rede…) | [infra.md](./infra.md) | Provisionamento, variáveis `infra/.env`, `terraform apply` |
| **Kubernetes** (EKS e Minikube) | [k8s.md](./k8s.md) | Templates EKS, overlay Minikube, HPA e carga |
| **Pipeline CI/CD** (GitHub Actions) | [docs/ci-cd](../ci-cd/README.md) | Workflows `.github/workflows/`, secrets, fluxo automatizado |

## Fluxo de deploy

```mermaid
flowchart LR
  Dev[Desenvolvedor / PR] --> GHA[GitHub Actions]
  GHA --> Test[lint · build · testes]
  Test --> Img[Build imagem → ECR]
  Img --> K8s[Apply manifestos no EKS]
  TF[Terraform infra/] --> AWS[EKS · RDS · ECR · rede]
  AWS --> K8s
```

Em resumo:

1. `infra/` → Terraform cria cluster, RDS, ECR, rede, etc.
2. `infra/` + `k8s/` → build/push da imagem + render do overlay Kubernetes
3. `k8s/` → `kubectl apply` (Deployment, Service, HPA, ConfigMap/Secret)
4. CI/CD → repete build/test/deploy em push ou disparo manual (`workflow_dispatch`)

## Artefatos no repositório

| Artefato | Local |
| -------- | ----- |
| Docker (app + Compose local) | `Dockerfile`, `docker-compose.yml` |
| Kubernetes (Deployment, Service, HPA, ConfigMap/Secret) | `k8s/` |
| Terraform (cluster, banco, registro) | `infra/` |
| Pipeline | `.github/workflows/ci-cd.yml`, `infra.yml` |

```text
oficina-mecanica-api/
├── Dockerfile
├── docker-compose.yml      # Dev local
├── infra/                  # Código Terraform + scripts
├── k8s/                    # Templates / overlays (código)
├── .github/workflows/
└── docs/deployment/
    ├── README.md           # este índice
    ├── infra.md            # Deploy AWS (Terraform)
    └── k8s.md              # Kubernetes (EKS + Minikube)
```

## Relacionados

- [Arquitetura da aplicação](../architecture/README.md) — camadas e ports
- [Build local](../build/README.md) — execução na máquina; não substitui deploy AWS
- [Entrega](../entrega/README.md) — nossa entrega (repo, vídeo, docs)
