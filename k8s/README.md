# Kubernetes

Este diretório contém duas configurações independentes:

- `templates/`: templates usados pelo deploy em AWS/EKS;
- `overlays/minikube/`: ambiente local autocontido com API, PostgreSQL, migrations e HPA.

## Cluster local com Minikube

### Pré-requisitos

- Docker;
- `minikube`;
- `kubectl` (também pode ser usado como `minikube kubectl --`).

Reserve recursos suficientes para a API, o banco, o Metrics Server e o gerador de carga:

```bash
minikube start --profile=minikube --driver=docker --cpus=4 --memory=6g
minikube addons enable metrics-server --profile=minikube
```

### Selecionar o contexto local

Um mesmo `kubeconfig` pode conter contextos locais e remotos. Antes de executar
qualquer comando deste guia, atualize o endpoint do Minikube, selecione seu
contexto e confirme o destino:

```bash
minikube update-context --profile=minikube
kubectl config use-context minikube
kubectl config current-context
kubectl cluster-info --context=minikube
```

`kubectl config current-context` deve imprimir exatamente `minikube`. Se aparecer
um nome de cluster EKS, não prossiga: comandos naquele contexto tentam autenticar
na AWS e podem exibir `Unable to locate credentials`. Não é necessário executar
`aws configure` para usar o cluster local; basta trocar o contexto.

Os comandos abaixo também passam `--context=minikube` explicitamente. Isso evita
que uma posterior troca do contexto global envie operações locais para o EKS. Para
listar os contextos disponíveis ou retornar ao contexto anterior:

```bash
kubectl config get-contexts
kubectl config use-context NOME_DO_CONTEXTO_ANTERIOR
```

Construa a imagem diretamente no runtime do Minikube e aplique o ambiente:

```bash
minikube image build --profile=minikube -t oficina-mecanica-api:local .
kubectl --context=minikube apply -k k8s/overlays/minikube
kubectl --context=minikube -n oficina-mecanica wait \
  --for=condition=complete job/oficina-mecanica-migrations --timeout=180s
kubectl --context=minikube -n oficina-mecanica \
  rollout status deployment/oficina-mecanica-api \
  --timeout=180s
```

Se a imagem da API for reconstruída, remova o Job concluído antes de reaplicar:

```bash
kubectl --context=minikube -n oficina-mecanica \
  delete job oficina-mecanica-migrations --ignore-not-found
minikube image build --profile=minikube -t oficina-mecanica-api:local .
kubectl --context=minikube apply -k k8s/overlays/minikube
kubectl --context=minikube -n oficina-mecanica \
  rollout restart deployment/oficina-mecanica-api
```

### Acessar a API

Em um terminal, exponha o serviço localmente:

```bash
kubectl --context=minikube -n oficina-mecanica \
  port-forward service/oficina-mecanica-api 3000:3000
```

Em outro terminal:

```bash
curl http://localhost:3000/api/v1/health
```

O Swagger estará em `http://localhost:3000/api`. Como alternativa ao port-forward,
use:

```bash
minikube service oficina-mecanica-api \
  --profile=minikube --namespace=oficina-mecanica --url
```

### Diagnóstico

```bash
kubectl --context=minikube -n oficina-mecanica get pods,svc,hpa,pvc
kubectl --context=minikube -n oficina-mecanica logs deployment/oficina-mecanica-api
kubectl --context=minikube -n oficina-mecanica logs job/oficina-mecanica-migrations
kubectl --context=minikube top pods -n oficina-mecanica
```

O HPA pode mostrar métricas como `<unknown>` durante os primeiros minutos após o
Metrics Server ser habilitado. Confirme que `kubectl top pods` retorna CPU e memória
antes do teste de carga.

## Simular aumento de carga

O cenário em `load-test/` executa k6 dentro do cluster. Em cinco minutos ele sobe
gradualmente de 50 para 500 usuários virtuais, chama o health check e depois reduz
a carga. Inicie o teste com:

```bash
kubectl --context=minikube -n oficina-mecanica \
  delete job k6-load-test --ignore-not-found
kubectl --context=minikube apply -k k8s/load-test
kubectl --context=minikube -n oficina-mecanica logs -f job/k6-load-test
```

Em outro terminal, acompanhe o consumo e o aumento de réplicas:

```bash
kubectl --context=minikube -n oficina-mecanica get hpa,pods -w
```

O HPA tem alvo de 50% da CPU solicitada, mínimo de 1 e máximo de 5 réplicas. A
medição e a criação de novos pods não são instantâneas; normalmente levam dezenas
de segundos. Para gerar mais ou menos pressão, ajuste os `target` e `duration` em
`k8s/load-test/k6-script.yaml` e recrie o Job.

Ao final, veja o resumo e aguarde a redução automática:

```bash
kubectl --context=minikube -n oficina-mecanica logs job/k6-load-test --tail=50
kubectl --context=minikube -n oficina-mecanica get hpa,pods -w
```

## Limpeza

Remova somente os recursos da aplicação, preservando o cluster:

```bash
kubectl --context=minikube delete -k k8s/load-test --ignore-not-found
kubectl --context=minikube delete -k k8s/overlays/minikube
```

Ou remova todo o cluster e o volume do banco:

```bash
minikube delete --profile=minikube
```

## Deploy em EKS

Os templates YAML de `templates/` são renderizados pelos scripts em `infra/` com
outputs do Terraform, variáveis de `infra/.env` e a tag da imagem publicada.

```bash
source infra/.env
source infra/load-terraform-outputs.sh
source infra/load-k8s-template-vars.sh
bash infra/prepare-k8s-overlay.sh
bash infra/render-k8s-overlay.sh
kubectl kustomize k8s/overlays/generated
```

Depois de conferir o resultado, aplique com:

```bash
bash infra/apply-k8s-overlay.sh
```

O overlay gerado contém segredos do banco/JWT em arquivos locais ignorados pelo
Git; esses arquivos não devem ser publicados nem adicionados ao repositório.
