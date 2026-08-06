---
title: Deployment
description: Docker, Kubernetes, Terraform (Azure), and monitoring — production deployment guide.
---

# Deployment

## 1. Local with Docker Compose

```bash
cp .env.example .env            # fill in values
pnpm docker:up                  # postgres + redis
pnpm db:generate && pnpm db:push && pnpm db:seed
pnpm dev                        # nx run-many, starts api + web + admin
```

## 2. Production images

`infrastructure/docker/` contains multi-stage Dockerfiles:

- `api.Dockerfile` — builds the workspace, runs `nx build api`, ships the compiled NestJS app.
- `web.Dockerfile` — builds the Next.js web app and serves it with the standalone output.

```bash
docker build -f infrastructure/docker/api.Dockerfile -t stellar-pay/api .
docker build -f infrastructure/docker/web.Dockerfile -t stellar-pay/web .
```

## 3. Kubernetes

`infrastructure/kubernetes/` is a Kustomize bundle: namespace, ConfigMap, Secret (example),
Postgres + Redis StatefulSets, API + Web deployments, and an NGINX ingress with TLS.

```bash
kubectl apply -k infrastructure/kubernetes
kubectl -n stellar-pay get pods
```

## 4. Terraform (Azure)

`infrastructure/terraform/` provisions the AKS cluster, managed Postgres (`flexible
server`), Redis cache, and Key Vault with Terraform Cloud state.

```bash
cd infrastructure/terraform
terraform init && terraform plan && terraform apply
```

## 5. Monitoring

`infrastructure/monitoring/` ships Prometheus + Grafana (auto-provisioned datasource) and a
base alert rule set (API error rate, 5xx spikes, payment failure rate). The API exposes
metrics at `/metrics` when `METRICS_ENABLED=true`.

## CI/CD

GitHub Actions (`.github/workflows/`) runs on every PR and push to `main`:

- `ci.yml` — install, lint, typecheck, test, build contracts, build apps.
- `deploy.yml` — build + push Docker images to a registry, then roll AKS deployments.

## Environment variables

See `.env.example` and `apps/api/.env.example`. Never commit secrets; inject via K8s
Secrets, Azure Key Vault, or the platform's secret store.
