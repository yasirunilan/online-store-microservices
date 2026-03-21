# -----------------------------------------------------------------------------
# CloudWatch Log Groups — one per service
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "services" {
  for_each = var.services

  name              = "/ecs/${var.project_name}-${each.key}"
  retention_in_days = var.log_retention_days

  tags = {
    Service = each.key
  }
}
