variable "subscription_id" {
  description = "Azure subscription id"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus2"
}

variable "environment" {
  description = "Deployment environment (dev / staging / prod)"
  type        = string
  default     = "dev"
}

variable "db_admin_password" {
  description = "PostgreSQL admin password (use a secret store in production)"
  type        = string
  sensitive   = true
}

variable "aks_egress_ip" {
  description = "AKS cluster egress IP for Postgres firewall rule (required in production)"
  type        = string
  # No default — must be provided explicitly to prevent accidental 0.0.0.0 exposure.
}
