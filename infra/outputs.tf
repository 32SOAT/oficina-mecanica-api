output "aws_region" {
  description = "Regiao AWS usada."
  value       = var.aws_region
}

output "vpc_id" {
  description = "ID da VPC criada."
  value       = aws_vpc.this.id
}

output "cluster_name" {
  description = "Nome do cluster EKS."
  value       = aws_eks_cluster.this.name
}

output "cluster_endpoint" {
  description = "Endpoint da API Kubernetes do EKS."
  value       = aws_eks_cluster.this.endpoint
}

output "kubeconfig_command" {
  description = "Comando para configurar kubectl localmente."
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.this.name}"
}

output "ecr_repository_url" {
  description = "URL do repositorio ECR da API."
  value       = aws_ecr_repository.api.repository_url
}

output "api_image" {
  description = "Imagem padrao da API no ECR."
  value       = local.api_image
}

output "kubernetes_namespace" {
  description = "Namespace Kubernetes da API."
  value       = var.kubernetes_namespace
}

output "api_service_name" {
  description = "Nome do Service Kubernetes da API."
  value       = var.api_name
}

output "project_name" {
  description = "Nome do projeto usado nos labels Kubernetes."
  value       = var.project_name
}

output "app_instance" {
  description = "Identificador da instancia da aplicacao no ambiente."
  value       = local.name_prefix
}

output "api_container_port" {
  description = "Porta HTTP exposta pelo container da API."
  value       = var.api_container_port
}

output "postgres_endpoint" {
  description = "Endpoint privado do RDS Postgres."
  value       = aws_db_instance.postgres.endpoint
}

output "postgres_address" {
  description = "Endereco privado do RDS Postgres, sem porta."
  value       = aws_db_instance.postgres.address
}
