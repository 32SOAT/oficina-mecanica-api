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

## Kubernetes/EKS — métricas de infraestrutura

O arquivo kubernetes-values.yaml configura o chart oficial
[datadog/datadog](https://github.com/DataDog/helm-charts/tree/main/charts/datadog):
um Node Agent por nó Linux e um Cluster Agent para CPU/memória dos containers,
estado dos pods e métricas básicas do cluster. State Metrics Core dispensa
kube-state-metrics legado. Logs, APM, admission controller e external metrics
provider ficam desabilitados neste release. Coleta de processos e manifests
(Orchestrator Explorer) também fica desabilitada; métricas de estado continuam
disponíveis no Metrics Explorer.

Instalação independente: não modifica a API, HPA, Terraform ou Agent do Compose.
**Metrics-server continua fornecendo métricas ao HPA, independentemente do
Datadog.** Este release não instala nem substitui metrics-server.

### Pré-requisitos

- Helm 3, kubectl e contexto autorizado do cluster desejado.
- Nós Linux, acesso ao kubelet/API Kubernetes e saída HTTPS para Datadog US1.
- Permissão para instalar RBAC, DaemonSet, Deployment e Secret.
- API key válida do site datadoghq.com; application key não é necessária.
- Conferir se já existe Agent/release, evitando instalação duplicada.
- Capacidade adicional por nó: request 100m CPU/256Mi RAM, limite 500m/512Mi.
  Cluster Agent: request 100m/128Mi, limite 500m/512Mi. Valores iniciais para
  cluster pequeno; acompanhar throttling/OOM e ajustar conforme a carga.
- Esta configuração atende nós Linux/EC2, não EKS Fargate. No Minikube, verificar
  certificados/acesso ao kubelet; não desabilitar TLS globalmente por conveniência.

### Secret e instalação manual

Os comandos abaixo alteram o cluster somente quando executados pelo operador.
Confirme o contexto. O Secret deve existir no namespace datadog, com nome
datadog-api-key e chave interna api-key.

~~~sh
kubectl config current-context
helm list --all-namespaces
kubectl create namespace datadog --dry-run=client -o yaml | kubectl apply -f -
~~~

Exemplo usando Python 3 em terminal interativo: solicita a chave sem eco e
envia o Secret por stdin, sem arquivo, argumento contendo segredo ou histórico
do shell. Não execute com depuração de shell. Se o Secret já existir, reutilize
o Secret aprovado: este comando falha, sem sobrescrevê-lo.

~~~sh
python3 -c 'import base64,getpass,json,sys; key=getpass.getpass("Datadog API key: "); sys.exit("Chave vazia") if not key else None; print(json.dumps({"apiVersion":"v1","kind":"Secret","metadata":{"name":"datadog-api-key","namespace":"datadog"},"type":"Opaque","data":{"api-key":base64.b64encode(key.encode()).decode()}}))'   | kubectl create -f -
~~~

Base64 não é criptografia. Proteja o acesso ao Secret com RBAC e nunca versione
seu conteúdo. A aplicação não recebe essa credencial.

~~~sh
helm repo add datadog https://helm.datadoghq.com
helm repo update datadog
helm search repo datadog/datadog --versions
~~~

Escolha e fixe uma versão revisada do chart. Substitua os exemplos abaixo;
clusterName deve ser único e estável por cluster.

~~~sh
DD_CLUSTER_NAME='nome-real-do-cluster'
DD_CHART_VERSION='VERSAO_REVISADA_DO_CHART'

helm template datadog datadog/datadog   --namespace datadog --version "$DD_CHART_VERSION"   -f datadog/kubernetes-values.yaml   --set-string datadog.clusterName="$DD_CLUSTER_NAME"

helm upgrade --install datadog datadog/datadog   --namespace datadog --version "$DD_CHART_VERSION"   -f datadog/kubernetes-values.yaml   --set-string datadog.clusterName="$DD_CLUSTER_NAME"   --wait --timeout 5m
~~~

O clusterName do arquivo é exemplo. As tags env:dev e service:oficina-mecanica-api
identificam esta instalação, mas **não restringem a coleta à API**. Filtre por
namespace/container nas consultas. Ajuste as tags para outros ambientes.

### Validação

~~~sh
kubectl -n datadog get daemonset,deployment,pods -o wide
kubectl -n datadog rollout status daemonset/datadog
kubectl -n datadog rollout status deployment/datadog-cluster-agent
kubectl -n datadog exec daemonset/datadog -c agent -- agent status
kubectl -n datadog exec deployment/datadog-cluster-agent -- datadog-cluster-agent status
~~~

Confirme um Agent pronto por nó elegível, Cluster Agent pronto, integração
kubelet saudável e check kubernetes_state_core funcionando. Verifique erros de
RBAC, certificados, conectividade e limites de memória.

No Datadog Metrics Explorer, filtre pelo cluster, namespace e container da API.
Exemplos (substitua os placeholders):

~~~text
sum:kubernetes.cpu.usage.total{kube_cluster_name:<cluster>,kube_namespace:<namespace>,kube_container_name:api} by {pod_name}
sum:kubernetes.memory.usage{kube_cluster_name:<cluster>,kube_namespace:<namespace>,kube_container_name:api} by {pod_name}
sum:kubernetes_state.pod.status_phase{kube_cluster_name:<cluster>,kube_namespace:<namespace>} by {phase}
~~~

CPU dessa métrica usa nanocores (dividir por 1.000.000.000 para cores); memória
usa bytes. Estado Running não garante readiness da aplicação.
Referências: [Kubernetes](https://docs.datadoghq.com/integrations/kubernetes/) e
[State Core](https://docs.datadoghq.com/integrations/kubernetes_state_core/).

### Remoção

~~~sh
helm uninstall datadog --namespace datadog
~~~

O Secret preexistente e o namespace permanecem. Só os remova separadamente se
não forem usados por outra instalação. A aplicação e metrics-server permanecem.
