# 📄 Request for Comments (RFCs)

Propostas técnicas submetidas ao grupo antes de virarem decisão.

## 🔀 RFC ou ADR?

| | RFC | ADR |
| --- | --- | --- |
| Quando | Antes de decidir | Depois de decidir |
| Pergunta | Qual caminho seguir? | Que caminho seguimos e por quê? |
| Alternativas | Em avaliação, com critérios | Descartadas, com justificativa |
| Ciclo de vida | Rascunho → Aberta para comentários → Revisada → Encerrada (Aprovada ou Rejeitada) | Proposta → Aceita → Substituída ou Depreciada |
| Editável | Sim, enquanto aberta | Não. Mudou? Escreve-se outra ADR |

A RFC mostra o processo, a ADR registra o resultado. Uma RFC rejeitada continua útil: evita que a mesma proposta volte sem argumento novo.

## 📑 Índice

| RFC | Título | Status | Resultado |
| --- | ------ | ------ | --------- |
| [001](./001-escolha-da-nuvem.md) | Escolha do provedor de nuvem | Encerrada — Aprovada | AWS |
| [002](./002-banco-de-dados-gerenciado.md) | Banco de dados gerenciado | Encerrada — Aprovada | Amazon RDS PostgreSQL |
| [003](./003-estrategia-de-autenticacao.md) | Estratégia de autenticação | Encerrada — Aprovada | [ADR 003](../adr/003-auth-cliente-lambda-jwt-role.md) |
| [004](./004-stack-de-observabilidade.md) | Stack de observabilidade | Encerrada — Aprovada | Datadog ([ADR 006](../adr/006-stack-de-observabilidade.md)) |
| [005](./005-segregacao-de-repositorios.md) | Segregação de repositórios | Encerrada — Aprovada | Terraform em repositórios próprios ([ADR 007](../adr/007-terraform-do-banco-com-descoberta-via-data-sources.md) e [ADR 008](../adr/008-plataforma-por-ambiente-com-contratos-ssm.md)) |

As RFCs 001 a 003 foram escritas em setembro de 2026 a partir das decisões já implementadas. A arquitetura e a divisão de responsabilidades foram fechadas em reunião do grupo em 25/08/2026; a RFC 003 leva a data da ADR 003, decidida antes. Cada uma declara isso no cabeçalho.

## 📝 Estrutura

1. Metadados: número, data, status, autores
2. Sumário: a proposta em um parágrafo
3. Motivação: o problema e por que decidir agora
4. Requisitos: o que a solução precisa atender
5. Critérios de avaliação: como as alternativas são comparadas
6. Alternativas avaliadas: cada uma contra os critérios
7. Proposta: a recomendação e sua justificativa
8. Questões em aberto: o que a RFC não resolve
9. Resultado: decisão e ADR gerada, preenchido ao encerrar

## 🔗 Relacionados

- [ADRs](../adr/README.md)
- [Índice da documentação](../README.md)
- [Componentes](../architecture/componentes.md)
