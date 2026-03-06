# Network security group - filter inbound traffic
resource "scaleway_instance_security_group" "bot" {
  name                    = "helldivers-bot-sg"
  inbound_default_policy  = "drop"
  outbound_default_policy = "accept"

  # Allow SSH from anywhere (secured by key-only auth + fail2ban)
  inbound_rule {
    action   = "accept"
    port     = 22
    protocol = "TCP"
  }
}
