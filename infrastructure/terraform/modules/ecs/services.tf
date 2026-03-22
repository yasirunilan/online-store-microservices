# -----------------------------------------------------------------------------
# ECS Task Definitions & Services
# -----------------------------------------------------------------------------

locals {
  # Common environment variables for all services
  common_env = [
    { name = "NODE_ENV", value = "production" },
    { name = "LOG_LEVEL", value = "info" },
    { name = "CACHE_STORE", value = "redis" },
    { name = "REDIS_URL", value = "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:6379" },
  ]

  # Queue environment variables for services that use SQS
  queue_env = [
    { name = "QUEUE_TRANSPORT", value = "sqs" },
  ]

  # Build queue URL env vars from the sqs_queue_urls map
  queue_url_env = [
    for pattern, url in var.sqs_queue_urls : {
      name  = "SQS_QUEUE_URL_${upper(replace(pattern, "-", "_"))}"
      value = url
    }
  ]

  # Internal ALB URL for service-to-service calls (web → backend via ALB)
  alb_url = "http://${var.alb_dns_name}"

  # Per-service config: which secrets and env vars each service needs
  service_configs = {
    "web" = {
      has_database = false
      has_queue    = false
      port         = 3000
      secrets      = []
      extra_env = [
        { name = "AUTH_SERVICE_URL", value = local.alb_url },
        { name = "USER_SERVICE_URL", value = local.alb_url },
        { name = "PRODUCT_SERVICE_URL", value = local.alb_url },
        { name = "ORDER_SERVICE_URL", value = local.alb_url },
      ]
    }
    "auth-service" = {
      has_database = true
      has_queue    = true
      port         = 3001
      extra_env    = []
      secrets = [
        { name = "DATABASE_URL", valueFrom = var.database_url_secret_arns["auth-service"] },
        { name = "JWT_PRIVATE_KEY", valueFrom = aws_secretsmanager_secret.jwt_private_key.arn },
        { name = "JWT_PUBLIC_KEY", valueFrom = aws_secretsmanager_secret.jwt_public_key.arn },
      ]
    }
    "user-service" = {
      has_database = true
      has_queue    = true
      port         = 3002
      extra_env    = []
      secrets = [
        { name = "DATABASE_URL", valueFrom = var.database_url_secret_arns["user-service"] },
        { name = "JWT_PUBLIC_KEY", valueFrom = aws_secretsmanager_secret.jwt_public_key.arn },
      ]
    }
    "product-service" = {
      has_database = true
      has_queue    = false
      port         = 3003
      extra_env    = []
      secrets = [
        { name = "DATABASE_URL", valueFrom = var.database_url_secret_arns["product-service"] },
        { name = "JWT_PUBLIC_KEY", valueFrom = aws_secretsmanager_secret.jwt_public_key.arn },
      ]
    }
    "order-service" = {
      has_database = true
      has_queue    = true
      port         = 3004
      extra_env    = []
      secrets = [
        { name = "DATABASE_URL", valueFrom = var.database_url_secret_arns["order-service"] },
        { name = "JWT_PUBLIC_KEY", valueFrom = aws_secretsmanager_secret.jwt_public_key.arn },
      ]
    }
    "notification-service" = {
      has_database = false
      has_queue    = true
      port         = 3005
      extra_env    = []
      secrets = [
        { name = "MONGODB_URI", valueFrom = aws_secretsmanager_secret.mongodb_uri.arn },
      ]
    }
  }
}

resource "aws_ecs_task_definition" "services" {
  for_each = var.services

  family                   = "${var.project_name}-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.task[each.key].arn

  container_definitions = jsonencode([
    {
      name      = each.key
      image     = "${var.ecr_repository_urls[each.key]}:latest"
      essential = true
      portMappings = [
        {
          containerPort = local.service_configs[each.key].port
          protocol      = "tcp"
        }
      ]
      environment = concat(
        local.common_env,
        [
          { name = "SERVICE_NAME", value = each.key },
          { name = "PORT", value = tostring(local.service_configs[each.key].port) },
        ],
        local.service_configs[each.key].has_queue ? concat(local.queue_env, local.queue_url_env) : [],
        local.service_configs[each.key].extra_env,
      )
      secrets = local.service_configs[each.key].secrets
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.services[each.key].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Service = each.key
  }
}

resource "aws_ecs_service" "services" {
  for_each = var.services

  name            = "${var.project_name}-${each.key}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.services[each.key].arn
  desired_count   = each.value.desired_count
  launch_type     = var.capacity_provider == "FARGATE" ? "FARGATE" : null

  dynamic "capacity_provider_strategy" {
    for_each = var.capacity_provider == "FARGATE_SPOT" ? [1] : []
    content {
      capacity_provider = "FARGATE_SPOT"
      weight            = 100
      base              = 1
    }
  }

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  # Only attach to ALB if the service has a target group
  dynamic "load_balancer" {
    for_each = lookup(var.alb_target_group_arns, each.key, null) != null ? [1] : []
    content {
      target_group_arn = var.alb_target_group_arns[each.key]
      container_name   = each.key
      container_port   = local.service_configs[each.key].port
    }
  }

  depends_on = [aws_iam_role_policy_attachment.ecs_execution]

  lifecycle {
    ignore_changes = [desired_count, task_definition]
  }
}

# -----------------------------------------------------------------------------
# Auto-scaling (prod only)
# -----------------------------------------------------------------------------

resource "aws_appautoscaling_target" "services" {
  for_each = var.enable_autoscaling ? var.services : {}

  max_capacity       = each.value.max_count
  min_capacity       = each.value.desired_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.services[each.key].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  for_each = var.enable_autoscaling ? var.services : {}

  name               = "${var.project_name}-${each.key}-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.services[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.services[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.services[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
