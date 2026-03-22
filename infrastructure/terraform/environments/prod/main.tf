# -----------------------------------------------------------------------------
# Prod Environment — module wiring
# -----------------------------------------------------------------------------

# --- Networking ---

module "vpc" {
  source = "../../modules/vpc"

  environment        = var.environment
  project_name       = var.project_name
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b"]
  single_nat_gateway = false
}

# --- Container Registry ---

module "ecr" {
  source = "../../modules/ecr"

  project_name          = var.project_name
  services              = var.service_names
  image_retention_count = 10
}

# --- Database ---

module "rds" {
  source = "../../modules/rds"

  environment             = var.environment
  project_name            = var.project_name
  subnet_ids              = module.vpc.private_subnet_ids
  security_group_id       = module.vpc.rds_security_group_id
  instance_class          = "db.t4g.small"
  allocated_storage       = 50
  multi_az                = true
  backup_retention_period = 30
}

# --- Message Queues ---

module "sqs" {
  source = "../../modules/sqs"

  environment  = var.environment
  project_name = var.project_name
}

# --- Load Balancer ---

module "alb" {
  source = "../../modules/alb"

  environment       = var.environment
  project_name      = var.project_name
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  security_group_id = module.vpc.alb_security_group_id
  certificate_arn   = var.certificate_arn
  services          = var.alb_services
  default_target = {
    name              = "web"
    port              = 3000
    health_check_path = "/api/health"
  }
}

# --- ECS Cluster & Services ---

module "ecs" {
  source = "../../modules/ecs"

  environment              = var.environment
  project_name             = var.project_name
  aws_region               = var.aws_region
  vpc_id                   = module.vpc.vpc_id
  private_subnet_ids       = module.vpc.private_subnet_ids
  ecs_security_group_id    = module.vpc.ecs_security_group_id
  redis_security_group_id  = module.vpc.redis_security_group_id
  alb_target_group_arns    = module.alb.target_group_arns
  alb_dns_name             = module.alb.alb_dns_name
  ecr_repository_urls      = module.ecr.repository_urls
  database_url_secret_arns = module.rds.database_url_secret_arns
  sqs_queue_urls           = module.sqs.queue_urls
  sqs_queue_arns           = module.sqs.queue_arns
  capacity_provider        = "FARGATE"
  log_retention_days       = 90
  enable_autoscaling       = true
  redis_num_cache_clusters = 2
  services                 = var.ecs_services
}

# -----------------------------------------------------------------------------
# GitHub Actions OIDC + Deploy Role
# -----------------------------------------------------------------------------

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = {
    Name = "github-actions-oidc"
  }
}

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "github_actions_deploy" {
  name = "${var.project_name}-${var.environment}-github-actions-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:*"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-github-actions-deploy"
  }
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  name = "deploy-permissions"
  role = aws_iam_role.github_actions_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition",
          "ecs:DeregisterTaskDefinition"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project_name}/${var.environment}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = module.ecs.execution_role_arn
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "alb_dns_name" {
  value = module.alb.alb_dns_name
}

output "ecr_repository_urls" {
  value = module.ecr.repository_urls
}

output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}

output "redis_endpoint" {
  value = module.ecs.redis_endpoint
}

output "rds_endpoint" {
  value = module.rds.db_instance_endpoint
}

output "github_actions_role_arn" {
  value = aws_iam_role.github_actions_deploy.arn
}
