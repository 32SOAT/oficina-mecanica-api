# 📦 Entrega

Artefatos e links da entrega.

---

## 📋 Pedido no PDF do portal

| Item | Link / valor |
| ---- | ------------ |
| ☁️ **Desenho da arquitetura** (EKS, RDS, ECR, etc.) | [docs/deployment/README.md](../deployment/README.md) |
| 🧱 **Arquitetura da aplicação** | [docs/architecture/README.md](../architecture/README.md) |
| 🎬 **Vídeo demonstrativo** (YouTube, até 15 min) | _cole o link do vídeo_ |

### 📘 API (Swagger)

| Ambiente | URL |
| -------- | --- |
| 💻 Local | http://localhost:3000/api |

### ✉️ Envio de e-mail (Resend)

Notificações reais com remetente `notificacoes@fiap.tech` ([configuração](../build/README.md)):

**Mecânicos** — ordem recebida (`RECEBIDA`):

![E-mail mecânicos — OS recebida](./email-mecanicos-recebida.png)

**Mecânicos** — aguardando serviço (`AGUARDANDO_SERVICO`):

![E-mail mecânicos — aguardando serviço](./email-mecanicos-aguardando-servico.png)

**Cliente** — orçamento aguardando aprovação (`R$ 250,00`):

![E-mail cliente — orçamento](./email-cliente-orcamento.png)

**Cliente** — caixa de entrada (orçamento + serviço finalizado):

![E-mail cliente — caixa de entrada](./email-cliente-caixa.png)

### 🧪 Print dos testes e análises

Cobertura de testes (`npm run test:cov`):

![Cobertura de testes](./cobertura-testes.png)

SonarQube (Overall Code) — Coverage: **91.0%** · Duplications: **0.0%** ([como rodar](../analysis/README.md)):

![SonarQube Overall Code](./sonar-overall.png)

OWASP ZAP (DAST) — High: 0 · Medium: 0 · Low: 3 · Informational: 4 ([como rodar](../analysis/README.md)):

![Relatório OWASP ZAP](./zap-scan.png)

---

## ➕ Complemento

| Item | Link |
| ---- | ---- |
| 🧩 **Miro** — documentações adicionais (domain storytelling, event-driven) | https://miro.com/app/board/uXjVGupYixo=/?share_link_id=890608508965 |

---

## 📚 Onde está o restante

Índice completo da documentação: **[README do projeto](../../README.md)**.
