# Task Manager

A full-stack task management app: a NestJS + SQLite backend exposing a REST API, and a Next.js frontend consuming it. Users register and sign in, then create tasks, set due dates, mark them complete, edit them, and filter by status. Each user only sees their own tasks.

## Stack

- **Backend**: NestJS 11, Prisma ORM 7 on SQLite (`better-sqlite3` driver adapter), JWT authentication with Passport and bcrypt, class-validator/class-transformer, Jest
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

No `.env` file is required here either. The app starts on `http://localhost:3001` (Next.js will pick the next free port if 3000 is taken by the backend) and expects the API to be reachable at the URL configured by `NEXT_PUBLIC_API_URL`, falling back to `http://localhost:3000`.

Open the printed local URL in your browser to use the app.

## Environment variables

Both apps read all configuration from environment variables with sensible local defaults, so nothing needs to be set up to run them. Each app has a `.env.example` listing its variables.

- **Backend**: copy `backend/.env.example` to `backend/.env` and edit it; the API and the Prisma CLI both load it. Variables set in the shell take precedence.
- **Frontend**: copy `frontend/.env.example` to `frontend/.env.local` and edit it; Next.js loads it automatically.

### Backend

| Variable | Default | Description |
| - | - | - |
| `NODE_ENV` | `development` | `production` makes `JWT_SECRET` mandatory |
| `PORT` | `3000` | Port the API listens on |
| `DATABASE_URL` | `file:./data/tasks.db` | SQLite database URL, relative to `backend/` |
| `JWT_SECRET` | random per process (development only) | Secret used to sign access tokens, at least 32 characters. Without it, tokens stop working whenever the API restarts |
| `JWT_EXPIRES_IN_SECONDS` | `3600` | Access token lifetime |

### Frontend

| Variable | Default | Description |
| - | - | - |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Base URL of the backend API (the app calls `/api/auth/*` and `/api/tasks` under it) |

## API reference

### Authentication

| Method | Path | Body | Description |
| - | - | - | - |
| POST | `/api/auth/register` | `{ email: string, password: string }` | Create an account (password 8–72 bytes). `201` with `{ accessToken, user }`, `409` if the email is taken |
| POST | `/api/auth/login` | `{ email: string, password: string }` | `200` with `{ accessToken, user }`, `401` on wrong credentials |
| GET | `/api/auth/me` | — | The signed-in user |

`register` and `login` are limited to 10 requests per minute per client (`429` beyond that).

### Tasks

Every `/api/tasks` request needs an `Authorization: Bearer <accessToken>` header (`401` without a valid token). Tasks belong to the user who created them: a task of another user answers `404`, exactly like a task that does not exist.

| Method | Path | Body | Description |
| - | - | - | - |
| GET | `/api/tasks` | — | List your tasks |
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

- The web app keeps the access token in `localStorage` and returns to the sign-in screen when the API answers `401` (for example after the token expires). Storing the token there is simple but readable by any script on the page, so the app must stay free of XSS (React escapes rendered values; never inject raw HTML).
- CORS on the backend is restricted to `http://localhost:3001` (see `backend/src/main.ts`); update it if you run the frontend on a different origin.
- The schema lives in `backend/prisma/schema.prisma` and its history in `backend/prisma/migrations`. After changing the schema, run `npm run db:migrate -- --name <change>` from `backend/` to create and apply a new migration.
- `npm run start`, `start:dev` and `start:prod` run `prisma migrate deploy` first, so pending migrations are applied automatically.
- **Upgrading a database created before the Prisma migration** (the `tasks` table already exists): mark the initial migration as applied once, from `backend/`:

  ```bash
  npx prisma migrate resolve --applied 20261014005643_init
  ```

- Tasks created before accounts existed have no owner and are hidden. To give them to a user, after that user has registered, run from `backend/` (replace the email):

  ```bash
  npx prisma db execute --stdin <<< "UPDATE tasks SET userId = (SELECT id FROM users WHERE email = 'you@example.com') WHERE userId IS NULL;"
  ```
