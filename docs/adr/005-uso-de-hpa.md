# ADR 005 — Uso de HPA (Horizontal Pod Autoscaler)

| Campo  | Valor      |
| ------ | ---------- |
| Data   | 06/09/2026 |
| Status | Aceita     |
| Decisores | Isaac Bruno Siqueira de Souza |

## 📌 Contexto

A expansão da oficina para múltiplas unidades trouxe requisito explícito de escalabilidade e alta disponibilidade. A carga da API não é uniforme: concentra-se no horário comercial, com picos na abertura da oficina e no fim do expediente, e cai quase a zero à noite.

Dimensionar por pico significa pagar capacidade ociosa a maior parte do tempo. Dimensionar pela média significa degradar exatamente quando a oficina está movimentada.

A aplicação tem características que tornam a escala horizontal viável:

- Stateless: não há sessão em memória. A autenticação é por JWT, verificado a cada requisição, sem consulta a store de sessão.
- Estado externalizado: toda persistência está no RDS.
- Container único: uma imagem, um processo Node.

Restrição relevante: os eventos de domínio usam `EventEmitter2`, que é **in-process** ([ADR 004](./004-padrao-de-comunicacao.md)). Um evento emitido em um pod é consumido nesse mesmo pod. Isso não impede replicar, porque cada requisição é atendida inteiramente por um pod, mas define um limite para o que pode ser assumido sobre eventos e réplicas.

A pergunta desta ADR é: **como a aplicação escala, sob qual métrica e com quais limites**.

## ✅ Decisão

Adotamos o **Horizontal Pod Autoscaler** do Kubernetes, API `autoscaling/v2`, com métrica de utilização de CPU.

### Configuração

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  scaleTargetRef:
    kind: Deployment
    name: oficina-mecanica-api
  minReplicas: 1
  maxReplicas: 3
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

O manifesto canônico é `kubernetes/oficina-api/base/hpa.yaml` no repositório `oficina-mecanica-infra-k8s`, aplicado pelo deploy Kubernetes de cada ambiente ([ADR 008](./008-plataforma-por-ambiente-com-contratos-ssm.md)). O overlay do Minikube em `k8s/overlays/minikube/` deste repositório reproduz a mesma configuração para desenvolvimento local.

### Estratégia de rollout

O Deployment usa `strategy: Recreate`. Antes de cada rollout o pipeline aplica o Job de migrations e espera sua conclusão; com `Recreate`, a versão nova do código só sobe depois que a anterior parou, então nunca há duas versões da API falando com o mesmo schema. O custo é uma janela sem pods durante a troca de versão, aceitável para o ritmo de deploy da fase.

### Requests e limits

O HPA calcula utilização como percentual do **request**, não do limit. Sem `resources.requests` definido, a métrica não existe e o HPA não funciona. O deployment declara:

```yaml
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

Com request de 100m e alvo de 70%, o HPA adiciona réplica quando a média passa de 70m de CPU por pod. O limit de 500m dá margem de cinco vezes para absorver rajada antes que a escala reaja, evitando thrashing em picos curtos.

### Escala no nível do nó

Node group por ambiente ([ADR 008](./008-plataforma-por-ambiente-com-contratos-ssm.md)): homologação com `t3.medium` SPOT de 1 a 3 nós; produção com `m6i.large` on-demand de 2 a 6 nós. O teto de 3 réplicas cabe na capacidade de homologação sem Cluster Autoscaler, que não está instalado.

### Probes

O HPA cria pods; o Service só encaminha tráfego para os prontos. As três probes têm papéis distintos:

| Probe | Configuração | Papel |
| ----- | ------------ | ----- |
| `startupProbe` | period 10 s, failureThreshold 18 | Tolera até 180 s de inicialização, cobrindo conexão ao RDS |
| `readinessProbe` | delay 15 s, period 10 s, threshold 6 | Impede tráfego antes do pod estar pronto |
| `livenessProbe` | delay 30 s, period 20 s, threshold 3 | Reinicia pod travado |

Sem a `readinessProbe`, um pod novo receberia requisições antes de conectar ao banco, e a escala causaria erro em vez de aliviar carga.

### Validação

`k8s/load-test/` neste repositório contém um Job com script k6, usado para gerar carga e observar o escalonamento no Minikube e no EKS.

## 📊 Consequências

### 👍 Positivas

- Capacidade acompanha a demanda sem intervenção manual, atendendo o requisito de escalabilidade da fase.
- Custo proporcional ao uso. Fora do horário comercial a aplicação opera com uma réplica; nos picos, sobe até três.
- Requests e limits declarados dão ao scheduler informação para distribuir pods entre nós, e ao HPA a base de cálculo.
- Configuração parametrizada por Terraform permite ajustar sem alterar manifesto.
- Existe caminho de validação reproduzível com k6.
- Métrica de CPU é fornecida pelo `metrics-server`, sem dependência de stack de observabilidade externa. O HPA funciona independentemente do Datadog ([ADR 006](./006-stack-de-observabilidade.md)).

### 👎 Negativas / trade-offs

- `Recreate` deixa a API sem pods durante a troca de versão. Deploy fora do horário de pico.
- Com `minReplicas: 1`, a queda do único pod fora do pico causa indisponibilidade até o restart.
- CPU pode não ser o gargalo real. A API é dominada por I/O com o RDS. Sob carga de consultas lentas, a latência sobe sem que a CPU acompanhe, e o HPA não reage. Latência ou requisições por segundo seriam métricas mais fiéis, mas exigem métricas customizadas.
- Escalar pods pressiona o banco. Cada réplica abre seu próprio pool de conexões. Três réplicas triplicam conexões contra uma instância `db.t4g.micro`. O HPA pode transformar gargalo de aplicação em gargalo de banco.
- Teto de 3 sem Cluster Autoscaler. Se os nós não comportarem, os pods ficam `Pending` indefinidamente.
- Eventos in-process não são redistribuídos. Um pod terminado durante scale-down perde eventos ainda não processados. Combinado com a ausência de retry ([ADR 004](./004-padrao-de-comunicacao.md)), scale-down pode causar perda silenciosa de histórico.
- Sem `behavior` configurado, valem os padrões do Kubernetes, incluindo janela de estabilização de 300 s para scale-down. Reação a queda de carga é lenta.

## 🔀 Alternativas consideradas

| Alternativa | Por que não foi escolhida |
| ----------- | ------------------------- |
| **`RollingUpdate` com `maxUnavailable: 0`** | Elimina a janela sem pods, mas faz duas versões do código conviverem durante o rollout, o que exige migrations retrocompatíveis. Fica como evolução quando o piso subir para duas réplicas |
| **Réplicas fixas** | Simples e previsível, mas obriga escolher entre pagar pelo pico ou degradar nele. O enunciado pede escalabilidade explicitamente |
| **VPA (Vertical Pod Autoscaler)** | Ajusta requests em vez de contar réplicas. Não resolve disponibilidade (continua sendo um pod) e o redimensionamento reinicia o pod. Complementar ao HPA, não substituto |
| **KEDA (escala por evento)** | Escalaria por profundidade de fila ou métrica externa. Faz sentido com broker, que não existe hoje ([ADR 004](./004-padrao-de-comunicacao.md)). Candidato natural se o outbox ou SQS forem adotados |
| **HPA por métrica customizada (latência ou RPS)** | Mais fiel ao comportamento real de uma API I/O-bound. Exige Datadog Cluster Agent como external metrics provider ou Prometheus Adapter ([ADR 006](./006-stack-de-observabilidade.md)). **Evolução prevista** |
| **HPA por memória** | Aplicação Node com GC tem uso de memória em serrilha, pouco correlacionado com carga. Geraria escala errática |
| **Cluster Autoscaler ou Karpenter** | Escalaria nós, removendo o teto de 3 réplicas. Não instalado; o node group tem tamanho fixo. Necessário se `maxReplicas` subir |
| **AWS Fargate para EKS** | Elimina gestão de nós, mas tem cold start maior e custo por pod superior para carga contínua |
| **Migrar a API para Lambda** | O padrão serverless já é usado na autenticação. Para a API completa, cold start e limite de 15 minutos seriam restritivos, e o pool de conexões por invocação pressionaria o RDS de forma pior que o HPA |

## 🔮 Evolução prevista

- `minReplicas: 2`, `RollingUpdate` com `maxUnavailable: 0` e `PodDisruptionBudget` com `minAvailable: 1`, para alta disponibilidade também durante o deploy.
- Migrar para métrica de latência via external metrics do Datadog Cluster Agent ([ADR 006](./006-stack-de-observabilidade.md)).
- Configurar `behavior` com janelas de estabilização ajustadas ao perfil de carga da oficina.
- Instalar Cluster Autoscaler se `maxReplicas` ultrapassar a capacidade do node group.
- Avaliar pooler de conexões (PgBouncer ou RDS Proxy) antes de aumentar o teto de réplicas.

## 🔗 Relacionados

- [ADR 004 — Padrão de comunicação](./004-padrao-de-comunicacao.md)
- [Componentes](../architecture/componentes.md)
- [Kubernetes](../deployment/k8s.md)
- [RFC 001 — Escolha da nuvem](../rfc/001-escolha-da-nuvem.md)
