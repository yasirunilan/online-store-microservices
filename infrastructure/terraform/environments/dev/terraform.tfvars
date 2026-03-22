environment       = "dev"
aws_region        = "us-east-1"
project_name      = "online-store"
github_repository = "yasirunilan/online-store-microservices"

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
    cpu           = 256
    memory        = 512
    desired_count = 1
    max_count     = 2
  }
  "auth-service" = {
    cpu           = 256
    memory        = 512
    desired_count = 1
    max_count     = 2
  }
  "user-service" = {
    cpu           = 256
    memory        = 512
    desired_count = 1
    max_count     = 2
  }
  "product-service" = {
    cpu           = 256
    memory        = 512
    desired_count = 1
    max_count     = 2
  }
  "order-service" = {
    cpu           = 256
    memory        = 512
    desired_count = 1
    max_count     = 2
  }
  "notification-service" = {
    cpu           = 256
    memory        = 512
    desired_count = 1
    max_count     = 2
  }
}
