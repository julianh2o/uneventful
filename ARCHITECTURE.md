# Architecture

## Overview

uneventful is an event management application built with a React/TypeScript frontend and Express backend. The application features form-driven workflows, task tracking, and automated SMS reminders via Twilio.

## System Architecture

### Frontend (React/TypeScript)

**Stack:**
- React 19
- TypeScript
- Material-UI v7
- React Router v7
- Emotion (CSS-in-JS)

**Entry Point:** `src/App.tsx`

**Directory Structure:**
- `src/components/` - Reusable UI components
- `src/pages/` - Route-based page components
- `src/contexts/` - React context providers
- `src/utils/` - Utility functions and helpers
- `src/config/` - YAML configuration files for forms and tasks
- `src/types/` - TypeScript type definitions

**Authentication:**
- Passwordless SMS magic links via `AuthProvider.tsx`
- Session token stored in localStorage as `uneventful_session_token`
- **IMPORTANT:** Always use `apiClient` from `src/utils/apiClient.ts` for authenticated requests

**Routing:**
- Configuration: `src/config/routes.ts`
- Unauthenticated routes: `/login`, `/auth/verify`
- Authenticated routes: All routes under `/`

### Backend (Express/TypeScript)

**Stack:**
- Express 5
- TypeScript
- Prisma (ORM)
- Twilio (SMS)
- node-cron (scheduled tasks)

**Entry Point:** `server/index.ts`

**Database:**
- SQLite via Prisma
- Location: `data/uneventful.db`
- **IMPORTANT:** Run `npx prisma migrate deploy` before starting in production

**Authentication:**
- JWT-based authentication
- Magic links expire in 15 minutes
- Session tokens expire in 30 days

**Reminders:**
- Daily cron job runs at 9 AM
- Implementation: `server/reminderJob.ts`
- Configuration: `src/config/tasks.yaml`

### Environment Configuration

**Development:**
- Frontend: `http://localhost:2998`
- Backend: `http://localhost:2999`
- Separate servers with CORS enabled

**Production:**
- Same-origin serving (backend serves static build from `/build`)
- Environment detection in `src/utils/api.ts` uses `window.location.hostname`

**Environment Variables (.env):**
```
TWILIO_ACCOUNT_SID=...      # Twilio account identifier
TWILIO_AUTH_TOKEN=...       # Twilio authentication token
TWILIO_PHONE_NUMBER=...     # Twilio phone number for sending SMS
JWT_SECRET=...              # Secret for signing JWT tokens
APP_BASE_URL=...            # Base URL for magic link generation
PORT=2999                   # Optional, defaults to 2999
DATABASE_URL=...            # SQLite file path
```

## Key Patterns

### Dynamic Forms

Forms are defined in YAML files in `src/config/` (e.g., `eventForm.yaml`, `tasks.yaml`). The `DynamicForm` component renders them automatically based on the configuration.

**Form Configuration:**
- See `src/types/FormConfig.ts` for field type definitions
- Supports multi-page flows
- Conditional field visibility with operators:
  - `equals` - Field value equals specific value
  - `notEquals` - Field value doesn't equal specific value
  - `in` - Field value is in array of values
  - `contains` - Field value contains substring
  - `containsAny` - Field value contains any of specified values

**Supported Field Types:**
- `text` - Single-line text input
- `textarea` - Multi-line text input
- `date` - Date picker
- `time` - Time picker
- `select` - Dropdown selection
- `checkbox` - Single checkbox
- `checkboxGroup` - Multiple checkboxes
- `radio` - Radio button group

**To modify forms:** Edit the YAML files directly in `src/config/`

**To add tasks:** Edit `src/config/tasks.yaml` with:
- `id` - Unique task identifier
- `name` - Display name
- `description` - Task description
- `deadline` - Days relative to event date (e.g., 14 = 14 days before event)
- `subtasks` - Optional array of subtasks

### Date/Time Formats

**IMPORTANT:** The application uses two different date/time formats:

**Storage Format (Database):**
- Date: `MM/DD/YYYY`
- Time: `h:MM AM/PM`

**HTML Input Format:**
- Date: `YYYY-MM-DD`
- Time: `HH:MM` (24-hour)

**Conversion Functions:** Located in `src/pages/EventRegistration.tsx`

### Type Definitions

Key TypeScript types are defined in `src/types/`:
- `FormConfig.ts` - Form field definitions and configuration types
- `Route.ts` - Application routing types
- `User.ts` - User data structures

## API Reference

See `server/index.ts` for complete endpoint definitions.

### Authentication Endpoints
- `POST /api/auth/request` - Request magic link
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify` - Verify magic link token
- `GET /api/auth/me` - Get current user info

### Event Endpoints
- `GET /api/events` - List all events
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Form Endpoints
- `GET /api/forms/eventForm` - Get event form YAML configuration

### Task Endpoints
- `POST /api/events/:id/tasks/:taskId/complete` - Mark task as complete

## Important Files

### Configuration
- `src/config/eventForm.yaml` - Event registration form definition
- `src/config/tasks.yaml` - Task definitions with deadlines
- `src/config/routes.ts` - Application routing configuration

### Backend
- `server/index.ts` - Express server and API endpoints
- `server/reminderJob.ts` - SMS reminder cron job
- `prisma/schema.prisma` - Database schema

### Frontend
- `src/App.tsx` - Application entry point
- `src/contexts/AuthProvider.tsx` - Authentication context
- `src/utils/apiClient.ts` - API client with authentication
- `src/utils/api.ts` - API endpoint configuration
- `src/types/FormConfig.ts` - Form type definitions

### Deployment
- `Dockerfile` - Multi-stage production build
- `docker-compose.prod.yml` - Standalone production deployment
- `.github/workflows/` - GitHub Actions CI/CD

## Directory Structure

```
uneventful/
├── src/                    # Frontend source
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   ├── contexts/         # React contexts
│   ├── utils/            # Utilities
│   ├── config/           # YAML configurations
│   └── types/            # TypeScript types
├── server/                # Backend source
│   ├── index.ts          # Express server
│   └── reminderJob.ts    # Cron job
├── prisma/                # Database
│   └── schema.prisma     # Schema definition
├── data/                  # Runtime data
│   └── uneventful.db     # SQLite database
└── build/                 # Production build output
```
