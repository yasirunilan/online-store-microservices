variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for the ALB"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for the ALB"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (empty string to skip HTTPS)"
  type        = string
  default     = ""
}

variable "services" {
  description = "List of services with routing configuration"
  type = list(object({
    name              = string
    port              = number
    path_patterns     = list(string)
    priority          = number
    health_check_path = string
  }))
}

variable "default_target" {
  description = "Default target (web frontend) — receives all requests that don't match a service path pattern"
  type = object({
    name              = string
    port              = number
    health_check_path = string
  })
  default = null
}
