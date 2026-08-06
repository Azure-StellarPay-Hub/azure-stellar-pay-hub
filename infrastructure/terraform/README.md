# Terraform (Azure)

Provisions the production infrastructure for the platform:

- Azure Resource Group
- Azure Database for PostgreSQL (Flexible Server 16)
- Azure Cache for Redis
- Azure Container Registry (image storage for CI/CD)
- Azure Kubernetes Service (AKS)

## Usage

```bash
cd infrastructure/terraform
terraform init
terraform plan -var subscription_id=$AZURE_SUBSCRIPTION_ID -var db_admin_password=$(openssl rand -base64 24)
terraform apply -auto-approve -var subscription_id=$AZURE_SUBSCRIPTION_ID -var db_admin_password=$(openssl rand -base64 24)
```

Then connect the cluster and deploy with the GitHub Actions workflow:

```bash
az aks get-credentials -n $(terraform output -raw aks_cluster_name) -g $(terraform output -raw resource_group_name)
kubectl apply -k ../kubernetes
```

> **Production hardening**: restrict the PostgreSQL firewall rule to the AKS
> egress ranges, manage secrets via Azure Key Vault, and enable network
> policies + pod identity.
