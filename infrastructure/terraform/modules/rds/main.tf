# -----------------------------------------------------------------------------
# RDS Module — single PostgreSQL instance, per-service schemas
# -----------------------------------------------------------------------------

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}

resource "random_password" "master" {
  length  = 16
  special = false
}

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment}"

  engine         = "postgres"
  engine_version = "16"
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.allocated_storage * 2

  db_name  = "online_store"
  username = "postgres"
  password = random_password.master.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.security_group_id]

  multi_az            = var.multi_az
  publicly_accessible = false
  storage_encrypted   = true
  skip_final_snapshot = var.environment == "dev"

  final_snapshot_identifier = var.environment == "prod" ? "${var.project_name}-${var.environment}-final" : null

  backup_retention_period = var.backup_retention_period

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}

# -----------------------------------------------------------------------------
# Secrets Manager — per-service DATABASE_URL with schema parameter
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "database_urls" {
  for_each = { for svc in var.postgres_services : svc.name => svc }

  name = "${var.project_name}/${var.environment}/${each.value.name}/database-url"

  tags = {
    Service = each.value.name
  }
}

resource "aws_secretsmanager_secret_version" "database_urls" {
  for_each = { for svc in var.postgres_services : svc.name => svc }

  secret_id = aws_secretsmanager_secret.database_urls[each.key].id
  secret_string = format(
    "postgresql://%s:%s@%s:%s/%s?schema=%s",
    aws_db_instance.main.username,
    random_password.master.result,
    aws_db_instance.main.address,
    aws_db_instance.main.port,
    aws_db_instance.main.db_name,
    each.value.schema
  )
}
