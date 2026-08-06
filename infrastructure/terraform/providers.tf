terraform {
  required_version = ">= 1.5"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # In production, configure remote state:
  # backend "azurerm" {
  #   resource_group_name  = "stellar-pay-infra"
  #   storage_account_name = "stellarpaytfstate"
  #   container_name       = "tfstate"
  #   key                  = "stellar-pay.tfstate"
  # }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}
