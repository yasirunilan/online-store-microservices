output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "listener_arn" {
  description = "Active listener ARN (HTTPS if cert provided, else HTTP)"
  value       = var.certificate_arn != "" ? aws_lb_listener.https[0].arn : aws_lb_listener.http.arn
}

output "target_group_arns" {
  description = "Map of service name to target group ARN"
  value       = { for k, v in aws_lb_target_group.services : k => v.arn }
}
