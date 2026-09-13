# Observabilidade — Oficina Mecânica

A API usa `NODE_ENV=production` para emitir JSON em stdout, mantendo `DD_ENV=dev`.
O Agent coleta somente `app`, selecionado pela label `com.datadoghq.ad.logs`,
pelo socket Docker. A coleta global fica desabilitada; db e SonarQube não possuem
labels de coleta. A estratégia de stdout também se aplica ao Kubernetes/EKS.

## Logging e correlação com traces

Em produção e no container Docker, os logs são JSON estruturado. No desenvolvimento
local no host, com NODE_ENV diferente de production, o terminal usa pino-pretty.
O correlationId reutiliza o header x-correlation-id recebido; quando ausente, gera
UUID. A resposta devolve x-correlation-id e os logs HTTP incluem correlationId.

O preload do dd-trace e DD_LOGS_INJECTION=true permitem incluir dd.trace_id e
dd.span_id nos logs Pino quando há contexto de trace ativo, preservando o
correlationId independente. Esses campos permitem navegar entre logs e traces.

Existe suporte opcional a arquivo local com LOG_FILE_ENABLED=true e
LOG_FILE_PATH (padrão ./logs/api.log), somente fora de produção. Esse recurso
não é a estratégia oficial de coleta no Docker: usamos JSON em stdout →
Docker → Datadog Agent, sem coleta de logs/api.log. A configuração Helm desta
branch trata apenas métricas de infraestrutura; logs/APM no EKS ficam para
uma etapa posterior.

## Execução local com Docker

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

## Métricas de negócio

### Volume de ordens de serviço

A métrica oficina.ordem_servico.criada é um contador enviado pelo cliente
DogStatsD existente no dd-trace, com incremento de 1 somente após a conclusão
bem-sucedida de runInTransaction() no CreateOrdemServicoUseCase.execute().
A emissão fica fora do callback: ocorre após o commit. Falha/rollback não
incrementa; falha síncrona de telemetria gera warning e preserva o sucesso da OS.

A tag explícita é status_inicial:recebida. env, service e version são herdadas
do SDK, sem duplicação. Não são enviados IDs de OS/cliente, documento, placa,
correlationId ou traceId como tags. A entrega é best-effort, sem garantia de
persistência da amostra em caso de encerramento antes do envio.

No dd-trace 6.15.0, o cliente DogStatsD usa o proxy HTTP do Agent em 8126;
as variáveis DogStatsD de hostname/porta não forçam UDP nessa versão.
Nenhuma API key é fornecida à aplicação.

O contador é usado para volume diário de OS no dashboard. Consulta:

~~~text
sum:oficina.ordem_servico.criada{env:dev,service:oficina-mecanica-api,status_inicial:recebida}.as_count()
~~~

Usar soma por dia, definindo o fuso horário do dashboard e a janela desejada.
Não interpretar taxa por segundo como quantidade diária. A validação local
confirmou recebimento após criação HTTP 201 e nenhuma nova amostra após uma
criação inválida HTTP 404.

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

O arquivo datadog/kubernetes-values.yaml configura o chart oficial
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

### Estado de validação nesta branch

A sintaxe YAML foi validada. O chart não foi renderizado nem instalado em
cluster real nesta branch; as métricas Kubernetes não foram validadas em EKS
ativo. A coleta de CPU, memória e estado dos pods descrita aqui é esperada,
não uma confirmação de implantação. A versão do chart deve ser escolhida,
revisada e fixada durante a instalação com --version.

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


## Healthcheck e uptime

GET /api/v1/health é público, sem JWT no NestJS, e é usado pelas probes
startup, readiness e liveness dos manifests Kubernetes. Retorna HTTP 200 com
data.status igual a ok e data.timestamp quando a API consegue responder.

O endpoint verifica somente disponibilidade HTTP da API. Não consulta
PostgreSQL nem Resend; pode continuar saudável mesmo com essas dependências
indisponíveis. O teste de uptime não comprova os fluxos completos de negócio.

O Datadog Synthetic HTTP Test deve apontar para a URL pública realmente
implantada, com o caminho /api/v1/health. Preferir o API Gateway se ele for a
entrada pública em uso; testar diretamente o NLB não cobre o Gateway.
Validar HTTP 200 e $.data.status igual a ok.

A URL pública real não foi obtida nesta implementação: não havia credenciais
AWS válidas nem kubeconfig/contexto Kubernetes válido disponíveis. Isso não
comprova ausência de ambiente implantado. A descoberta da URL e a validação
externa permanecem pendentes.

localhost não é acessível por um Datadog Synthetic executado em localização
pública. Para endpoint privado/local, seria necessária uma Private Location
com conectividade apropriada; o Agent do Compose sozinho não fornece isso.

## Dashboard e monitores na conta Datadog

Os itens abaixo foram configurados manualmente na conta Datadog. Não fazem
parte dos manifests versionados e não são criados pelos comandos Helm ou
Compose deste repositório. Esta lista registra a configuração manual informada,
não uma exportação ou validação automatizada dos recursos da conta.

Dashboard: **Oficina Mecânica - Observabilidade**, com os painéis:

- Volume de OS.
- Tempo médio por fase.
- Latência p95 da API.
- Falhas de integração com Resend.
- Requisições da API.
- Erros 5xx da API.

Monitores configurados manualmente:

- Monitor de falha de integração com Resend.
- Monitor de falhas 5xx da API.

A existência dos painéis não substitui as validações pendentes descritas acima.
A criação de Synthetic para uptime e a coleta Kubernetes em cluster real
continuam dependendo da configuração e do acesso ao ambiente implantado.
