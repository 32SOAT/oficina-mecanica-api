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
| RF7 | Transições de status da OS com histórico | `historico_status_os` | 🟡 histórico pode se perder ([ADR 004](../adr/004-padrao-de-comunicacao.md)) |
| RF8 | Notificação por e-mail nas mudanças de status | `ResendNotificacaoAdapter` | ✅ |
| RF9 | Cadastros de clientes, veículos, serviços, estoque, usuários | módulos correspondentes | ✅ |
| RF10 | Dashboards de volume diário de OS, tempo por status e erros de integração | Datadog | ⏳ |

---

## 📐 Requisitos não funcionais

| # | Atributo | Requisito | Meta (SLO) | Indicador (SLI) | Como medir | Estado |
| --- | -------- | --------- | ---------- | --------------- | ---------- | ------ |
| RNF1 | Disponibilidade | API acessível pelo Gateway | 99,5% ao mês (a validar) | Synthetic `GET /api/v1/health` a cada 5 min | Datadog Synthetics | ⏳ |
| RNF2 | Latência | Rotas de leitura respondem rápido | p95 < 400 ms, p99 < 800 ms (a validar) | `trace.express.request.duration` por rota | Datadog APM | ⏳ |
| RNF3 | Latência da autenticação | `POST /auth/cpf` | p95 < 1 s incluindo cold start (a validar) | `aws.lambda.duration` | Integração AWS | ⏳ |
| RNF4 | Escalabilidade | API escala sob carga sem intervenção | de 2 a 3 réplicas com CPU média acima de 70% | réplicas do HPA, `kubernetes.cpu.usage.total` | `kubectl get hpa`, Datadog | 🟡 HPA existe com piso 1 |
| RNF5 | Deploy sem indisponibilidade | Rollout não derruba a API | 0 requisições com 5xx durante o rollout | taxa de 5xx no minuto do deploy | APM | ⏳ `Recreate` ainda ativo |
| RNF6 | Taxa de erro | Erros do servidor | < 1% de 5xx em 5 min (a validar) | `trace.express.request.hits` por status | APM | ⏳ |
| RNF7 | Consistência | Toda transição de status tem linha de histórico | 0 OS divergentes | custom query no Postgres | Monitor "Histórico divergente" | ⏳ corrida conhecida |
| RNF8 | Observabilidade | Logs JSON com correlação ponta a ponta | 100% das requisições com `correlationId` em Gateway, Lambda e Nest | busca por `@correlationId` | Datadog Logs | 🟡 Nest e Lambda; Gateway pendente |
| RNF9 | Segurança | Token de cliente não alcança rota administrativa | 0 rotas administrativas acessíveis com `role: cliente` | teste automatizado do `RolesGuard` | `npm test` | ✅ |
| RNF9a | Segurança | Cliente só acessa as próprias OS (autorização por recurso) | 0 OS de outro cliente acessível pelo UUID | teste de integração comparando `sub` com `os.cliente_id` | `npm test` | ⏳ IDOR conhecido ([ADR 003](../adr/003-auth-cliente-lambda-jwt-role.md)) |
| RNF9b | Segurança | `POST /auth/cpf` não permite enumerar CPFs | throttling no Gateway (a validar: 10 req/min por IP) | `aws.apigateway.count` por IP, 429 | Integração AWS | ⏳ sem rate limiting ([RFC 003](../rfc/003-estrategia-de-autenticacao.md)) |
| RNF10 | Segurança | Banco sem exposição pública, criptografado em repouso | `publicly_accessible = false`, `storage_encrypted = true` | Terraform | `terraform plan` | ✅ |
| RNF11 | Segurança | Segredos fora do código | 0 segredos em arquivos versionados | GitHub Secrets, Kubernetes Secret | revisão de PR | 🟡 `db_password` em variável Terraform |
| RNF12 | Recuperação | Backup automático do banco | retenção de 7 dias (a validar) | `backup_retention_period` | Terraform | 🟡 variável existe, valor não fixado |
| RNF13 | Manutenibilidade | Cobertura de testes | ≥ 80% de linhas | `npm run test:cov` | SonarQube, CI | ✅ 91% na última medição |
| RNF14 | Rastreabilidade | Toda mudança em `main` passa por PR com CI verde | 0 pushes diretos | proteção de branch | GitHub | ⏳ |

Os thresholds dos monitores em [observability/README.md](../observability/README.md) derivam das metas desta tabela. Quando o grupo alterar uma meta, o monitor correspondente muda junto.

---

## 🔗 Relacionados

- [Componentes](./componentes.md)
- [Observabilidade](../observability/README.md)
- [ADR 005 — HPA](../adr/005-uso-de-hpa.md)
- [ADR 006 — Observabilidade](../adr/006-stack-de-observabilidade.md)
- [Modelo de dados](./modelo-de-dados.md)
