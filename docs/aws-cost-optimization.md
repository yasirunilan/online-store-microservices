# AWS Cost Optimization Guide

Estimated monthly costs and actionable optimizations for the Online Store infrastructure.

---

## Current Cost Breakdown

### Development Environment (~$170/month)

| Service | Configuration | Est. Cost |
|---|---|---|
| ECS Fargate Spot | 6 tasks (256 CPU, 512 MB each) | ~$45-65 |
| NAT Gateway | 1 gateway + 1 Elastic IP | ~$45 |
| RDS PostgreSQL | db.t4g.micro, 20 GB, single-AZ | ~$26 |
| ElastiCache Redis | cache.t4g.micro, 1 node | ~$17 |
| ALB | 1 load balancer, 5 target groups | ~$16 |
| CloudWatch Logs | 6 log groups, 30-day retention | ~$8-15 |
| Container Insights | 6 tasks | ~$4 |
| Secrets Manager | 7 secrets | ~$3 |
| ECR | 6 repos | ~$2 |
| SQS | 6 queues (3 main + 3 DLQ) | ~$0.50 |

### Production Environment (~$700/month)

| Service | Configuration | Est. Cost |
|---|---|---|
| ECS Fargate (on-demand) | 11 tasks (512-1024 CPU), autoscaling to 33 | ~$280-420 |
| RDS PostgreSQL | db.t4g.small, 50 GB, Multi-AZ | ~$155 |
| NAT Gateways | 2 gateways + 2 Elastic IPs (multi-AZ) | ~$90 |
| ElastiCache Redis | cache.t4g.micro, 2 nodes + failover | ~$34 |
| CloudWatch Logs | 6 log groups, 90-day retention | ~$25-50 |
| ALB | 1 load balancer, 5 target groups | ~$16 |
| Container Insights | 11+ tasks | ~$7-10 |
| Secrets Manager | 7 secrets | ~$3 |
| ECR | 6 repos | ~$2 |
| SQS | 6 queues | ~$1-5 |

---

## Optimization Opportunities (ranked by impact)

### 1. Replace NAT Gateway with fck-nat instance (dev)

**Savings: ~$42/month in dev**

NAT Gateway is the largest fixed cost. For dev, replace it with a [fck-nat](https://github.com/AndrewGuentworker/fck-nat) t4g.nano instance (~$3/month vs $45).

Alternative: deploy ECS tasks in public subnets with `assign_public_ip = true` to eliminate NAT entirely.

```hcl
# Option A: public subnet deployment (dev only)
# In modules/ecs/services.tf — network_configuration block:
network_configuration {
  subnets          = var.public_subnet_ids   # was: private_subnet_ids
  security_groups  = [var.ecs_security_group_id]
  assign_public_ip = true                    # was: false
}

# Option B: single NAT in prod instead of 2
# In environments/prod/main.tf:
module "vpc" {
  # ...
  single_nat_gateway = true   # was: false — saves ~$45/month
}
```

### 2. Use Fargate Spot for production

**Savings: ~$110-170/month**

Dev already uses `FARGATE_SPOT`. Production uses full-price `FARGATE`. ECS handles spot interruptions gracefully with task rebalancing.

```hcl
# In environments/prod/main.tf:
module "ecs" {
  # ...
  capacity_provider = "FARGATE_SPOT"   # was: "FARGATE"
}
```

Risk: spot capacity can be reclaimed. Mitigate by keeping `desired_count >= 2` so at least one task survives rebalancing.

### 3. Scale dev to zero outside work hours

**Savings: ~$50-70/month**

Dev services run 24/7 but are only used during work hours. Set desired count to 0 outside business hours.

```hcl
# Add to modules/ecs/ — scheduled scaling (example for 9am-6pm UTC weekdays)
resource "aws_appautoscaling_scheduled_action" "scale_down" {
  for_each = var.enable_scheduled_scaling ? var.services : {}

  name               = "${var.project_name}-${each.key}-scale-down"
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.services[each.key].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  schedule           = "cron(0 18 ? * MON-FRI *)"

  scalable_target_action {
    min_capacity = 0
    max_capacity = 0
  }
}

resource "aws_appautoscaling_scheduled_action" "scale_up" {
  for_each = var.enable_scheduled_scaling ? var.services : {}

  name               = "${var.project_name}-${each.key}-scale-up"
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.services[each.key].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  schedule           = "cron(0 9 ? * MON-FRI *)"

  scalable_target_action {
    min_capacity = each.value.desired_count
    max_capacity = each.value.max_count
  }
}
```

### 4. Reduce CloudWatch log retention

**Savings: ~$5-10/month (dev), ~$15-30/month (prod)**

Dev logs older than 7 days are rarely needed. Prod can export to S3 for long-term archival at 10x cheaper storage.

```hcl
# In environments/dev/main.tf:
module "ecs" {
  # ...
  log_retention_days = 7    # was: 30
}

# In environments/prod/main.tf:
module "ecs" {
  # ...
  log_retention_days = 30   # was: 90 — use S3 export for longer retention
}
```

### 5. Disable Container Insights in dev

**Savings: ~$4/month**

Container Insights adds $0.65/task/month. Not needed for dev.

```hcl
# In modules/ecs/main.tf — add a variable toggle:
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}"

  dynamic "setting" {
    for_each = var.enable_container_insights ? [1] : []
    content {
      name  = "containerInsights"
      value = "enabled"
    }
  }
}

# In environments/dev/main.tf:
module "ecs" {
  # ...
  enable_container_insights = false   # save ~$4/month
}
```

### 6. Switch Secrets Manager to SSM Parameter Store

**Savings: ~$3/month per environment**

SSM Parameter Store (SecureString, standard tier) is free. Secrets Manager costs $0.40/secret/month.

```hcl
# Replace aws_secretsmanager_secret with:
resource "aws_ssm_parameter" "database_url" {
  for_each = var.database_schemas

  name  = "/${var.project_name}/${var.environment}/${each.key}/database-url"
  type  = "SecureString"
  value = "postgresql://..."
}

# In ECS task definitions, change secrets valueFrom to SSM ARN format:
# arn:aws:ssm:region:account:parameter/name
```

Requires updating ECS task execution role to allow `ssm:GetParameters` instead of `secretsmanager:GetSecretValue`.

### 7. RDS reserved instance

**Savings: ~30-40% on RDS costs**

If you commit to 1 year, reserved instances reduce RDS pricing:
- Dev db.t4g.micro: ~$26/month → ~$16/month (no upfront, 1yr)
- Prod db.t4g.small: ~$75/month → ~$48/month (no upfront, 1yr)

This is a billing-level change, not a Terraform change. Purchase via the AWS Console under RDS > Reserved Instances.

---

## What NOT to cut

| Resource | Reason |
|---|---|
| RDS Multi-AZ (prod) | Data loss risk on AZ failure isn't worth the ~$75 savings |
| ElastiCache 2-node failover (prod) | Cheap insurance at t4g.micro pricing (~$17 extra) |
| ALB | Required for routing — only one per environment |
| ECR lifecycle policies | Already optimized (10 images, 7-day untagged cleanup) |
| SQS DLQ queues | Essential for debugging failed events — nearly free |

---

## Estimated Savings Summary

| Optimization | Dev | Prod |
|---|---|---|
| NAT Gateway (fck-nat or public subnet) | ~$42/month | ~$45-87/month |
| Fargate Spot (prod) | — | ~$110-170/month |
| Scale to zero (dev, evenings/weekends) | ~$50-70/month | — |
| CloudWatch retention reduction | ~$5-10/month | ~$15-30/month |
| Disable Container Insights (dev) | ~$4/month | — |
| SSM Parameter Store | ~$3/month | ~$3/month |
| RDS reserved instance (1yr) | ~$10/month | ~$27/month |
| **Total potential savings** | **~$115-140/month** | **~$200-320/month** |
| **Estimated cost after optimizations** | **~$30-55/month** | **~$380-500/month** |

---

## Relevant Terraform Files

| File | What to change |
|---|---|
| `environments/dev/main.tf` | Capacity provider, log retention, Container Insights, NAT config |
| `environments/prod/main.tf` | Capacity provider, log retention, NAT config |
| `environments/dev/terraform.tfvars` | Service counts, scaling schedule |
| `environments/prod/terraform.tfvars` | Service counts |
| `modules/vpc/main.tf` | NAT Gateway vs fck-nat vs public subnet |
| `modules/ecs/main.tf` | Container Insights toggle |
| `modules/ecs/services.tf` | Scheduled scaling, network config |
| `modules/ecs/logs.tf` | Log retention variable |
| `modules/ecs/secrets.tf` | Secrets Manager → SSM migration |
