output "server_ip" {
  value       = length(scaleway_instance_server.bot.public_ips) > 0 ? scaleway_instance_server.bot.public_ips[0].address : "pending"
  description = "Adresse IP publique du serveur"
}

output "ssh_command" {
  value       = length(scaleway_instance_server.bot.public_ips) > 0 ? "ssh helldivers@${scaleway_instance_server.bot.public_ips[0].address}" : "pending"
  description = "Commande SSH pour se connecter au serveur"
}
