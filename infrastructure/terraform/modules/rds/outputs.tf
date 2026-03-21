output "db_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "database_url_secret_arns" {
  description = "Map of service name to Secrets Manager ARN for DATABASE_URL"
  value       = { for k, v in aws_secretsmanager_secret.database_urls : k => v.arn }
}
