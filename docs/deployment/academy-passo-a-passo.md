# AWS Academy — subir e derrubar (passo a passo)

Guia curto para repetir o que funcionou neste projeto. Região: **us-east-1**.
Custa cerca de **US$ 0,25/hora**. Não deixe ligado de um dia para o outro.

Ferramentas no PC: AWS CLI, Terraform, Docker Desktop, kubectl, Git Bash.

---

## 0) Abrir o lab

1. [AWS Academy](https://www.awsacademy.com) → Student Login → curso **Learner Lab**.
2. Módulos → **Iniciar os laboratórios de aprendizagem da AWS Academy**.
3. **Start Lab**. Espera o pontinho **AWS** ficar **verde**.
4. Se aparecer `account is still in cleanup`, espera 5–15 min. Não clica em Reset.

Se o timer estiver acabando, clica **Start Lab** de novo para renovar as 4 horas.

---

## 1) Ligar o terminal na conta do lab

Na aba do lab: **AWS Details**. Copia Access Key, Secret e Session Token.

PowerShell (não cola as chaves no chat):

```powershell
aws configure set aws_access_key_id COLA_ACCESS_KEY
aws configure set aws_secret_access_key COLA_SECRET
aws configure set aws_session_token COLA_SESSION_TOKEN
aws configure set region us-east-1
aws configure set output json
aws sts get-caller-identity
```

Tem que aparecer `voclabs`. As chaves **expiram com a sessão**. Se der `ExpiredToken`, pega de novo no AWS Details.

---

## 2) Variáveis da infra

Arquivo: `infra/.env` (cópia de `infra/.env.example`).

Obrigatório:

- `TF_VAR_db_password`
- `TF_VAR_jwt_secret` (mais de 16 caracteres)
- `TF_VAR_use_existing_eks_iam_roles=true` (Academy não deixa criar IAM)
- `TF_VAR_db_storage_type="gp2"`
- `TF_VAR_node_instance_types='["t3.medium"]'`

As roles do Academy **não** se chamam só `LabEksClusterRole`. Conferir:

```powershell
aws iam list-roles --query "Roles[?contains(RoleName, 'LabEks')].[RoleName]" --output table
```

Coloca os nomes reais em:

- `TF_VAR_eks_cluster_role_name`
- `TF_VAR_eks_node_role_name`

---

## 3) Criar a infra (Terraform)

PowerShell:

```powershell
cd C:\Users\Juliana\Documents\projetos\oficina-mecanica-api\infra
terraform init
$env:TF_VAR_use_existing_eks_iam_roles="true"
$env:TF_VAR_eks_cluster_role_name="COLA_O_NOME_LabEksClusterRole"
$env:TF_VAR_eks_node_role_name="COLA_O_NOME_LabEksNodeRole"
$env:TF_VAR_db_storage_type="gp2"
terraform apply
```

Cola senha e JWT quando pedir. No final digite **yes** (não aperte Enter vazio).

Demora 15–25 min. Sucesso: `Apply complete!`

Conferir o cluster:

```powershell
aws eks update-kubeconfig --region us-east-1 --name oficina-mecanica-dev
kubectl get nodes
```

Os nodes têm que estar `Ready`.

---

## 4) Publicar a imagem no ECR

Abre o **Docker Desktop** e espera ficar pronto.

PowerShell (uma linha só no `output -raw`):

```powershell
cd C:\Users\Juliana\Documents\projetos\oficina-mecanica-api
$ecr = terraform -chdir=infra output -raw ecr_repository_url
echo $ecr
cmd /c "aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 010014817485.dkr.ecr.us-east-1.amazonaws.com"
docker buildx build --platform linux/amd64 -t "${ecr}:v1.0.0" --push .
```

O login no PowerShell **precisa** do `cmd /c`, senão dá 400.

---

## 5) Subir a API no Kubernetes

Abre **Git Bash** (não PowerShell):

```bash
cd /c/Users/Juliana/Documents/projetos/oficina-mecanica-api
source infra/.env
source infra/load-terraform-outputs.sh
export API_IMAGE_TAG=v1.0.0
export API_HEALTHCHECK_PATH="/api/v1/health"
export RESEND_API_KEY="$(grep '^RESEND_API_KEY=' .env | cut -d= -f2-)"
export NOTIFICACAO_EMAIL_MECANICOS="$(grep '^NOTIFICACAO_EMAIL_MECANICOS=' .env | cut -d= -f2-)"
export NOTIFICACAO_EMAIL_ADMIN="$(grep '^NOTIFICACAO_EMAIL_ADMIN=' .env | cut -d= -f2-)"
source infra/load-k8s-template-vars.sh
bash infra/prepare-k8s-overlay.sh
bash infra/render-k8s-overlay.sh
kubectl apply -k k8s/overlays/generated
bash infra/run-db-migrations.sh
bash infra/apply-k8s-overlay.sh
```

Ordem importa: **namespace primeiro** (`kubectl apply -k`), **depois** migrations.

Se o rollout travar em `0/1` e o probe der 404:

```bash
kubectl -n oficina-mecanica patch deployment fase2-kubernetes-oficina-mecanica-api --type='json' -p='[
  {"op":"replace","path":"/spec/template/spec/containers/0/readinessProbe/httpGet/path","value":"/api/v1/health"},
  {"op":"replace","path":"/spec/template/spec/containers/0/livenessProbe/httpGet/path","value":"/api/v1/health"},
  {"op":"replace","path":"/spec/template/spec/containers/0/startupProbe/httpGet/path","value":"/api/v1/health"}
]'
kubectl -n oficina-mecanica get pods -w
```

Queremos `1/1 Running`.

URL pública:

```bash
kubectl -n oficina-mecanica get svc fase2-kubernetes-oficina-mecanica-api -o jsonpath="{.status.loadBalancer.ingress[0].hostname}"; echo
```

- Health: `http://<hostname>/api/v1/health`
- Swagger: `http://<hostname>/api`

Esse hostname é o `nest_api_url` da Lambda (HTTP, sem barra no final).

---

## 6) Lambda + API Gateway (Fase 3)

Repo separado: [oficina-mecanica-lambda-auth](https://github.com/32SOAT/oficina-mecanica-lambda-auth). O Nest precisa estar **1/1 Running** e o NLB com hostname.

1. RDS host, subnets privadas e `jwt_secret` **iguais** aos da API (`infra/.env` / outputs do Terraform).
2. `lambda_role_arn` = ARN do **LabRole** (Academy não cria IAM).
3. `nest_api_url = "http://<hostname-do-nlb>"`
4. `npm run build` e `terraform apply` na pasta `infra` da Lambda.

`terraform output api_endpoint` é a URL do Gateway:

- `POST {endpoint}/auth/cpf` → JWT `role: cliente`
- `{endpoint}/api/v1/health` → proxy para o Nest
- `{endpoint}/api/v1/ordens/{id}/status` → JWT de cliente

Guia completo (tfvars, curls, timeout/CIDR): [README da Lambda](https://github.com/32SOAT/oficina-mecanica-lambda-auth).

`TF_VAR_api_allowed_cidr_blocks` da API deve permitir `0.0.0.0/0` senão o Gateway não alcança o NLB.

Antes de derrubar o EKS, dê `terraform destroy` **neste repo da Lambda** (Gateway + Function). Senão o apply da Lambda fica órfão e o NLB pode prender o destroy da API.

---

## 7) Derrubar tudo (parar o gasto)

Lab **verde**. Credenciais válidas (`aws sts get-caller-identity`).

Se subiu a Lambda, destrua **primeiro** o Terraform dela (`oficina-mecanica-lambda-auth/infra`), depois o desta API.

No Windows use **só PowerShell**. Não rode `bash .\destroy-environment.sh` — cai no WSL e falha.

```powershell
cd C:\Users\Juliana\Documents\projetos\oficina-mecanica-api\infra
$env:TF_VAR_use_existing_eks_iam_roles="true"
$env:TF_VAR_db_storage_type="gp2"
terraform destroy
```

Cola senha e JWT do `infra/.env`. No final: **yes**.

O NAT demora. Sucesso: `Destroy complete!`.

### Se der `DependencyViolation` nas subnets / IGW

O cluster EKS já saiu, mas o **Network Load Balancer** da API ficou. Isso prende subnet e internet gateway.

1. Achar o NLB:

```powershell
aws elbv2 describe-load-balancers --region us-east-1 --query "LoadBalancers[].{Name:LoadBalancerName,Arn:LoadBalancerArn,State:State.Code}"
```

2. Apagar (troca o ARN pelo da sua saída):

```powershell
aws elbv2 delete-load-balancer --region us-east-1 --load-balancer-arn "COLA_O_ARN"
```

3. Esperar ~2 min até a lista ficar vazia:

```powershell
aws elbv2 describe-load-balancers --region us-east-1
```

4. Rodar de novo:

```powershell
$env:TF_VAR_use_existing_eks_iam_roles="true"
$env:TF_VAR_db_storage_type="gp2"
terraform destroy
```

Se o EKS **ainda** existir, pode apagar o Service antes do NLB:

```powershell
kubectl -n oficina-mecanica delete svc fase2-kubernetes-oficina-mecanica-api
```

### Confirmar que apagou

```powershell
terraform show
aws eks list-clusters --region us-east-1
aws rds describe-db-instances --region us-east-1 --query "DBInstances[].DBInstanceIdentifier"
aws ec2 describe-nat-gateways --region us-east-1 --query "NatGateways[?State!='deleted']"
aws ecr describe-repositories --region us-east-1 --query "repositories[].repositoryName"
aws elbv2 describe-load-balancers --region us-east-1
```

Limpo quando: `terraform show` não lista VPC/subnet/IGW, e os `aws` voltam lista vazia.

**Não dá Reset** no Academy se o destroy completou. Reset apaga a conta do lab e **não** devolve os US$ 50. Depois do destroy: **End Lab**.

---

## Se der erro

| Erro | O que fazer |
| --- | --- |
| `iam:CreateRole` | Faltou `TF_VAR_use_existing_eks_iam_roles=true` |
| `iam:PassRole` em `LabEksClusterRole` | Usar o nome **longo** da role (`aws iam list-roles`) |
| `ExpiredToken` | AWS Details → `aws configure set` de novo |
| ECR login 400 no PowerShell | Usar `cmd /c` no pipe do login |
| Namespace not found nas migrations | `kubectl apply -k` antes do job |
| Probe 404 / pod `0/1` | Patch do health para `/api/v1/health` |
| `account is still in cleanup` | Esperar; não Reset |
| `bash` / `execvpe(/bin/bash)` no PowerShell | Usar `terraform destroy`, não o `.sh` |
| `DependencyViolation` subnet/IGW | Apagar o NLB (`elbv2 delete-load-balancer`) e destroy de novo |
| `iam:CreateRole` na Lambda | `lambda_role_arn` = ARN do LabRole |
| Gateway timeout no `/api/v1/health` | NLB `0.0.0.0/0`; `nest_api_url` com `http://` e sem barra |
