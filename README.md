# AI Business Automation

A full-stack AI business automation platform: a React dashboard for managing leads and
running AI-powered automations, backed by a FastAPI API, PostgreSQL, and an existing
n8n workflow that drives a Groq-powered AI Agent with Gmail and PostgreSQL tools.

**Status: all 13 build phases complete.** Every feature below was built with real,
runnable code and tested against a live PostgreSQL database (see `TESTING.md` for the
exact test results and what still needs verification on your machine with your real
n8n instance).

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Folder structure](#folder-structure)
- [Installation](#installation)
  - [PostgreSQL setup](#postgresql-setup)
  - [Backend setup](#backend-setup)
  - [Frontend setup](#frontend-setup)
  - [n8n setup](#n8n-setup)
- [Environment variables](#environment-variables)
- [API endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Testing](#testing)
- [Deployment](#deployment)
- [Future improvements](#future-improvements)

---

## Overview

This project wraps an existing n8n automation workflow (Webhook → Edit Fields → AI
Agent with Groq, a Gmail tool, a PostgreSQL tool, and chat memory) in a real product:
a FastAPI backend that owns authentication, lead management, and automation history,
and a React frontend where a business user can manage leads, trigger AI automations,
and see exactly what the AI Agent did — without ever touching n8n directly.

The AI logic itself was **not** rebuilt — FastAPI only calls the existing n8n webhook
and reports back whatever it actually returns.

## Features

- **Authentication** — JWT-based register/login, protected routes, role support (user/admin)
- **Lead management** — full CRUD, search, status filter, pagination, ownership isolation
- **AI automation** — trigger the real n8n/Groq AI Agent from the UI and see its real response
- **Automation history** — every run logged with request/response data and status
- **Conversations** — every message sent to the AI Agent and what it actually said back
- **Dashboard** — live stats and recent activity computed from the database, never hardcoded
- **Profile & settings** — update your name; unimplemented settings honestly marked "Coming soon"
- **Security** — bcrypt password hashing, scoped CORS, ownership enforcement, no leaked stack traces (see `SECURITY.md`)

## Architecture

```
                     ┌────────────────────┐
                     │   React Frontend    │
                     │ (Vite, Tailwind)    │
                     └─────────┬───────────┘
                               │ HTTPS (JWT bearer)
                               ▼
                     ┌────────────────────┐
                     │   FastAPI Backend   │
                     │  (auth, leads,      │
                     │   automation,       │
                     │   dashboard, etc.)  │
                     └────┬───────────┬────┘
                          │           │
                          ▼           ▼
               ┌───────────────┐   ┌─────────────────┐
               │  PostgreSQL   │   │  n8n (webhook)   │
               │  users        │   └────────┬─────────┘
               │  leads        │            ▼
               │  automation_  │   ┌─────────────────┐
               │  logs         │   │    AI Agent      │
               │  conversations│   │   (Groq LLM)      │
               └───────────────┘   └───┬────────┬─────┘
                                        ▼        ▼
                                 ┌──────────┐ ┌──────────┐
                                 │  Gmail   │ │PostgreSQL│
                                 │  Tool    │ │  Tool +  │
                                 │          │ │Chat Memory│
                                 └──────────┘ └──────────┘
```

**How the pieces actually communicate:**

1. The **React frontend** never calls n8n directly. It only calls FastAPI, sending a
   JWT on every request after login.
2. **FastAPI** validates the JWT, enforces that a user only ever sees their own data
   (unless they're an admin), and is the only thing that talks to PostgreSQL *and* n8n.
3. For lead CRUD, dashboard stats, and history, FastAPI reads/writes **PostgreSQL**
   directly via SQLAlchemy.
4. For automations, FastAPI `POST`s to the **existing n8n webhook** and waits for its
   response — it does not reimplement any AI logic.
5. Inside **n8n**, the AI Agent (Groq) decides what to do, optionally calling its own
   Gmail tool (send a confirmation email) and its own PostgreSQL tool + chat memory
   (separate from — and not modified by — this project's `conversations` table, which
   records the same turn from the FastAPI side for the app's own history UI).
6. n8n's response flows back through FastAPI, gets logged to `automation_logs` and
   `conversations`, and is returned to the React frontend exactly as received — never
   altered or faked.

## Tech stack

**Backend:** Python 3.11+, FastAPI, Uvicorn, SQLAlchemy, PostgreSQL (via `psycopg` v3),
Pydantic v2, `python-jose` (JWT), `passlib`+`bcrypt` (password hashing), `httpx` (async
n8n calls), `python-dotenv`

**Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, Lucide React

**Database:** PostgreSQL 14+

**Automation:** n8n (your existing workflow — Webhook → Edit Fields → AI Agent)

**LLM:** Groq, called from inside your existing n8n AI Agent node (not called directly by this app)

## Folder structure

```
AI-bussiness-automation/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, global exception handler, routers
│   │   ├── core/
│   │   │   ├── config.py            # Settings loaded from environment / .env
│   │   │   └── security.py          # Password hashing + JWT create/decode
│   │   ├── database/
│   │   │   ├── database.py          # Engine, session factory, Base, get_db()
│   │   │   └── models.py            # User, Lead, AutomationLog, Conversation
│   │   ├── schemas/                 # Pydantic request/response models
│   │   │   ├── auth.py
│   │   │   ├── lead.py
│   │   │   ├── automation.py
│   │   │   ├── conversation.py
│   │   │   └── dashboard.py
│   │   ├── routers/                 # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── leads.py
│   │   │   ├── automation.py
│   │   │   ├── conversations.py
│   │   │   └── dashboard.py
│   │   ├── services/                # Business logic, reused across routers
│   │   │   ├── n8n_service.py       # httpx call to n8n + safe response parsing
│   │   │   ├── lead_service.py
│   │   │   ├── automation_service.py
│   │   │   └── conversation_service.py
│   │   └── dependencies/
│   │       └── auth.py              # get_current_user / get_current_admin_user
│   ├── test_db_connection.py        # Standalone DB connectivity check
│   ├── requirements.txt
│   ├── .env.example
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── components/              # Badge, Modal, ConfirmDialog, Pagination, EmptyState, Loader, StatCard, ProtectedRoute
│   │   ├── layouts/
│   │   │   └── AppLayout.jsx        # Top nav (desktop + mobile), user menu
│   │   ├── pages/                   # One file per route
│   │   ├── services/
│   │   │   └── api.js               # Axios instance + all API calls
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── App.jsx                  # Routes
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .gitignore
│
├── SECURITY.md                      # Phase 11 security review
├── TESTING.md                       # Phase 12 test results
└── README.md
```

## Installation

### PostgreSQL setup

1. Install PostgreSQL 14+ if you don't already have it.
2. Create the database:
   ```sql
   CREATE DATABASE ai_business_automation;
   ```
   (Tables are created automatically on backend startup — no manual migration step needed.)

### Backend setup

```cmd
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` and set your real `DATABASE_URL` password and a real `SECRET_KEY`. Then:

```cmd
python test_db_connection.py
```

You should see `✅ All expected tables exist.` Then run the server:

```cmd
uvicorn app.main:app --reload --port 8000
```

Backend: `http://localhost:8000` · Swagger docs: `http://localhost:8000/docs`

### Frontend setup

```cmd
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

### n8n setup

This project **uses your existing n8n workflow as-is** — it does not create or modify
it. Make sure:

1. Your n8n instance is running (e.g. `http://localhost:5678`).
2. The workflow (Webhook → Edit Fields → AI Agent with Groq + Gmail + PostgreSQL tools)
   is active.
3. `backend/.env`'s `N8N_WEBHOOK_URL` points at that workflow's webhook URL.
4. The webhook accepts a JSON body shaped like:
   ```json
   { "name": "Ali Khan", "email": "ali@example.com", "company": "ABC Software", "message": "Please contact me." }
   ```

## Environment variables

`backend/.env.example`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (`postgresql+psycopg://user:pass@host:port/db`) |
| `SECRET_KEY` | JWT signing secret — change this, never commit a real one |
| `ALGORITHM` | JWT algorithm (`HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT lifetime in minutes |
| `N8N_WEBHOOK_URL` | Your existing n8n workflow's webhook URL |
| `FRONTEND_URL` | Used to build the CORS allow-list |

The frontend has no `.env` of its own — it calls a hardcoded `http://localhost:8000/api`
base URL (see `frontend/src/services/api.js`) since it's a local dev setup; change that
constant if you deploy the backend elsewhere.

## API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Liveness + DB connectivity check |
| POST | `/api/auth/register` | No | Create an account |
| POST | `/api/auth/login` | No | Get a JWT |
| GET | `/api/auth/me` | Yes | Current user |
| PATCH | `/api/auth/me` | Yes | Update your name |
| POST | `/api/leads` | Yes | Create a lead |
| GET | `/api/leads` | Yes | List leads (`page`, `limit`, `search`, `status`) |
| GET | `/api/leads/{id}` | Yes | Get one lead |
| PATCH | `/api/leads/{id}` | Yes | Update status/company/message |
| DELETE | `/api/leads/{id}` | Yes | Delete a lead |
| POST | `/api/automation/send` | Yes | Call the n8n webhook, log the result |
| GET | `/api/automation/history` | Yes | List past automation runs (`page`, `limit`, `status`) |
| GET | `/api/automation/{id}` | Yes | One automation run |
| GET | `/api/conversations` | Yes | List AI conversation turns (`page`, `limit`) |
| GET | `/api/conversations/{id}` | Yes | One conversation turn |
| GET | `/api/dashboard/stats` | Yes | Live counts (leads, automations, etc.) |
| GET | `/api/dashboard/recent-activity` | Yes | Recent automation runs |

All "Yes" routes require `Authorization: Bearer <token>` and are scoped to the
requesting user unless they're an admin. Full interactive docs at `/docs`.

## Screenshots

_Add screenshots here before publishing — e.g._

```
![Dashboard](docs/screenshots/dashboard.png)
![Leads](docs/screenshots/leads.png)
![Automation](docs/screenshots/automation.png)
```

## Testing

See [`TESTING.md`](./TESTING.md) for the full record of what was tested (23/23
automated backend checks passing against a real database) and a checklist of what to
verify yourself in a browser against your real n8n instance.

## Deployment

This project ships configured for local development. For a real deployment:

- **Backend:** run behind a process manager (e.g. `gunicorn -k uvicorn.workers.UvicornWorker`)
  behind a reverse proxy (nginx/Caddy) that terminates TLS. Set `DATABASE_URL`,
  `SECRET_KEY`, and `N8N_WEBHOOK_URL` via real environment/secret management, not a
  committed `.env` file.
- **Frontend:** `npm run build` produces a static `dist/` folder — serve it from any
  static host (Vercel, Netlify, S3+CloudFront, or the same reverse proxy as the API).
  Update the hardcoded API base URL in `frontend/src/services/api.js` to your deployed
  backend's URL.
- **Database:** use a managed PostgreSQL instance; the app creates tables automatically
  on startup, but for a production deployment consider switching to versioned
  migrations (e.g. Alembic) instead of `Base.metadata.create_all`.
- **CORS:** update `FRONTEND_URL` to your real deployed frontend origin.
- See `SECURITY.md` for the full list of production hardening recommendations
  (rate limiting, HTTPS, refresh tokens) that were deliberately left undone in this
  build rather than faked.

## Future improvements

- Rate limiting on `/api/auth/login` and `/api/automation/send`
- Refresh tokens / shorter-lived access tokens
- Alembic migrations instead of `create_all`
- Admin UI for managing all users' leads (backend already supports the `admin` role)
- Per-lead automation history (link a specific lead to the automation runs about it)
- Real-time updates (WebSocket) instead of manual refresh on the dashboard
- Password reset flow
- Two-factor authentication (currently listed as "Coming soon" in Settings)
