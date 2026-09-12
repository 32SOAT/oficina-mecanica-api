# Observabilidade local com Docker

A API usa `NODE_ENV=production` para emitir JSON em stdout, mantendo `DD_ENV=dev`.
O Agent coleta somente `app`, selecionado pela label `com.datadoghq.ad.logs`,
pelo socket Docker. A coleta global fica desabilitada; db e SonarQube não possuem
labels de coleta. A estratégia de stdout também se aplica ao Kubernetes/EKS.

Configure PostgreSQL, JWT e Resend no `.env` local conforme `.env.example`.
O Compose repassa variáveis explicitamente: a API não recebe `DD_API_KEY`.
A imagem não contém `.env`. Libere a porta 3000 da API no host antes de subir:

```sh
docker compose --profile observability config --quiet
docker compose --profile observability build app
docker compose --profile observability up -d db datadog-agent app
```

A API conecta ao banco em `db:5432` e ao Agent em `http://datadog-agent:8126`.
O CMD carrega `dotenv/config` e `dd-trace/init` antes da aplicação.
`DD_TRACE_STARTUP_LOGS=false` evita diagnósticos de inicialização em texto do SDK,
preservando a saída JSON sem desativar o tracing.
Preserve os volumes `pgdata` e `datadog-run` nos reinícios.

## Validação

```sh
curl -i -H 'x-correlation-id: docker-log-trace-001' http://localhost:3000/api/v1/health
docker compose logs --no-log-prefix app | grep 'docker-log-trace-001'
docker compose exec datadog-agent agent status
docker compose logs --tail=100 -f datadog-agent
```

Confirme o header, `correlationId` e o objeto `dd` com `trace_id`/`span_id`.
O Agent deve mostrar Logs Agent e APM ativos, a fonte Docker da API e contadores
de envio. Em Datadog Logs, busque:
`service:oficina-mecanica-api env:dev @correlationId:docker-log-trace-001`.
Abra o trace associado para validar a navegação entre logs e traces.

## Chave do Agent

Nunca versione a chave real. O `.env` atual continua compatível. Para separar a
chave das variáveis usadas em execuções da API no host, mova-a manualmente para
`datadog/.env.local` (ignorado pelo Git), removendo-a do `.env` comum, e use:

```sh
docker compose --env-file .env --env-file datadog/.env.local --profile observability up -d db datadog-agent app
```
