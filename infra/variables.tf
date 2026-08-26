variable "aws_region" {
  type        = string
  description = "Regiao AWS onde a infraestrutura sera criada."
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  description = "Nome base usado em tags e nomes de recursos."
  default     = "oficina-mecanica"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Use apenas letras minusculas, numeros e hifens em project_name."
  }
}

variable "environment" {
  type        = string
  description = "Ambiente da implantacao."
  default     = "dev"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment))
    error_message = "Use apenas letras minusculas, numeros e hifens em environment."
  }
}

variable "tags" {
  type        = map(string)
  description = "Tags adicionais aplicadas aos recursos AWS."
  default     = {}
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR principal da VPC."
  default     = "10.20.0.0/16"
}

variable "az_count" {
  type        = number
  description = "Quantidade de zonas de disponibilidade usadas para subnets."
  default     = 2

  validation {
    condition     = var.az_count >= 2 && var.az_count <= 3
    error_message = "az_count deve ser 2 ou 3."
  }
}

variable "single_nat_gateway" {
  type        = bool
  description = "Quando true, cria um unico NAT Gateway para reduzir custo em ambientes pequenos."
  default     = true
}

variable "cluster_version" {
  type        = string
  description = "Versao do Kubernetes no EKS. Deixe null para usar a versao padrao da AWS."
  default     = null
}

variable "cluster_endpoint_public_access" {
  type        = bool
  description = "Permite acesso publico ao endpoint da API do Kubernetes."
  default     = true
}

variable "cluster_endpoint_public_access_cidrs" {
  type        = list(string)
  description = "CIDRs autorizados a acessar o endpoint publico do cluster EKS."
  default     = ["0.0.0.0/0"]
}

variable "cluster_enabled_log_types" {
  type        = list(string)
  description = "Logs do control plane do EKS enviados ao CloudWatch."
  default     = []
}

variable "use_existing_eks_iam_roles" {
  type        = bool
  description = "Quando true, nao cria roles IAM e usa as roles ja existentes (AWS Academy)."
  default     = false
}

variable "eks_cluster_role_name" {
  type        = string
  description = "Nome da role IAM do cluster EKS quando use_existing_eks_iam_roles=true."
  default     = "LabEksClusterRole"
}

variable "eks_node_role_name" {
  type        = string
  description = "Nome da role IAM dos nodes EKS quando use_existing_eks_iam_roles=true."
  default     = "LabEksNodeRole"
}

variable "node_instance_types" {
  type        = list(string)
  description = "Tipos de instancia usados pelo node group."
  default     = ["t3.medium"]
}

variable "node_capacity_type" {
  type        = string
  description = "Tipo de capacidade do node group: ON_DEMAND ou SPOT."
  default     = "ON_DEMAND"

  validation {
    condition     = contains(["ON_DEMAND", "SPOT"], var.node_capacity_type)
    error_message = "node_capacity_type deve ser ON_DEMAND ou SPOT."
  }
}

variable "node_desired_size" {
  type        = number
  description = "Quantidade desejada de nodes."
  default     = 2
}

variable "node_min_size" {
  type        = number
  description = "Quantidade minima de nodes."
  default     = 1
}

variable "node_max_size" {
  type        = number
  description = "Quantidade maxima de nodes."
  default     = 3
}

variable "node_disk_size" {
  type        = number
  description = "Tamanho do disco dos nodes, em GiB."
  default     = 30
}

variable "ecr_repository_name" {
  type        = string
  description = "Nome do repositorio ECR da API. Deixe vazio para usar o mesmo nome de api_name."
  default     = ""
}

variable "ecr_force_delete" {
  type        = bool
  description = "Permite destruir o repositorio ECR mesmo com imagens."
  default     = true
}

variable "db_name" {
  type        = string
  description = "Nome do banco Postgres."
  default     = "oficina_mecanica"
}

variable "db_username" {
  type        = string
  description = "Usuario master do Postgres."
  default     = "oficina"
}

variable "db_password" {
  type        = string
  description = "Senha master do Postgres."
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 8
    error_message = "db_password precisa ter pelo menos 8 caracteres."
  }
}

variable "db_port" {
  type        = number
  description = "Porta do Postgres."
  default     = 5432
}

variable "db_instance_class" {
  type        = string
  description = "Classe da instancia RDS."
  default     = "db.t4g.micro"
}

variable "postgres_engine_version" {
  type        = string
  description = "Versao do engine Postgres. Deixe null para usar a versao padrao da AWS."
  default     = null
}

variable "db_storage_type" {
  type        = string
  description = "Tipo de armazenamento do RDS. Use gp2 no AWS Academy."
  default     = "gp3"

  validation {
    condition     = contains(["gp2", "gp3"], var.db_storage_type)
    error_message = "db_storage_type deve ser gp2 ou gp3."
  }
}

variable "db_allocated_storage" {
  type        = number
  description = "Armazenamento inicial do RDS, em GiB."
  default     = 20
}

variable "db_max_allocated_storage" {
  type        = number
  description = "Limite de autoscaling de armazenamento do RDS, em GiB."
  default     = 100
}

variable "db_backup_retention_period" {
  type        = number
  description = "Dias de retencao de backup do RDS."
  default     = 7
}

variable "db_multi_az" {
  type        = bool
  description = "Habilita Multi-AZ para o RDS."
  default     = false
}

variable "db_deletion_protection" {
  type        = bool
  description = "Protege o RDS contra delecao acidental."
  default     = false
}

variable "db_skip_final_snapshot" {
  type        = bool
  description = "Quando true, nao cria snapshot final ao destruir o RDS."
  default     = true
}

variable "db_apply_immediately" {
  type        = bool
  description = "Aplica alteracoes do RDS imediatamente."
  default     = true
}

variable "api_name" {
  type        = string
  description = "Nome do Deployment/Service da API no Kubernetes."
  default     = "fase2-kubernetes-oficina-mecanica-api"

  validation {
    condition     = length(var.api_name) <= 63 && can(regex("^[a-z0-9]([-a-z0-9]*[a-z0-9])?$", var.api_name))
    error_message = "api_name deve ser um nome DNS Kubernetes valido, com no maximo 63 caracteres."
  }
}

variable "api_image" {
  type        = string
  description = "Imagem completa da API. Se vazio, usa o repositorio ECR criado por este Terraform."
  default     = ""
}

variable "api_image_tag" {
  type        = string
  description = "Tag usada quando api_image estiver vazio."
  default     = "latest"
}

variable "api_image_pull_policy" {
  type        = string
  description = "Politica de pull da imagem da API."
  default     = "Always"

  validation {
    condition     = contains(["Always", "IfNotPresent", "Never"], var.api_image_pull_policy)
    error_message = "api_image_pull_policy deve ser Always, IfNotPresent ou Never."
  }
}

variable "api_replicas" {
  type        = number
  description = "Numero de replicas da API."
  default     = 2
}

variable "api_wait_for_rollout" {
  type        = bool
  description = "Quando true, o Terraform aguarda o rollout completo do Deployment da API."
  default     = false
}

variable "api_container_port" {
  type        = number
  description = "Porta HTTP exposta pelo container da API."
  default     = 3000

  validation {
    condition     = var.api_container_port >= 1 && var.api_container_port <= 65535 && floor(var.api_container_port) == var.api_container_port
    error_message = "api_container_port deve ser um inteiro entre 1 e 65535."
  }
}

variable "api_healthcheck_path" {
  type        = string
  description = "Endpoint usado pelos probes de liveness/readiness."
  default     = "/api/v1/health"
}

variable "api_hpa_min_replicas" {
  type        = number
  description = "Quantidade minima de replicas controladas pelo HorizontalPodAutoscaler."
  default     = 1

  validation {
    condition     = var.api_hpa_min_replicas >= 1
    error_message = "api_hpa_min_replicas deve ser maior ou igual a 1."
  }
}

variable "api_hpa_max_replicas" {
  type        = number
  description = "Quantidade maxima de replicas controladas pelo HorizontalPodAutoscaler."
  default     = 3

  validation {
    condition     = var.api_hpa_max_replicas >= var.api_hpa_min_replicas
    error_message = "api_hpa_max_replicas deve ser maior ou igual a api_hpa_min_replicas."
  }
}

variable "api_hpa_target_cpu_utilization_percentage" {
  type        = number
  description = "Percentual medio de uso de CPU alvo do HorizontalPodAutoscaler."
  default     = 70

  validation {
    condition     = var.api_hpa_target_cpu_utilization_percentage >= 1 && var.api_hpa_target_cpu_utilization_percentage <= 100
    error_message = "api_hpa_target_cpu_utilization_percentage deve ficar entre 1 e 100."
  }
}

variable "api_allowed_cidr_blocks" {
  type        = list(string)
  description = "CIDRs que podem acessar o Load Balancer publico da API."
  default     = ["0.0.0.0/0"]
}

variable "api_service_annotations" {
  type        = map(string)
  description = "Annotations extras para o Service LoadBalancer."
  default     = {}
}

variable "api_resource_requests" {
  type = object({
    cpu    = string
    memory = string
  })
  description = "Requests de CPU/memoria do container da API."
  default = {
    cpu    = "100m"
    memory = "256Mi"
  }
}

variable "api_resource_limits" {
  type = object({
    cpu    = string
    memory = string
  })
  description = "Limits de CPU/memoria do container da API."
  default = {
    cpu    = "500m"
    memory = "512Mi"
  }
}

variable "kubernetes_namespace" {
  type        = string
  description = "Namespace Kubernetes da API."
  default     = "oficina-mecanica"
}

variable "node_env" {
  type        = string
  description = "Valor da variavel NODE_ENV da API."
  default     = "production"
}

variable "postgres_sync" {
  type        = string
  description = "Valor da variavel POSTGRES_SYNC da API. Use 0 em ambientes com migrations."
  default     = "0"

  validation {
    condition     = contains(["0", "1"], var.postgres_sync)
    error_message = "postgres_sync deve ser 0 ou 1."
  }
}

variable "postgres_ssl" {
  type        = string
  description = "Valor da variavel POSTGRES_SSL da API. Use 1 quando o RDS exigir conexao criptografada."
  default     = "1"

  validation {
    condition     = contains(["0", "1"], var.postgres_ssl)
    error_message = "postgres_ssl deve ser 0 ou 1."
  }
}

variable "postgres_ssl_reject_unauthorized" {
  type        = string
  description = "Valor da variavel POSTGRES_SSL_REJECT_UNAUTHORIZED da API."
  default     = "0"

  validation {
    condition     = contains(["0", "1"], var.postgres_ssl_reject_unauthorized)
    error_message = "postgres_ssl_reject_unauthorized deve ser 0 ou 1."
  }
}

variable "jwt_secret" {
  type        = string
  description = "Segredo usado para assinar JWTs."
  sensitive   = true

  validation {
    condition     = length(var.jwt_secret) >= 16
    error_message = "jwt_secret precisa ter pelo menos 16 caracteres."
  }
}

variable "jwt_expires_in" {
  type        = string
  description = "Duracao dos JWTs emitidos pela API."
  default     = "1h"
}
