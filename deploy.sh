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

SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_helldivers}"
REMOTE="helldivers@${SERVER_IP}"
REMOTE_DIR="/opt/helldivers/app"

echo "=> Construction du projet..."
npm run build

echo "=> Synchronisation des fichiers vers ${SERVER_IP}..."
rsync -avz -e "ssh -i ${SSH_KEY}" \
  dist \
  src/db/schema.ts \
  drizzle.config.ts \
  package.json \
  package-lock.json \
  "${REMOTE}:${REMOTE_DIR}/"

echo "=> Installation des dependances et redemarrage du service..."
ssh -i "${SSH_KEY}" "${REMOTE}" \
  "cd ${REMOTE_DIR} && npm ci --omit=dev && sudo systemctl restart helldivers-bot"

echo "Deployed successfully"
