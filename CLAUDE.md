# CLAUDE.md

## Special instructions
IMPORTANT: Do not build or release unless specifically asked or granted permission.
IMPORTANT: When significant work is completed, perform a `yarn format > /dev/null && yarn lint && yarn typecheck && yarn build` to verify the code quality.

## Project Overview

uneventful is an event management application with a React/TypeScript frontend and Express backend. Features include form-driven workflows, task tracking, and automated SMS reminders via Twilio.

## Commands

```bash
# Development
yarn dev                    # Run frontend + backend concurrently
yarn dev:client            # Frontend only (port 2998)
yarn dev:server            # Backend only (port 2999)

# Building
yarn build                 # Build frontend
yarn build:server          # Compile TypeScript server to JavaScript

# Production
yarn start                 # Run production server (YOU MUST build first)
yarn preview              # Build and run production server

# Testing
yarn test                 # Run all tests
yarn test:client          # Frontend tests only
yarn test:server          # Server tests only

# Code Quality
yarn lint                 # Run ESLint
yarn format              # Format with Prettier

# Deployment
yarn deploy             # Deploy to melinoe server via SSH (requires root access)
yarn watch-deploy       # Watch GitHub Actions workflow execution (requires gh CLI)
yarn release            # Bump version, push tags, trigger automated GitHub Actions release
yarn release:local      # Manual: Build and push multi-platform Docker image to Docker Hub
```

## Architecture

For detailed information about the system architecture, directory structure, key patterns, API endpoints, and important files, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Deployment

**Production Server Deployment**
- **Host:** melinoe (root@melinoe)
- **Location:** `/opt/uneventful`
- **Command:** `yarn deploy` - SSHs to server, runs `docker compose down/pull/up -d`, then follows logs
- **Requirements:** SSH access as root to melinoe host

**IMPORTANT - Release Process: Automated via GitHub Actions**
1. `yarn release` - Bumps version (patch), creates git commit/tag, pushes to GitHub
2. `yarn watch-deploy` - (Optional) Watch GitHub Actions workflow execution in real-time
3. GitHub Actions automatically builds multi-platform image and pushes to Docker Hub
4. `yarn deploy` - Deploy the new image to production server
5. **Manual alternative:** `yarn release:local` - Local Docker build and push (use `yarn version` first)
