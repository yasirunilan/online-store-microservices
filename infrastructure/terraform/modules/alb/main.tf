# -----------------------------------------------------------------------------
# ALB Module — path-based routing to ECS services
# -----------------------------------------------------------------------------

resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = var.public_subnet_ids

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}

# -----------------------------------------------------------------------------
# Target Groups
# -----------------------------------------------------------------------------

resource "aws_lb_target_group" "services" {
  for_each = { for svc in var.services : svc.name => svc }

  name        = "${var.project_name}-${each.value.name}"
  port        = each.value.port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = each.value.health_check_path
    protocol            = "HTTP"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name    = "${var.project_name}-${each.value.name}"
    Service = each.value.name
  }
}

# -----------------------------------------------------------------------------
# Default Target Group (web frontend — catch-all)
# -----------------------------------------------------------------------------

resource "aws_lb_target_group" "default" {
  count = var.default_target != null ? 1 : 0

  name        = "${var.project_name}-${var.default_target.name}"
  port        = var.default_target.port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = var.default_target.health_check_path
    protocol            = "HTTP"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name    = "${var.project_name}-${var.default_target.name}"
    Service = var.default_target.name
  }
}

# -----------------------------------------------------------------------------
# Listeners
# -----------------------------------------------------------------------------

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  # When HTTPS cert exists: redirect HTTP → HTTPS
  # When no cert + default target: forward to web frontend
  # When no cert + no default target: 404
  default_action {
    type = var.certificate_arn != "" ? "redirect" : (
      var.default_target != null ? "forward" : "fixed-response"
    )

    dynamic "redirect" {
      for_each = var.certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    dynamic "forward" {
      for_each = var.certificate_arn == "" && var.default_target != null ? [1] : []
      content {
        target_group {
          arn = aws_lb_target_group.default[0].arn
        }
      }
    }

    dynamic "fixed_response" {
      for_each = var.certificate_arn == "" && var.default_target == null ? [1] : []
      content {
        content_type = "application/json"
        message_body = "{\"error\":\"not found\"}"
        status_code  = "404"
      }
    }
  }
}

resource "aws_lb_listener" "https" {
  count = var.certificate_arn != "" ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type = var.default_target != null ? "forward" : "fixed-response"

    dynamic "forward" {
      for_each = var.default_target != null ? [1] : []
      content {
        target_group {
          arn = aws_lb_target_group.default[0].arn
        }
      }
    }

    dynamic "fixed_response" {
      for_each = var.default_target == null ? [1] : []
      content {
        content_type = "application/json"
        message_body = "{\"error\":\"not found\"}"
        status_code  = "404"
      }
    }
  }
}

# -----------------------------------------------------------------------------
# Listener Rules — path-based routing
# -----------------------------------------------------------------------------

resource "aws_lb_listener_rule" "services" {
  for_each = { for svc in var.services : svc.name => svc }

  listener_arn = var.certificate_arn != "" ? aws_lb_listener.https[0].arn : aws_lb_listener.http.arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.key].arn
  }

  condition {
    path_pattern {
      values = each.value.path_patterns
    }
  }
}
