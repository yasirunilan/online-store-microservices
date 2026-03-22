environment       = "prod"
aws_region        = "us-east-1"
project_name      = "online-store"
github_repository = "org/online-store"
certificate_arn   = ""

alb_services = [
  {
    name              = "auth-service"
    port              = 3001
    path_patterns     = ["/v*/auth/*", "/.well-known/*"]
    priority          = 100
    health_check_path = "/health"
  },
  {
    name              = "user-service"
    port              = 3002
    path_patterns     = ["/v*/users/*"]
    priority          = 200
    health_check_path = "/health"
  },
  {
    name              = "product-service"
    port              = 3003
    path_patterns     = ["/v*/products/*", "/graphql"]
    priority          = 300
    health_check_path = "/health"
  },
  {
    name              = "order-service"
    port              = 3004
    path_patterns     = ["/v*/orders/*"]
    priority          = 400
    health_check_path = "/health"
  }
]

ecs_services = {
  "web" = {
    cpu           = 512
    memory        = 1024
    desired_count = 2
    max_count     = 4
  }
  "auth-service" = {
    cpu           = 512
    memory        = 1024
    desired_count = 2
    max_count     = 6
  }
  "user-service" = {
    cpu           = 512
    memory        = 1024
    desired_count = 2
    max_count     = 6
  }
  "product-service" = {
    cpu           = 1024
    memory        = 2048
    desired_count = 2
    max_count     = 6
  }
  "order-service" = {
    cpu           = 512
    memory        = 1024
    desired_count = 2
    max_count     = 6
  }
  "notification-service" = {
    cpu           = 256
    memory        = 512
    desired_count = 1
    max_count     = 3
  }
}
