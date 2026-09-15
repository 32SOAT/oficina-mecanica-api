# ADR 006 — Stack de observabilidade com Datadog

| Campo | Valor |
| ----- | ----- |
| Data | 13/09/2026 |
| Status | Aceita |
| Decisores | João Ricardo Bianchini Vieira |
| RFC de origem | [RFC 004](../rfc/004-stack-de-observabilidade.md) |

## 📌 Contexto

A plataforma roda em três lugares: uma Lambda, pods no EKS e um RDS. O enunciado da fase exige latência de API, consumo de CPU e memória, healthcheck, alertas de falha no processamento de OS, logs JSON correlacionados e três dashboards de negócio: volume diário de OS, tempo médio por fase e erros de integração.

Dois fatos do código pesam na decisão:

- Os eventos de domínio da OS rodam em `EventEmitter2`, sem retry ([ADR 004](./004-padrao-de-comunicacao.md)). Uma falha no listener de histórico não gera erro HTTP. O sinal precisa vir de fora do fluxo da requisição.
- O tempo por fase é derivado de `historico_status_os`, que registra cada transição com `created_at`. Não existe métrica pronta; ela precisa ser calculada.

A pergunta desta ADR é: **qual plataforma recebe os sinais, como cada componente é instrumentado e de onde saem as métricas de negócio**.

## ✅ Decisão

Adotamos o **Datadog** como plataforma única de observabilidade.

### Instrumentação da API

| Sinal | Mecanismo | Configuração |
| ----- | --------- | ------------ |
| Traces e latência por rota | `dd-trace` 6.15 carregado antes do Nest | `node --require dd-trace/init`; `DD_SERVICE=oficina-mecanica-api`, `DD_ENV`, `DD_VERSION`; `DD_TRACE_STARTUP_LOGS=false` para manter o stdout em JSON puro |
| Logs JSON | `nestjs-pino` + `pino-http`, `NODE_ENV=production` | `correlationId` lido de `x-correlation-id` ou gerado (UUID), devolvido no header da resposta; `DD_LOGS_INJECTION=true` injeta `dd.trace_id` e `dd.span_id`; `redact` em `authorization`, `cookie` e `set-cookie` |
| Volume de OS | Contador `oficina.ordem_servico.criada` via DogStatsD do `dd-trace` | Emitido em `CreateOrdemServicoUseCase` **após** o `runInTransaction` resolver, ou seja, após o commit. Tag `status_inicial:recebida`. Rollback não conta |
| Tempo médio por fase | Gauge `oficina.ordem_servico.tempo_medio_fase`, tags `fase` e `janela:24h` | `TempoFaseMetricsPublisher` consulta o histórico ao subir e a cada 60 s (`BUSINESS_METRICS_ENABLED=true`, uma réplica por ambiente). Fases: `diagnostico` (EM_DIAGNOSTICO → AGUARDANDO_APROVACAO), `execucao` (EM_EXECUCAO → FINALIZADA), `finalizacao` (FINALIZADA → ENTREGUE) |
| Healthcheck | `GET /api/v1/health`, público | Probes do Kubernetes e health check do pipeline de deploy |

A API nunca recebe `DD_API_KEY`. Ela fala com o Agent em `:8126`; o Agent é quem autentica no Datadog.

### Coleta

| Onde | Mecanismo | Configuração |
| ---- | --------- | ------------ |
| Docker Compose (desenvolvimento e validação) | Datadog Agent como serviço do profile `observability` | Coleta logs só do container `app` pela label `com.datadoghq.ad.logs`; APM pelo socket; chave em `datadog/.env.local`, fora do Git |
| EKS | Helm chart `datadog/datadog` com `datadog/kubernetes-values.yaml` | Node Agent (DaemonSet) e Cluster Agent com `kubernetes_state_core`: CPU, memória e estado de pods e nós. Chave em Secret `datadog-api-key` no namespace `datadog` |
| Lambda e control plane do EKS | CloudWatch Logs | `AWSLambdaBasicExecutionRole`; `cluster_enabled_log_types` com api, audit, authenticator, controllerManager e scheduler |

Escolhemos DaemonSet e não sidecar. O cluster tem poucos nós; um Agent por nó cobre todos os pods e o Cluster Agent agrega o estado do cluster.

### Dashboard e monitores

Na conta Datadog, dashboard **Oficina Mecânica - Observabilidade** com seis painéis: volume de OS, tempo médio por fase, latência p95 da API, requisições, erros 5xx e falhas de integração com o Resend. Dois monitores: falha de integração com o Resend e taxa de 5xx da API. Consultas e nomes em [observability/README.md](../observability/README.md).

## 📊 Consequências

### 👍 Positivas

- Um lugar para logs, traces e métricas dos três componentes; a correlação entre logs e traces vem de graça com `DD_LOGS_INJECTION`.
- `dd-trace` instrumenta Express e `pg` sem alterar os casos de uso. Latência por rota e por consulta SQL aparece sem código novo.
- As duas métricas de negócio saem da própria API, não de consulta agendada externa: a de volume no ponto exato do commit, a de fase a partir do histórico persistido.
- Headers sensíveis nunca chegam ao Datadog; o `redact` é aplicado no processo.
- Metrics-server continua alimentando o HPA; o Datadog não entra nesse caminho.

### 👎 Negativas e trade-offs

- Dependência de SaaS pago; o trial cobre a avaliação.
- `dd-trace` adiciona alguns segundos ao boot do container e o Agent consome CPU e memória em cada nó (`requests` 100m / 256Mi).
- `tempo_medio_fase` é uma média móvel de 24 h calculada por polling, não uma distribuição por evento. Reinício da réplica reinicia a coleta; encerramento abrupto pode perder a última amostra.
- A consulta de tempo por fase percorre o histórico não excluído a cada 60 s. Os índices propostos em [modelo-de-dados.md A6](../architecture/modelo-de-dados.md#a6--índices-para-os-dashboards-da-fase-3) reduzem esse custo.
- O contador de volume é best-effort: se o processo cair entre o commit e o flush do DogStatsD, a amostra se perde. O dashboard pode subcontar; o banco continua sendo a fonte de verdade.
- O chart no EKS coleta métricas de infraestrutura; logs e APM no cluster seguem o mesmo mecanismo do Compose (stdout e `:8126`) e são habilitados por `logs.enabled` e `apm.portEnabled` no `values.yaml`.

## 🔀 Alternativas consideradas

| Alternativa | Por que não foi escolhida |
| ----------- | ------------------------- |
| **New Relic** | Cobertura equivalente. Plano gratuito limita a um usuário com acesso completo, o que atrapalha o grupo |
| **Prometheus + Grafana + Loki** | Enunciado pede Datadog ou New Relic. Operar a stack no mesmo cluster compete com a API por recurso |
| **OpenTelemetry SDK exportando para Datadog** | Menos lock-in, mas injeção de `trace_id` em log e instrumentação de `pg` exigem mais configuração que o `dd-trace`. Evolução possível |
| **Sidecar do Agent em cada pod** | Custo por pod. DaemonSet cobre todos os pods com um Agent por nó |
| **Métrica de fase emitida por evento (distribution)** | Daria granularidade por transição, mas herdaria a falta de garantia de entrega dos eventos. O cálculo sobre o histórico persistido é a fonte que já existe e não depende do listener ter rodado |
| **Métricas de negócio por consulta agendada no Agent (custom query)** | Colocaria SQL de negócio na configuração do Agent, fora do repositório da API e dos testes |
| **CloudWatch + X-Ray** | Não atende o enunciado e não tem dashboards de negócio equivalentes |

## 🔮 Evolução prevista

- Synthetic API Test em `GET /api/v1/health` pelo endpoint do Gateway, para uptime medido de fora.
- Monitor de falha no processamento de OS por divergência entre `ordem_servico.status_atual` e a última linha do histórico.
- Dashboard e monitores versionados com o provider Terraform `datadog/datadog`.
- Datadog Lambda Extension na função de autenticação e integração AWS para métricas de RDS e API Gateway.
- Correlação ponta a ponta com o Gateway injetando `x-correlation-id` a partir de `$context.requestId`.
- HPA por métrica de latência via external metrics do Cluster Agent ([ADR 005](./005-uso-de-hpa.md)).

## 🔗 Relacionados

- [RFC 004 — Stack de observabilidade](../rfc/004-stack-de-observabilidade.md)
- [ADR 004 — Padrão de comunicação](./004-padrao-de-comunicacao.md)
- [ADR 005 — Uso de HPA](./005-uso-de-hpa.md)
- [Observabilidade](../observability/README.md)
- [Datadog: operação](../../datadog/README.md)
- [Componentes](../architecture/componentes.md)
