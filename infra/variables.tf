variable "project_id" {
  type        = string
  description = "Scaleway project ID"
}

variable "region" {
  type        = string
  default     = "fr-par"
  description = "Scaleway region (fr-par, nl-ams, pl-waw)"
}

variable "zone" {
  type        = string
  default     = "fr-par-1"
  description = "Scaleway zone"
}

variable "instance_type" {
  type        = string
  default     = "STARDUST1-S"
  description = "Instance type - use STARDUST1-S for cheapest"
}

variable "ssh_public_key_path" {
  type        = string
  default     = "~/.ssh/id_helldivers.pub"
  description = "Path to the SSH public key"
}
