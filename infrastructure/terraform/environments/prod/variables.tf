variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "online-store"
}

variable "service_names" {
  description = "List of all service names"
  type        = list(string)
  default     = ["web", "auth-service", "user-service", "product-service", "order-service", "notification-service"]
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
}

variable "github_repository" {
  description = "GitHub repository in org/repo format for OIDC trust"
  type        = string
}

variable "alb_services" {
  description = "ALB routing configuration per service"
  type = list(object({
    name              = string
    port              = number
    path_patterns     = list(string)
    priority          = number
    health_check_path = string
  }))
}

variable "ecs_services" {
  description = "ECS service configurations"
  type = map(object({
    cpu           = number
    memory        = number
    desired_count = number
    max_count     = number
  }))
}
