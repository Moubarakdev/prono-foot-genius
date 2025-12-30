# CouponFoot Backend API

The backend for CouponFoot, built with **FastAPI**, **SQLAlchemy**, and **Celery**.

##  Getting Started

### Prerequisites
- Python 3.11+
- MySQL 8.0
- Redis

### Local Development Setup

1. **Create Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Variables**
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```
   *Make sure to set `DATABASE_URL` to your local MySQL instance.*

4. **Run Migrations**
   ```bash
   alembic upgrade head
   ```

5. **Start Server**
   ```bash
   uvicorn app.main:app --reload
   ```

##  Testing

We use `pytest` for testing.

```bash
# Run all tests
pytest

# Run specific test file
pytest test_hybrid.py
```

##  Database Migrations

To create a new migration after modifying models:

```bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

##  AI & Data Providers

The backend uses a **Provider Pattern** to abstract external services.

- **AI Providers**: Located in `app/providers/ai/`.
- **Football Providers**: Located in `app/providers/football/`.

To switch providers, update the configuration or environment variables.

##  Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
