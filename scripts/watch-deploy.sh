#!/bin/bash
set -e

# Script to watch GitHub Actions workflow execution
# Uses GitHub CLI (gh) to stream workflow logs

echo "🔍 Watching GitHub Actions workflow..."
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Error: Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

# Watch the most recent workflow run
# This will automatically stream logs and update status
gh run watch

echo ""
echo "✅ Workflow completed!"
