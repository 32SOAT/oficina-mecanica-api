data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_iam_roles" "eks_cluster" {
  count      = var.use_existing_eks_iam_roles ? 1 : 0
  name_regex = "LabEksClusterRole"
}

data "aws_iam_roles" "eks_node" {
  count      = var.use_existing_eks_iam_roles ? 1 : 0
  name_regex = "LabEksNodeRole"
}

locals {
  name_prefix  = "${var.project_name}-${var.environment}"
  cluster_name = local.name_prefix
  account_id   = data.aws_caller_identity.current.account_id

  existing_cluster_role_arn = try(tolist(data.aws_iam_roles.eks_cluster[0].arns)[0], "arn:aws:iam::${local.account_id}:role/${var.eks_cluster_role_name}")
  existing_node_role_arn    = try(tolist(data.aws_iam_roles.eks_node[0].arns)[0], "arn:aws:iam::${local.account_id}:role/${var.eks_node_role_name}")

  eks_cluster_role_arn = var.use_existing_eks_iam_roles ? local.existing_cluster_role_arn : aws_iam_role.eks_cluster[0].arn
  eks_node_role_arn    = var.use_existing_eks_iam_roles ? local.existing_node_role_arn : aws_iam_role.eks_node[0].arn
  azs                  = slice(data.aws_availability_zones.available.names, 0, var.az_count)

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
