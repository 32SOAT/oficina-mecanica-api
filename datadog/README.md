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

### Tempo médio por fase (histórico persistido)

Com BUSINESS_METRICS_ENABLED=true, a API consulta o histórico ao inicializar e
a cada 60 segundos. No Compose está habilitado; fora dele o padrão é desabilitado.
Habilite em apenas uma réplica por banco/ambiente no EKS. Não há escrita no banco.

A gauge oficina.ordem_servico.tempo_medio_fase usa segundos e tags fase e janela:24h;
env/service são herdados do dd-trace. Cada fase é a média de intervalos completos
cuja saída ocorreu entre agora menos 24 horas e agora, incluindo entradas anteriores:

- diagnostico: entrada EM_DIAGNOSTICO até saída AGUARDANDO_APROVACAO;
- execucao: entrada EM_EXECUCAO até saída FINALIZADA;
- finalizacao: entrada FINALIZADA até saída ENTREGUE. Representa espera até entrega,
  não trabalho ativo de finalização.

Entradas/saídas ausentes ou múltiplas, timestamps inválidos, durações negativas e
transições intermediárias ambíguas são descartados. Sem amostras não há publicação.
O histórico continua não atômico e a leitura percorre todo o histórico não excluído.
A métrica é uma fotografia da média móvel, não uma distribuição individual.
Evite interpolar/exibir amostras antigas como atuais no dashboard.
Falhas são best-effort; erros síncronos geram warning, mas o SDK não confirma entrega.
O timer é limpo quando o Nest encerra o módulo (por exemplo, via app.close()).
O bootstrap atual não habilita enableShutdownHooks: sinais do sistema não garantem
a execução desse hook. O fim do processo elimina o timer; encerramento abrupto
não garante conclusão de coleta/envio. Uma consulta que não resolve mantém a
proteção contra sobreposição ativa e suspende as próximas coletas.

Consulta:

```text
avg:oficina.ordem_servico.tempo_medio_fase{env:dev,service:oficina-mecanica-api,janela:24h} by {fase}
```

Diagnóstico (aguarde um ciclo e o flush do SDK):

```sh
docker compose exec -T datadog-agent agent config set dogstatsd_stats true
docker compose exec -T datadog-agent agent dogstatsd-stats | grep 'oficina.ordem_servico.tempo_medio_fase'
docker compose exec -T datadog-agent agent config set dogstatsd_stats false
```

dogstatsd-stats confirma nome/tags e contagem de amostras, não o valor da gauge.
Consulte os valores no Metrics Explorer; use o histórico para conferir o cálculo.


#### Validação funcional local — 13/09/2026

Foi utilizado exclusivamente o fluxo normal da API:
RECEBIDA -> EM_DIAGNOSTICO -> AGUARDANDO_APROVACAO.

- Diagnóstico: intervalo válido de **2,227 segundos**, calculado pelos timestamps
  do histórico retornado pela API.
- DogStatsD Agent: uma amostra confirmada para
  oficina.ordem_servico.tempo_medio_fase, com fase:diagnostico, janela:24h,
  env:dev, service:oficina-mecanica-api e version:0.0.1.
- O diagnóstico do Agent confirma recebimento e tags, não o valor numérico da gauge.
- Health e GET /api/v1/relatorios/tempo-medio-servicos continuaram respondendo HTTP 200.
- Execução e finalização **pendentes de validação funcional local**: a aprovação
  retornou HTTP 403 porque exige JWT de cliente emitido pela Lambda externa; o
  ambiente local dispõe de JWT de administrador. Isso não indica falha dessas fases.
- Não houve bypass de autenticação, escrita SQL manual ou alteração direta do
  histórico. As estatísticas temporárias do Agent foram desabilitadas ao finalizar.

As três fases possuem cobertura unitária do cálculo. A validação funcional restante
depende da autenticação normal de cliente; não faz parte desta etapa alterá-la.
