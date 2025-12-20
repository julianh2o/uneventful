#!/bin/bash
set -e

echo "🔨 Building uneventful locally..."
echo "═══════════════════════════════════════"
echo ""

# Build frontend
echo "📦 Step 1/3: Building frontend..."
yarn build

echo ""

# Build server
echo "⚙️  Step 2/3: Building server (TypeScript → JavaScript)..."
yarn build:server

echo ""

# Build Docker image
echo "🐳 Step 3/3: Building Docker image..."
docker compose build

echo ""
echo "✅ Local build complete!"
echo ""
echo "To run: docker compose up"
