# -----------------------------------------------------------------------------
# ElastiCache — Redis replication group
# -----------------------------------------------------------------------------

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${var.project_name}-${var.environment}"
  description          = "Redis for ${var.project_name} ${var.environment}"

  node_type            = "cache.t4g.micro"
  num_cache_clusters   = var.redis_num_cache_clusters
  port                 = 6379
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [var.redis_security_group_id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = false
  automatic_failover_enabled = var.redis_num_cache_clusters > 1

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}
