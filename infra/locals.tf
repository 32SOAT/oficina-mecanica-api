data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  name_prefix  = "${var.project_name}-${var.environment}"
  cluster_name = local.name_prefix
  azs          = slice(data.aws_availability_zones.available.names, 0, var.az_count)

  public_subnet_cidrs = [
    for index in range(var.az_count) : cidrsubnet(var.vpc_cidr, 4, index)
  ]

  private_subnet_cidrs = [
    for index in range(var.az_count) : cidrsubnet(var.vpc_cidr, 4, index + var.az_count)
  ]

  database_subnet_cidrs = [
    for index in range(var.az_count) : cidrsubnet(var.vpc_cidr, 4, index + (var.az_count * 2))
  ]

  nat_gateway_count = var.single_nat_gateway ? 1 : var.az_count

  common_tags = merge(var.tags, {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  })

  subnet_cluster_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
  }

  api_labels = {
    "app.kubernetes.io/name"     = var.api_name
    "app.kubernetes.io/instance" = local.name_prefix
    "app.kubernetes.io/part-of"  = var.project_name
  }

  api_image = trimspace(var.api_image) != "" ? var.api_image : "${aws_ecr_repository.api.repository_url}:${var.api_image_tag}"
}
