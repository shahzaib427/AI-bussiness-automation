"""
AI Business Automation - FastAPI Backend
Phase 11: security hardening — global exception handler so unhandled
errors never leak stack traces / internals to the client (they're logged
server-side instead, per section 28 of the spec).
"""
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.database.database import Base, engine, SessionLocal
from app.database import models  # noqa: F401 - ensures models are registered on Base
from app.routers import auth, automation, conversations, dashboard, leads

logger = logging.getLogger("ai_business_automation")

app = FastAPI(
    title="AI Business Automation API",
    description="Backend API for the AI Business Automation Platform. "
    "Talks to PostgreSQL for storage and to an existing n8n workflow "
    "for AI automation (Groq + Gmail + PostgreSQL tools).",
    version="0.1.0",
)

# CORS - only allow the configured frontend origin(s), never "*" in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catch anything that isn't already an HTTPException (those keep their own
    clean `detail` message). Logs the real error server-side for debugging,
    but returns a generic message to the client — never a stack trace,
    SQL text, or internal file paths.
    """
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


@app.on_event("startup")
def on_startup():
    """Create tables if they don't exist yet (users, leads, automation_logs, conversations)."""
    Base.metadata.create_all(bind=engine)


@app.get("/api/health", tags=["health"])
async def health_check():
    """
    Liveness check used by the frontend and for manual testing.
    Also reports whether the PostgreSQL connection is working, so a broken
    DB shows up immediately instead of silently failing later.
    """
    db_status = "ok"
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()
    except Exception as exc:  # pragma: no cover - reported to caller, not hidden
        db_status = f"error: {exc.__class__.__name__}"

    return {
        "status": "ok",
        "service": "ai-business-automation-backend",
        "version": app.version,
        "database": db_status,
    }


app.include_router(auth.router)
app.include_router(leads.router)
app.include_router(automation.router)
app.include_router(dashboard.router)
app.include_router(conversations.router)


@app.get("/", tags=["health"])
async def root():
    return {"message": "AI Business Automation API is running. See /docs for Swagger UI."}
