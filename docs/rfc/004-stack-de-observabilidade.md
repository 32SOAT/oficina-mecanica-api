# RFC 004 — Stack de observabilidade

| Campo | Valor |
| ----- | ----- |
| Número | 004 |
| Data | 10/09/2026 |
| Status | ✅ Encerrada — Aprovada |
| Autores | João Ricardo Bianchini Vieira |
| Resultado | Datadog. Registrado na [ADR 006](../adr/006-stack-de-observabilidade.md) |

## 📄 Sumário

Proposta de adoção do Datadog como plataforma única de logs, métricas, traces, alertas e dashboards, com o Datadog Agent em DaemonSet no EKS, `dd-trace` na API NestJS, Lambda Extension na function de autenticação e integração AWS para RDS e API Gateway. O log estruturado com correlação já iniciado na branch `integration-datadog` é o primeiro passo dessa proposta.

## 📌 Motivação

O enunciado da fase pede integração com Datadog ou New Relic e lista o que precisa ser monitorado:

| # | Requisito do enunciado | Sinal |
| --- | ---------------------- | ----- |
| R1 | Latência das APIs | trace / métrica |
| R2 | CPU e memória do Kubernetes | métrica de infra |
| R3 | Healthchecks e uptime | teste sintético |
| R4 | Alertas para falhas no processamento de OS | monitor sobre log, métrica ou banco |
| R5 | Logs estruturados em JSON com correlação entre requisições | log |
| R6 | Dashboard de volume diário de OS | métrica de negócio |
| R7 | Dashboard de tempo médio por status (Diagnóstico, Execução, Finalização) | métrica de negócio |
| R8 | Dashboard de erros e falhas nas integrações | log / trace |

Na abertura desta RFC nenhum desses sinais saía da plataforma.

Há também um problema que o requisito R4 descreve sem saber: os eventos de domínio da OS rodam em `EventEmitter2`, sem retry ([ADR 004](../adr/004-padrao-de-comunicacao.md)). Se o listener de histórico falhar, a OS fica com `status_atual` preenchido e sem linha em `historico_status_os`. Ninguém fica sabendo. A observabilidade é a única forma de detectar isso enquanto o outbox não existe.

### Ponto de partida

| Componente | Antes | Primeiro passo (branch `integration-datadog`) |
| ---------- | ----- | --------------------------------------------- |
| API Nest | Logger padrão do Nest, texto | `nestjs-pino` + `pino-http`. JSON em produção, `pino-pretty` em dev. `x-correlation-id` lido do header ou gerado (UUID v4) e devolvido na resposta. Campo `correlationId` em todos os logs da requisição |
| Lambda | `logStructured` emite JSON com `level`, `event`, `timestamp`, `requestId` do Gateway | igual |
| Gateway | Sem log de acesso configurado | igual |
| EKS | `metrics-server` para o HPA | igual |

O restante da instrumentação foi feito na mesma branch depois desta RFC; o resultado está na [ADR 006](../adr/006-stack-de-observabilidade.md).

## 📋 Requisitos

Além de R1 a R8:

| # | Requisito |
| --- | --------- |
| R9 | Cobrir os três componentes de execução: Lambda, API no EKS, RDS |
| R10 | Provisionável por Terraform ou Helm versionado, sem clique no console |
| R11 | Custo compatível com conta acadêmica e com demonstração de poucas horas |
| R12 | Correlação ponta a ponta: um id que atravesse Gateway, Lambda e Nest |
| R13 | Conteúdo alinhado ao material da disciplina (Datadog e New Relic são as ferramentas das aulas) |

## ⚖️ Critérios de avaliação

1. Cobertura de R1 a R9 com uma única ferramenta
2. Esforço de instrumentação em Node.js
3. Custo no período de avaliação
4. Integração nativa com EKS, Lambda e RDS
5. Familiaridade da equipe e aderência às aulas

## 🔀 Alternativas avaliadas

### A. Datadog

Plataforma SaaS com APM, Log Management, Infrastructure, Synthetics, Monitors e Dashboards no mesmo lugar.

| Requisito | Como atende |
| --------- | ----------- |
| R1 | `dd-trace` instrumenta Express e `pg` automaticamente. Latência p50/p95/p99 por rota sem código |
| R2 | Datadog Agent em DaemonSet coleta kubelet e cAdvisor. Cluster Agent agrega |
| R3 | Synthetic API Test contra `GET /api/v1/health` pelo Gateway, de várias regiões |
| R4 | Log Monitor sobre erros dos listeners, mais uma custom query no check de Postgres comparando `status_atual` com o histórico |
| R5 | Agent coleta stdout JSON dos pods; `dd-trace` injeta `dd.trace_id` nos logs do pino |
| R6, R7 | Métricas customizadas via DogStatsD emitidas pelos listeners de evento da OS |
| R8 | Error Tracking do APM mais Log Monitor sobre falhas do Resend |
| R9 | Lambda Extension (layer) e integração AWS via CloudWatch para RDS e Gateway |
| R10 | Provider Terraform `datadog/datadog` para monitores e dashboards; Helm chart `datadog/datadog` para o agente |
| R11 | Trial de 14 dias cobre a demonstração. Plano gratuito mantém infra básica |

Contrapontos: custo por host e por GB de log em produção real; `dd-trace` adiciona latência de inicialização; segredo `DD_API_KEY` precisa de gestão.

O que pesou mais: as aulas 2 a 6 de Monitoramento Avançado são sobre Datadog, e quem começou a instrumentação já estava nele.

### B. New Relic

Cobre R1 a R9 tão bem quanto o Datadog. Agent Node.js, Kubernetes integration, Lambda layer, NRQL para dashboards.

Não escolhido por dois motivos: o plano gratuito limita usuários com acesso completo a um, o que dificulta o trabalho em grupo, e a parte da equipe que começou a instrumentação já sinalizou Datadog no nome da branch.

### C. Prometheus + Grafana + Loki + Tempo (OpenTelemetry)

Stack aberta, sem custo de licença, coberta nas aulas de OpenTelemetry da Fase 2.

Não escolhido porque o enunciado pede "Datadog ou New Relic" explicitamente, e porque a equipe teria que operar quatro componentes a mais no cluster (armazenamento, retenção, alta disponibilidade do próprio Prometheus). Em um EKS de três nós `t3.medium`, isso compete por recurso com a API.

### D. OpenTelemetry SDK com exportação para Datadog

Instrumentar com OTel e enviar ao Datadog via OTLP. Evita lock-in no `dd-trace`.

Não escolhido agora. O suporte a OTLP no Datadog Agent existe, mas a injeção automática de `trace_id` nos logs e a instrumentação do `pg` são mais simples com `dd-trace`. Fica como evolução se o grupo quiser portabilidade.

### E. CloudWatch apenas

Já recebe logs da Lambda. Container Insights cobre R2. CloudWatch Logs Insights cobre parte de R5.

Não escolhido: não atende R1 sem X-Ray, não tem Synthetics comparável, e o enunciado exige uma das duas ferramentas.

## 📊 Comparação

| Critério | Datadog | New Relic | Prometheus stack | OTel → Datadog | CloudWatch |
| -------- | ------- | --------- | ---------------- | -------------- | ---------- |
| Cobertura R1–R9 | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Esforço em Node | ✅ Baixo | ✅ Baixo | 🟡 | 🟡 | 🟡 |
| Custo na avaliação | ✅ Trial | ✅ Free tier | ✅ | ✅ Trial | ✅ |
| Integração EKS/Lambda/RDS | ✅ | ✅ | 🟡 | ✅ | ✅ |
| Aderência às aulas | ✅ | ✅ | 🟡 | 🟡 | ❌ |
| Trabalho em grupo | ✅ | 🟡 | ✅ | ✅ | ✅ |

## ✅ Proposta

Adotar o **Datadog**, nesta ordem:

1. Logs: mesclar `integration-datadog` em `main`. Ajustar o pino para o formato que o Datadog reconhece sem pipeline: `level` como texto (`formatters.level`) e `messageKey: 'message'`, ou criar um pipeline de remap no Datadog. Escolha registrada na ADR 006.
2. Agente: Helm chart `datadog/datadog` com `logs.enabled`, `apm.portEnabled`, `clusterAgent.enabled`. `DD_API_KEY` em Secret do Kubernetes, alimentado pelo pipeline.
3. APM: `dd-trace` inicializado antes do Nest (`import 'dd-trace/init'` no `main.ts`), com `logInjection: true`. Variáveis `DD_SERVICE`, `DD_ENV`, `DD_VERSION` no ConfigMap.
4. Lambda: layer `Datadog-Extension` e `datadog-lambda-js` via Terraform da Lambda. O `requestId` do Gateway vira o `correlationId` propagado para o Nest quando a Lambda chamar a API. Como hoje a Lambda não chama o Nest, a correlação entre os dois é feita pelo Gateway injetando `x-correlation-id` a partir de `$context.requestId`.
5. Integração AWS: role de leitura do CloudWatch para métricas de RDS e API Gateway.
6. Métricas de negócio: listener novo no módulo de OS emite `oficina.os.criada` (count) e `oficina.os.status.duracao` (distribution, tag `status`) via DogStatsD. Índices propostos em [modelo-de-dados.md A6](../architecture/modelo-de-dados.md#a6--índices-para-os-dashboards-da-fase-3) continuam necessários para as consultas de apoio.
7. Monitores e dashboards: definidos em Terraform no repositório da API, para serem versionados e reproduzíveis.

Lista de monitores e dashboards em [observability/README.md](../observability/README.md).

## ❓ Questões em aberto

| Questão | Encaminhamento |
| ------- | -------------- |
| Quem cria a conta e guarda o `DD_API_KEY`? | Definir dono. Chave vai para GitHub Secrets e Kubernetes Secret |
| DaemonSet ou sidecar? | DaemonSet. Um agente por nó custa menos e o cluster tem no máximo três nós. Sidecar só se o node group crescer |
| Correlação Gateway → Nest | Parameter mapping no API Gateway (`append:header.x-correlation-id = $context.requestId`) ou aceitar `x-amzn-trace-id` no `genReqId` do pino. Testar os dois |
| Divergência `status_atual` × histórico | Custom query no check de Postgres do Agent, a cada 5 min. Alternativa: endpoint interno da API que a Synthetic chama |
| Retenção de logs | Trial usa 15 dias. Documentar o que se perde ao voltar ao plano gratuito |
| Logs do control plane do EKS | Habilitar `api` e `audit` em `cluster_enabled_log_types`. Custo baixo, útil para depurar o HPA |

## 🏁 Resultado

**Encerrada — Aprovada em 10/09/2026.** O grupo confirmou o Datadog. Implementado na API (`dd-trace`, `nestjs-pino`, métricas de negócio via DogStatsD), no Compose (Agent) e no EKS (Helm chart `datadog/datadog`), com dashboard e monitores na conta. Do que a proposta listou, ficaram como evolução a Lambda Extension, a integração AWS, o Synthetic e os monitores em Terraform. Decisão registrada na [ADR 006](../adr/006-stack-de-observabilidade.md).

## 🔗 Relacionados

- [ADR 006 — Stack de observabilidade](../adr/006-stack-de-observabilidade.md)
- [ADR 004 — Padrão de comunicação](../adr/004-padrao-de-comunicacao.md)
- [ADR 005 — Uso de HPA](../adr/005-uso-de-hpa.md)
- [Observabilidade](../observability/README.md)
- [Componentes](../architecture/componentes.md)
