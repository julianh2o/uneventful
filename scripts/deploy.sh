#!/bin/bash
set -e

# Deployment script for uneventful on melinoe
HOST="root@melinoe"
DEPLOY_DIR="/opt/uneventful"

echo "🚀 Deploying to melinoe:${DEPLOY_DIR}..."

# SSH into the host and run deployment commands
ssh ${HOST} << 'ENDSSH'
cd /opt/uneventful

echo "📦 Stopping containers..."
docker compose down

echo "⬇️  Pulling latest images..."
docker compose pull

echo "🔄 Starting containers..."
docker compose up -d

echo "✅ Deployment complete!"
echo "📋 Following logs (Ctrl+C to exit)..."
ENDSSH

# Follow logs (runs locally but connects to remote docker)
echo ""
ssh ${HOST} "cd ${DEPLOY_DIR} && docker compose logs -f"
