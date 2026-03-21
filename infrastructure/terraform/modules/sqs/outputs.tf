output "queue_urls" {
  description = "Map of event pattern to SQS queue URL"
  value       = { for k, v in aws_sqs_queue.main : k => v.url }
}

output "queue_arns" {
  description = "Map of event pattern to SQS queue ARN"
  value       = { for k, v in aws_sqs_queue.main : k => v.arn }
}

output "dlq_arns" {
  description = "Map of event pattern to DLQ ARN"
  value       = { for k, v in aws_sqs_queue.dlq : k => v.arn }
}
