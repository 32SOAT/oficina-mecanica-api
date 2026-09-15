# RFC 001 — Escolha do provedor de nuvem

| Campo | Valor |
| ----- | ----- |
| Número | 001 |
| Data | 25/08/2026 |
| Status | ✅ Encerrada — Aprovada |
| Autores | Isaac Bruno Siqueira de Souza, Gustavo de Matos Parizi |
| Resultado | Amazon Web Services |

> 📅 **Documento reconstruído em 09/2026.** A arquitetura e a divisão de responsabilidades foram definidas pelo grupo em 25/08/2026; a implementação aconteceu em datas diferentes por pessoa. O histórico do Git é a referência oficial.

## 📄 Sumário

Proposta de adoção da **AWS** como provedor único para a plataforma da oficina, usando EKS para a aplicação, RDS PostgreSQL para persistência, Lambda e API Gateway para autenticação, ECR para imagens e Terraform para provisionamento.

## 📌 Motivação

A expansão para múltiplas unidades trouxe requisitos de segurança, escalabilidade, alta disponibilidade e observabilidade que a operação atual não atende. A escolha do provedor precisa ser feita antes de qualquer código de infraestrutura, porque determina o Terraform, o pipeline de CI/CD e as opções de observabilidade.

Custo de reversão é alto: trocar de provedor depois significa reescrever todo o código de infraestrutura.

## 📋 Requisitos

| # | Requisito | Origem |
| --- | --------- | ------ |
| R1 | Kubernetes gerenciado com escalabilidade | Enunciado da fase |
| R2 | Function serverless para autenticação | Enunciado da fase |
| R3 | API Gateway para roteamento | Enunciado da fase |
| R4 | Banco relacional gerenciado | Enunciado + [ADR 001](../adr/001-escolha-do-banco-de-dados.md) |
| R5 | Registro de containers privado | Deploy da API |
| R6 | Provisionamento por Terraform | Enunciado da fase |
| R7 | Integração com Datadog ou New Relic | Enunciado da fase |
| R8 | Viável no ambiente acadêmico disponível | Restrição do grupo |

## ⚖️ Critérios de avaliação

1. Cobertura de R1 a R7: os cinco serviços existem como oferta gerenciada?
2. Maturidade do provider Terraform: recursos estáveis e documentados?
3. Familiaridade da equipe: curva de aprendizado dentro do prazo da fase
4. Ambiente de laboratório: o grupo consegue provisionar de fato?
5. Ecossistema de observabilidade: integrações prontas com as ferramentas exigidas

O critério 4 tem peso desproporcional. Uma arquitetura que o grupo não consegue provisionar não é entregável, por melhor que seja no papel.

## 🔀 Alternativas avaliadas

### AWS

| Requisito | Serviço |
| --------- | ------- |
| R1 | Amazon EKS |
| R2 | AWS Lambda |
| R3 | API Gateway HTTP API |
| R4 | Amazon RDS PostgreSQL |
| R5 | Amazon ECR |
| R6 | `hashicorp/aws`, o provider mais maduro do ecossistema |
| R7 | Datadog e New Relic têm integração nativa com EKS, Lambda e RDS |

Cobre tudo com serviços de primeira linha. O API Gateway HTTP API tem custo e latência menores que o REST API e é suficiente para o caso, que precisa de duas rotas.

O que pesou mais: o AWS Academy é o ambiente disponível ao grupo. Existe caminho concreto para provisionar e demonstrar.

**Contrapontos.** Curva de aprendizado do IAM é íngreme. O ambiente Academy tem restrições de permissão e sessões de duração limitada, exigindo cuidado com estado do Terraform.

### Google Cloud Platform

GKE é, tecnicamente, o Kubernetes gerenciado mais refinado do mercado, com Autopilot e upgrades menos trabalhosos que o EKS. Cloud Functions, API Gateway e Cloud SQL cobrem o resto.

Não escolhido por dois motivos: sem ambiente acadêmico equivalente disponível ao grupo (R8), e a integração da equipe com o ecossistema é menor, o que consumiria prazo em aprendizado de plataforma em vez de arquitetura.

### Microsoft Azure

AKS, Azure Functions, API Management e Azure Database for PostgreSQL cobrem os requisitos. Azure for Students oferece crédito.

Não escolhido porque o API Management tem custo de entrada e complexidade superiores ao necessário para duas rotas, e a familiaridade da equipe é a menor entre as três.

### Multi-cloud ou agnóstico

Kubernetes em qualquer provedor, com Crossplane ou abstrações que evitem lock-in.

Descartada rapidamente. O enunciado pede function serverless e API gateway gerenciados, que são exatamente os serviços onde a abstração vaza. Multi-cloud significaria o denominador comum de três provedores, com complexidade tripla e nenhum ganho no escopo da fase.

## 📊 Comparação

| Critério | AWS | GCP | Azure |
| -------- | --- | --- | ----- |
| Cobertura R1–R7 | ✅ | ✅ | ✅ |
| Maturidade Terraform | ✅ Alta | ✅ Alta | 🟡 Média |
| Familiaridade da equipe | ✅ Maior | 🟡 Menor | 🟡 Menor |
| Ambiente de laboratório | ✅ AWS Academy | ❌ | 🟡 Crédito estudante |
| Ecossistema de observabilidade | ✅ | ✅ | ✅ |

## ✅ Proposta

Adotar **AWS**, com a seguinte composição:

```
API Gateway HTTP API  →  entrada única
  ├─ POST /auth/cpf      →  Lambda (nodejs22.x)
  └─ ANY /{proxy+}       →  NLB → EKS

EKS       →  aplicação NestJS, com HPA
RDS       →  PostgreSQL em subnets isoladas
ECR       →  imagens
Terraform →  todo o provisionamento
```

Região `us-east-1`, por ser a padrão do AWS Academy e a de maior disponibilidade de serviços.

Rede em três camadas de subnet: pública (NLB, NAT), privada (nós EKS, Lambda em VPC) e de banco (RDS, sem rota para a internet).

## ❓ Questões em aberto

| Questão | Encaminhamento |
| ------- | -------------- |
| Como lidar com a expiração de sessão do AWS Academy no Terraform? | Backend remoto de state em S3 com trava em DynamoDB, um por repositório |
| Multi-AZ no RDS encarece. Vale para o escopo da fase? | Variável `db_multi_az`, padrão `false`. Reavaliar antes da demonstração |
| Cluster Autoscaler será necessário? | Não com `maxReplicas: 3`. Ver [ADR 005](../adr/005-uso-de-hpa.md) |
| Qual ferramenta de observabilidade? | [RFC 004](./004-stack-de-observabilidade.md): proposta Datadog |

## 🏁 Resultado

**Encerrada — Aprovada.** Implementada em Terraform: rede e RDS em `oficina-mecanica-infra-db`, EKS, ECR e IAM em `oficina-mecanica-infra-k8s`, Lambda e API Gateway em `oficina-mecanica-lambda-auth`. A divisão entre repositórios está na [RFC 005](./005-segregacao-de-repositorios.md).

## 🔗 Relacionados

- [RFC 002 — Banco de dados gerenciado](./002-banco-de-dados-gerenciado.md)
- [RFC 005 — Segregação de repositórios](./005-segregacao-de-repositorios.md)
- [ADR 005 — Uso de HPA](../adr/005-uso-de-hpa.md)
- [Componentes](../architecture/componentes.md)
