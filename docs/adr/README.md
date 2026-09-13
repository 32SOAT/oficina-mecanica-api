# 📝 Architecture Decision Records (ADRs)

Registro das decisões arquiteturais do projeto. Cada ADR documenta contexto, decisão, consequências e alternativas descartadas.

Propostas ainda em discussão ficam em [docs/rfc](../rfc/README.md). Uma RFC aprovada gera uma ADR; a RFC continua existindo como memória de como se chegou lá.

## 📑 Índice

| ADR | Título | Status | RFC de origem |
| --- | ------ | ------ | ------------- |
| [001](./001-escolha-do-banco-de-dados.md) | Escolha do banco de dados | Aceita | |
| [002](./002-envio-de-email-com-resend.md) | Envio de e-mail com Resend | Aceita | |
| [003](./003-auth-cliente-lambda-jwt-role.md) | Auth de cliente via Lambda (CPF) e JWT com role | Aceita | [RFC 003](../rfc/003-estrategia-de-autenticacao.md) |
| [004](./004-padrao-de-comunicacao.md) | Padrão de comunicação entre componentes | Aceita | |
| [005](./005-uso-de-hpa.md) | Uso de HPA (Horizontal Pod Autoscaler) | Aceita | |
| [006](./006-stack-de-observabilidade.md) | Stack de observabilidade com Datadog | Aceita | [RFC 004](../rfc/004-stack-de-observabilidade.md) |
| [007](./007-terraform-do-banco-com-descoberta-via-data-sources.md) | Terraform do banco em repositório dedicado com descoberta via data sources | Aceita | [RFC 005](../rfc/005-segregacao-de-repositorios.md) |

A instrumentação da ADR 006 está em andamento. O [diagrama de componentes](../architecture/componentes.md) marca em tracejado o que ainda não foi implantado.

## 📐 Formato

Uma ADR registra uma decisão já tomada. Depois de aceita, não se edita: se a decisão mudar, escreve-se outra ADR que substitui a anterior e a antiga recebe o status Substituída.

1. Título: a decisão em uma frase
2. Metadados: data, status, decisores, RFC de origem quando houver
3. Contexto: o problema e as restrições
4. Decisão: o que foi escolhido, em voz ativa
5. Consequências: ganhos e trade-offs
6. Alternativas consideradas: o que foi descartado e por quê
7. Evolução prevista: o que fica para depois, sem fazer parte da decisão

Status possíveis: Proposta, Aceita, Rejeitada, Substituída, Depreciada.

Quando criar uma ADR: escolha de tecnologia central, contrato entre componentes, requisito não funcional (escala, segurança, disponibilidade), mudança de macroestrutura. Quando não criar: versão de biblioteca, ajuste de lint, configuração temporária.

## 🔗 Referências

- [README principal do projeto](../../README.md)
- [Índice da documentação](../README.md)
- [RFCs](../rfc/README.md)
- [Arquitetura](../architecture/README.md)
- [Diagrama de componentes](../architecture/componentes.md)
- [Modelo de dados](../architecture/modelo-de-dados.md)
