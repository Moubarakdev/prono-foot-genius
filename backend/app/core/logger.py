import logging
import sys
import json
from datetime import datetime
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict, Optional
from contextvars import ContextVar
from app.core.config import get_settings

settings = get_settings()

# Context variables for request tracking
request_id_ctx: ContextVar[Optional[str]] = ContextVar('request_id', default=None)
user_id_ctx: ContextVar[Optional[str]] = ContextVar('user_id', default=None)


class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured JSON logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add context if available
        request_id = request_id_ctx.get()
        user_id = user_id_ctx.get()
        if request_id:
            log_data["request_id"] = request_id
        if user_id:
            log_data["user_id"] = user_id
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, 'extra_data'):
            log_data.update(record.extra_data)
        
        return json.dumps(log_data, ensure_ascii=False)


class ColoredConsoleFormatter(logging.Formatter):
    """Colored formatter for console output."""
    
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        
        # Add context info
        request_id = request_id_ctx.get()
        user_id = user_id_ctx.get()
        context = ""
        if request_id:
            context += f" [req:{request_id[:8]}]"
        if user_id:
            context += f" [user:{user_id[:8]}]"
        
        log_format = (
            f"{color}%(asctime)s{self.RESET} - "
            f"{color}%(levelname)-8s{self.RESET}{context} - "
            f"%(name)s.%(funcName)s:%(lineno)d - "
            f"%(message)s"
        )
        
        formatter = logging.Formatter(log_format, datefmt='%H:%M:%S')
        return formatter.format(record)


def setup_logging():
    """Configure logging for the application."""
    
    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if settings.debug else logging.INFO)
    root_logger.handlers.clear()
    
    # Console Handler (colored for development)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG if settings.debug else logging.INFO)
    console_handler.setFormatter(ColoredConsoleFormatter())
    root_logger.addHandler(console_handler)
    
    # File Handler - General logs (rotating)
    general_handler = RotatingFileHandler(
        log_dir / "app.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    general_handler.setLevel(logging.INFO)
    general_handler.setFormatter(StructuredFormatter())
    root_logger.addHandler(general_handler)
    
    # File Handler - Error logs only (rotating)
    error_handler = RotatingFileHandler(
        log_dir / "error.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(StructuredFormatter())
    root_logger.addHandler(error_handler)
    
    # Set levels for noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    logger.info("🚀 Logging system initialized", extra={
        'extra_data': {
            'debug_mode': settings.debug,
            'log_dir': str(log_dir.absolute())
        }
    })


class LoggerAdapter(logging.LoggerAdapter):
    """Custom logger adapter with extra methods."""
    
    def log_request(self, method: str, path: str, status_code: int, duration_ms: float):
        """Log HTTP request."""
        self.info(
            f"{method} {path} - {status_code} ({duration_ms:.2f}ms)",
            extra={'extra_data': {
                'type': 'http_request',
                'method': method,
                'path': path,
                'status_code': status_code,
                'duration_ms': duration_ms
            }}
        )
    
    def log_db_query(self, query: str, duration_ms: float):
        """Log database query."""
        self.debug(
            f"DB Query ({duration_ms:.2f}ms): {query[:100]}...",
            extra={'extra_data': {
                'type': 'db_query',
                'duration_ms': duration_ms,
                'query': query
            }}
        )
    
    def log_external_api(self, service: str, endpoint: str, status: str, duration_ms: float):
        """Log external API call."""
        self.info(
            f"External API: {service}/{endpoint} - {status} ({duration_ms:.2f}ms)",
            extra={'extra_data': {
                'type': 'external_api',
                'service': service,
                'endpoint': endpoint,
                'status': status,
                'duration_ms': duration_ms
            }}
        )
    
    def log_cache(self, operation: str, key: str, hit: bool = None):
        """Log cache operation."""
        msg = f"Cache {operation}: {key}"
        if hit is not None:
            msg += f" - {'HIT' if hit else 'MISS'}"
        
        self.debug(msg, extra={'extra_data': {
            'type': 'cache',
            'operation': operation,
            'key': key,
            'hit': hit
        }})
    
    def log_auth(self, event: str, user_id: str = None, email: str = None, success: bool = True):
        """Log authentication event."""
        self.info(
            f"Auth: {event} - {'Success' if success else 'Failed'}",
            extra={'extra_data': {
                'type': 'auth',
                'event': event,
                'user_id': user_id,
                'email': email,
                'success': success
            }}
        )
    
    def log_payment(self, event: str, user_id: str, plan: str, amount: float = None, success: bool = True):
        """Log payment event."""
        self.info(
            f"Payment: {event} - {plan} - {'Success' if success else 'Failed'}",
            extra={'extra_data': {
                'type': 'payment',
                'event': event,
                'user_id': user_id,
                'plan': plan,
                'amount': amount,
                'success': success
            }}
        )
    
    def log_ai_analysis(self, fixture_id: int, user_id: str, duration_ms: float, success: bool = True):
        """Log AI analysis."""
        self.info(
            f"AI Analysis: fixture={fixture_id} ({duration_ms:.2f}ms) - {'Success' if success else 'Failed'}",
            extra={'extra_data': {
                'type': 'ai_analysis',
                'fixture_id': fixture_id,
                'user_id': user_id,
                'duration_ms': duration_ms,
                'success': success
            }}
        )


# Main logger instance
base_logger = logging.getLogger("footintel")
logger = LoggerAdapter(base_logger, {})


def get_logger(name: str) -> LoggerAdapter:
    """Get a logger instance with the given name."""
    return LoggerAdapter(logging.getLogger(f"footintel.{name}"), {})


def set_request_context(request_id: str, user_id: str = None):
    """Set context variables for the current request."""
    request_id_ctx.set(request_id)
    if user_id:
        user_id_ctx.set(user_id)


def clear_request_context():
    """Clear context variables."""
    request_id_ctx.set(None)
    user_id_ctx.set(None)

