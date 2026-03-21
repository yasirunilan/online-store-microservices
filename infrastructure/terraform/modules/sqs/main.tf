# -----------------------------------------------------------------------------
# SQS Module — event queues with dead-letter queues
# -----------------------------------------------------------------------------

resource "aws_sqs_queue" "dlq" {
  for_each = toset(var.event_patterns)

  name                      = "${var.project_name}-${var.environment}-${each.value}-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name    = "${var.project_name}-${var.environment}-${each.value}-dlq"
    Pattern = each.value
  }
}

resource "aws_sqs_queue" "main" {
  for_each = toset(var.event_patterns)

  name                       = "${var.project_name}-${var.environment}-${each.value}"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[each.key].arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = {
    Name    = "${var.project_name}-${var.environment}-${each.value}"
    Pattern = each.value
  }
}
