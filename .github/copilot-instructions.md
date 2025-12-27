# Copilot Instructions for CouponFoot

## Project Overview
CouponFoot is an AI-powered football match and coupon analysis platform. It combines real-time football data from API-Football with Google Gemini AI to provide predictive insights.

## Tech Stack
- **Backend**: FastAPI (Python 3.11+), SQLAlchemy 2.0, Alembic, PostgreSQL, Redis.
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, shadcn/ui, Zustand.
- **AI**: Google Gemini (primary), Ollama (fallback).
- **Data**: API-Football (API-Sports.io).

## Backend Conventions
- **Routing**: All API routes are under `app/api/v1/`. Use `APIRouter` with appropriate prefixes and tags.
- **Authentication**: Use `Annotated[User, Depends(get_current_user)]` to protect routes.
- **Database**: 
  - Models: `app/models/` (SQLAlchemy).
  - Schemas: `app/schemas/` (Pydantic).
  - Dependency: Use `Annotated[AsyncSession, Depends(get_db)]` for database access in routes.
  - Migrations: Use Alembic. Run `alembic revision --autogenerate -m "description"` for changes.
- **Services**: Business logic belongs in `app/services/`.
  - `football_api.py`: Wrapper for API-Football.
  - `ai_service.py`: Handles Gemini prompts and responses.
  - `cache_service.py`: Redis caching for external API responses.
- **Caching**: Always cache external API calls (fixtures, stats, odds) using `cache_service` with appropriate TTLs defined in `app/services/__init__.py`.

## Frontend Conventions
- **Architecture**: Feature-based structure in `src/features/`. Each feature should have its own `services/`, `components/`, and `store/`.
- **API Calls**: Use the centralized `apiClient` from `src/lib/api-client.ts`. Do not use `axios` or `fetch` directly in components.
- **State Management**: Use Zustand for global state (e.g., `src/features/auth/store/auth-store.ts`).
- **Internationalization**: Use `i18next` via `useTranslation` hook. Translations are in `src/i18n/locales/`.
- **UI Components**: Use shadcn/ui components located in `src/components/ui/` (if present) or follow the pattern in `src/components/`. Use `lucide-react` for icons and `cn` utility for conditional classes.

## Critical Workflows
- **Local Development**: Use `docker-compose up -d` to start PostgreSQL and Redis.
- **Environment Variables**: Check `.env` for `FOOTBALL_API_KEY` and `GEMINI_API_KEY`.
- **API Documentation**: Accessible at `http://localhost:8000/docs` when the backend is running.

## Common Patterns
- **AI Analysis**: When modifying AI prompts, ensure the response format remains a valid JSON as expected by `app/services/ai_service.py`.
- **Data Mapping**: Backend often returns raw data from API-Football; frontend services (e.g., `analyze-service.ts`) should map this to clean TypeScript interfaces.

## Key Files
- `backend/app/main.py`: FastAPI entry point and middleware.
- `backend/app/core/config.py`: Pydantic settings management.
- `frontend/src/lib/api-client.ts`: Axios configuration with auth interceptors.
- `PRD.md`: Product requirements and technical vision.
