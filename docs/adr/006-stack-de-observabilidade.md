# ADR 006 — Stack de observabilidade com Datadog

| Campo | Valor |
| ----- | ----- |
| Data | 10/09/2026 |
| Status | Aceita |
| Decisores | João Ricardo Bianchini Vieira |
| RFC de origem | [RFC 004](../rfc/004-stack-de-observabilidade.md) |

## 📌 Contexto

A plataforma roda em três lugares: uma Lambda, pods no EKS e um RDS. Nenhum deles envia telemetria para fora hoje. O enunciado da fase exige latência de API, consumo de CPU e memória, healthcheck, alertas de falha no processamento de OS, logs JSON correlacionados e três dashboards de negócio.

Dois fatos do código pesam na decisão:

- Os eventos de domínio da OS rodam em `EventEmitter2`, sem retry ([ADR 004](./004-padrao-de-comunicacao.md)). Uma falha no listener de histórico deixa a OS inconsistente sem nenhum sinal. O alerta precisa vir de fora do processo.
- A branch `integration-datadog` já trocou o logger do Nest por `nestjs-pino` com `pino-http`. Cada requisição recebe um `x-correlation-id` (do header ou gerado) e o valor aparece em todos os logs dela e no header da resposta. Isso resolve a metade do requisito de correlação.

A pergunta desta ADR é: **qual plataforma recebe os sinais, como cada componente é instrumentado e em que formato os logs saem**.

## ✅ Decisão

Adotamos o **Datadog** como plataforma única de observabilidade.

### Coleta

| Componente | Mecanismo | Configuração |
| ---------- | --------- | ------------ |
| API no EKS | Datadog Agent como **DaemonSet** com Cluster Agent, via Helm chart `datadog/datadog` | `logs.enabled=true`, `logs.containerCollectAll=true`, `apm.portEnabled=true`, `clusterAgent.enabled=true`. `DD_API_KEY` em Secret do namespace |
| Traces da API | `dd-trace` carregado antes do Nest | `import 'dd-trace/init'` como primeira linha de `main.ts`. `DD_SERVICE=oficina-mecanica-api`, `DD_ENV`, `DD_VERSION` (tag da imagem) no ConfigMap. `DD_LOGS_INJECTION=true` |
| Lambda | Layer `Datadog-Extension` + `datadog-lambda-js` | `layers` e variáveis `DD_API_KEY`, `DD_SERVICE=oficina-mecanica-lambda-auth`, `DD_ENV` no Terraform da Lambda |
| RDS e API Gateway | Integração AWS do Datadog (leitura de CloudWatch) | Role com `CloudWatchReadOnlyAccess` e `tag:GetResources`. No Academy, avaliar se o `LabRole` permite; senão, usar o forwarder de logs |
| Uptime | Synthetic API Test | `GET {gateway}/api/v1/health`, a cada 5 min, de duas regiões |

Escolhemos DaemonSet e não sidecar. O cluster tem no máximo três nós; um agente por nó custa menos e cobre todos os pods. Sidecar faria sentido se cada pod precisasse de isolamento de recurso para a coleta, o que não é o caso.

### Formato de log

Um único formato JSON nos dois emissores, com os campos que o Datadog lê sem pipeline:

| Campo | Nest (pino) | Lambda | Observação |
| ----- | ----------- | ------ | ---------- |
| `timestamp` | `formatters`/`timestamp: pino.stdTimeFunctions.isoTime` | já existe | O pino padrão emite `time` em epoch ms, que o Datadog não reconhece como data |
| `status` | `formatters.level: (label) => ({ status: label })` | renomear `level` → `status` | O pino padrão emite `level` numérico (30, 40, 50) |
| `message` | `messageKey: 'message'` | usar `event` como `message` | Datadog espera `message` |
| `service`, `env`, `version` | via `DD_*` no `dd-trace` | via `DD_*` na Extension | Tags de correlação entre logs, traces e infra |
| `correlationId` | `customProps` do `pino-http` (já existe) | `requestId` do Gateway | Mesmo nome nos dois emissores |
| `dd.trace_id`, `dd.span_id` | injetados pelo `dd-trace` | injetados pela Extension | Liga log a trace |
| `http.method`, `http.url`, `http.status_code` | `serializers` do `pino-http` | montar no handler | Atributos padrão do Datadog para requisição |

A alternativa era manter o formato atual do pino e criar um pipeline de remap no Datadog. Preferimos ajustar na origem: o log fica legível em qualquer destino e não depende de configuração que vive fora do repositório.

### Correlação ponta a ponta

O Gateway passa a injetar `x-correlation-id` com o valor de `$context.requestId` nas duas rotas (parameter mapping do HTTP API). A Lambda já loga esse `requestId`; o Nest passa a recebê-lo em vez de gerar um UUID. Uma consulta por `correlationId` no Datadog mostra Gateway, Lambda e Nest da mesma requisição.

### Métricas de negócio

Os dashboards de volume diário e tempo por status não saem de métrica de infra. A fonte é o fluxo de eventos da OS, que já existe:

- Listener novo em `ordens-de-servico/infrastructure/events` ouve `OsCriadaEvent` e `StatusAlteradoEvent` e emite via DogStatsD (`hot-shots`, apontando para o Agent do nó):
  - `oficina.os.criada` (count, tags `env`)
  - `oficina.os.status.transicao` (count, tags `de`, `para`)
  - `oficina.os.status.duracao` (distribution em segundos, tag `status` do estado que terminou)
- A duração é calculada pela diferença entre o `created_at` da linha anterior em `historico_status_os` e o momento da transição. Precisa do índice composto proposto em [modelo-de-dados.md A6](../architecture/modelo-de-dados.md#a6--índices-para-os-dashboards-da-fase-3).

Emitir a métrica no listener e não no use case mantém a regra da ADR 004: efeito colateral fica fora da transação.

### Alerta de falha no processamento de OS

Dois monitores cobrem o requisito, porque a falha pode ser ruidosa ou silenciosa:

| Monitor | Tipo | Detecta |
| ------- | ---- | ------- |
| Erro em listener de OS | Log Monitor: `service:oficina-mecanica-api status:error context:*Listener*` > 0 em 5 min | Falha que gerou log |
| Histórico divergente | Custom query no check de Postgres do Agent, a cada 5 min: OS cujo `status_atual` difere do último `status_novo` do histórico | Falha silenciosa: evento perdido ou `INSERT` do histórico rejeitado pela corrida com o `COMMIT` ([ADR 004](./004-padrao-de-comunicacao.md)) |

A segunda consulta é a única forma de pegar o caso descrito na ADR 004 enquanto o outbox não existe.

### Onde a configuração vive

| Artefato | Repositório | Forma |
| -------- | ----------- | ----- |
| Helm values do Agent | `oficina-mecanica-api/k8s/datadog/` (a criar) | `values.yaml` versionado, aplicado pelo pipeline |
| Monitores e dashboards | `oficina-mecanica-api/datadog/` (a criar) | Provider Terraform `datadog/datadog` |
| Layer e variáveis da Lambda | `oficina-mecanica-lambda-auth/infra/` | `lambda.tf` (layer e `DD_*` a adicionar) |
| Integração AWS | `oficina-mecanica-infra-k8s` | `datadog_integration_aws_account` e role de leitura |

## 📊 Consequências

### 👍 Positivas

- Um lugar para logs, traces, métricas e alertas dos três componentes. A aula 4 chama isso de all-in-one; para uma equipe pequena, a correlação entre sinais na mesma tela pesa mais que o custo.
- `dd-trace` instrumenta Express e `pg` sem alterar os casos de uso. Latência por rota e por consulta SQL aparece sem código novo.
- O log estruturado já feito na branch `integration-datadog` é reaproveitado; só o formato muda.
- Monitores e dashboards em Terraform são reproduzíveis e revisáveis por PR.
- O alerta de histórico divergente cobre a fraqueza conhecida da ADR 004 sem mudar a arquitetura de eventos.

### 👎 Negativas e trade-offs

- Dependência de SaaS pago. O trial cobre a avaliação; produção real exigiria orçamento por host e por GB de log.
- `dd-trace` adiciona alguns segundos ao boot do container. O `startupProbe` de 180 s comporta, mas o tempo de scale-up do HPA piora.
- O `DD_API_KEY` é mais um segredo compartilhado entre dois repositórios, como o `JWT_SECRET`.
- O Datadog Agent consome CPU e memória em cada nó (`requests` do chart: 200m / 256Mi). Em `t3.medium` isso é notável.
- A integração AWS depende de criar role IAM, que o AWS Academy restringe. Se falhar, RDS e Gateway ficam só no CloudWatch.
- Métricas de negócio emitidas por listener herdam a falta de garantia de entrega dos eventos. O dashboard pode subcontar. O monitor de histórico divergente é o que revela isso.

## 🔀 Alternativas consideradas

| Alternativa | Por que não foi escolhida |
| ----------- | ------------------------- |
| **New Relic** | Cobertura equivalente. Plano gratuito limita a um usuário com acesso completo, o que atrapalha o grupo. A branch de integração já apontava para Datadog |
| **Prometheus + Grafana + Loki** | Enunciado pede Datadog ou New Relic. Operar a stack no mesmo cluster de três nós compete com a API por recurso |
| **OpenTelemetry SDK exportando para Datadog** | Menos lock-in, mas injeção de `trace_id` em log e instrumentação de `pg` exigem mais configuração que o `dd-trace`. Fica como evolução |
| **Sidecar do Agent em cada pod** | Isolamento por pod, custo por pod. Com HPA até 3 réplicas e 3 nós, DaemonSet é mais barato e mais simples |
| **Pipeline de remap no Datadog em vez de ajustar o pino** | Funciona, mas deixa o formato de log dependente de configuração fora do repositório |
| **Métricas de negócio por consulta SQL agendada no Agent** | Não depende dos eventos, mas coloca carga periódica no RDS e não dá granularidade por transição. Mantida apenas para o monitor de divergência |
| **CloudWatch + X-Ray** | Não atende o enunciado e não tem Synthetics nem dashboards equivalentes |

## 🔮 Evolução prevista

- Migrar o HPA para métrica de latência via external metrics do Cluster Agent ([ADR 005](./005-uso-de-hpa.md)).
- Trocar `dd-trace` por OpenTelemetry se o grupo quiser sair do Datadog sem reinstrumentar.
- Outbox pattern nos eventos da OS, quando o monitor de divergência começar a disparar ([ADR 004](./004-padrao-de-comunicacao.md)).
- SLO de disponibilidade e latência no Datadog, com error budget, quando houver histórico suficiente.

## 🔗 Relacionados

- [RFC 004 — Stack de observabilidade](../rfc/004-stack-de-observabilidade.md)
- [ADR 004 — Padrão de comunicação](./004-padrao-de-comunicacao.md)
- [ADR 005 — Uso de HPA](./005-uso-de-hpa.md)
- [Observabilidade](../observability/README.md)
- [Componentes](../architecture/componentes.md)
