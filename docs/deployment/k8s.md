# Deploy Kubernetes

Documentação dos ambientes Kubernetes da API:

- **EKS (AWS)** — templates em `k8s/templates/` + overlay gerado pelos scripts em `infra/`
- **Minikube (local)** — overlay em `k8s/overlays/minikube/` + teste de carga em `k8s/load-test/`

---

## EKS (AWS)

Os templates YAML versionados ficam em `k8s/templates/`:

- `namespace.yaml`
- `deployment.yaml`
- `service.yaml`
- `hpa.yaml`
- `kustomization.yaml`

O overlay `overlays/generated/` é criado pelos scripts em `infra/` renderizando esses templates com:

- outputs do Terraform, como ECR e RDS;
- variáveis carregadas de `infra/.env`;
- a tag da imagem Docker publicada.

Arquivos gerados no overlay:

- `namespace.yaml`
- `deployment.yaml`
- `service.yaml`
- `hpa.yaml`
- `kustomization.yaml`
- `values/`, com os valores locais usados pelos generators do Kustomize

Fluxo recomendado, a partir da raiz do projeto (após o Terraform e a imagem no ECR — detalhes em [infra.md](./infra.md)):

```bash
source infra/.env
source infra/load-terraform-outputs.sh
source infra/load-k8s-template-vars.sh
bash infra/prepare-k8s-overlay.sh
bash infra/render-k8s-overlay.sh
kubectl kustomize k8s/overlays/generated
```

Para aplicar os manifestos depois de conferir o resultado:

```bash
bash infra/apply-k8s-overlay.sh
```

O ConfigMap e o Secret são criados por `configMapGenerator` e `secretGenerator`. Os valores são lidos de arquivos com permissão restrita, o que evita interpolação insegura de aspas, caracteres especiais e quebras de linha em YAML.

O overlay gerado contém os segredos do banco/JWT em arquivos locais e fica ignorado pelo Git. Esses arquivos não devem ser copiados, publicados como artefato nem adicionados ao controle de versão.

`API_NAME` identifica Deployment, Service, HPA, ConfigMap e Secret. O valor `oficina-mecanica-api` usado no campo `image` é somente um placeholder estável: o Kustomize o substitui por `${ECR_REPOSITORY_URL}:${API_IMAGE_TAG}`. Dessa forma, o nome local usado no build Docker não fica acoplado aos nomes dos recursos Kubernetes.

Os probes HTTP usam o path configurado em `TF_VAR_api_healthcheck_path`, e o HPA escala o Deployment por uso médio de CPU.

Provisionamento do cluster e publicação da imagem: [infra.md](./infra.md).

---

## Minikube (local)

Ambiente local autocontido com a API, PostgreSQL, migrations e HPA (`k8s/overlays/minikube`).

### Pré-requisitos

- Docker
- `minikube`
- `kubectl` (também pode ser usado como `minikube kubectl --`)

```bash
minikube start --profile=minikube --driver=docker --cpus=4 --memory=6g
minikube addons enable metrics-server --profile=minikube
```

### Selecionar o contexto local

Um mesmo `kubeconfig` pode conter contextos locais e remotos. Antes de executar qualquer comando deste guia, confirme o destino:

```bash
minikube update-context --profile=minikube
kubectl config use-context minikube
kubectl config current-context
kubectl cluster-info --context=minikube
```

`kubectl config current-context` deve imprimir exatamente `minikube`. Se aparecer um nome de cluster EKS, não prossiga. Não é necessário `aws configure` para o cluster local.

Os comandos abaixo passam `--context=minikube` explicitamente para evitar enviar operações ao EKS por engano.

### Subir a API

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

### Acessar a API

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

### Diagnóstico

```bash
kubectl --context=minikube -n oficina-mecanica get pods,svc,hpa,pvc
kubectl --context=minikube -n oficina-mecanica logs deployment/oficina-mecanica-api
kubectl --context=minikube -n oficina-mecanica logs job/oficina-mecanica-migrations
kubectl --context=minikube top pods -n oficina-mecanica
```

O HPA pode mostrar `<unknown>` nos primeiros minutos após habilitar o Metrics Server. Confirme `kubectl top pods` antes do teste de carga.

### Simular aumento de carga

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

### Limpeza

```bash
kubectl --context=minikube delete -k k8s/load-test --ignore-not-found
kubectl --context=minikube delete -k k8s/overlays/minikube
```

Ou remova o cluster:

```bash
minikube delete --profile=minikube
```

---

## Ver também

- [Deploy (índice)](./README.md)
- [Terraform / AWS](./infra.md)
- [Build local (Docker Compose)](../build/README.md)
- [CI/CD](../ci-cd/README.md)
