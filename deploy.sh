#!/usr/bin/env bash
# Script de deploiement du bot Helldivers sur le serveur distant
set -euo pipefail

# Adresse IP du serveur (argument ou variable d'environnement)
SERVER_IP="${1:-${SERVER_IP:-}}"

if [[ -z "$SERVER_IP" ]]; then
  echo "Usage: $0 <server_ip>"
  echo "  ou definir la variable SERVER_IP"
  exit 1
fi

echo "=> Construction du projet..."
npm run build

echo "=> Synchronisation des fichiers vers ${SERVER_IP}..."
rsync -avz --delete \
  dist/ \
  package.json \
  package-lock.json \
  "helldivers@${SERVER_IP}:/opt/helldivers/app/"

echo "=> Installation des dependances et redemarrage du service..."
ssh "helldivers@${SERVER_IP}" \
  "cd /opt/helldivers/app && npm ci --omit=dev && sudo systemctl restart helldivers-bot"

echo "Deployed successfully"
