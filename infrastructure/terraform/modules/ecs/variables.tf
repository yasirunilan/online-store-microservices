variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "ecs_security_group_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "redis_security_group_id" {
  description = "Security group ID for Redis"
  type        = string
}

variable "alb_target_group_arns" {
  description = "Map of service name to ALB target group ARN"
  type        = map(string)
}

variable "ecr_repository_urls" {
  description = "Map of service name to ECR repository URL"
  type        = map(string)
}

variable "database_url_secret_arns" {
  description = "Map of service name to Secrets Manager ARN for DATABASE_URL"
  type        = map(string)
}

variable "sqs_queue_urls" {
  description = "Map of event pattern to SQS queue URL"
  type        = map(string)
}

variable "sqs_queue_arns" {
  description = "Map of event pattern to SQS queue ARN"
  type        = map(string)
}

variable "capacity_provider" {
  description = "ECS capacity provider (FARGATE or FARGATE_SPOT)"
  type        = string
  default     = "FARGATE"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "enable_autoscaling" {
  description = "Enable ECS auto-scaling"
  type        = bool
  default     = false
}

variable "redis_num_cache_clusters" {
  description = "Number of cache clusters (nodes) in the Redis replication group"
  type        = number
  default     = 1
}

variable "services" {
  description = "Map of service configurations"
  type = map(object({
    cpu           = number
    memory        = number
    desired_count = number
    max_count     = number
  }))
}
