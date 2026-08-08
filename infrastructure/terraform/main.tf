resource "random_id" "suffix" {
  byte_length = 4
}

resource "azurerm_resource_group" "main" {
  name     = "rg-stellar-pay-${var.environment}"
  location = var.location
}

# ------------------------------------------------------------------ Database
resource "azurerm_postgresql_flexible_server" "main" {
  name                = "stellar-pay-pg-${var.environment}${random_id.suffix.hex}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  version             = "16"
  administrator_login = "stellar_pay"
  administrator_password = var.db_admin_password
  sku_name            = "B_Standard_B1ms"
  storage_mb          = 32768
  zone                = "1"

  lifecycle {
    ignore_changes = [administrator_password]
  }
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "stellar_pay"
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_aks" {
  name             = "allow-aks-egress"
  server_id        = azurerm_postgresql_flexible_server.main.id
  # Restrict to Azure-region external IPs. Replace with your AKS egress IP(s) in production.
  # For dev: use the AKS node pool outbound IP. Never use 0.0.0.0 in production.
  start_ip_address = var.aks_egress_ip
  end_ip_address   = var.aks_egress_ip
}

# --------------------------------------------------------------------- Cache
resource "azurerm_redis_cache" "main" {
  name                = "stellar-pay-redis-${var.environment}${random_id.suffix.hex}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  capacity            = 1
  family              = "C"
  sku_name            = "Basic"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
}

# ------------------------------------------------------------------- Registry
resource "azurerm_container_registry" "main" {
  name                = "stellarpayacr${var.environment}${random_id.suffix.hex}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true
}

# ---------------------------------------------------------------------- AKS
resource "azurerm_kubernetes_cluster" "main" {
  name                = "stellar-pay-aks-${var.environment}${random_id.suffix.hex}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  dns_prefix          = "stellarpay${var.environment}"
  kubernetes_version  = "1.31"

  default_node_pool {
    name       = "default"
    node_count = var.environment == "prod" ? 3 : 2
    vm_size    = "Standard_B2s"
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin = "azure"
    network_policy = "azure"
  }
}

# Outputs for the deploy workflow
output "aks_cluster_name" {
  value = azurerm_kubernetes_cluster.main.name
}

output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "acr_login_server" {
  value = azurerm_container_registry.main.login_server
}

output "postgres_connection_string" {
  value     = "postgresql://stellar_pay:${var.db_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/stellar_pay?sslmode=require"
  sensitive = true
}

output "redis_connection_string" {
  value     = "rediss://:${azurerm_redis_cache.main.primary_access_key}@${azurerm_redis_cache.main.hostname}:6380"
  sensitive = true
}
