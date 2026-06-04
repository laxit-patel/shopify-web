# Future prod modules (not used in staging)

Reserved for when you outgrow single-EC2:

- `ecr/` — container registry
- `ecs/` — Fargate services
- `alb/` — load balancer
- `rds/` — managed Postgres (prod alternative to **Neon**; staging uses on-box Postgres)

Staging today: `../ec2-app` + `../network` + `../secrets`.
