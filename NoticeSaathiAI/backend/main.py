import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import init_db
from .routers import health, notices, checklist, samples

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("noticesaathi")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes database tables on application startup."""
    logger.info("Initializing database tables...")
    try:
        init_db()
        logger.info("NoticeSaathi database initialized successfully.")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
    yield
    logger.info("NoticeSaathi backend shutting down.")

app = FastAPI(
    title="NoticeSaathi AI API",
    description=(
        "Notice-to-Action Accessibility Assistant API. "
        "Transforms complex, multilingual college, scholarship, and public notices into simple, "
        "evidence-backed, actionable information powered by Google Gemma 4."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
allowed_origins = [
    settings.FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request size validation middleware
@app.middleware("http")
async def check_upload_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if content_length and int(content_length) > max_bytes:
        return JSONResponse(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            content={"detail": f"File or payload exceeds maximum allowed limit of {settings.MAX_UPLOAD_MB} MB."}
        )
    return await call_next(request)

# Global safe error handler - prevents leaking internal stack traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal error occurred while processing your request. Please try again or inspect system logs."}
    )

# Include Routers
app.include_router(health.router)
app.include_router(notices.router)
app.include_router(checklist.router)
app.include_router(samples.router)

@app.get("/", tags=["Root"])
def root_endpoint():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "api_health": "/api/health"
    }
