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
