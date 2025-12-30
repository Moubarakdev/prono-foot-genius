# GitHub Copilot Instructions for CouponFoot (FootGenius)

This document provides context and guidelines for AI agents working on the CouponFoot codebase.

## 🏗️ Project Architecture

- **Monorepo Structure**:
  - `backend/`: FastAPI (Python) application.
  - `frontend/`: React (TypeScript) application.
  - `docker-compose.yml`: Orchestrates the full stack (Backend, Frontend, MySQL, Redis).

### Backend (`backend/`)
- **Framework**: FastAPI with Async SQLAlchemy 2.0.
- **Database**: MySQL 8.0 (Primary), Redis (Cache/Celery Broker).
- **Key Directories**:
  - `app/api/`: API route definitions.
  - `app/services/`: Business logic (AI, Football Data, Payments).
  - `app/models/`: SQLAlchemy ORM models.
  - `app/schemas/`: Pydantic models for validation.
  - `app/providers/`: External data source adapters (Football-Data.org, Scrapers).
  - `app/core/`: Configuration, logging, and security.
- **AI Integration**: `GeminiAIService` in `app/services/ai_service.py` handles interactions with Google Gemini. Prompts are stored in `app/services/ai/prompts.py`.

### Frontend (`frontend/`)
- **Framework**: React 19, Vite, TypeScript.
- **State Management**: Zustand (`features/*/store`).
- **Styling**: Tailwind CSS, Shadcn/UI.
- **Structure**:
  - `src/features/`: Feature-based organization (Auth, Analyze, Coupons).
  - `src/pages/`: Route components.
  - `src/layout/`: Layout wrappers (DashboardLayout).
  - `src/hooks/`: Custom React hooks.

## 🛠️ Critical Workflows

### Running the Project
- **Full Stack**: `docker-compose up -d`
- **Backend Local**:
  ```bash
  cd backend
  # Ensure venv is active
  uvicorn app.main:app --reload
  ```
- **Frontend Local**:
  ```bash
  cd frontend
  pnpm dev
  ```

### Database Migrations
- Uses **Alembic**.
- Create migration: `alembic revision --autogenerate -m "message"`
- Apply migration: `alembic upgrade head`

## 🧩 Coding Conventions

### Backend (Python)
- **Async/Await**: Use `async` for all I/O bound operations (DB, API calls).
- **Type Hinting**: Strictly use Python type hints.
- **Pydantic**: Use Pydantic v2 models for all request/response validation.
- **Dependency Injection**: Use FastAPI's `Depends` for services and DB sessions.
- **Logging**: Use `app.core.logger` instead of `print`.

### Frontend (TypeScript/React)
- **Functional Components**: Use React functional components with hooks.
- **Strict Types**: Avoid `any`. Define interfaces for props and API responses.
- **Feature Folders**: Keep related components, stores, and services within `src/features/<feature_name>`.
- **Tailwind**: Use utility classes for styling.

## 🤖 AI & Data Patterns
- **Provider Pattern**: When adding new data sources, implement a provider in `app/providers` to maintain abstraction.
- **AI Prompts**: Keep prompts in `app/services/ai/prompts.py` to separate logic from prompt engineering.
- **Error Handling**: The AI service has fallback mechanisms (e.g., if Gemini fails). Ensure these are preserved.

## 🔍 Common Files to Reference
- `backend/app/main.py`: App entry point and router inclusion.
- `backend/app/core/config.py`: Environment variable settings.
- `frontend/src/App.tsx`: Main routing configuration.
- `PRD.md`: Product Requirements Document for feature context.
