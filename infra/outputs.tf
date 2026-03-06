# Sorties utiles apres le deploiement

output "server_ip" {
  value       = scaleway_instance_ip.main.address
  description = "Adresse IP publique du serveur"
  # Pour Hetzner : hcloud_server.bot.ipv4_address
}

output "ssh_command" {
  value       = "ssh helldivers@${scaleway_instance_ip.main.address}"
  description = "Commande SSH pour se connecter au serveur"
  # Pour Hetzner : "ssh helldivers@${hcloud_server.bot.ipv4_address}"
}
