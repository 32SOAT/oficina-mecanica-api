# ☸️ Deploy Kubernetes

> Para AWS/EKS, o deploy canônico é executado pelo
> [`oficina-mecanica-infra-k8s`](https://github.com/32SOAT/oficina-mecanica-infra-k8s),
> que versiona o digest, executa migrations, publica o hostname do NLB no SSM
> e integra o API Gateway. Este documento cobre somente o desenvolvimento
> local com Minikube. Consulte
> [cross-repository.md](./cross-repository.md) antes de operar um ambiente novo.

Documentação do ambiente Kubernetes local da API:

- **Minikube (local)** — overlay em `k8s/overlays/minikube/` + teste de carga em `k8s/load-test/`

---

---

## 💻 Minikube (local)

Ambiente local autocontido com a API, PostgreSQL, migrations e HPA (`k8s/overlays/minikube`).

### ✅ Pré-requisitos

- Docker
- `minikube`
- `kubectl` (também pode ser usado como `minikube kubectl --`)

```bash
minikube start --profile=minikube --driver=docker --cpus=4 --memory=6g
minikube addons enable metrics-server --profile=minikube
```

### 🎯 Selecionar o contexto local

Um mesmo `kubeconfig` pode conter contextos locais e remotos. Antes de executar qualquer comando deste guia, confirme o destino:

```bash
minikube update-context --profile=minikube
kubectl config use-context minikube
kubectl config current-context
kubectl cluster-info --context=minikube
```

`kubectl config current-context` deve imprimir exatamente `minikube`. Se aparecer um nome de cluster EKS, não prossiga. Não é necessário `aws configure` para o cluster local.

Os comandos abaixo passam `--context=minikube` explicitamente para evitar enviar operações ao EKS por engano.

### 🚀 Subir a API

```bash
minikube image build --profile=minikube -t oficina-mecanica-api:local .
kubectl --context=minikube apply -k k8s/overlays/minikube
kubectl --context=minikube -n oficina-mecanica wait \
  --for=condition=complete job/oficina-mecanica-migrations --timeout=180s
kubectl --context=minikube -n oficina-mecanica \
  rollout status deployment/oficina-mecanica-api \
  --timeout=180s
```

Se a imagem for reconstruída:

```bash
kubectl --context=minikube -n oficina-mecanica \
  delete job oficina-mecanica-migrations --ignore-not-found
minikube image build --profile=minikube -t oficina-mecanica-api:local .
kubectl --context=minikube apply -k k8s/overlays/minikube
kubectl --context=minikube -n oficina-mecanica \
  rollout restart deployment/oficina-mecanica-api
```

### 🌐 Acessar a API

```bash
kubectl --context=minikube -n oficina-mecanica \
  port-forward service/oficina-mecanica-api 3000:3000
```

```bash
curl http://localhost:3000/api/v1/health
```

Swagger: `http://localhost:3000/api`. Alternativa:

```bash
minikube service oficina-mecanica-api \
  --profile=minikube --namespace=oficina-mecanica --url
```

### 🩺 Diagnóstico

```bash
kubectl --context=minikube -n oficina-mecanica get pods,svc,hpa,pvc
kubectl --context=minikube -n oficina-mecanica logs deployment/oficina-mecanica-api
kubectl --context=minikube -n oficina-mecanica logs job/oficina-mecanica-migrations
kubectl --context=minikube top pods -n oficina-mecanica
```

O HPA pode mostrar `<unknown>` nos primeiros minutos após habilitar o Metrics Server. Confirme `kubectl top pods` antes do teste de carga.

### 📈 Simular aumento de carga

O cenário em `k8s/load-test/` executa k6 dentro do cluster. Em cinco minutos sobe gradualmente de 50 para 500 usuários virtuais, chama o health check e depois reduz a carga:

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

O HPA tem alvo de 50% da CPU solicitada, mínimo de 1 e máximo de 5 réplicas. A medição e a criação de novos pods não são instantâneas. Para ajustar a pressão, edite `target` e `duration` em `k8s/load-test/k6-script.yaml` e recrie o Job.

Ao final:

```bash
kubectl --context=minikube -n oficina-mecanica logs job/k6-load-test --tail=50
kubectl --context=minikube -n oficina-mecanica get hpa,pods -w
```

### 🧹 Limpeza

```bash
kubectl --context=minikube delete -k k8s/load-test --ignore-not-found
kubectl --context=minikube delete -k k8s/overlays/minikube
```

Ou remova o cluster:

```bash
minikube delete --profile=minikube
```

---

## 🔗 Ver também

- [Deploy (índice)](./README.md)
- [Integração AWS entre repositórios](./cross-repository.md)
- [Build local (Docker Compose)](../build/README.md)
- [CI/CD](../ci-cd/README.md)
