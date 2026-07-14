# ADR 001 — Escolha do banco de dados


| Campo  | Valor      |
| ------ | ---------- |
| Data   | 25/03/2026 |
| Status | Aceita     |


## Contexto

O domínio de uma oficina mecânica não é um conjunto de registros isolados: existe uma malha de dependências que o sistema precisa respeitar. Um cliente possui veículos; cada ordem de serviço está ligada a um veículo; os itens da ordem apontam para serviços cadastrados ou para linhas de estoque; o histórico de status precisa estar sempre associado à ordem correta. Ou seja, o negócio é naturalmente estruturado em entidades e relacionamentos — exatamente o que o modelo relacional descreve com tabelas, chaves e integridade referencial.

Além disso, operações de oficina costumam exigir várias escritas coordenadas (abrir item na OS, atualizar quantidade reservada no estoque, registrar mudança de status no histórico). Se uma etapa falhar no meio, o sistema não pode ficar “meio atualizado”. O MVP também precisa responder perguntas de negócio relacionais por natureza (total por período, ordens em aberto por status, consumo de peças, histórico de uma OS) e evoluir o schema de forma controlada, com migrações versionadas junto ao código.

Diante disso, a equipe precisava escolher o tipo de persistência e o SGBD que sustentariam o monólito modular da Oficina Mecânica API.

## Decisão

Adotamos um **banco de dados relacional**, especificamente o **PostgreSQL**, como persistência principal da aplicação.

Em um SGBDR, o schema declara quem pode referenciar quem: chaves estrangeiras impedem, por exemplo, uma ordem de serviço órfã (sem veículo) ou um item apontando para um serviço que não existe. Restrições de unicidade (como documento do cliente ou placa do veículo) evitam duplicidade que geraria confusão operacional. Isso reduz a quantidade de validações “só na aplicação” e diminui o risco de dois caminhos de código divergirem sobre a mesma regra.

Bancos relacionais oferecem transações **ACID** (atomicidade, consistência, isolamento, durabilidade): ou tudo que pertence àquela operação é confirmado, ou nada é — o que é essencial para integridade em um MVP que pretende crescer para cenários reais.

**PostgreSQL** em particular foi escolhido por ser robusto, open source e amplamente adotado: bom desempenho para cargas típicas de sistema administrativo, recursos sólidos de tipos (incluindo UUID, NUMERIC, timestamps com fuso) e ecossistema compatível com Docker, nuvem e ferramentas de backup. Quando surgir necessidade de algo menos estruturado em um ponto específico, o Postgres ainda oferece tipos como JSON/JSONB para casos pontuais sem abandonar o modelo relacional como base.

Na prática, a decisão se materializa com TypeORM, migrações versionadas neste repositório e PostgreSQL em desenvolvimento (Docker) e em ambientes de deploy.

## Consequências

### Positivas

- Integridade referencial e unicidade ficam no banco, alinhadas ao domínio (cliente ↔ veículo ↔ OS ↔ itens ↔ estoque/serviços).
- Transações ACID cobrem fluxos que atualizam vários agregados de uma vez (OS, estoque, histórico).
- SQL facilita relatórios e consultas analíticas sem reimplementar agregações em código para cada caso.
- Migrações versionadas permitem evoluir o schema com revisão em pull request e histórico claro do que mudou no banco.
- PostgreSQL oferece flexibilidade pontual (JSON/JSONB) sem trocar o modelo base.
- Boa disponibilidade de documentação, operators e serviços gerenciados em nuvem.

### Negativas / trade-offs

- Schema e migrações exigem disciplina: mudanças de modelo passam por versionamento e revisão, o que é mais rígido que documentos sem schema.
- Escalabilidade horizontal e modelagem altamente desnormalizada (típicas de alguns NoSQL) não são o foco; para este MVP administrativo, a prioridade é consistência e clareza de relacionamentos.
- A equipe precisa manter conhecimento de SQL/TypeORM e cuidar de índices e planos de consulta conforme o volume crescer.

## Alternativas consideradas


| Alternativa                            | Por que não foi escolhida                                                                                                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **MongoDB (ou outro document store)**  | Adequado a documentos flexíveis e pouco acoplados; no domínio da oficina, relacionamentos e regras de integridade são centrais — sem FKs nativas, boa parte da consistência cairia só na aplicação.                      |
| **MySQL / MariaDB**                    | Também relacionais e viáveis; PostgreSQL foi preferido por tipagem mais rica (UUID, NUMERIC, JSONB, timestamptz), maturidade no ecossistema Node/Nest e adequação a deploy com Docker/Kubernetes já adotados no projeto. |
| **SQLite**                             | Simples para protótipos locais, mas limitado para concorrência, ambientes multi-container e cenários próximos de produção que o MVP pretende alcançar.                                                                   |
| **Banco em memória / apenas arquivos** | Insuficiente para durabilidade, backup, relatórios e consistência ACID exigidos pelo domínio.                                                                                                                            |


