# Deploy AWS (Terraform)

Guia para provisionar a infraestrutura na AWS (Terraform) e fazer o deploy da aplicação no Kubernetes.

## O que você precisa ter instalado

- `terraform` 1.6 ou superior
- `aws` CLI autenticado na conta correta
- `docker` com o plugin `buildx`
- `kubectl`
- `envsubst` (normalmente fornecido pelo pacote `gettext-base`)

## 1. Preparar as variáveis

Crie o arquivo local de ambiente:

```bash
cd infra
cp .env.example .env
```

Edite `infra/.env` e ajuste pelo menos:

- `TF_VAR_db_password`
- `TF_VAR_jwt_secret`
- `TF_VAR_cluster_endpoint_public_access_cidrs`
- `TF_VAR_api_allowed_cidr_blocks`

Carregue as variáveis no terminal:

```bash
source .env
```

## 2. Criar a infraestrutura AWS com Terraform

Inicialize o diretório:

```bash
terraform init
```

Opcionalmente, veja o plano:

```bash
terraform plan
```

Crie a infraestrutura:

```bash
terraform apply
```

Se quiser aplicar sem confirmação interativa:

```bash
terraform apply -auto-approve
```

## 3. Ler os outputs do Terraform

Depois do `apply`, carregue em variáveis locais os valores que vamos reutilizar:

```bash
source ./load-terraform-outputs.sh
```

Esse arquivo exporta:

- `CLUSTER_NAME`
- `AWS_REGION_OUT`
- `ECR_REPOSITORY_URL`
- `KUBERNETES_NAMESPACE`
- `API_SERVICE_NAME`
- `API_NAME`
- `PROJECT_NAME`
- `APP_INSTANCE`
- `APP_PORT`
- `POSTGRES_HOST`

Se preferir conferir tudo de uma vez:

```bash
terraform output
```

## 4. Configurar acesso ao cluster EKS

Atualize o kubeconfig local:

```bash
aws eks update-kubeconfig --region "${AWS_REGION_OUT}" --name "${CLUSTER_NAME}"
```

Teste a conexão:

```bash
kubectl get nodes
kubectl get ns
```

Se esse passo falhar, o problema ainda é acesso ao cluster, não deploy da API.

## 5. Build e push da imagem Docker

Saia do diretório `infra` e volte para a raiz do projeto:

```bash
cd ..
```

Escolha a tag da imagem:

```bash
export API_IMAGE_TAG="v1.0.0"
```

Publique a imagem para a arquitetura dos nodes EKS. O script usa
`linux/amd64` por padrão, autentica no hostname do ECR e faz o build e o push
em uma única operação:

```bash
bash ./infra/publish-api-image.sh
```

Para publicar intencionalmente para outra arquitetura, defina
`API_IMAGE_PLATFORM` antes de executar o script.

## 6. Gerar os manifestos Kubernetes manualmente

Os arquivos versionados ficam em `k8s/templates` e o resultado final vai para `k8s/overlays/generated`.

Garanta que você está na raiz do projeto:

```bash
pwd
```

O caminho esperado termina com:

```text
oficina-mecanica-api
```

Prepare o diretório gerado e copie os templates:

```bash
bash ./infra/prepare-k8s-overlay.sh
```

Carregue as variáveis usadas nos templates:

```bash
source ./infra/load-k8s-template-vars.sh
```

Renderize todos os YAMLs:

```bash
bash ./infra/render-k8s-overlay.sh
```

Antes de renderizar, o script valida se todas as variáveis obrigatórias estão
preenchidas e se os valores estruturais, como namespace, replicas e tag da
imagem, possuem formato válido. Se alguma variável estiver ausente ou vazia, a
renderização termina com erro antes de alterar os YAMLs.

Os valores do ConfigMap e do Secret não são interpolados diretamente no YAML.
Eles são gravados com permissão restrita em `k8s/overlays/generated/values/` e
processados por `configMapGenerator` e `secretGenerator` do Kustomize. Isso
preserva com segurança de serialização valores que contenham aspas, caracteres
especiais ou quebras de linha. Todo o diretório gerado fica ignorado pelo Git.

O Deployment usa `oficina-mecanica-api` apenas como nome local da imagem. O
Kustomize troca esse placeholder por `${ECR_REPOSITORY_URL}:${API_IMAGE_TAG}`.
Esse nome local é independente de `API_NAME`, que identifica os recursos
Kubernetes. Isso permite que pipelines validem a imagem com, por exemplo,
`docker buildx build --platform linux/amd64 --load -t
oficina-mecanica-api:<tag> .`, sem acoplar o build ao nome do Deployment.

Confira o resultado final do kustomize:

```bash
kubectl kustomize k8s/overlays/generated
```

Esse comando não aplica nada no cluster. Ele apenas mostra o YAML final montado.

## 7. Aplicar os manifestos no Kubernetes

Agora aplique de fato:

```bash
bash ./infra/apply-k8s-overlay.sh
```

## 8. Verificar se a API subiu

Veja os pods:

```bash
kubectl -n "${KUBERNETES_NAMESPACE}" get pods
```

Veja o Service:

```bash
kubectl -n "${KUBERNETES_NAMESPACE}" get service "${API_SERVICE_NAME}"
```

Pegue o hostname público do Load Balancer:

```bash
kubectl -n "${KUBERNETES_NAMESPACE}" get service "${API_SERVICE_NAME}" \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Quando o hostname aparecer, a URL pública será:

```text
http://<hostname-do-load-balancer>
```

## 9. Atualizar a imagem no cluster

Depois do primeiro deploy, você não precisa recriar a infraestrutura para publicar uma versão nova da API. O fluxo normal é:

1. gerar uma nova tag
2. fazer build e push para o ECR
3. renderizar novamente o overlay com a nova tag
4. reaplicar no cluster

Exemplo com uma nova versão:

```bash
export API_IMAGE_TAG="v1.0.1"
bash ./infra/publish-api-image.sh
```

Re-renderize os YAMLs com a nova tag. Se você ainda estiver na mesma sessão do shell e com as variáveis carregadas, basta preparar de novo o overlay:

```bash
bash ./infra/prepare-k8s-overlay.sh
```

Depois rode novamente a etapa de renderização:

```bash
bash ./infra/render-k8s-overlay.sh
```

Confira o manifesto final:

```bash
kubectl kustomize k8s/overlays/generated
```

Aplique a nova versão:

```bash
bash ./infra/apply-k8s-overlay.sh
```

Se você usar sempre a mesma tag, como `latest`, o `kubectl apply` sozinho pode não disparar uma nova troca de pods. Nesse caso, o `rollout restart` passa a ser obrigatório para forçar a nova leitura da imagem.

Para conferir qual imagem está rodando no momento:

```bash
bash ./infra/show-k8s-image.sh
```

## 10. Comandos úteis de diagnóstico

Status do Deployment:

```bash
kubectl -n "${KUBERNETES_NAMESPACE}" get deployment "${API_NAME}" -o wide
```

ReplicaSets:

```bash
kubectl -n "${KUBERNETES_NAMESPACE}" get replicasets -l "app.kubernetes.io/name=${API_NAME}"
```

Pods:

```bash
kubectl -n "${KUBERNETES_NAMESPACE}" get pods -l "app.kubernetes.io/name=${API_NAME}" -o wide
```

Logs:

```bash
kubectl -n "${KUBERNETES_NAMESPACE}" logs deployment/"${API_NAME}" --all-containers --tail=200
```

Describe do pod:

```bash
kubectl -n "${KUBERNETES_NAMESPACE}" describe pods -l "app.kubernetes.io/name=${API_NAME}"
```

HPA:

```bash
kubectl -n "${KUBERNETES_NAMESPACE}" get hpa
```

## 11. Problemas comuns

### `error validating data: failed to download openapi`

O `kubectl` não conseguiu acessar o endpoint da API do cluster EKS. Verifique:

- `aws eks update-kubeconfig` executado com sucesso
- DNS e acesso de rede até o endpoint do EKS
- se o cluster ainda existe
- se o endpoint do cluster é público ou privado

### `deployment exceeded its progress deadline`

O Deployment foi criado, mas os pods não ficaram prontos no tempo esperado. Confira:

- `TF_VAR_api_healthcheck_path`
- conectividade com o Postgres
- logs da aplicação
- se a imagem publicada contém o build correto

### `CrashLoopBackOff`

Olhe primeiro os logs:

```bash
kubectl -n "${KUBERNETES_NAMESPACE}" logs deployment/"${API_NAME}" --previous --all-containers --tail=200
```

Erros comuns:

- senha/host do banco incorretos
- SSL do Postgres desajustado
- variáveis ausentes no ConfigMap ou Secret
- container sem memória suficiente

### `Variáveis obrigatórias ausentes ou vazias`

O overlay não foi renderizado porque uma ou mais variáveis não estão disponíveis
no shell atual. Carregue novamente as entradas e os outputs antes de tentar de
novo:

```bash
source infra/.env
source infra/load-terraform-outputs.sh
source infra/load-k8s-template-vars.sh
```

## 12. Destruir o ambiente manualmente

Se quiser remover tudo sem usar os scripts:

```bash
bash ./infra/destroy-environment.sh
```

Para destruir sem confirmação interativa:

```bash
bash ./infra/destroy-environment.sh -auto-approve
```

Se o `Service` LoadBalancer ainda existir, a AWS pode demorar alguns minutos para liberar o NLB antes do `terraform destroy` conseguir remover rede e subnets.
