# ADR 002 — Envio de e-mail com Resend


| Campo  | Valor      |
| ------ | ---------- |
| Data   | 01/06/2026 |
| Status | Aceita     |


## 📌 Contexto

A Oficina Mecânica API precisa notificar stakeholders por e-mail quando eventos relevantes ocorrem no fluxo de ordens de serviço (por exemplo, avisos a mecânicos, à administração ou ao cliente). Para o Tech Challenge, o requisito é demonstrar esse comportamento de ponta a ponta, sem montar uma infraestrutura completa de e-mail de produção (filas, bounce handling, etc.).

O time já organiza o módulo de notificações sob influência de Clean/Hexagonal Architecture: a aplicação depende de um port (`NotificacaoPort`), e a infraestrutura pluga um adapter concreto. Era necessário escolher um provedor simples o bastante para entregar a demo rapidamente, sem travar a evolução futura para um provedor cloud mais maduro.

## ✅ Decisão

Adotamos o **Resend** como provedor de envio de e-mail **para o momento atual do projeto** — abordagem prática e mínima para o Tech Challenge.

Na prática:

- `ResendNotificacaoAdapter` implementa `NotificacaoPort` e chama a API do Resend.
- Configuração via variáveis de ambiente (`RESEND_API_KEY`, `RESEND_FROM`, destinatários internos de notificação).
- Com remetente configurado em domínio verificado no Resend, o sistema envia para qualquer destinatário válido (cliente, mecânicos, admin), o que cobre o fluxo real das notificações da OS.
- Opcionalmente, `RESEND_DEV_REDIRECT_TO` pode redirecionar todos os e-mails para uma caixa de teste; quando omitido, a mensagem segue para o destinatário original.

Esta decisão **não** fixa o Resend como solução definitiva de produção. O port de notificação permanece a fronteira estável; no futuro, um adapter para soluções da **AWS** (por exemplo SES, eventualmente com SNS/SQS) pode substituir o Resend sem alterar os casos de uso que disparam e-mail.

## 📊 Consequências

### 👍 Positivas

- Entrega rápida do requisito de notificação no Tech Challenge, com API simples e SDK Node.
- Fluxo demonstrável de ponta a ponta: a API dispara e o destinatário recebe o e-mail.
- Troca futura de provedor fica localizada no adapter; domínio de negócio e application continuam acoplados só a `NotificacaoPort`.
- Redirect opcional em testes evita envios indesejados quando ainda se está validando templates.

### 👎 Negativas / trade-offs

- Dependência de serviço SaaS externo e de chave de API (não versionar segredos).
- Reputação de entrega e filtros de spam do provedor do destinatário (Outlook, Gmail, etc.) ficam fora do controle da aplicação.
- Compliance avançado de produção (filas, bounce, unsubscribe, políticas de domínio) não é o foco desta escolha básica.
- Produção futura na AWS exigirá nova ADR (ou revisão desta) ao adotar SES ou equivalente.

## 🔀 Alternativas consideradas


| Alternativa                                  | Por que não foi escolhida agora                                                                                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AWS SES (e ecossistema AWS)**              | Adequado a produção e alinhado a um possível deploy na AWS; exige mais setup (identidade, sandbox, IAM, observabilidade). Fica como caminho natural de evolução, não como bloco obrigatório do Tech Challenge. |
| **SMTP genérico (Nodemailer + Gmail/outro)** | Funciona para testes; credenciais e limites de provedores pessoais são frágeis para demo reproduzível e documentação do entregável.                                                                            |
| **Apenas log / stub sem envio real**         | Simplifica ainda mais o código, mas não permite evidenciar o requisito de notificação por e-mail na entrega.                                                                                                   |
| **SendGrid / Mailgun / similares**           | Comparáveis ao Resend em praticidade; Resend foi escolhido por simplicidade de onboarding e encaixe rápido no adapter atual.                                                                                   |


