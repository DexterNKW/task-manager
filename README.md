# Task Manager

A full-stack task management app: a NestJS + SQLite backend exposing a REST API, and a Next.js frontend consuming it. Create tasks, set due dates, mark them complete, edit them, and filter by status.

## Stack

- **Backend**: NestJS 11, SQLite (`better-sqlite3`), class-validator/class-transformer, Jest
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript

## Project structure

```
task-manager/
├── backend/   # NestJS REST API
└── frontend/  # Next.js UI
```

## Prerequisites

- Node.js 20+ and npm

## Getting started

### 1. Backend

```bash
cd backend
npm install
cp .env.local.example .env.local   # optional, defaults work out of the box
npm run start:dev
```

The API starts on `http://localhost:3000` (or `PORT` if set) and creates a SQLite database file on first run.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # optional, defaults work out of the box
npm run dev
```

The app starts on `http://localhost:3001` (Next.js will pick the next free port if 3000 is taken by the backend) and expects the API to be reachable at the URL configured in `NEXT_PUBLIC_API_URL`.

Open the printed local URL in your browser to use the app.

## Environment variables

Both apps ship a `.env.local.example` file documenting the variables they read. Copy it to `.env.local` and adjust as needed — `.env.local` files (including the `.example` ones) are intentionally not committed to the repository.

### Backend (`backend/.env.local.example`)

| Variable  | Default               | Description                          |
|-----------|------------------------|--------------------------------------|
| `PORT`    | `3000`                 | Port the API listens on              |
| `DB_PATH` | `./data/tasks.db`      | Path to the SQLite database file     |

### Frontend (`frontend/.env.local.example`)

| Variable               | Default                              | Description                  |
|-------------------------|---------------------------------------|-------------------------------|
| `NEXT_PUBLIC_API_URL`  | `http://localhost:3000/api/tasks`     | Base URL of the tasks API     |

## API reference

Base path: `/api/tasks`

| Method | Path              | Body                                              | Description                     |
|--------|-------------------|----------------------------------------------------|----------------------------------|
| GET    | `/api/tasks`      | —                                                  | List all tasks                  |
| POST   | `/api/tasks`      | `{ title: string, dueDate?: string \| null }`      | Create a task                   |
| PUT    | `/api/tasks/:id`  | `{ title?, completed?, dueDate? }` (all optional)  | Update a task                   |
| DELETE | `/api/tasks/:id`  | —                                                  | Delete a task                   |

Errors are returned in a uniform shape:

```json
{
  "statusCode": 404,
  "message": "Task 999 not found",
  "error": "Not Found",
  "timestamp": "2026-07-04T12:00:00.000Z",
  "path": "/api/tasks/999"
}
```

## Testing

Run from `backend/`:

```bash
npm test            # unit tests
npm run test:e2e    # end-to-end tests (full CRUD flow against an in-memory database)
```

## Notes

- CORS on the backend is restricted to `http://localhost:3001` (see `backend/src/main.ts`); update it if you run the frontend on a different origin.
- The SQLite database file is created automatically on first backend start; no migrations are needed for this project's scope.
