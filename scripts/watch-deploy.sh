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

# Get the most recent workflow run ID
echo "📋 Finding most recent workflow run..."
RUN_ID=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')

if [ -z "$RUN_ID" ]; then
    echo "❌ No workflow runs found"
    exit 1
fi

echo "🔍 Watching run ID: $RUN_ID"
echo ""

# Watch the workflow run
# This will automatically stream logs and update status
gh run watch $RUN_ID --exit-status

echo ""
echo "✅ Workflow completed!"
