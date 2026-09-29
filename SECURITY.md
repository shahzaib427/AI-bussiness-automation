# Security Review (Phase 11)

A pass over the areas the spec calls out, what was found, and what was fixed.

## Authentication & JWT
- Tokens are signed with `HS256` using `SECRET_KEY` from environment (never hardcoded; `.env.example` ships a placeholder that must be changed).
- Token expiry is configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (default 24h) — no infinite tokens.
- `get_current_user` validates the signature and expiry on every request via `jose.jwt.decode`; an invalid/expired token returns a clean `401`, never a stack trace.
- **Recommendation for production:** add a refresh-token flow and/or shorter-lived access tokens if this goes beyond portfolio use. Not implemented here — flagged rather than faked.

## Password handling
- Passwords are hashed with **bcrypt** via `passlib` before storage — verified in Phase 3 testing that the DB never contains plaintext.
- Minimum length of 8 characters enforced by Pydantic (`RegisterRequest`).
- **Recommendation:** add a password-strength meter / complexity rule client-side if this becomes a public-facing product.

## Authorization / ownership
- Every leads, automation, and conversation endpoint scopes queries to `current_user.id` unless the user is `admin`.
- Cross-user access attempts return `404` (not `403`), so a user can't even confirm another user's record exists — verified in Phase 4/6/8 testing (Sara could not see or fetch Ali's records by ID).

## CORS
- `CORSMiddleware` only allows `settings.CORS_ORIGINS` (built from `FRONTEND_URL`, default `http://localhost:5173`) — no wildcard `*`. Confirmed in code (`app/main.py`).

## Database access
- All queries go through SQLAlchemy's ORM query builder — no raw SQL string concatenation anywhere in the codebase, so standard SQL injection via user input isn't possible through this API.
- Foreign keys and cascade rules are defined in `app/database/models.py` (e.g. deleting a user cascades their leads/logs/conversations; deleting a lead nulls out `automation_logs.lead_id` rather than orphaning silently).

## Input validation
- Every request body is a typed Pydantic model — unexpected/extra fields are ignored, wrong types are rejected with a `422` before touching the database.
- Email fields use `EmailStr` (via `email-validator`).

## Secret handling
- `SECRET_KEY`, `DATABASE_URL`, and `N8N_WEBHOOK_URL` are only ever read from environment variables (`app/core/config.py`), never hardcoded in source.
- `.env` is in `.gitignore` for both backend and frontend — confirmed present since Phase 1.
- The frontend never sees backend secrets — it only calls `http://localhost:8000/api/...`.

## Error handling
- Added a global exception handler (`app/main.py`) in this phase: any unhandled exception is logged server-side with `logger.exception` (full traceback in your server logs) but the client only ever receives `{"detail": "An unexpected error occurred. Please try again later."}` — no stack trace, no SQL, no file paths leak to the browser.
- Every intentionally-raised error (`HTTPException`) already returned clean, specific `detail` messages (verified throughout Phases 3–8): `"Invalid email or password"`, `"Lead not found"`, `"Unable to connect to the n8n automation service"`, etc.
- `automation_logs.request_data` / `response_data` only ever store the lead payload and n8n's response — never passwords or JWTs (confirmed by inspecting `log_automation` call sites; nothing in the codebase passes credentials into it).

## What was NOT added (and why)
- **Rate limiting** — not implemented. For a real deployment, add `slowapi` or a reverse-proxy-level limiter on `/api/auth/login` and `/api/automation/send` to prevent brute-force and n8n-hammering. Left as a documented gap rather than a fake/partial implementation.
- **HTTPS enforcement** — this is a local dev setup (`http://localhost`); in production, terminate TLS at a reverse proxy (nginx/Caddy) or your hosting platform and set `SECRET_KEY`/`DATABASE_URL` via real secret management, not a `.env` file.
