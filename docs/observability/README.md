# 📡 Observabilidade

O que é monitorado, onde ver e como cada requisito do enunciado é atendido. Decisão de ferramenta e instrumentação: [ADR 006](../adr/006-stack-de-observabilidade.md). Procedimentos de execução, validação e instalação do Agent: [datadog/README.md](../../datadog/README.md).

---

## 🧭 Requisitos do enunciado × sinal

| Requisito | Sinal | Onde ver no Datadog |
| --------- | ----- | ------------------- |
| Latência das APIs | APM, `trace.express.request.duration` por `resource_name` | APM → Services → `oficina-mecanica-api`; painel "Latência p95 da API" |
| CPU e memória do Kubernetes | `kubernetes.cpu.usage.total`, `kubernetes.memory.usage`, `kubernetes_state.pod.status_phase` | Infrastructure → Kubernetes; Metrics Explorer filtrando `kube_container_name:api` |
| Healthchecks e uptime | `GET /api/v1/health` nas probes e no health check do deploy | Kubernetes (`rollout status`) e Job Summary do `kubernetes-deploy.yml` |
| Alertas de falha no processamento de OS | Monitor de 5xx da API e monitor de falha no Resend (integração disparada pela OS) | Monitors |
| Logs JSON com correlação | `correlationId`, `dd.trace_id`, `dd.span_id` | Logs → `service:oficina-mecanica-api @correlationId:<id>` |
| Volume diário de OS | `oficina.ordem_servico.criada` (count) | Painel "Volume de OS" |
| Tempo médio por status (Diagnóstico, Execução, Finalização) | `oficina.ordem_servico.tempo_medio_fase` (gauge, tag `fase`) | Painel "Tempo médio por fase" |
| Erros e falhas nas integrações | logs `status:error` do `ResendNotificacaoAdapter`; erros 5xx | Painéis "Falhas de integração com Resend" e "Erros 5xx da API" |

---

## 📝 Logs

### Campos

```json
{
  "level": 30,
  "time": 1757944202114,
  "msg": "request completed",
  "service": "oficina-mecanica-api",
  "env": "dev",
  "version": "0.0.1",
  "correlationId": "3f1e...",
  "dd": { "trace_id": "...", "span_id": "..." },
  "req": { "method": "POST", "url": "/api/v1/ordens", "headers": { "authorization": "[REDACTED]" } },
  "res": { "statusCode": 201 },
  "context": "OrdemServicoController"
}
```

`level`, `time` e `msg` são o formato nativo do pino; o Datadog mapeia `level` numérico para `status` e `msg` para `message` no pipeline padrão de Node.js. `service`, `env` e `version` vêm do `dd-trace`. Em desenvolvimento no host (`NODE_ENV` diferente de `production`) o log sai em texto colorido pelo `pino-pretty`; em container e em produção sai JSON.

### Como seguir uma requisição

1. Pegar o `x-correlation-id` do header da resposta (o Nest sempre devolve; se o cliente mandou um, é o mesmo).
2. No Datadog, Logs → `service:oficina-mecanica-api @correlationId:<valor>`.
3. Clicar em `dd.trace_id` para abrir o trace com as consultas SQL da mesma requisição.

A Lambda loga JSON com `requestId` do Gateway no CloudWatch.

### O que não vai para o log

`authorization`, `cookie` e `set-cookie` são substituídos por `[REDACTED]` pelo `redact` do pino. CPF completo, senha e chaves de API não são logados pela aplicação. A Lambda loga só o `requestId` e o resultado.

---

## 📈 Dashboard

Dashboard **Oficina Mecânica - Observabilidade** na conta Datadog, tipo Timeboard.

| Painel | Consulta | Requisito |
| ------ | -------- | --------- |
| Volume de OS | `sum:oficina.ordem_servico.criada{env:dev,service:oficina-mecanica-api,status_inicial:recebida}.as_count()`, somado por dia | Volume diário de OS |
| Tempo médio por fase | `avg:oficina.ordem_servico.tempo_medio_fase{env:dev,service:oficina-mecanica-api,janela:24h} by {fase}` | Tempo médio por status |
| Latência p95 da API | `p95:trace.express.request.duration{service:oficina-mecanica-api}` | Latência |
| Requisições da API | `sum:trace.express.request.hits{service:oficina-mecanica-api}.as_count()` | Latência e volume |
| Erros 5xx da API | `sum:trace.express.request.errors{service:oficina-mecanica-api}.as_count()` | Erros |
| Falhas de integração com Resend | `logs("service:oficina-mecanica-api status:error @context:ResendNotificacaoAdapter").rollup("count")` | Erros nas integrações |

Leitura das métricas de negócio:

- `oficina.ordem_servico.criada` é um contador. No painel de volume diário, usar soma por dia com o fuso do dashboard; não interpretar taxa por segundo como quantidade.
- `oficina.ordem_servico.tempo_medio_fase` é uma gauge em segundos, calculada a cada 60 s sobre as transições concluídas nas últimas 24 h. Fases: `diagnostico`, `execucao`, `finalizacao` (`finalizacao` mede a espera entre FINALIZADA e ENTREGUE). Sem amostra na janela, o painel fica vazio.

Métricas de infraestrutura no EKS (`kubernetes.cpu.usage.total` em nanocores, `kubernetes.memory.usage` em bytes) filtradas por `kube_cluster_name`, `kube_namespace:oficina-mecanica` e `kube_container_name:api`.

---

## 🚨 Monitores

| Nome | Tipo | Condição | Requisito |
| ---- | ---- | -------- | --------- |
| Falhas 5xx da API | APM / métrica | `trace.express.request.errors` acima do limiar em 5 min | Erros; falha no processamento de OS |
| Falha de integração com Resend | Log | `status:error @context:ResendNotificacaoAdapter` acima do limiar em 15 min | Erros nas integrações |

Os dois monitores notificam o canal do grupo. Cada mensagem traz o link do dashboard, o valor atual e o limiar.

### Runbooks

| Monitor | Primeiro passo | Se persistir |
| ------- | -------------- | ------------ |
| Falhas 5xx da API | Filtrar logs `status:error` pelo `correlationId` de uma das requisições; abrir o trace | Se o erro vier do Postgres, checar conexões no RDS; se for exceção nova, abrir issue e restaurar o digest anterior por PR no `infra-k8s` |
| Falha de integração com Resend | Conferir status do Resend e validade da `RESEND_API_KEY` no GitHub Environment | Rotacionar a chave e refazer o deploy; e-mails perdidos não são reenviados |

### Convenção

Nomes no Datadog seguem `provedor-recurso-ambiente-região-métrica-severidade` (exemplo: `AWS-EKS-homologacao-use1-5xx-critical`), com tags `env`, `service` e `team:32soat`. Categorias, como na aula de alertas: reativo (5xx, Resend) notifica quem está de plantão; proativo (a criar) notifica o canal sem urgência.

---

## ✅ Validação

Local, com o profile `observability` do Compose:

```sh
docker compose --profile observability up -d db datadog-agent app
curl -i -H 'x-correlation-id: docker-log-trace-001' http://localhost:3000/api/v1/health
docker compose logs --no-log-prefix app | grep 'docker-log-trace-001'
docker compose exec datadog-agent agent status
```

No EKS, após `helm upgrade --install` com `datadog/kubernetes-values.yaml`:

```sh
kubectl -n datadog rollout status daemonset/datadog
kubectl -n datadog exec daemonset/datadog -c agent -- agent status
```

Passo a passo, chaves e diagnóstico das métricas de negócio: [datadog/README.md](../../datadog/README.md).

---

## 🔗 Relacionados

- [ADR 006 — Stack de observabilidade](../adr/006-stack-de-observabilidade.md)
- [RFC 004](../rfc/004-stack-de-observabilidade.md)
- [Datadog: operação](../../datadog/README.md)
- [Componentes](../architecture/componentes.md)
- [Requisitos](../architecture/requisitos.md)
- [Modelo de dados](../architecture/modelo-de-dados.md)
