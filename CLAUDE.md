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

# Database (Prisma)
yarn prisma:generate       # Generate Prisma client (auto-runs on postinstall)
yarn prisma:migrate        # Create and apply new migration
yarn prisma:migrate:deploy # Apply pending migrations (production)
yarn prisma:studio         # Open Prisma Studio GUI

# Deployment
yarn deploy             # Deploy to melinoe server via SSH (requires root access)
yarn watch-deploy       # Watch GitHub Actions workflow execution (requires gh CLI)
yarn release            # Bump version, push tags, trigger automated GitHub Actions release
yarn release:local      # Manual: Build and push multi-platform Docker image to Docker Hub
```

## Architecture

For detailed information about the system architecture, directory structure, key patterns, API endpoints, and important files, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Database Management

**Prisma Client Generation**
- The Prisma client is automatically generated on `yarn install` (postinstall hook)
- When schema changes are made, `yarn dev:server` automatically runs migrations and regenerates the client
- Nodemon watches `prisma/schema.prisma` and restarts the server when it changes

**Important Notes**
- If you manually edit `prisma/schema.prisma`, the dev server will auto-restart
- After pulling schema changes from git, run `yarn install` or `yarn prisma:generate` to update the client
- The server MUST be restarted after Prisma client regeneration to avoid schema inconsistencies

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
