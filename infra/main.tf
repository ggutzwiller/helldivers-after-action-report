# Terraform configuration for the Helldivers Discord bot deployment

terraform {
  required_version = ">= 1.0"

  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.0"
    }
  }
}

provider "scaleway" {
  region     = var.region
  zone       = var.zone
  project_id = var.project_id
}
