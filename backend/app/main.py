from contextlib import asynccontextmanager
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.logger import setup_logging, logger, set_request_context, clear_request_context
from app.db.session import init_db
from app.api import (
    auth_router,
    analyze_router,
    coupons_router,
    football_router,
    subscription_router
)

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    setup_logging()
    logger.info(f"🚀 Starting {settings.app_name}...")
    await init_db()
    yield
    # Shutdown
    logger.info(f"👋 Shutting down {settings.app_name}...")


app = FastAPI(
    title=settings.app_name,
    description="API d'analyse de football avec IA",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Log all HTTP requests with timing and request ID."""
    # Generate request ID
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Set context for logging
    set_request_context(request_id)
    
    # Log incoming request
    logger.info(
        f"→ {request.method} {request.url.path}",
        extra={'extra_data': {
            'type': 'http_request_start',
            'method': request.method,
            'path': request.url.path,
            'query_params': str(request.query_params),
            'client_host': request.client.host if request.client else None
        }}
    )
    
    # Process request
    start_time = time.time()
    try:
        response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000
        
        # Log response
        logger.log_request(
            request.method,
            request.url.path,
            response.status_code,
            duration_ms
        )
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response
    
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        logger.error(
            f"✗ {request.method} {request.url.path} - ERROR ({duration_ms:.2f}ms): {str(e)}",
            exc_info=True,
            extra={'extra_data': {
                'type': 'http_request_error',
                'method': request.method,
                'path': request.url.path,
                'duration_ms': duration_ms,
                'error': str(e)
            }}
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "request_id": request_id}
        )
    
    finally:
        # Clear context
        clear_request_context()



# Health check
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": settings.app_name}


# API v1 routers
app.include_router(auth_router, prefix=settings.api_v1_str)
app.include_router(analyze_router, prefix=settings.api_v1_str)
app.include_router(coupons_router, prefix=settings.api_v1_str)
app.include_router(football_router, prefix=settings.api_v1_str)
app.include_router(subscription_router, prefix=settings.api_v1_str)


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API info."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }
