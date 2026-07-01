# Manifestos Kubernetes

Os manifestos base da API ficam em `base/`.

Os templates YAML versionados ficam em `templates/`:

- `namespace.yaml`
- `configmap.yaml`
- `secret.yaml`
- `deployment-patch.yaml`
- `hpa.yaml`
- `kustomization.yaml`

O overlay `overlays/generated/` e criado pelos scripts em `infra/scripts` renderizando esses templates com:

- outputs do Terraform, como ECR e RDS;
- variaveis carregadas de `infra/.env`;
- a tag da imagem Docker publicada.

Arquivos gerados no overlay:

- `namespace.yaml`
- `configmap.yaml`
- `secret.yaml`
- `deployment-patch.yaml`
- `hpa.yaml`
- `kustomization.yaml`

Fluxo recomendado:

```bash
cd infra
source .env
./scripts/publish-api-image.sh
```

Para aplicar uma tag especifica ja publicada:

```bash
./scripts/deploy-k8s.sh v1.0.0
```

O overlay gerado contem segredo do banco/JWT e fica ignorado pelo Git.
Os probes HTTP usam o path configurado em `TF_VAR_api_healthcheck_path`, e o HPA escala o Deployment por uso medio de CPU.
