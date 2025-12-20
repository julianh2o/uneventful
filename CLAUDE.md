# CLAUDE.md

## Special instructions
IMPORTANT: Do not build or release unless specifically asked or granted permission.

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
yarn release            # Bump version, push tags, trigger automated GitHub Actions release
yarn release:local      # Manual: Build and push multi-platform Docker image to Docker Hub
```

## Architecture Overview

### Frontend (React/TypeScript)
- **Stack:** React 19, TypeScript, Material-UI v7, React Router v7, Emotion
- **Entry:** `src/App.tsx`
- **Key directories:** `src/components/`, `src/pages/`, `src/contexts/`, `src/utils/`
- **Authentication:** Passwordless SMS magic links via `AuthProvider.tsx`
  - Session token stored in localStorage as `uneventful_session_token`
  - **IMPORTANT:** Always use `apiClient` from `src/utils/apiClient.ts` for authenticated requests
- **Routing:** See `src/config/routes.ts` - unauthenticated routes (`/login`, `/auth/verify`) and authenticated routes (under `/`)

### Backend (Express/TypeScript)
- **Stack:** Express 5, TypeScript, Prisma, Twilio, node-cron
- **Entry:** `server/index.ts`
- **Database:** SQLite via Prisma (`data/uneventful.db`)
  - **IMPORTANT:** Run `npx prisma migrate deploy` before starting in production
- **Auth:** JWT-based (magic links expire in 15 min, sessions in 30 days)
- **Reminders:** Daily cron job at 9 AM (`server/reminderJob.ts`) reads `src/config/tasks.yaml`

### Environment Configuration

**Development:**
- Frontend: `http://localhost:2998`
- Backend: `http://localhost:2999`

**Production:**
- Same-origin serving (backend serves static build from `/build`)
- Environment detection in `src/utils/api.ts` uses `window.location.hostname`

**Environment Variables (.env):**
```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
JWT_SECRET=...
APP_BASE_URL=...       # For magic link URLs
PORT=2999              # Optional, defaults to 2999
DATABASE_URL=...       # SQLite file path
```

## Key Patterns

### Dynamic Forms
Forms are defined in YAML files in `src/config/` (e.g., `eventForm.yaml`, `tasks.yaml`). The `DynamicForm` component renders them automatically.

**To modify forms:** Edit the YAML files directly. See `src/types/FormConfig.ts` for field type definitions. Forms support:
- Multi-page flows
- Conditional field visibility (operators: equals, notEquals, in, contains, containsAny)
- Multiple field types: text, textarea, date, time, select, checkbox, checkboxGroup, radio

**To add tasks:** Edit `src/config/tasks.yaml` with task id, name, description, deadline (days relative to event date, e.g., 14 = 14 days before), and optional subtasks.

### Date/Time Formats
**IMPORTANT:** Two different formats are used:
- **Storage** (in database): `MM/DD/YYYY` and `h:MM AM/PM`
- **HTML inputs:** `YYYY-MM-DD` and `HH:MM` (24-hour)
- Conversion functions in `src/pages/EventRegistration.tsx`

### Type Definitions
Key types in `src/types/`:
- `FormConfig.ts` - Form field definitions
- `Route.ts` - App routing
- `User.ts` - User data

## Deployment

**IMPORTANT - Release Process: Automated via GitHub Actions**
1. `yarn release` - Bumps version (patch), creates git commit/tag, pushes to GitHub
2. GitHub Actions automatically builds multi-platform image and pushes to Docker Hub
3. **Manual alternative:** `yarn release:local` - Local Docker build and push (use `yarn version` first)

## API Reference

See `server/index.ts` for full endpoint definitions:
- Auth: `/api/auth/*` (request, register, verify, me)
- Events: `/api/events/*` (CRUD operations)
- Forms: `/api/forms/eventForm` (returns YAML config)
- Tasks: `/api/events/:id/tasks/:taskId/complete`

## Important Files

- `src/config/eventForm.yaml` - Event registration form definition
- `src/config/tasks.yaml` - Task definitions with deadlines
- `src/config/routes.ts` - App routing configuration
- `server/index.ts` - Express server and API endpoints
- `server/reminderJob.ts` - SMS reminder cron job
- `Dockerfile` - Multi-stage production build
- `docker-compose.prod.yml` - Standalone production deployment
