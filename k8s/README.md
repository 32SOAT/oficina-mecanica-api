# Manifestos Kubernetes

Os templates YAML versionados ficam em `templates/`:

- `namespace.yaml`
- `deployment.yaml`
- `service.yaml`
- `hpa.yaml`
- `kustomization.yaml`

O overlay `overlays/generated/` e criado pelos scripts em `infra/` renderizando esses templates com:

- outputs do Terraform, como ECR e RDS;
- variaveis carregadas de `infra/.env`;
- a tag da imagem Docker publicada.

Arquivos gerados no overlay:

- `namespace.yaml`
- `deployment.yaml`
- `service.yaml`
- `hpa.yaml`
- `kustomization.yaml`
- `values/`, com os valores locais usados pelos generators do Kustomize

Fluxo recomendado, a partir da raiz do projeto:

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

O ConfigMap e o Secret sao criados por `configMapGenerator` e
`secretGenerator`. Os valores sao lidos de arquivos com permissao restrita, o
que evita interpolacao insegura de aspas, caracteres especiais e quebras de
linha em YAML.

O overlay gerado contem os segredos do banco/JWT em arquivos locais e fica
ignorado pelo Git. Esses arquivos nao devem ser copiados, publicados como
artefato nem adicionados ao controle de versao.

`API_NAME` identifica Deployment, Service, HPA, ConfigMap e Secret. O valor
`oficina-mecanica-api` usado no campo `image` e somente um placeholder estavel:
o Kustomize o substitui por `${ECR_REPOSITORY_URL}:${API_IMAGE_TAG}`. Dessa
forma, o nome local usado no build Docker nao fica acoplado aos nomes dos
recursos Kubernetes.

Os probes HTTP usam o path configurado em `TF_VAR_api_healthcheck_path`, e o HPA escala o Deployment por uso medio de CPU.
