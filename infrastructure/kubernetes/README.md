# Kubernetes deployment

Manifests for running the platform on Kubernetes (Azure AKS or any cluster).

```bash
kubectl apply -k infrastructure/kubernetes/overlays/dev
# or, with kustomize:
kubectl apply -k .
```

## Layout

| File | Purpose |
| ---- | ------- |
| `namespace.yaml` | `stellar-pay` namespace |
| `configmap.yaml` | non-secret env configuration |
| `secret.yaml` | secret env (JWT secret, DB credentials) — use SealedSecrets/External Secrets in prod |
| `postgres.yaml` | PostgreSQL StatefulSet (dev) |
| `redis.yaml` | Redis StatefulSet (dev) |
| `api.yaml` | API Deployment + Service + HPA |
| `web.yaml` | Web Deployment + Service |
| `ingress.yaml` | Ingress + TLS |
| `kustomization.yaml` | resource bundle |

## Production notes

- Replace the bundled Postgres/Redis with Azure Database for PostgreSQL and
  Azure Cache for Redis (see `infrastructure/terraform/`).
- Manage secrets with Azure Key Vault + CSI driver, never plain Secrets.
- TLS via cert-manager; HPA configured on CPU + custom metrics.
