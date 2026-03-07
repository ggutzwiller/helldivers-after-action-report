# SSH key imported from local machine
resource "scaleway_account_ssh_key" "main" {
  name       = "helldivers-bot-key"
  public_key = file(var.ssh_public_key_path)
}

# Main bot server
resource "scaleway_instance_server" "bot" {
  name              = "helldivers-bot"
  type              = var.instance_type
  image             = "debian_trixie"
  enable_dynamic_ip = true

  cloud_init = file("${path.module}/cloud-init.yaml")

  tags = ["helldivers-bot"]
}
