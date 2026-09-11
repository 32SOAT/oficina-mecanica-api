# RFC 002 — Banco de dados gerenciado

| Campo | Valor |
| ----- | ----- |
| Número | 002 |
| Data | 25/08/2026 |
| Status | ✅ Encerrada — Aprovada |
| Autores | Gustavo de Matos Parizi |
| Resultado | Amazon RDS for PostgreSQL |

> 📅 **Documento reconstruído em 09/2026.** A arquitetura e a divisão de responsabilidades foram definidas pelo grupo em 25/08/2026; a implementação aconteceu em datas diferentes por pessoa. O histórico do Git é a referência oficial.

## 📄 Sumário

Proposta de migração do PostgreSQL para **Amazon RDS**, em subnets isoladas sem acesso público, com criptografia em repouso e acesso restrito ao security group do cluster EKS.

## 📌 Motivação

A [ADR 001](../adr/001-escolha-do-banco-de-dados.md) já decidiu **modelo relacional e PostgreSQL**. Esta RFC não reabre essa decisão. A pergunta aqui é diferente: **onde o PostgreSQL roda em produção**.

Em desenvolvimento o banco sobe via Docker Compose. Isso não atende os requisitos da fase:

- Backup automatizado e recuperação a ponto no tempo
- Patching de segurança sem intervenção manual
- Alta disponibilidade com failover
- Isolamento de rede auditável
- Criptografia em repouso

Há ainda um problema arquitetural. A [ADR 005](../adr/005-uso-de-hpa.md) adota HPA para escalar a API. Colocar o banco como pod no mesmo cluster misturaria estado persistente com carga stateless no mesmo plano de escala. Scale-down ou despejo de nó atingiriam o banco.

Existe também consumidor externo ao cluster: a Lambda de autenticação consulta a tabela `cliente` diretamente ([ADR 004](../adr/004-padrao-de-comunicacao.md)). Um banco interno ao EKS exigiria expor um Service para fora do cluster.

## 📋 Requisitos

| # | Requisito |
| --- | --------- |
| R1 | PostgreSQL, conforme ADR 001 |
| R2 | Backup automatizado com retenção configurável |
| R3 | Sem exposição pública |
| R4 | Criptografia em repouso |
| R5 | Acessível pelo EKS e pela Lambda em VPC |
| R6 | Provisionável por Terraform |
| R7 | Caminho para alta disponibilidade sem redesenho |
| R8 | Custo compatível com ambiente acadêmico |

## ⚖️ Critérios de avaliação

1. Cobertura de R1 a R7
2. Esforço operacional da equipe
3. Custo no ambiente disponível
4. Compatibilidade com TypeORM e migrations existentes
5. Previsibilidade em laboratório com sessões de duração limitada

## 🔀 Alternativas avaliadas

### Amazon RDS for PostgreSQL

Serviço gerenciado padrão. Backup automático, snapshots, patching, failover Multi-AZ opcional, criptografia com KMS, métricas no CloudWatch.

Compatível com TypeORM sem qualquer adaptação: é PostgreSQL.

| Requisito | Como atende |
| --------- | ----------- |
| R2 | `backup_retention_period` configurável |
| R3 | `publicly_accessible = false`, subnets sem rota padrão |
| R4 | `storage_encrypted = true` |
| R5 | Security group aceita ingress apenas do SG do cluster EKS |
| R6 | `aws_db_instance`, recurso maduro |
| R7 | `multi_az` é mudança de flag, sem redesenho |
| R8 | `db.t4g.micro` cabe no orçamento acadêmico |

**Contrapontos.** Sem acesso ao sistema de arquivos nem a extensões que exijam superusuário. Escala vertical exige janela de manutenção.

### Amazon Aurora PostgreSQL

Storage distribuído em três AZs, failover mais rápido, réplicas de leitura com baixo lag.

Não escolhido: custo mínimo significativamente maior que `db.t4g.micro`, e os ganhos (throughput alto, muitas réplicas) não são exercitados por uma aplicação com 3 réplicas de API no teto. Superdimensionado para o escopo.

Aurora Serverless v2 foi considerado pela escala automática, mas tem custo mínimo por ACU que não se paga com carga intermitente de laboratório.

### PostgreSQL em pod no EKS

Já existe no overlay de Minikube (`k8s/overlays/minikube/postgres.yaml`) para desenvolvimento local.

Não escolhido para nuvem. Além do custo operacional (backup, patching e failover viram responsabilidade da equipe), há a incompatibilidade estrutural com o HPA: estado persistente e carga stateless no mesmo plano de escala. Um `StatefulSet` com `PersistentVolumeClaim` mitiga parte disso, mas transfere ao grupo justamente o trabalho que a fase pede para delegar.

### PostgreSQL em EC2 autogerenciado

Controle total, incluindo extensões e tuning de sistema operacional. Custo de instância menor que RDS equivalente.

Não escolhido: tudo que o RDS automatiza vira script mantido pela equipe. Não há requisito que justifique o controle adicional.

### Serviço externo (Neon, Supabase, ElephantSQL)

Provisionamento rápido, camada gratuita, Postgres real.

Não escolhido: tráfego sairia da VPC para a internet, quebrando R3 na prática. Adiciona provedor fora do Terraform da AWS e latência entre aplicação e banco.

## 📊 Comparação

| Critério | RDS | Aurora | Pod no EKS | EC2 | Externo |
| -------- | --- | ------ | ---------- | --- | ------- |
| Backup automático | ✅ | ✅ | ❌ | ❌ | ✅ |
| Sem exposição pública | ✅ | ✅ | ✅ | ✅ | ❌ |
| Esforço operacional | ✅ Baixo | ✅ Baixo | ❌ Alto | ❌ Alto | ✅ Baixo |
| Custo acadêmico | ✅ | ❌ | ✅ | 🟡 | ✅ |
| Compatível com HPA | ✅ | ✅ | ❌ | ✅ | ✅ |
| Caminho para HA | ✅ Flag | ✅ Nativo | ❌ | ❌ | 🟡 |

## ✅ Proposta

Adotar **Amazon RDS for PostgreSQL**, com:

```hcl
storage_encrypted      = true
publicly_accessible    = false
db_subnet_group_name   = aws_db_subnet_group.postgres.name
vpc_security_group_ids = [aws_security_group.postgres.id]
auto_minor_version_upgrade = true
```

Security group com **um único ingress**, restrito ao security group do cluster EKS. Subnets de banco sem rota padrão: o RDS não tem caminho de saída nem de entrada pela internet.

Parâmetros expostos como variáveis: `db_instance_class` (padrão `db.t4g.micro`), `db_allocated_storage` (20 GB, autoescalável), `db_multi_az` (padrão `false`), `db_backup_retention_period`, `db_deletion_protection`.

Docker Compose permanece em desenvolvimento local. Migrations TypeORM são as mesmas nos dois ambientes, executadas por Job no cluster.

## ❓ Questões em aberto

| Questão | Encaminhamento |
| ------- | -------------- |
| Multi-AZ na demonstração? | Custo aproximadamente dobra. Habilitar apenas na janela do vídeo, ou justificar `false` |
| Senha do banco está em `var.db_password`, em variável Terraform | Migrar para Secrets Manager ou SSM Parameter Store. Aparece também nas variáveis de ambiente da Lambda |
| `db.t4g.micro` aguenta 3 réplicas de API mais Lambda? | Cada réplica abre pool próprio. Avaliar RDS Proxy ou PgBouncer antes de elevar `maxReplicas` |
| Retenção de backup adequada? | Definir e documentar antes da entrega |
| `POSTGRES_SSL_REJECT_UNAUTHORIZED = "0"` na Lambda | Desabilita verificação de certificado. Rever com o CA bundle do RDS |

As duas últimas linhas são as mais relevantes para segurança e deveriam ser resolvidas antes da entrega final.

## 🏁 Resultado

**Encerrada — Aprovada.** Implementada no Terraform de `oficina-mecanica-infra-db` ([RFC 005](./005-segregacao-de-repositorios.md)).

## 🔗 Relacionados

- [ADR 001 — Escolha do banco de dados](../adr/001-escolha-do-banco-de-dados.md)
- [RFC 001 — Escolha da nuvem](./001-escolha-da-nuvem.md)
- [Modelo de dados](../architecture/modelo-de-dados.md)
- [Componentes](../architecture/componentes.md)
