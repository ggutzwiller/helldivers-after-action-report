# SSH key imported from local machine
resource "scaleway_account_ssh_key" "main" {
  name       = "helldivers-bot-key"
  public_key = file(var.ssh_public_key_path)
}

# Reserved public IP for the server
resource "scaleway_instance_ip" "main" {}

# Additional volume for SQLite data (persistent across rebuilds)
resource "scaleway_instance_volume" "data" {
  name       = "helldivers-data"
  size_in_gb = 10
  type       = "b_ssd"
}

# Main bot server
resource "scaleway_instance_server" "bot" {
  name  = "helldivers-bot"
  type  = var.instance_type
  image = "ubuntu_jammy"
  ip_id = scaleway_instance_ip.main.id

  security_group_id = scaleway_instance_security_group.bot.id

  additional_volume_ids = [
    scaleway_instance_volume.data.id,
  ]

  cloud_init = file("${path.module}/cloud-init.yaml")

  tags = ["helldivers-bot"]
}
