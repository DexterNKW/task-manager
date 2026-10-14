# Task Manager

A full-stack task management app: a NestJS + SQLite backend exposing a REST API, and a Next.js frontend consuming it. Create tasks, set due dates, mark them complete, edit them, and filter by status.

## Stack

- **Backend**: NestJS 11, Prisma ORM 7 on SQLite (`better-sqlite3` driver adapter), class-validator/class-transformer, Jest
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript, Vitest

## Project structure

```text
task-manager/
├── backend/   # NestJS REST API
└── frontend/  # Next.js UI
```

## Prerequisites

- Node.js 22.18 or later (pinned to 22 in `.nvmrc`) and npm

## Getting started

### 1. Backend

```bash
cd backend
npm install
npm run start:dev
```

No `.env` file is required — every variable below has a working default. The API starts on `http://localhost:3000` (or `PORT` if set) and applies the database migrations before starting, which also creates the SQLite database file (and its parent directory) on first run. `npm install` generates the Prisma client into `src/generated/prisma` (not committed).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

No `.env` file is required here either. The app starts on `http://localhost:3001` (Next.js will pick the next free port if 3000 is taken by the backend) and expects the API to be reachable at the URL configured by `NEXT_PUBLIC_API_URL`, falling back to `http://localhost:3000/api/tasks`.

Open the printed local URL in your browser to use the app.

## Environment variables

Both apps read all configuration from environment variables with sensible local defaults, so nothing needs to be set up to run them. Each app has a `.env.example` listing its variables.

- **Backend**: set the variables in the shell that starts the API (for example `PORT=4000 npm run start:dev`).
- **Frontend**: copy `frontend/.env.example` to `frontend/.env.local` and edit it; Next.js loads it automatically.

### Backend

| Variable | Default | Description |
| - | - | - |
| `PORT` | `3000` | Port the API listens on |
| `DATABASE_URL` | `file:./data/tasks.db` | SQLite database URL, relative to `backend/` |

### Frontend

| Variable | Default | Description |
| - | - | - |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api/tasks` | Base URL of the tasks API |

## API reference

Base path: `/api/tasks`

| Method | Path | Body | Description |
| - | - | - | - |
| GET | `/api/tasks` | — | List all tasks |
| POST | `/api/tasks` | `{ title: string, dueDate?: string \| null }` | Create a task |
| PUT | `/api/tasks/:id` | `{ title?, completed?, dueDate? }` (all optional) | Update a task |
| DELETE | `/api/tasks/:id` | — | Delete a task |

Errors are returned in a uniform shape:

```json
{
  "statusCode": 404,
  "message": "Task 999 not found",
  "error": "NOT_FOUND",
  "timestamp": "2026-07-04T12:00:00.000Z",
  "path": "/api/tasks/999"
}
```

## Testing

Run from `backend/`:

```bash
npm test            # unit tests
npm run test:e2e    # end-to-end tests (full CRUD flow against a temporary database)
```

Run from `frontend/`:

```bash
npm test            # unit tests (Vitest)
```

Static checks, available in both `backend/` and `frontend/`:

```bash
npm run typecheck   # TypeScript without emitting
npm run lint        # ESLint (in backend/ this applies fixes; use npm run lint:check to only report)
```

CI (`.github/workflows/ci.yml`) runs lint, type check, tests and build for both apps on every push to `index` and on every pull request.

## Notes

- CORS on the backend is restricted to `http://localhost:3001` (see `backend/src/main.ts`); update it if you run the frontend on a different origin.
- The schema lives in `backend/prisma/schema.prisma` and its history in `backend/prisma/migrations`. After changing the schema, run `npm run db:migrate -- --name <change>` from `backend/` to create and apply a new migration.
- `npm run start`, `start:dev` and `start:prod` run `prisma migrate deploy` first, so pending migrations are applied automatically.
- **Upgrading a database created before the Prisma migration** (the `tasks` table already exists): mark the initial migration as applied once, from `backend/`:

  ```bash
  npx prisma migrate resolve --applied 20261014005643_init
  ```
