# 🧩 Diagrama de componentes

Visão de nuvem, APIs, banco e monitoramento da plataforma da oficina, organizada nos níveis do C4 Model: contexto, contêineres e componentes.

Detalhe interno da aplicação (módulos, ports, camadas): [architecture/README.md](./README.md). Guias de provisionamento: [deployment/](../deployment/README.md).

> Os diagramas mostram a arquitetura da Fase 3 como decidida nas RFCs e ADRs: Datadog como observabilidade ([ADR 006](../adr/006-stack-de-observabilidade.md)), Terraform separado por repositório ([RFC 005](../rfc/005-segregacao-de-repositorios.md)) e `RollingUpdate` com duas réplicas mínimas ([ADR 005](../adr/005-uso-de-hpa.md)). O que ainda está em implementação aparece na tabela de estado da seção de monitoramento, não nos desenhos.

---

## 🌍 C1 · Contexto

Quem usa o sistema e com o que ele conversa.

```mermaid
flowchart LR
  Cliente["Cliente da oficina<br/><i>[Pessoa]</i><br/>consulta status e aprova orçamento"]
  Equipe["Equipe da oficina<br/><i>[Pessoa]</i><br/>opera OS, estoque, cadastros"]

  Sistema["Plataforma da Oficina Mecânica<br/><i>[Software System]</i><br/>API, autenticação por CPF, notificações"]

  Resend["Resend<br/><i>[Sistema externo]</i><br/>e-mail transacional"]
  DD["Datadog<br/><i>[Sistema externo]</i><br/>logs, métricas, traces, alertas"]

  Cliente -->|HTTPS| Sistema
  Equipe -->|HTTPS| Sistema
  Sistema -->|API HTTPS| Resend
  Sistema -->|agente e integração AWS| DD
```

Dois atores, dois sistemas externos. O Resend recebe os e-mails de mudança de status da OS ([ADR 002](../adr/002-envio-de-email-com-resend.md)). O Datadog recebe telemetria de todos os componentes e é o único ponto onde a equipe olha para saber se a plataforma está saudável.

---

## 📦 C2 · Contêineres

Cada caixa é uma unidade executável ou de armazenamento com deploy próprio, com a tecnologia entre colchetes e a responsabilidade em uma linha. As setas trazem o protocolo. Onde cada contêiner roda (VPC, subnets, nós) está no [diagrama de implantação](#-implantação-na-aws).

```mermaid
flowchart TB
    Cliente["Cliente da oficina<br/><i>[Pessoa]</i><br/>Autentica por CPF, consulta status<br/>e aprova ou reprova orçamento"]
    Equipe["Equipe da oficina<br/><i>[Pessoa]</i><br/>Opera OS, estoque e cadastros"]

    subgraph Plataforma["Plataforma da Oficina Mecânica"]
        GW["API Gateway<br/><i>[AWS API Gateway HTTP API]</i><br/>Entrada pública única. Roteia,<br/>não autoriza"]
        Lambda["Autenticação por CPF<br/><i>[AWS Lambda · Node 22 · TypeScript]</i><br/>Valida CPF, consulta cliente ativo<br/>e emite JWT role=cliente"]
        API["API da oficina<br/><i>[NestJS · TypeORM · container no EKS]</i><br/>Regras de negócio, login admin,<br/>valida JWT e autoriza por papel"]
        DB[("Banco de dados<br/><i>[Amazon RDS · PostgreSQL]</i><br/>Clientes, veículos, OS, estoque,<br/>histórico de status, usuários")]
        Agent["Datadog Agent<br/><i>[DaemonSet no EKS]</i><br/>Coleta logs, traces e métricas<br/>dos pods e dos nós"]
        Job["Job de migrations<br/><i>[Kubernetes Job · TypeORM]</i><br/>Aplica o schema antes do rollout"]
    end

    Resend["Resend<br/><i>[Sistema externo]</i><br/>E-mail transacional"]
    DD["Datadog<br/><i>[Sistema externo]</i><br/>APM, logs, dashboards, alertas"]

    Cliente -->|"HTTPS / JSON"| GW
    Equipe -->|"HTTPS / JSON"| GW
    GW -->|"ANY /{proxy+}<br/>HTTP proxy → NLB"| API
    GW -->|"POST /auth/cpf<br/>invocação Lambda"| Lambda
    API -->|"SQL / TypeORM"| DB
    Job --> DB
    Lambda -->|"SQL / pg"| DB
    API -->|"HTTPS / API Resend"| Resend
    API -->|"stdout JSON · dd-trace"| Agent
    Agent -->|"HTTPS"| DD
    Lambda -->|"Lambda Extension"| DD
    DB -->|"métricas via CloudWatch"| DD
    GW -->|"métricas via CloudWatch"| DD
```

## 🔬 C3 · Componentes

Zoom no contêiner "API NestJS", limitado aos componentes que participam dos dois fluxos documentados nesta fase. A decomposição completa por módulo está em [architecture/README.md](./README.md).

```mermaid
flowchart LR
  GW["API Gateway"]

  subgraph Nest["API NestJS"]
    subgraph Common["common"]
      Pino["pino-http + dd-trace<br/>x-correlation-id"]
      Filter["ApplicationExceptionFilter"]
    end
    subgraph Auth["auth"]
      JwtGuard["JwtAuthGuard"]
      Roles["RolesGuard"]
      Parse["parseJwtPayload"]
      AuthCtrl["AuthController<br/>POST /api/v1/auth/login"]
    end
    subgraph OS["ordens-de-servico"]
      OsCtrl["OrdemServicoController"]
      CreateUC["CreateOrdemServicoUseCase"]
      TxPort["OrdemServicoTransactionPort"]
      TxImpl["OrdemServicoTypeormTransaction"]
      EvPort["OrdemServicoEventsPort"]
      EvAdapter["OrdemServicoEventsAdapter<br/>EventEmitter2"]
      HistL["PersistirHistoricoListener"]
      NotifL["NotificarListener"]
    end
    subgraph Cli["clientes / veiculos / servicos / estoque"]
      CliTx["ClienteTransactionalPort"]
      VeiTx["VeiculoTransactionalPort"]
      SrvTx["ServicoTransactionalPort"]
      EstTx["EstoqueTransactionalPort<br/>reserva de peças"]
    end
    subgraph Notif["notificacoes"]
      NotifPort["NotificacaoPort"]
      ResendAd["ResendNotificacaoAdapter"]
    end
    Health["HealthController<br/>GET /api/v1/health"]
  end

  DB[("RDS")]
  Resend["Resend"]

  GW --> Pino --> JwtGuard --> Roles --> OsCtrl
  JwtGuard --> Parse
  Pino --> AuthCtrl
  OsCtrl --> CreateUC --> TxPort
  TxPort -.implementa.- TxImpl
  TxImpl --> CliTx
  TxImpl --> VeiTx
  TxImpl --> SrvTx
  TxImpl --> EstTx
  TxImpl --> DB
  CreateUC --> EvPort
  EvPort -.implementa.- EvAdapter
  EvAdapter --> HistL --> DB
  EvAdapter --> NotifL --> NotifPort
  NotifPort -.implementa.- ResendAd --> Resend
  OsCtrl --> Filter
  GW --> Health
```

Papel de cada componente nos fluxos desta fase:

| Componente | Módulo | Papel nesta fase |
| ---------- | ------ | ---------------- |
| `JwtAuthGuard`, `RolesGuard`, `parseJwtPayload` | `auth` | Validam os dois formatos de JWT ([sequencia-auth.md](./sequencia-auth.md)) |
| `CreateOrdemServicoUseCase`, `OrdemServicoTransactionPort` | `ordens-de-servico` | Transação de abertura da OS ([sequencia-abertura-os.md](./sequencia-abertura-os.md)) |
| `OrdemServicoEventsAdapter` e listeners | `ordens-de-servico/infrastructure/events` | Histórico, e-mail e, pela ADR 006, métricas de negócio |
| `configureApp` + `CoreModule` | `common` | Logger pino e `x-correlation-id` |
| `HealthController` | `health` | Probes do Kubernetes e teste sintético |

---

## ☁️ Implantação na AWS

Diagrama de implantação, complementar ao C4: onde cada contêiner do C2 roda na nuvem. Provisionado por Terraform em `oficina-mecanica-infra-db` (banco) e `oficina-mecanica-infra-k8s` (rede, cluster, registro, IAM) — ver [ADR 007](../adr/007-terraform-do-banco-com-descoberta-via-data-sources.md).

```mermaid
flowchart TB
    Internet["Internet"]

    subgraph AWS["AWS · us-east-1"]
        GW["API Gateway HTTP API<br/>stage $default"]
        ECR["ECR<br/>imagens da API"]
        CW["CloudWatch Logs<br/>Lambda · control plane do EKS"]

        subgraph VPC["VPC"]
            subgraph PUB["Subnets públicas · rota pelo Internet Gateway"]
                NLB["Network Load Balancer<br/>Service type LoadBalancer"]
                NAT["NAT Gateway"]
            end
            subgraph PRIV["Subnets privadas · saída pelo NAT"]
                Lambda["Lambda auth-cpf<br/>256 MB · 10 s<br/>(na VPC quando subnet_ids é informado)"]
                subgraph EKS["EKS · node group t3.medium · 1 a 3 nós"]
                    Pods["Pods da API NestJS<br/>Deployment RollingUpdate · HPA CPU 70% · 2 a 3 réplicas"]
                    Job["Job de migrations<br/>aplicado pelo pipeline, fora do overlay"]
                    Agent["Datadog Agent<br/>DaemonSet + Cluster Agent"]
                end
            end
            subgraph DBS["Subnets de banco · sem rota externa"]
                RDS[("RDS PostgreSQL<br/>criptografado · sem acesso público<br/>ingress só do SG do cluster")]
            end
        end
    end

    Internet --> GW
    GW -->|"AWS_PROXY"| Lambda
    GW -->|"HTTP_PROXY"| NLB
    NLB --> Pods
    Pods --> RDS
    Job --> RDS
    Lambda --> RDS
    Pods -.->|"egress"| NAT
    ECR -.->|"pull"| Pods
    Lambda --> CW
    EKS -->|"api · audit"| CW
```

### 🚪 Entrada

O API Gateway HTTP API é provisionado no repositório da Lambda (`aws_apigatewayv2_api.http`). Stage `$default` com `auto_deploy`, CORS aberto para qualquer origem.

| Rota | Integração | Destino |
| ---- | ---------- | ------- |
| `POST /auth/cpf` | `AWS_PROXY`, payload 2.0 | Lambda de autenticação |
| `ANY /{proxy+}` | `HTTP_PROXY`, timeout 29 s | NLB da API no EKS |

O proxy coringa evita cadastrar rota por endpoint. Todo o resto da API, incluindo o login administrativo, passa por ele.

O Gateway não autoriza, só roteia. Assinatura e papel do token são verificados nos guards do Nest ([ADR 003](../adr/003-auth-cliente-lambda-jwt-role.md)). Um token inválido só é recusado no final da cadeia, já dentro do cluster.

### λ Function serverless

`aws_lambda_function.auth`: runtime `nodejs22.x`, handler `handler.handler`, 256 MB, timeout 10 s, empacotada como ZIP a partir de `dist/handler.js`.

Recebe um CPF, valida o dígito verificador, confirma que existe cliente ativo e devolve um JWT com `role: "cliente"`. Não conhece regra de negócio da OS.

Acessa o Postgres com pool `pg` limitado a `max: 2`, porque cada execução atende uma requisição. O `vpc_config` é dinâmico: com `subnet_ids` preenchido a function roda dentro da VPC e alcança o RDS pela rede privada.

Fluxo completo em [sequencia-auth.md](./sequencia-auth.md).

### ☸️ Aplicação no cluster

Monólito modular NestJS, containerizado, publicado no ECR e executado no EKS.

| Objeto | Configuração |
| ------ | ------------ |
| Deployment | `requests` 100m CPU / 256Mi · `limits` 500m CPU / 512Mi · `RollingUpdate` com `maxUnavailable: 0` e `PodDisruptionBudget` ([ADR 005](../adr/005-uso-de-hpa.md)) |
| Probes | `startup` (até 180 s), `readiness` (15 s + 10 s), `liveness` (30 s + 20 s) |
| Service | `LoadBalancer`, provisiona o NLB |
| HPA | `autoscaling/v2`, CPU 70%, 2 a 3 réplicas ([ADR 005](../adr/005-uso-de-hpa.md)) |
| ConfigMap / Secret | Injetados via `envFrom` |
| Job | Migrations TypeORM, aplicado pelo pipeline após o `kubectl apply` do overlay |

Node group padrão: `t3.medium`, `desired 2`, `min 1`, `max 3`.

### 🗄️ Dados

RDS PostgreSQL em subnets dedicadas (`aws_subnet.database`), sem rota para a internet.

- `publicly_accessible = false`
- `storage_encrypted = true`
- Security group com um único ingress: a porta do Postgres, vinda do security group do cluster EKS

Por isso a Lambda só alcança o banco quando roda dentro da VPC com um security group aceito por essa regra.

Modelo relacional e ajustes propostos em [modelo-de-dados.md](./modelo-de-dados.md).

### 🌐 Rede

Três camadas de subnet, provisionadas junto com o cluster (destino: `oficina-mecanica-infra-k8s`); o repositório do banco as descobre pela tag `Tier` ([ADR 007](../adr/007-terraform-do-banco-com-descoberta-via-data-sources.md)):

| Camada | Rota padrão | Ocupantes |
| ------ | ----------- | --------- |
| Pública | Internet Gateway | NLB, NAT Gateway |
| Privada | NAT Gateway | Nós do EKS, Lambda em VPC, Datadog Agent |
| Database | Nenhuma | RDS |

O RDS não tem caminho de saída nem de entrada pela internet. O isolamento vem da topologia, não só do security group.

---

## 📡 Camada de monitoramento

Decidida na [RFC 004](../rfc/004-stack-de-observabilidade.md) e registrada na [ADR 006](../adr/006-stack-de-observabilidade.md). Estado em 11/09/2026:

| Sinal | Origem | Como chega ao Datadog | Estado |
| ----- | ------ | --------------------- | ------ |
| Logs JSON da API, com `correlationId` | `nestjs-pino` + `pino-http` no Nest | stdout do container → Datadog Agent (DaemonSet) | 🟡 log existe na branch `integration-datadog`; agente não |
| Logs JSON da Lambda, com `requestId` | `logStructured` em `src/infrastructure/logger.ts` | CloudWatch → integração AWS, ou Lambda Extension | ⏳ integração não configurada |
| Traces e latência por rota | `dd-trace` no Nest | Agent APM | ⏳ |
| CPU e memória de pods e nós | kubelet / cAdvisor | Datadog Agent | ⏳ |
| Healthcheck e uptime | `GET /api/v1/health` | Synthetic API Test do Datadog | ⏳ |
| Métricas de negócio (OS criadas, tempo por status) | Listeners de eventos da OS ([ADR 004](../adr/004-padrao-de-comunicacao.md)) | DogStatsD via Agent | ⏳ |
| Métricas do RDS e do Gateway | CloudWatch | Integração AWS | ⏳ |

O que falta para a correlação ser ponta a ponta: o Gateway precisa injetar `x-correlation-id` (ou o Nest precisa aceitar o `x-amzn-trace-id` que o Gateway já envia) e a Lambda precisa logar o mesmo valor. Hoje a Lambda loga o `requestId` do Gateway e o Nest gera um UUID próprio quando o header não vem. Os dois ids não se cruzam.

Detalhes operacionais (dashboards, monitores, campos de log): [observability/README.md](../observability/README.md).

---

## 🚚 Entrega: repositórios e alvos de deploy

Este diagrama não faz parte do C4. Mostra qual repositório provisiona o quê e em que ordem o `terraform apply` acontece, conforme a [RFC 005](../rfc/005-segregacao-de-repositorios.md).

```mermaid
flowchart LR
  R3["oficina-mecanica-infra-k8s<br/>VPC · subnets · EKS · node group · ECR · IAM"]
  R4["oficina-mecanica-infra-db<br/>RDS · subnet group · SG (ingress do cluster)"]
  R1["oficina-mecanica-api<br/>imagem + manifestos K8s + Datadog Agent"]
  R2["oficina-mecanica-lambda-auth<br/>Lambda + API Gateway"]

  R3 -->|"descoberta por data sources:<br/>nome do cluster, tag Tier=database"| R4
  R3 -->|"cluster_name, ecr_repository_url"| R1
  R4 -->|"db_endpoint"| R2
  R3 -->|"hostname do NLB"| R2
```

| Componente | Repositório | Pipeline |
| ---------- | ----------- | -------- |
| RDS PostgreSQL, subnet group, security group | `oficina-mecanica-infra-db` | `fmt`/`validate` em PR, `plan` + `apply` automático em `main` ✅ |
| VPC, subnets, EKS, node group, ECR, IAM | `oficina-mecanica-infra-k8s` | `terraform plan` em PR, `apply` em `develop` e `main` (a migrar do repo da API) |
| Imagem, manifestos K8s, Datadog Agent | `oficina-mecanica-api` | `ci-cd.yml`: build, push no ECR, `kubectl apply`, migrations |
| Lambda + API Gateway | `oficina-mecanica-lambda-auth` | lint, testes, `terraform apply` |

O repositório do banco descobre a rede por data sources (nome do cluster e tags), sem ler state alheio; os demais consomem outputs via variáveis de pipeline. A ordem de apply é cluster antes de banco. Decisão e etapas: [RFC 005](../rfc/005-segregacao-de-repositorios.md); implementação do banco registrada na [ADR 007](../adr/007-terraform-do-banco-com-descoberta-via-data-sources.md).

---

## 🔗 Relacionados

| Documento | Conteúdo |
| --------- | -------- |
| [Sequência: autenticação](./sequencia-auth.md) | Fluxo CPF e admin |
| [Sequência: abertura de OS](./sequencia-abertura-os.md) | Transação de criação |
| [Modelo de dados](./modelo-de-dados.md) | ER e relacionamentos |
| [Observabilidade](../observability/README.md) | Dashboards, monitores, logs |
| [ADR 004](../adr/004-padrao-de-comunicacao.md) | Padrão de comunicação |
| [ADR 005](../adr/005-uso-de-hpa.md) | HPA |
| [ADR 006](../adr/006-stack-de-observabilidade.md) | Stack de observabilidade |
| [RFC 001](../rfc/001-escolha-da-nuvem.md) | Escolha da nuvem |
