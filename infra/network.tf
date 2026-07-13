resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = local.name_prefix
  }
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${local.name_prefix}-igw"
  }
}

resource "aws_subnet" "public" {
  count = var.az_count

  vpc_id                  = aws_vpc.this.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.subnet_cluster_tags, {
    Name                     = "${local.name_prefix}-public-${local.azs[count.index]}"
    Tier                     = "public"
    "kubernetes.io/role/elb" = "1"
  })
}

resource "aws_subnet" "private" {
  count = var.az_count

  vpc_id                  = aws_vpc.this.id
  cidr_block              = local.private_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = false

  tags = merge(local.subnet_cluster_tags, {
    Name                              = "${local.name_prefix}-private-${local.azs[count.index]}"
    Tier                              = "private"
    "kubernetes.io/role/internal-elb" = "1"
  })
}

resource "aws_subnet" "database" {
  count = var.az_count

  vpc_id                  = aws_vpc.this.id
  cidr_block              = local.database_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "${local.name_prefix}-database-${local.azs[count.index]}"
    Tier = "database"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = {
    Name = "${local.name_prefix}-public"
  }
}

resource "aws_route_table_association" "public" {
  count = var.az_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
  count = local.nat_gateway_count

  domain = "vpc"

  tags = {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "this" {
  count = local.nat_gateway_count

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[var.single_nat_gateway ? 0 : count.index].id

  tags = {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.this]
}

resource "aws_route_table" "private" {
  count = var.az_count

  vpc_id = aws_vpc.this.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.this[var.single_nat_gateway ? 0 : count.index].id
  }

  tags = {
    Name = "${local.name_prefix}-private-${local.azs[count.index]}"
  }
}

resource "aws_route_table_association" "private" {
  count = var.az_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table" "database" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${local.name_prefix}-database"
  }
}

resource "aws_route_table_association" "database" {
  count = var.az_count

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}
