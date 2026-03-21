variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "services" {
  description = "List of service names to create ECR repositories for"
  type        = list(string)
}

variable "image_retention_count" {
  description = "Number of tagged images to retain"
  type        = number
  default     = 10
}
