# 📡 Observabilidade

O que é monitorado, onde ver e como cada requisito do enunciado é atendido. Decisão de ferramenta e instrumentação: [ADR 006](../adr/006-stack-de-observabilidade.md).

> Estado em 11/09/2026: a branch `integration-datadog` está em andamento e hoje contém o log estruturado com `correlationId`. O restante desta página é o alvo definido na ADR 006. Cada tabela tem a coluna **Estado**; atualizar na mesma PR que implementar o item.

---

## 🧭 Requisitos do enunciado × sinal

| Requisito | Sinal | Onde ver no Datadog | Estado |
| --------- | ----- | ------------------- | ------ |
| Latência das APIs | APM, `trace.express.request` por `resource_name` | APM → Services → `oficina-mecanica-api` | ⏳ |
| CPU e memória do Kubernetes | `kubernetes.cpu.usage.total`, `kubernetes.memory.usage` por pod e nó | Infrastructure → Kubernetes | ⏳ |
| Healthcheck e uptime | Synthetic API Test em `/api/v1/health` | Synthetics | ⏳ |
| Alertas de falha no processamento de OS | Log Monitor + custom query no Postgres | Monitors | ⏳ |
| Logs JSON com correlação | `correlationId`, `dd.trace_id` | Logs → filtro `@correlationId:<id>` | 🟡 log JSON pronto na branch; sem agente |
| Volume diário de OS | `oficina.os.criada` (count) | Dashboard "Oficina — Operação" | ⏳ |
| Tempo médio por status | `oficina.os.status.duracao` (distribution, tag `status`) | Dashboard "Oficina — Operação" | ⏳ |
| Erros e falhas nas integrações | Error Tracking do APM + logs `status:error` com `integracao:resend` | Dashboard "Oficina — Erros" | ⏳ |

---

## 📝 Logs

### Campos

Formato único para API e Lambda (detalhe na ADR 006):

```json
{
  "timestamp": "2026-09-10T14:03:22.114Z",
  "status": "info",
  "message": "request completed",
  "service": "oficina-mecanica-api",
  "env": "prod",
  "version": "sha-a8c6585",
  "correlationId": "3f1e...",
  "dd": { "trace_id": "...", "span_id": "..." },
  "http": { "method": "POST", "url": "/api/v1/ordens", "status_code": 201 },
  "context": "OrdemServicoController"
}
```

### Como seguir uma requisição

1. Pegar o `x-correlation-id` do header da resposta (o Nest sempre devolve).
2. No Datadog, Logs → `@correlationId:<valor>`. Aparecem Gateway (access log), Lambda (se a rota for `/auth/cpf`) e Nest.
3. Clicar no `dd.trace_id` para abrir o trace com as consultas SQL da mesma requisição.

Localmente, `NODE_ENV` diferente de `production` liga o `pino-pretty` e o log sai colorido em texto. Em produção sai JSON puro no stdout.

### O que não logar

CPF completo, senha, token JWT, `DD_API_KEY`, `RESEND_API_KEY`. A Lambda já loga só o `requestId` e o resultado; manter. No Nest, o `pino-http` padrão serializa os headers da requisição, incluindo `Authorization` com o JWT inteiro. A branch `integration-datadog` ainda não configura `redact`; precisa de:

```ts
redact: { paths: ['req.headers.authorization', 'req.headers.cookie'], censor: '[redacted]' }
```

### Drop rule para as probes

O Deployment tem três probes HTTP em `/api/v1/health` (a cada 10 s, 20 s e 10 s) por réplica. Com `logs.containerCollectAll=true`, isso vira a maior parte do volume indexado sem nenhum valor. Regra de exclusão no pipeline do Datadog, como a aula 3 sugere para health checks:

- Filtro: `service:oficina-mecanica-api @http.url:"/api/v1/health" @http.status_code:200`
- Ação: excluir da indexação (os logs continuam contando no Live Tail, não no índice)

O mesmo vale para o Synthetic, que também bate em `/health`.

---

## 🎯 Metas (SLO)

Os thresholds abaixo derivam de [requisitos.md](../architecture/requisitos.md). Enquanto o grupo não validar as metas, os valores são propostas.

| SLO | Meta | SLI no Datadog |
| --- | ---- | -------------- |
| Disponibilidade da API | 99,5% ao mês | uptime do Synthetic `health` |
| Latência de leitura | p95 < 400 ms | `trace.express.request.duration` |
| Taxa de erro | < 1% de 5xx | `trace.express.request.errors / hits` |

Criar como SLO no Datadog (Monitors → SLOs) com error budget mensal, para o dashboard de infra mostrar o budget consumido.

## 📈 Dashboards

Três dashboards, definidos em Terraform em `datadog/` na raiz do repositório da API (a criar). Tipo: Timeboard nos três, porque a leitura é temporal e o eixo de tempo sincronizado entre widgets é o que permite cruzar um pico de latência com CPU ou com uma transição de OS. Screenboard ficaria para uma tela de TV na oficina, que não está no escopo.

### Oficina — Operação

| Widget | Query | Requisito |
| ------ | ----- | --------- |
| Timeseries, barras por dia | `sum:oficina.os.criada{env:prod}.as_count().rollup(sum, 86400)` | Volume diário de OS |
| Query Value | mesma métrica, últimos 7 dias | Volume da semana |
| Timeseries, uma linha por status | `avg:oficina.os.status.duracao{env:prod} by {status}` filtrando `status:EM_DIAGNOSTICO,EM_EXECUCAO,FINALIZADA` | Tempo médio por status |
| Toplist | `sum:oficina.os.status.transicao{env:prod} by {para}` | OS por status atual |
| Timeseries | `oficina.os.status.transicao{para:AGUARDANDO_PECAS_INSUMOS}` | Gargalo de peças |

Template variables: `env`, `version`.

### Oficina — API e infra

| Widget | Query | Requisito |
| ------ | ----- | --------- |
| Timeseries p50/p95/p99 | `trace.express.request.duration{service:oficina-mecanica-api} by {resource_name}` | Latência das APIs |
| Timeseries | `trace.express.request.hits` por `http.status_code` (2xx, 4xx, 5xx) | Taxa de erro |
| Timeseries | `kubernetes.cpu.usage.total{kube_deployment:oficina-mecanica-api} by {pod_name}` | CPU dos pods |
| Timeseries | `kubernetes.memory.usage{...} by {pod_name}` | Memória dos pods |
| Query Value | `kubernetes_state.deployment.replicas_available` | Réplicas do HPA |
| Check Status | Synthetic `health` | Uptime |
| Timeseries | `aws.rds.cpuutilization`, `aws.rds.database_connections` | RDS |
| Timeseries | `aws.lambda.duration`, `aws.lambda.errors{functionname:...auth}` | Lambda |

### Oficina — Erros e integrações

| Widget | Query | Requisito |
| ------ | ----- | --------- |
| Log Stream | `service:oficina-mecanica-api status:error` | Erros da API |
| Timeseries | `logs("service:oficina-mecanica-api status:error @integracao:resend").rollup("count")` | Falhas no Resend |
| Timeseries | `aws.apigateway.5xxerror` | Falhas no Gateway |
| Top List | Error Tracking por `error.type` | Exceções mais frequentes |
| Query Value | monitor "Histórico divergente" | OS inconsistentes |

Para o filtro `@integracao:resend` funcionar, o `ResendNotificacaoAdapter` precisa logar o erro com esse atributo.

---

## 🚨 Monitores

| Nome | Tipo | Condição | Severidade | Requisito |
| ---- | ---- | -------- | ---------- | --------- |
| API fora do ar | Synthetic API Test | 2 falhas seguidas em `/api/v1/health` | Alert | Uptime |
| Latência p95 alta | APM | `p95(last_5m) > 800 ms` em qualquer `resource_name`, warning em 400 ms | Warning / Alert | Latência |
| Taxa de 5xx | APM | `> 2%` das requisições em 5 min | Alert | Erros |
| Erro em listener de OS | Log | `service:oficina-mecanica-api status:error @context:*Listener*` > 0 em 5 min | Alert | Falha no processamento de OS |
| Histórico divergente | Postgres custom query | OS com `status_atual` diferente do último `status_novo` em `historico_status_os` > 0 | Alert | Falha silenciosa no processamento de OS |
| Falha no Resend | Log | `@integracao:resend status:error` > 3 em 15 min | Warning | Integrações |
| Pod em CrashLoop | Kubernetes | `kubernetes_state.container.status_report.count.waiting{reason:crashloopbackoff}` > 0 | Alert | Infra |
| Memória do pod | Metric | `kubernetes.memory.usage / limit > 85%` por 10 min | Warning | Infra |
| HPA no teto | Metric | réplicas disponíveis = `maxReplicas` por 15 min | Warning | Escala |
| Lambda com erro | Metric | `aws.lambda.errors` > 0 em 5 min | Alert | Auth |
| Sem dados | qualquer monitor de métrica | `notify_no_data` em 10 min | Alert | Agente parou |

Consulta do monitor "Histórico divergente" (custom query do check `postgres` do Agent):

```sql
SELECT count(*) AS os_divergentes
FROM ordem_servico os
LEFT JOIN LATERAL (
  SELECT status_novo
  FROM historico_status_os h
  WHERE h.os_id = os.id
  ORDER BY h.created_at DESC
  LIMIT 1
) ult ON true
WHERE os.deleted_at IS NULL
  AND (ult.status_novo IS NULL OR ult.status_novo <> os.status_atual);
```

Usa o índice composto `(os_id, created_at)` proposto em [modelo-de-dados.md A6](../architecture/modelo-de-dados.md#a6--índices-para-os-dashboards-da-fase-3). Sem ele a consulta varre o histórico inteiro a cada execução.

### Convenção de nome e roteamento

Nome no Datadog segue o padrão da aula 10: `provedor-recurso-ambiente-região-métrica-severidade`. Exemplos: `AWS-EKS-prod-use1-latencia-p95-warning`, `AWS-Lambda-prod-use1-erros-critical`, `DB-RDS-prod-use1-historico-divergente-critical`. Os nomes curtos da tabela acima são o título legível na mensagem.

Tags em todos os monitores: `env`, `service`, `team:32soat`, `categoria`. A categoria segue a aula 10 e define para onde a notificação vai:

| Categoria | Monitores | Destino |
| --------- | --------- | ------- |
| Proativo | Latência p95, Memória do pod, HPA no teto, Falha no Resend | canal do grupo, sem urgência |
| Reativo | API fora do ar, Taxa de 5xx, Erro em listener, Histórico divergente, Pod em CrashLoop, Lambda com erro, Sem dados | canal do grupo com menção a quem está de plantão |
| Informativo | deploy concluído: evento enviado pelo `ci-cd.yml` via API de eventos do Datadog no fim do job `deploy` (a adicionar ao workflow) | canal do grupo |

Canal: a definir pelo grupo (Slack, Discord ou e-mail). O `@` de roteamento vai na mensagem do monitor, com `{{#is_alert}}` e `{{#is_warning}}` separando os dois destinos.

### Runbooks

Cada monitor leva na mensagem o link do dashboard, o valor atual (`{{value}}`), o limiar (`{{threshold}}`) e o runbook abaixo. Os runbooks ficam nesta página até existir volume para uma pasta própria.

| Monitor | Primeiro passo | Se persistir |
| ------- | -------------- | ------------ |
| API fora do ar | `kubectl get pods` e `describe` no pod mais recente; conferir se o NLB tem target saudável | `rollout undo` do Deployment; se o RDS estiver indisponível, aguardar o failover |
| Latência p95 alta | Abrir o trace mais lento no APM; ver se o tempo está no `pg` (consulta) ou no Express | Se for consulta, `EXPLAIN ANALYZE` na query do trace; se for CPU, conferir se o HPA está no teto |
| Taxa de 5xx | Filtrar logs `status:error` pelo `correlationId` de uma das requisições | Se o erro vier do Postgres, checar conexões no RDS; se for exceção nova, abrir issue e considerar `rollout undo` |
| Erro em listener de OS | Ler o log do listener com o `correlationId`; anotar o `osId` | Reprocessar o histórico manualmente com `INSERT` e abrir issue para o outbox |
| Histórico divergente | Rodar a query da seção acima e listar os `os.id` | Corrigir as linhas faltantes; se voltar a ocorrer, priorizar mover o `emit` para depois do commit ([ADR 004](../adr/004-padrao-de-comunicacao.md)) |
| Falha no Resend | Conferir status do Resend e validade da `RESEND_API_KEY` | Rotacionar a chave via pipeline; e-mails perdidos não são reenviados |
| Pod em CrashLoop | `kubectl logs --previous` | Quase sempre variável ausente no ConfigMap/Secret ou senha do banco; ver o runbook de integração em [cross-repository.md](../deployment/cross-repository.md) |
| Memória do pod | `kubectl top pods`; ver se o crescimento é contínuo | Reiniciar o pod; se repetir, investigar vazamento com heap snapshot |
| HPA no teto | Ver se a carga é real ou teste do k6 | Aumentar `max_size` do node group e `maxReplicas`, com PgBouncer antes de passar de 3 réplicas |
| Lambda com erro | Ler o log da Lambda pelo `requestId` | Se for timeout de conexão ao RDS, conferir `subnet_ids` e security group |
| Sem dados | Conferir se o Datadog Agent está rodando em todos os nós (`kubectl get ds -n datadog`) | Reinstalar o chart; conferir `DD_API_KEY` no Secret |

---

## 🎬 Roteiro para o vídeo

O enunciado pede "dashboard de monitoramento com análise ao vivo" e "logs e traces em execução". Sequência sugerida:

1. `POST /auth/cpf` pelo Gateway. Mostrar o `x-correlation-id` na resposta.
2. `POST /api/v1/ordens` com token admin. Mostrar a mesma correlação no header.
3. Logs no Datadog filtrados pelo `correlationId`: Gateway, Lambda, Nest.
4. Abrir o trace do `POST /ordens`: spans do Express e do `pg`, tempo por consulta.
5. Dashboard "Operação": a OS recém-criada aparece no volume do dia.
6. Transicionar a OS por dois status e mostrar `oficina.os.status.duracao` mudando.
7. Forçar um erro (Resend com chave inválida) e mostrar o monitor "Falha no Resend" disparar.
8. `kubectl apply` do k6 (`k8s/load-test/`) e o dashboard de infra mostrando CPU subindo e o HPA criando réplica.

---

## 🔗 Relacionados

- [ADR 006 — Stack de observabilidade](../adr/006-stack-de-observabilidade.md)
- [RFC 004](../rfc/004-stack-de-observabilidade.md)
- [Componentes](../architecture/componentes.md)
- [Modelo de dados](../architecture/modelo-de-dados.md)
- [Kubernetes](../deployment/k8s.md)
