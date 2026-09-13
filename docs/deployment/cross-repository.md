# Integração de deploy entre os repositórios

Este repositório é responsável pelo código da API Nest, testes, imagem Docker
e publicação no ECR. O provisionamento da plataforma e o deploy no EKS são
responsabilidade de `oficina-mecanica-infra-k8s`; a autenticação de cliente por
CPF é responsabilidade de `oficina-mecanica-lambda-auth`.

## Ownership

| Responsabilidade | Owner |
| --- | --- |
| Código Nest, migrations e testes | `oficina-mecanica-api` |
| Build e publicação da imagem ECR | `oficina-mecanica-api` |
| VPC, EKS, IAM/OIDC, ECR compartilhado e NLB | `oficina-mecanica-infra-k8s` |
| Deployment, Service, migration Job e HPA | `oficina-mecanica-infra-k8s` |
| Lambda, bundle, role de execução e configuração de RDS | `oficina-mecanica-lambda-auth` |
| API Gateway HTTP, stage, rotas e integração com Lambda/NLB | `oficina-mecanica-infra-k8s` |
| RDS, backups e credenciais | repositório de banco gerenciado |

Não aplique os artefatos Terraform históricos em `infra/` para uma instalação
nova e não crie API Gateway, Lambda, NLB ou IAM compartilhado neste repositório.

## Fluxo por ambiente

Homologação e produção são isoladas por branch, GitHub Environment, state,
configuração e contratos SSM:

| Ambiente | Branch da API | Branch do infra-k8s | Parâmetros |
| --- | --- | --- | --- |
| homologação | `homolog` | `homolog` | `/oficina/homologacao/platform/...` |
| produção | `main` | `main` | `/oficina/producao/platform/...` |

O fluxo recomendado é:

1. Desenvolver e validar a API localmente com `npm test`, build e Docker.
2. Abrir PR para `homolog` ou `main`; o CI executa lint, testes, build e build
   Docker sem publicar.
3. Após merge, disparar manualmente `publish-image.yml` informando um commit
   alcançável por `homolog` ou `main`. O workflow publica tag `sha-<SHA>` e
   retorna o digest `sha256:<digest>`.
4. Abrir PR no `infra-k8s` alterando o digest do overlay correspondente. Nunca
   usar `latest`.
5. O workflow do `infra-k8s` executa migration, rollout e health check e
   publica `/oficina/<ambiente>/platform/api-nlb-hostname` quando o Service
   recebe o hostname do NLB.
6. O time de plataforma aplica a Lambda no ambiente correspondente. O apply
   publica `/oficina/<ambiente>/platform/auth-lambda-arn`.
7. Depois que ambos os parâmetros existirem e houver consistência eventual do
   SSM, o `infra-k8s` gera, revisa e aplica o saved plan do API Gateway.

Não copie secrets, state ou tfvars entre ambientes. `JWT_SECRET` deve ser
configurado de forma segura e ter o mesmo valor lógico na API Nest e na Lambda,
mas nunca deve ser versionado ou impresso em logs.

## Entrada pública e rotas

O endpoint público é fornecido pelo `infra-k8s`:

```text
https://<api-id>.execute-api.<region>.amazonaws.com
```

| Rota | Destino |
| --- | --- |
| `POST /auth/cpf` | Lambda de autenticação |
| `ANY /{proxy+}` | NLB HTTP do Nest, incluindo `/api/v1` e Swagger `/api` |
| `POST /api/v1/auth/login` | Nest via proxy, login administrativo |

O stage é `$default` com auto deploy; não acrescente nome de stage à URL.

## Validação da imagem e do deploy

Antes do PR de infraestrutura, confirme que a referência é um digest válido e
que foi publicada pelo workflow deste repositório. Depois do deploy Kubernetes,
teste primeiro o health direto do NLB e depois o endpoint do Gateway:

```bash
curl -fsS "http://<hostname-do-nlb>/api/v1/health"
curl -fsS "https://<api-id>.execute-api.<region>.amazonaws.com/api/v1/health"
curl -fsS -X POST \
  "https://<api-id>.execute-api.<region>.amazonaws.com/auth/cpf" \
  -H 'content-type: application/json' \
  -d '{"cpf":"529.982.247-25"}'
```

Use dados de teste aprovados pelo ambiente. Não coloque tokens reais nos
comandos salvos, tickets ou logs.

## Desenvolvimento local

O modo local não exige AWS, EKS, NLB ou API Gateway:

```bash
cp .env.example .env
npm install
docker compose up -d db
npm run migration:run
npm run start:dev
```

Consulte [build/README.md](../build/README.md) para banco, migrations,
seeding, testes e Resend. Consulte [architecture/auth.md](../architecture/auth.md)
para JWT admin/cliente. O login CPF local depende da Lambda ou de um token de
teste compatível; a Lambda não é iniciada pelo Compose desta API.

## Segurança e exclusões

Esta arquitetura usa NLB público e comunicação HTTP entre API Gateway e NLB.
Isso é um risco conhecido, não uma configuração a ser mascarada. Não adicione
domínio, ACM, Route 53, WAF, VPC Link, NLB interno ou CloudWatch Logs como parte
deste repositório sem alterar formalmente o contrato de ownership.

## Referências

- [README do infra-k8s](https://github.com/32SOAT/oficina-mecanica-infra-k8s)
- [README do lambda-auth](https://github.com/32SOAT/oficina-mecanica-lambda-auth)
- [CI/CD](../ci-cd/README.md)
- [Autenticação](../architecture/auth.md)
- [Kubernetes local (Minikube)](./k8s.md)
