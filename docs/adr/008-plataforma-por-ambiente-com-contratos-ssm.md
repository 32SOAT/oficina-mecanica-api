# ADR 008 — Plataforma por ambiente com contratos via SSM e deploy por digest

| Campo | Valor |
| ----- | ----- |
| Data | 14/09/2026 |
| Status | Aceita |
| Decisores | Isaac Bruno Siqueira de Souza |
| RFC de origem | [RFC 005](../rfc/005-segregacao-de-repositorios.md) |

## 📌 Contexto

A [RFC 005](../rfc/005-segregacao-de-repositorios.md) aprovou tirar o Terraform de cluster do repositório da API e colocá-lo em `oficina-mecanica-infra-k8s`, com pipeline própria e deploy automático de homologação e produção. A [ADR 007](./007-terraform-do-banco-com-descoberta-via-data-sources.md) já havia decidido que o banco descobre a rede por data sources, sem ler state alheio.

Faltava decidir três coisas para o repositório da plataforma:

- Como os quatro repositórios trocam os valores que um produz e o outro consome (URL do ECR, hostname do NLB, ARN da Lambda, subnets), sem `terraform_remote_state` e sem copiar outputs à mão.
- Como isolar homologação de produção: mesmo state, mesma VPC, mesma conta?
- Como a imagem da API chega ao cluster com rastreabilidade, e quem executa as migrations.

Havia ainda uma questão de ownership: o API Gateway nasceu no repositório da Lambda, mas precisa do hostname do NLB, que só existe depois do deploy Kubernetes.

A pergunta desta ADR é: **como a plataforma é organizada por ambiente, como os repositórios se integram e como a aplicação é promovida**.

## ✅ Decisão

### Três roots Terraform com state próprio

| Root | Branch | Conteúdo |
| ---- | ------ | -------- |
| `environments/shared` | `main` | ECR da API, identidade de publicação, parâmetro `/oficina/shared/ecr/repository-url` |
| `environments/homologacao` | `homolog` | VPC `10.20.0.0/16`, EKS, identidade de deploy, contratos SSM, API Gateway |
| `environments/producao` | `main` | VPC `10.30.0.0/16`, EKS, identidade de deploy, contratos SSM, API Gateway |

Cada root tem backend, lockfile e ciclo de vida independentes. `bootstrap/backend` cria o bucket S3 com KMS e `bootstrap/identity` cria o provider OIDC e roles separadas de plan, apply e destroy, executados uma vez por conta. Não há Terraform workspaces.

### Contratos por parâmetros SSM

Cada repositório publica o que produz em `/oficina/<ambiente>/platform/<nome>` e lê o que consome por data source. Só valores `String` não sensíveis.

| Parâmetro | Quem publica | Quem consome |
| --------- | ------------ | ------------ |
| `/oficina/shared/ecr/repository-url` | root `shared` | `publish-image.yml` da API, deploy Kubernetes |
| `vpc-id`, `public-subnet-ids`, `private-subnet-ids`, `database-subnet-ids`, `database-client-security-group-id`, `eks-cluster-name`, `aws-region` | root do ambiente | operação e repositórios consumidores |
| `auth-lambda-arn` | `oficina-mecanica-lambda-auth` | módulo `api-gateway-http` |
| `api-nlb-hostname` | `kubernetes-deploy.sh`, após o Service receber hostname | módulo `api-gateway-http` |

### API Gateway no repositório da plataforma

O módulo `api-gateway-http` vive no root de cada ambiente e é aplicado por último, quando `auth-lambda-arn` e `api-nlb-hostname` existem. O repositório da Lambda deixa de criar Gateway e proxy; publica só o ARN. A [ADR 003](./003-auth-cliente-lambda-jwt-role.md) continua valendo para o contrato de token e a autorização no Nest.

### Deploy por digest imutável

- A API publica a imagem por `workflow_dispatch` (`publish-image.yml`), com tag `sha-<SHA completo>`, e devolve o digest. Só commits alcançáveis por `homolog` ou `main` são aceitos. Nunca `latest`.
- O `infra-k8s` versiona o digest no overlay do ambiente (`kubernetes/oficina-api/overlays/<ambiente>/kustomization.yaml`). Trocar de versão é um PR que muda uma linha.
- Após o merge, `kubernetes-deploy.sh` valida o digest no ECR, cria ConfigMap e Secret a partir do GitHub Environment, aplica o Job de migrations e espera, aplica o overlay, espera o rollout, testa `GET /api/v1/health` no NLB e publica `api-nlb-hostname`.
- Produção usa o mesmo digest aprovado em homologação; a política de promoção rejeita digest diferente.

### Autenticação por OIDC

GitHub Actions assume roles AWS por OIDC, com uma role por finalidade (plan read-only em PR, apply por ambiente, destroy protegido, publicação de imagem, deploy Kubernetes). Não há access keys nos repositórios de plataforma. `TF_DEPLOY_ENABLED` e `KUBERNETES_<AMBIENTE>_DEPLOY_ENABLED` são travas explícitas por repositório.

## 📊 Consequências

### 👍 Positivas

- Nenhum repositório lê o state de outro. O contrato é um nome de parâmetro, verificável com `aws ssm get-parameter`.
- Homologação e produção são independentes em rede, cluster, state, credenciais e branch. Um `destroy` de homologação não alcança produção.
- Toda versão em execução é rastreável até um commit da API e um PR no `infra-k8s`, pelo digest.
- Migrations rodam antes do rollout e abortam o deploy quando falham.
- O Gateway só é aplicado quando seus dois alvos existem, o que elimina a ordem manual "sobe o Nest, copia o hostname, aplica a Lambda" das fases anteriores.

### 👎 Negativas e trade-offs

- A ordem de provisionamento de um ambiente novo tem oito etapas e vive em runbook ([cross-repository-integration.md](https://github.com/32SOAT/oficina-mecanica-infra-k8s/blob/main/docs/runbooks/cross-repository-integration.md)).
- O parâmetro `api-nlb-hostname` só existe depois do primeiro deploy; até lá o Gateway não pode ser aplicado.
- A promoção entre ambientes é um PR manual com o digest. Não há automação de promoção na primeira versão.
- O NLB é público e a integração Gateway → NLB é HTTP. Risco conhecido, registrado nos runbooks, com evolução para VPC Link e TLS.
- O `infra-db` descobre o cluster por nome e tag em vez de ler `database-client-security-group-id`; os dois contratos coexistem e precisam de nomes de cluster iguais nos dois repositórios (`oficina-mecanica-<ambiente>`).

## 🔀 Alternativas consideradas

| Alternativa | Por que não foi escolhida |
| ----------- | ------------------------- |
| **`terraform_remote_state` entre repositórios** | Acopla o leitor ao bucket e à key do state alheio e exige permissão de leitura sobre ele. Foi a proposta original da RFC 005 e já havia sido descartada pela ADR 007 para o banco |
| **Outputs copiados para `tfvars` à mão** | Era o fluxo das fases anteriores. Não é reproduzível em pipeline e depende de quem operou lembrar o valor |
| **Um state e uma VPC para os dois ambientes** | Mais barato, mas um erro em homologação alcança produção. O enunciado pede os dois ambientes com deploy próprio |
| **Gateway no repositório da Lambda** | Onde nasceu. Precisava do hostname do NLB, que pertence ao deploy Kubernetes, e da ordem manual de apply. Mover para a plataforma coloca o Gateway ao lado dos dois alvos que ele integra |
| **Tag `latest` ou tag mutável por branch** | Impede saber qual código está rodando e permite deploy sem PR. Digest é a única referência que não muda |
| **Deploy disparado pelo repositório da API** | A API precisaria de credenciais do cluster e conhecer os manifestos. Separar publicação de deploy mantém cada repositório com uma responsabilidade |
| **Access keys em GitHub Secrets** | Funcionava no Academy, mas credenciais de longa duração em segredo de repositório. OIDC emite credencial por execução |

## 🔮 Evolução prevista

- Promoção automática para produção após homologação verde, com aprovação no GitHub Environment.
- VPC Link e TLS entre o Gateway e o Nest, com NLB interno.
- `infra-db` consumindo `database-client-security-group-id` do contrato SSM em vez do SG do cluster.
- Domínio próprio, ACM e WAF na frente do Gateway.
- Pipeline da Lambda com `terraform apply` por ambiente, no mesmo modelo OIDC.

## 🔗 Relacionados

- [RFC 005 — Segregação de repositórios](../rfc/005-segregacao-de-repositorios.md)
- [ADR 003 — Auth de cliente via Lambda](./003-auth-cliente-lambda-jwt-role.md)
- [ADR 005 — Uso de HPA](./005-uso-de-hpa.md)
- [ADR 007 — Terraform do banco](./007-terraform-do-banco-com-descoberta-via-data-sources.md)
- [Integração entre repositórios](../deployment/cross-repository.md)
- [Componentes](../architecture/componentes.md)
- [README do infra-k8s](https://github.com/32SOAT/oficina-mecanica-infra-k8s)
