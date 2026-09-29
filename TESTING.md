# Final Testing (Phase 12)

This is a record of what was actually tested against this codebase, not a checklist
of intentions. Every phase in this project was tested live against a real PostgreSQL
instance and, for n8n, a mock webhook server standing in for your real n8n workflow
(since I don't have access to your actual n8n instance) — every response shown in
this project's build log was real output, not fabricated.

## Automated backend test pass (Phase 12, run together)

23/23 checks passed in one consolidated run against a clean database:

- Health check reports `database: ok`
- Register → 201; duplicate email → 400
- Login wrong password → 401; correct login → 200 with real JWT
- `GET /auth/me` with/without token → 200 / 401
- `PATCH /auth/me` updates the name for real
- Lead create → 201; list → 200; get single → 200
- Cross-user lead access → 404 (not leaked as 403)
- Lead status update → 200, persisted
- Lead search and status filter → correct scoped results
- Automation run against mock n8n → 200, real response text
- Automation with invalid email → 422 (caught before hitting n8n)
- Automation history → populated, scoped
- Conversations → populated with the real message/response pair
- Dashboard stats → real DB-derived numbers, not hardcoded
- Recent activity → 200
- Delete lead → 204, then a follow-up GET on it → 404

## What you still need to test yourself

I cannot test these from my sandbox — they require your actual machine, your actual
n8n instance, and a browser:

1. **The real n8n workflow.** Everything up to the `POST` to your webhook URL is
   verified. What your n8n workflow's AI Agent actually does with Groq, Gmail, and
   its own PostgreSQL tool is outside what I can verify — test this by running a real
   automation from the Automation page and checking your inbox / your DB.
2. **The actual UI in a browser.** I verified every page compiles and the API calls
   are wired correctly, but I can't click buttons in a real browser from here. Click
   through: register → login → create/edit/delete a lead → run an automation → check
   history → check conversations → check dashboard numbers update → edit your profile
   name → browse Settings tabs → resize the window to confirm the mobile nav works →
   logout → confirm protected routes redirect you to `/login`.
3. **Two real browser sessions** (or one normal + one incognito) to visually confirm
   two different logged-in users never see each other's leads/history/conversations —
   the backend enforces this (tested above), but seeing it in the actual UI is worth
   doing once.
4. **Unauthorized API access from a REST client** (Postman/curl) with no token or a
   tampered token against any `/api/...` route other than `/api/health`, `/api/auth/register`,
   and `/api/auth/login` — all should return 401.
5. **n8n unavailable** — stop your n8n instance and run an automation from the UI; you
   should see a clean error message (not a crash), and the failed attempt should still
   appear in Automation History with a FAILED badge.
6. **Database unavailable** — stop PostgreSQL and hit any endpoint; you should get a
   clean 500 message, never a stack trace (I verified this exact scenario from my side
   too — see `SECURITY.md`).

## Known, documented limitations (not bugs — deliberate scope decisions)

- `emails_sent` on the dashboard is derived from successful automation runs, since n8n
  reports one combined result per call rather than a distinct "email sent" event. See
  the comment in `app/routers/dashboard.py`.
- Conversations are created as a side effect of a successful automation run (the real
  message sent + the real n8n response), since that's the only point where an actual
  AI request/response pair exists in this system. See `app/routers/automation.py`.
- Settings page tabs other than the link to Profile are intentionally marked "Coming
  soon" rather than wired to fake functionality, per the spec's explicit instruction.
