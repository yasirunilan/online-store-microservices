# -----------------------------------------------------------------------------
# Secrets Manager — JWT keys and MongoDB URI (empty placeholders)
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "jwt_private_key" {
  name = "${var.project_name}/${var.environment}/jwt-private-key"

  tags = {
    Name = "${var.project_name}/${var.environment}/jwt-private-key"
  }
}

resource "aws_secretsmanager_secret_version" "jwt_private_key" {
  secret_id     = aws_secretsmanager_secret.jwt_private_key.id
  secret_string = "PLACEHOLDER-populate-before-first-deploy"

  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret" "jwt_public_key" {
  name = "${var.project_name}/${var.environment}/jwt-public-key"

  tags = {
    Name = "${var.project_name}/${var.environment}/jwt-public-key"
  }
}

resource "aws_secretsmanager_secret_version" "jwt_public_key" {
  secret_id     = aws_secretsmanager_secret.jwt_public_key.id
  secret_string = "PLACEHOLDER-populate-before-first-deploy"

  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret" "mongodb_uri" {
  name = "${var.project_name}/${var.environment}/mongodb-uri"

  tags = {
    Name = "${var.project_name}/${var.environment}/mongodb-uri"
  }
}

resource "aws_secretsmanager_secret_version" "mongodb_uri" {
  secret_id     = aws_secretsmanager_secret.mongodb_uri.id
  secret_string = "PLACEHOLDER-populate-before-first-deploy"

  lifecycle {
    ignore_changes = [secret_string]
  }
}
