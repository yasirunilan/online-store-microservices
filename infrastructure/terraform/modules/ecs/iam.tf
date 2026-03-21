# -----------------------------------------------------------------------------
# IAM — Task Execution Role (shared) + Task Roles (per-service)
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

# --- Task Execution Role (shared across all services) ---

resource "aws_iam_role" "ecs_execution" {
  name = "${var.project_name}-${var.environment}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-ecs-execution"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "secrets-access"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
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
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# --- Task Roles (per-service) ---

resource "aws_iam_role" "task" {
  for_each = var.services

  name = "${var.project_name}-${var.environment}-${each.key}-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name    = "${var.project_name}-${var.environment}-${each.key}-task"
    Service = each.key
  }
}

# auth-service: publish to user-registered queue
resource "aws_iam_role_policy" "auth_sqs" {
  count = contains(keys(var.services), "auth-service") ? 1 : 0
  name  = "sqs-publish"
  role  = aws_iam_role.task["auth-service"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = [var.sqs_queue_arns["user-registered"]]
      }
    ]
  })
}

# user-service: consume from user-registered queue
resource "aws_iam_role_policy" "user_sqs" {
  count = contains(keys(var.services), "user-service") ? 1 : 0
  name  = "sqs-consume"
  role  = aws_iam_role.task["user-service"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [var.sqs_queue_arns["user-registered"]]
      }
    ]
  })
}

# order-service: publish to order-placed and order-status-updated queues
resource "aws_iam_role_policy" "order_sqs" {
  count = contains(keys(var.services), "order-service") ? 1 : 0
  name  = "sqs-publish"
  role  = aws_iam_role.task["order-service"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = [
          var.sqs_queue_arns["order-placed"],
          var.sqs_queue_arns["order-status-updated"]
        ]
      }
    ]
  })
}

# notification-service: consume from all queues + SES
resource "aws_iam_role_policy" "notification_sqs" {
  count = contains(keys(var.services), "notification-service") ? 1 : 0
  name  = "sqs-consume-and-ses"
  role  = aws_iam_role.task["notification-service"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = values(var.sqs_queue_arns)
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}
