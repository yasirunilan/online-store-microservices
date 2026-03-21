# Terraform Infrastructure — Next Steps

## 1. Terraform State Backend

- Create an S3 bucket for Terraform state storage (e.g. `online-store-terraform-state-<account-id>`)
- Replace `PLACEHOLDER` in both backend configs:
  - `environments/dev/backend.tf`
  - `environments/prod/backend.tf`

## 2. Update Configuration

- Set `github_repository` in both `terraform.tfvars` files to your actual repo (e.g. `your-org/online-store`)
- Set `certificate_arn` in `environments/prod/terraform.tfvars` for HTTPS

## 3. First Apply (Dev)

```bash
cd infrastructure/terraform/environments/dev
terraform init
terraform plan
terraform apply
```

## 4. Populate Secrets Manually

After `terraform apply` creates the empty placeholder secrets in Secrets Manager:

- **JWT keys**: Generate an RS256 key pair → base64 encode → store as `online-store/dev/jwt-private-key` and `online-store/dev/jwt-public-key`
- **MongoDB**: Set `online-store/dev/mongodb-uri` with your Atlas connection string

## 5. Database Migration

Run the `db-migrate.yml` workflow with `migrate-deploy` for each Prisma service (auth, user, product, order) to create database schemas.

## 6. First Deploy

Push or merge to main to trigger the `deploy.yml` workflow. This builds Docker images, pushes to ECR, and updates ECS services.

## 7. Verification

- `curl http://<alb-dns>/v1/auth/health` — check each service path
- Check ECS service stability in the AWS console
- Verify CloudWatch logs are flowing under `/ecs/online-store-*`
- Send a test SQS message and verify the consumer picks it up
- Run a full CI/CD end-to-end merge to confirm naming alignment

## 8. Production

Repeat steps 3–7 for `environments/prod/`:

```bash
cd infrastructure/terraform/environments/prod
terraform init
terraform plan
terraform apply
```
