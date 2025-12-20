# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

uneventful is an event management application built on a React/TypeScript frontend with an Express backend. The app helps event hosts manage their events through form-driven workflows, task tracking, and automated SMS reminders.

## Commands

### Development
```bash
# Frontend (React on port 2998)
yarn start

# Backend server (development mode with hot reload)
yarn server:dev

# Backend server (production)
yarn server

# Build production frontend
yarn build
```

### Testing and Code Quality
```bash
# Run frontend tests
yarn test

# Run server tests
yarn test:server

# Lint code
yarn lint

# Format code with Prettier
yarn format
```

## Architecture

### Dual Environment System

The application has distinct development and production configurations:

**Development:**
- Frontend: `http://localhost:2998`
- Backend API: `http://localhost:2999`
- API calls use explicit port 2999

**Production:**
- Frontend and backend served from same origin (e.g., `https://uneventful.bawdyshop.space`)
- Backend serves static React build from `/build` directory
- API detection in `src/utils/api.ts` uses `window.location.hostname` to determine environment

### Frontend Architecture

**Key Technologies:** React 17, TypeScript, Material-UI v5, React Router v5, Emotion (CSS-in-JS)

**Core Structure:**
- `src/App.tsx` - Main app with routing, theme provider, and auth provider
- `src/contexts/` - Context providers (Auth, ThemeMode, App)
- `src/providers/AuthProvider.tsx` - Manages authentication state and session persistence
- `src/components/` - Reusable components organized by feature
- `src/pages/` - Route-level page components
- `src/services/` - API service layer (`authService.ts`, etc.)
- `src/utils/` - Utilities including `apiClient.ts` (authenticated fetch wrapper) and `api.ts` (environment-aware base URL)

**Authentication Flow:**
- Passwordless magic link authentication via SMS (Twilio)
- Login flow: User enters phone → receives SMS with link → clicks link → auto-logged in
- Session managed via JWT stored in localStorage (`uneventful_session_token`)
- Protected routes use `ProtectedRoute` component wrapper
- `AuthContext` provides `user`, `login`, `logout`, `refreshUser` throughout app

**Routing:**
- Two-tier routing: unauthenticated routes (`/login`, `/auth/verify`) and authenticated routes (everything under `/`)
- Routes defined in `src/config/routes.ts`
- Protected routes wrapped in `Layout` component which includes Header, Navigation, Footer

### Backend Architecture

**Key Technologies:** Express, TypeScript, Twilio (SMS), node-cron, JWT

**Server Entry:** `server/index.ts`

**Data Storage:**
- File-based JSON storage (no database)
- Events stored in `data/events.json`
- Users stored in `data/users.json`
- Both files created automatically if missing

**Authentication System (`server/auth.ts`, `server/userStorage.ts`):**
- Magic link tokens (JWT, 15 min expiry)
- Session tokens (JWT, 30 day expiry)
- Rate limiting (3 requests per 5 minutes per phone number)
- Phone number normalization to E.164 format

**API Endpoints:**
- `POST /api/auth/request` - Request magic link (sends SMS)
- `POST /api/auth/register` - Register new user with phone and name
- `GET /api/auth/verify?token=...` - Verify magic link, returns session token
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `GET /api/events` - List user's events
- `POST /api/events/:id/tasks/:taskId/complete` - Mark task complete
- `GET /api/forms/eventForm` - Get event form configuration (YAML)

**Reminder System (`server/reminderJob.ts`):**
- Cron job runs daily at 9:00 AM
- Reads tasks from `src/config/tasks.yaml`
- Tasks have deadlines relative to event date (e.g., 14 = 14 days before, -1 = 1 day after)
- Sends SMS reminders for tasks due that day to event hosts
- Respects task completion status (won't remind for completed tasks)

### Dynamic Form System

**Configuration-Driven Forms:**

Forms are defined in YAML files in `src/config/` (e.g., `eventForm.yaml`, `tasks.yaml`). The `DynamicForm` component (`src/components/DynamicForm/`) renders forms from these configs.

**Form Configuration Structure:**
```yaml
title: Form Title
description: Optional markdown description
pages:  # Multi-page forms supported
  - title: Page Title
    description: Optional markdown
    fields:
      - id: fieldId
        type: text|textarea|date|time|select|checkbox|checkboxGroup|radio
        label: Field Label
        title: Optional title (for checkboxes)
        required: true|false
        description: Optional markdown description
        options:  # For select/checkboxGroup/radio
          # Array format:
          - value: 'val1'
            label: 'Label 1'
          # OR Dictionary format:
          val1: 'Label 1'
          val2: 'Label 2'
        condition:  # Conditional visibility
          field: otherFieldId
          operator: equals|notEquals|in|contains|containsAny
          value: 'value'  # or values: ['val1', 'val2']
```

**Conditional Logic:**
- Fields can be shown/hidden based on other field values
- Operators: `equals`, `notEquals`, `in`, `contains` (for checkboxGroup), `containsAny`
- CheckboxGroup values stored as JSON string arrays

**Form Types:**
- `eventForm.yaml` - Multi-page event registration form with conditional agreements
- `tasks.yaml` - Task definitions with deadlines and subtasks

### Date/Time Format Conventions

**Storage format (in events.json):**
- Dates: `MM/DD/YYYY` (e.g., "12/25/2024")
- Times: `h:MM AM/PM` (e.g., "7:30 PM")

**Input format (HTML date/time inputs):**
- Dates: `YYYY-MM-DD` (e.g., "2024-12-25")
- Times: `HH:MM` 24-hour (e.g., "19:30")

**Conversion handled in:** `src/pages/EventRegistration.tsx` via `formatDateForStorage`, `formatDateForInput`, `formatTimeForStorage`, `formatTimeForInput`

### Type Definitions

Key types in `src/types/`:
- `FormConfig.ts` - Form field definitions, supports both array and dictionary options format
- `Route.ts` - App routing structure
- `User.ts` - User data structure

## Important Patterns

### API Calls
Always use `apiClient` from `src/utils/apiClient.ts` for authenticated requests. It automatically adds the JWT token from localStorage.

### Adding New Form Fields
1. Update YAML config in `src/config/eventForm.yaml`
2. Field types are rendered automatically by `DynamicForm` component
3. Use conditional logic to show fields based on other selections

### Adding New Tasks
Edit `src/config/tasks.yaml` with task id, name, description, deadline (days relative to event), and optional subtasks.

### Environment Variables
Backend uses `.env` file with:
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `JWT_SECRET`
- `APP_BASE_URL` (for magic link URLs)
- `PORT` (defaults to 2999)

## Deployment Notes

### Traditional Deployment

Production deployment requires:
1. Build frontend: `yarn build`
2. Start server: `yarn server` (serves both API and static build)
3. Ensure `.env` configured with production values
4. Server listens on PORT from env or 2999
5. Frontend automatically detects production environment and uses same-origin API calls

### Docker Deployment

**Development with Docker Compose:**

Use `docker-compose.yml` (default) to build and run locally:

```bash
# Create a .env file with your configuration:
# TWILIO_ACCOUNT_SID=your_sid
# TWILIO_AUTH_TOKEN=your_token
# TWILIO_PHONE_NUMBER=your_number
# JWT_SECRET=your_secret
# APP_BASE_URL=http://localhost:2999

# Start the application (builds from source)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

**Production with Docker Compose (recommended):**

Use `docker-compose.prod.yml` to deploy the published image:

```bash
# Create a .env file with your production configuration:
# TWILIO_ACCOUNT_SID=your_sid
# TWILIO_AUTH_TOKEN=your_token
# TWILIO_PHONE_NUMBER=your_number
# JWT_SECRET=your_secret
# APP_BASE_URL=https://your-domain.com

# Start the application (uses published image from Docker Hub)
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop the application
docker-compose -f docker-compose.prod.yml down
```

**Standalone Deployment:**

The `docker-compose.prod.yml` file is completely standalone. You can:
1. Copy just `docker-compose.prod.yml` to your production server
2. Create a `.env` file with your configuration
3. Run `docker-compose -f docker-compose.prod.yml up -d`

No source code or build step required!

**Manual Docker Run:**
```bash
# Build the Docker image locally
docker build -t uneventful .

# Or pull from Docker Hub
docker pull julianh2o/uneventful:latest

# Run the container
docker run -d \
  -p 2999:2999 \
  -v $(pwd)/data:/app/data \
  -e TWILIO_ACCOUNT_SID=your_sid \
  -e TWILIO_AUTH_TOKEN=your_token \
  -e TWILIO_PHONE_NUMBER=your_number \
  -e JWT_SECRET=your_secret \
  -e APP_BASE_URL=https://your-domain.com \
  --name uneventful \
  julianh2o/uneventful:latest
```

**Docker Configuration:**
- Multi-stage build for optimized image size
- Node.js 18 Alpine base image
- Production dependencies only in final image
- Data directory mounted as volume for persistence
- Healthcheck endpoint at `/api/health`
- Automatic restart unless stopped
- Port 2999 exposed (configurable via PORT env var)
- OCI-compliant image labels with version metadata

### Publishing to Docker Hub

**Prerequisites:**
1. Create a Docker Hub account at https://hub.docker.com
2. Login to Docker Hub locally:
   ```bash
   docker login
   ```

**Release Process:**

Version management uses yarn's built-in `version` command, then `yarn release` builds and pushes:

```bash
# Step 1: Bump version (creates git commit and tag)
yarn version --patch      # 2.0.0 -> 2.0.1
yarn version --minor      # 2.0.0 -> 2.1.0
yarn version --major      # 2.0.0 -> 3.0.0
yarn version --new-version 3.5.0  # Custom version

# Step 2: Build and push to Docker Hub
yarn release

# Step 3: Push git changes and tags
git push && git push --tags
```

**What the release script does:**
1. Reads current version from `package.json`
2. Builds Docker image with version metadata (version, build date, git commit)
3. Tags image with both specific version (e.g., `julianh2o/uneventful:2.0.1`) and `latest`
4. Pushes both tags to Docker Hub

**Docker Hub Repository:**
- Images are published to `julianh2o/uneventful`

**Manual Docker Build (if needed):**
```bash
# Build with version metadata
docker build \
  --build-arg VERSION=2.0.0 \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --build-arg VCS_REF=$(git rev-parse --short HEAD) \
  -t julianh2o/uneventful:2.0.0 \
  -t julianh2o/uneventful:latest .

# Push to Docker Hub
docker push julianh2o/uneventful:2.0.0
docker push julianh2o/uneventful:latest
```

**Using Published Images:**
```bash
# Pull specific version
docker pull julianh2o/uneventful:2.0.0

# Pull latest
docker pull julianh2o/uneventful:latest

# Run published image
docker run -d \
  -p 2999:2999 \
  -v $(pwd)/data:/app/data \
  -e TWILIO_ACCOUNT_SID=your_sid \
  -e TWILIO_AUTH_TOKEN=your_token \
  -e TWILIO_PHONE_NUMBER=your_number \
  -e JWT_SECRET=your_secret \
  -e APP_BASE_URL=https://your-domain.com \
  julianh2o/uneventful:latest
```
