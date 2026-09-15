# 📋 Requisitos

Requisitos funcionais e não funcionais da plataforma na Fase 3, com metas mensuráveis. As metas marcadas "a validar" são propostas da documentação e precisam de aprovação do grupo antes de virarem SLO no Datadog.

Fonte dos requisitos: enunciado do Tech Challenge Fase 3 e o que o sistema já fazia nas fases anteriores.

---

## ✅ Requisitos funcionais

| # | Requisito | Onde está | Estado |
| --- | --------- | --------- | ------ |
| RF1 | Cliente autentica com CPF e recebe JWT | Lambda `POST /auth/cpf` | ✅ |
| RF2 | Lambda valida o CPF, consulta existência e status do cliente | `authenticate-cpf.ts` | ✅ |
| RF3 | Rotas sensíveis exigem JWT; rotas de cliente aceitam só `role: cliente` | `JwtAuthGuard`, `RolesGuard` | ✅ |
| RF4 | Equipe autentica com e-mail e senha | `POST /api/v1/auth/login` | ✅ |
| RF5 | Abertura de OS com itens de serviço e peças, reservando estoque | `CreateOrdemServicoUseCase` | ✅ |
| RF6 | Cliente consulta status e aprova ou reprova orçamento | rotas `@Roles('cliente')` | ✅ |
| RF7 | Transições de status da OS com histórico | `historico_status_os` | ✅ |
| RF8 | Notificação por e-mail nas mudanças de status | `ResendNotificacaoAdapter` | ✅ |
| RF9 | Cadastros de clientes, veículos, serviços, estoque, usuários | módulos correspondentes | ✅ |
| RF10 | Dashboards de volume diário de OS, tempo por fase e erros de integração | Dashboard "Oficina Mecânica - Observabilidade" no Datadog | ✅ |

---

## 📐 Requisitos não funcionais

| # | Atributo | Requisito | Meta (SLO) | Indicador (SLI) | Como medir | Estado |
| --- | -------- | --------- | ---------- | --------------- | ---------- | ------ |
| RNF1 | Disponibilidade | API acessível pelo Gateway | 99,5% ao mês (a validar) | health check do deploy e probes em `GET /api/v1/health` | Kubernetes, pipeline | ✅ probes e health check; Synthetic como evolução |
| RNF2 | Latência | Rotas de leitura respondem rápido | p95 < 400 ms, p99 < 800 ms (a validar) | `trace.express.request.duration` por rota | Datadog APM | ✅ painel de latência p95 |
| RNF3 | Latência da autenticação | `POST /auth/cpf` | p95 < 1 s incluindo cold start (a validar) | duração da invocação | CloudWatch | ✅ logs da Lambda no CloudWatch |
| RNF4 | Escalabilidade | API escala sob carga sem intervenção | de 1 a 3 réplicas com CPU média acima de 70% | réplicas do HPA, `kubernetes.cpu.usage.total` | `kubectl get hpa`, Datadog | ✅ |
| RNF5 | Deploy controlado | Migration antes do rollout, health check ao final | 0 deploys com migration falha | Job de migration e `rollout status` no pipeline | `kubernetes-deploy.yml` | ✅ |
| RNF6 | Taxa de erro | Erros do servidor | < 1% de 5xx em 5 min (a validar) | `trace.express.request.errors` | APM, monitor de 5xx | ✅ |
| RNF7 | Consistência | Toda transição de status tem linha de histórico | 0 OS divergentes | comparação de `status_atual` com a última linha do histórico | consulta SQL | 🟡 monitor como evolução ([ADR 004](../adr/004-padrao-de-comunicacao.md)) |
| RNF8 | Observabilidade | Logs JSON com correlação | 100% das requisições com `correlationId` e `dd.trace_id` | busca por `@correlationId` | Datadog Logs | ✅ |
| RNF9 | Segurança | Token de cliente não alcança rota administrativa | 0 rotas administrativas acessíveis com `role: cliente` | teste automatizado do `RolesGuard` | `npm test` | ✅ |
| RNF9a | Segurança | Cliente só acessa as próprias OS (autorização por recurso) | 0 OS de outro cliente acessível pelo UUID | teste de integração comparando `sub` com `os.cliente_id` | `npm test` | 🟡 evolução prevista ([ADR 003](../adr/003-auth-cliente-lambda-jwt-role.md)) |
| RNF9b | Segurança | `POST /auth/cpf` não permite enumerar CPFs | throttling no Gateway (a validar) | contagem por IP, 429 | API Gateway | 🟡 evolução prevista ([RFC 003](../rfc/003-estrategia-de-autenticacao.md)) |
| RNF10 | Segurança | Banco sem exposição pública, criptografado em repouso | `publicly_accessible = false`, `storage_encrypted = true` | Terraform | `terraform plan` | ✅ |
| RNF11 | Segurança | Segredos fora do código | 0 segredos em arquivos versionados | GitHub Environments, Secret do Kubernetes criado no deploy, OIDC sem access keys | revisão de PR | ✅ |
| RNF12 | Recuperação | Backup automático do banco | retenção de 7 dias | `backup_retention_period` | Terraform do `infra-db` | ✅ |
| RNF13 | Manutenibilidade | Cobertura de testes | ≥ 80% de linhas | `npm run test:cov` | SonarQube, CI | ✅ 91% na última medição |
| RNF14 | Rastreabilidade | Toda mudança em `main` passa por PR com CI verde | 0 pushes diretos | proteção de branch nos 4 repositórios | GitHub | ✅ |

Os thresholds dos monitores em [observability/README.md](../observability/README.md) derivam das metas desta tabela. Quando o grupo alterar uma meta, o monitor correspondente muda junto.

---

## 🔗 Relacionados

- [Componentes](./componentes.md)
- [Observabilidade](../observability/README.md)
- [ADR 005 — HPA](../adr/005-uso-de-hpa.md)
- [ADR 006 — Observabilidade](../adr/006-stack-de-observabilidade.md)
- [Modelo de dados](./modelo-de-dados.md)
