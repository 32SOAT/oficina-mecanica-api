# ADR 007 — Terraform do banco em repositório dedicado com descoberta via data sources

| Campo | Valor |
| ----- | ----- |
| Data | 13/09/2026 |
| Status | Aceita |
| Decisores | Gustavo de Matos Parizi |
| RFC de origem | [RFC 005](../rfc/005-segregacao-de-repositorios.md) |

## 📌 Contexto

A [RFC 005](../rfc/005-segregacao-de-repositorios.md) aprovou a alternativa B: migração completa do Terraform para os repositórios de infraestrutura, com a VPC em `infra-db`, a regra de ingress do Postgres em `infra-k8s` e `terraform_remote_state` como integração entre eles.

Na implementação do primeiro repositório da migração (`oficina-mecanica-infra-db`), três pontos da alternativa B se mostraram mais custosos do que a RFC previa:

- **A VPC carrega identidade do cluster, não do banco.** As subnets têm as tags `kubernetes.io/cluster/<nome>` e `kubernetes.io/role/internal-elb`, que existem para o EKS e o NLB. Movê-las para o repositório do banco obrigaria `infra-db` a conhecer o nome do cluster de qualquer forma — só que como dono, não como consumidor.
- **`terraform_remote_state` acopla ao layout do state.** O repositório leitor precisa saber bucket e key do state alheio e ter permissão de leitura sobre ele. Qualquer reorganização de state quebra o leitor.
- **SG sem regra é uma janela de inconsistência.** Na alternativa B o security group do Postgres nasce vazio em `infra-db` e só recebe a regra quando `infra-k8s` aplica. Entre os dois applies, o banco existe sem regra de acesso definida no código que o criou.

Havia também um fato novo, verificado durante a implementação: **não existia state remoto a preservar**. Os applies das fases anteriores foram locais, na conta AWS Academy de um único integrante, e o pipeline `infra.yml` nunca executou um `apply`. A questão em aberto da RFC ("migrar o state ou recriar?") se resolveu sozinha: recriar.

A pergunta desta ADR é: **como o repositório do banco obtém a rede e o security group do cluster, e o que exatamente vive nele**.

## ✅ Decisão

O `oficina-mecanica-infra-db` contém **apenas os recursos do banco** e descobre a rede em runtime por **data sources**, usando as convenções de nome e tag que já existiam no Terraform:

```hcl
data "aws_eks_cluster" "this" {
  name = local.cluster_name # oficina-mecanica-dev
}

data "aws_subnets" "database" {
  filter {
    name   = "vpc-id"
    values = [data.aws_eks_cluster.this.vpc_config[0].vpc_id]
  }
  tags = { Tier = "database" }
}
```

| Recurso | Onde vive |
| ------- | --------- |
| `aws_db_instance`, `aws_db_subnet_group`, `aws_security_group` do Postgres | `oficina-mecanica-infra-db` |
| VPC, subnets (inclusive as de tag `Tier = database`), EKS | Stack do cluster (hoje `oficina-mecanica-api/infra`; destino: `infra-k8s`) |
| Regra de ingress 5432 ← SG do cluster | No próprio SG, em `infra-db`, via data source |
| Regras de ingress adicionais (ex.: Lambda em VPC) | Variável `extra_ingress_security_group_ids` em `infra-db` |

O state é próprio (`oficina-mecanica/db/terraform.tfstate` no mesmo bucket S3, key separada) e o pipeline segue o requisito da fase: `fmt`/`validate` em PR, `plan` + **`apply` automático** em push na `main`, `plan`/`destroy` manuais por `workflow_dispatch`.

### Divergências em relação à alternativa B da RFC 005

| Ponto | RFC 005 (alternativa B) | Implementado | Motivo |
| ----- | ----------------------- | ------------ | ------ |
| VPC e subnets | Em `infra-db` | Permanecem com o stack do cluster | As tags `kubernetes.io/*` pertencem ao ciclo de vida do cluster; o banco é consumidor da rede, não dono |
| Integração entre repositórios | `terraform_remote_state` | Data sources por nome e tag | Remove o acoplamento a bucket/key e a permissão de leitura de state alheio; o contrato vira a convenção de nomes que já existia |
| Regra de ingress do Postgres | Em `infra-k8s`, após ambos existirem | No próprio `infra-db` | O SG nasce completo, sem janela sem regra; `infra-k8s` não precisa conhecer o banco |
| Ordem de apply | `infra-db` → `infra-k8s` | Cluster → `infra-db` | Consequência da descoberta: o data source exige o cluster existente. Documentada nos READMEs |

A dependência circular que a RFC apontou como único bloqueio técnico deixa de existir: só há uma direção de dependência (banco depende do cluster).

## 📊 Consequências

### 👍 Positivas

- O contrato entre repositórios é a convenção `${project_name}-${environment}` + tag `Tier = database`, que já estava no código. Nenhum repositório lê state de outro.
- State isolado por key: um `terraform destroy` no repositório do banco não alcança rede nem cluster, e vice-versa.
- Deploy automático na `main` implementado e verificado — requisito da fase que o `infra.yml` da API (apply só manual) não atendia.
- Testado ponta a ponta em conta AWS Academy em 13/09/2026: cluster + subnets aplicados pelo stack da API, RDS aplicado por `infra-db` via data sources, ingress verificado (5432 apenas a partir do SG do cluster), `terraform plan` subsequente sem mudanças, destroy completo sem resíduo de recurso ou custo.
- Quando o stack de rede migrar da API para `infra-k8s` (etapa do Isaac na RFC 005), `infra-db` não muda: as tags e o nome do cluster viajam com o código.

### 👎 Negativas e trade-offs

- A convenção de nomes vira contrato implícito. Renomear o cluster ou retirar a tag `Tier` quebra a descoberta — a falha é explícita no `plan`, mas é quebra.
- A ordem de apply (cluster antes do banco) é obrigatória e vive só em documentação.
- `infra-k8s` continua vazio até a migração do stack do cluster; o R5 da RFC 005 segue pendente.
- Branches de homologação (`develop`) ainda não existem; o pipeline cobre apenas `main`.
- A senha do RDS continua em GitHub Secret + variável Terraform ([requisitos RNF11](../architecture/requisitos.md)); Secrets Manager fica para depois.
- Credenciais do AWS Academy expiram a cada sessão (~4h): antes de qualquer apply via pipeline, os três secrets AWS precisam ser renovados.

## 🔀 Alternativas consideradas

| Alternativa | Por que não foi escolhida |
| ----------- | ------------------------- |
| **Alternativa B literal (VPC em `infra-db`, ingress em `infra-k8s`, remote state)** | Acopla o repositório de menor mudança (banco) ao de maior identidade de rede (cluster), exige permissão de leitura de state entre repositórios e deixa o SG do banco sem regra entre applies |
| **Remote state apenas para os outputs de rede** | Meio termo que mantém o acoplamento a bucket/key sem eliminar a ordem de apply; o data source dá o mesmo resultado sem o acoplamento |
| **Migrar o state existente com `terraform state mv`/`import`** | Não havia state remoto compartilhado a preservar — os applies eram locais e a conta de laboratório é recriável. Recriar é mais previsível, como a própria RFC já suspeitava |
| **Monorepo ou repositórios-espelho** | Rejeitados na RFC 005 |

## 🔮 Evolução prevista

- Migração do stack de rede/EKS da API para `infra-k8s`, sem mudança em `infra-db`.
- Branch `develop` com deploy de homologação nos quatro repositórios (etapa 5 da RFC 005).
- OIDC do GitHub Actions para role AWS no lugar de chaves estáticas, quando fora do Academy.
- Senha do RDS via AWS Secrets Manager.
- Quando a Lambda entrar na VPC, autorizá-la no banco por `extra_ingress_security_group_ids`, sem tocar no SG na mão.

## 🔗 Relacionados

- [RFC 005 — Segregação de repositórios](../rfc/005-segregacao-de-repositorios.md)
- [RFC 002 — Banco de dados gerenciado](../rfc/002-banco-de-dados-gerenciado.md)
- [ADR 001 — Escolha do banco de dados](./001-escolha-do-banco-de-dados.md)
- [Modelo de dados](../architecture/modelo-de-dados.md)
- [Componentes](../architecture/componentes.md)
- [Repositório oficina-mecanica-infra-db](https://github.com/32SOAT/oficina-mecanica-infra-db)
