# Copilot Instructions for CouponFoot

## Project Overview
CouponFoot is an AI-powered football match and coupon analysis platform. It combines real-time football data from multiple sources with AI (Google Gemini or Ollama) to provide predictive insights. The platform features match analysis, betting coupon evaluation, AI chat, and subscription management.

## Tech Stack
- **Backend**: FastAPI (Python 3.11+), SQLAlchemy 2.0, Alembic, MySQL 8.0, Redis, Celery
- **Frontend**: React 19 + Vite, TypeScript, Tailwind CSS v4, Zustand, react-i18next, lucide-react
- **AI**: Ollama (default), Google Gemini (configurable via `ai_provider` setting)
- **Data**: Hybrid architecture - Football-Data.org API (free) + Web Scrapers (SofaScore, OddsChecker, FBref)
- **Payments**: Stripe (international), Moneroo (Mobile Money - Africa)

---

## 🏗️ Architecture & Design Patterns

### Provider Pattern (Critical)
The codebase uses **abstract base classes** for pluggable data sources and AI providers:
- `BaseFootballProvider`: Abstract interface for football data (fixtures, stats, odds, H2H)
- `BaseAIProvider`: Abstract interface for AI analysis (match analysis, coupon analysis)

**Implementations:**
- Football: `HybridFootballProvider` (default), `FootballDataOrgProvider`, `ApiFootballProvider` (legacy)
- AI: `OllamaAIProvider` (default), `GeminiAIProvider`

**Dependency Injection in Routes:**
```python
# app/api/v1/analyze.py pattern
FootballProvider = Annotated[BaseFootballProvider, Depends(get_football_provider)]
AIProvider = Annotated[BaseAIProvider, Depends(get_ai_provider)]

@router.post("/analyze")
async def analyze_match(
    football_api: FootballProvider,  # Injected provider
    ai_service: AIProvider,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    ...
```

**Why this matters:** When adding/modifying features, ALWAYS use provider dependencies instead of directly importing services. Providers are cached via `@lru_cache()` in `app/providers/__init__.py`.

### Hybrid Data Architecture
**Default setup** uses `HybridFootballProvider` which orchestrates:
1. **Football-Data.org** (free API): Fixtures, leagues, teams - 10 req/min limit
2. **Web Scrapers** (in `app/services/scrapers.py`):
   - SofaScore: Live scores
   - OddsChecker: Betting odds
   - FBref: Detailed statistics

**Fallback logic:** If a scraper fails (403/timeout), methods return empty data or cached fallback. See `HYBRID_DATA_ARCHITECTURE.md` for details.

**Migration note:** Legacy `ApiFootballProvider` (RapidAPI) still exists but is replaced by hybrid approach to avoid API costs.

---

## 🔧 Backend Conventions

### Routing & API Structure
- **All routes**: `app/api/v1/{resource}.py` (e.g., `analyze.py`, `auth.py`, `coupons.py`)
- **Pattern**: Use `APIRouter` with prefix and tags:
  ```python
  router = APIRouter(prefix="/analyze", tags=["Analysis"])
  ```
- **Authentication**: Protected routes use `Annotated[User, Depends(get_current_user)]`

### Database Layer
- **Models**: `app/models/` (SQLAlchemy 2.0 with async support)
  - Key models: `User`, `MatchAnalysis`, `Coupon`, `ChatMessage`
  - **Note**: Using MySQL 8.0 (not PostgreSQL) - see `docker-compose.yml`
- **Schemas**: `app/schemas/` (Pydantic v2 for validation/serialization)
- **Session dependency**: `Annotated[AsyncSession, Depends(get_db)]` for DB access
- **Migrations**: 
  ```bash
  # Generate migration after model changes
  alembic revision --autogenerate -m "description"
  
  # Apply migrations (done automatically by entrypoint.sh in Docker)
  alembic upgrade head
  ```

### Services vs Providers
**Services** (`app/services/`): Business logic, orchestration, external integrations
- `cache_service.py`: Redis caching wrapper
- `ai_service.py`: **Legacy** - now use `app/providers/ai/` instead
- `pricing_service.py`, `stripe_service.py`, `moneroo_service.py`: Payment logic
- `news_service.py`: Fetch sports news for AI context
- `analysis/`: Match analysis orchestration (`MatchAnalyzer`)

**Providers** (`app/providers/`): Data source abstractions
- Access via `get_football_provider()` and `get_ai_provider()` dependency injection

### Caching Strategy
**Always cache external API calls** to avoid rate limits:
```python
from app.services import cache_service, CACHE_TTL

# Cache key pattern: {source}:{resource}:{identifier}
cache_key = f"football_data:fixtures:{date}"
cached = await cache_service.get(cache_key)
if cached:
    return cached

data = await fetch_data()
await cache_service.set(cache_key, data, ttl=CACHE_TTL["fixtures"])
```

**TTL defaults** (in `app/services/__init__.py`):
- Fixtures: 15 min
- Odds: 30 min  
- Statistics: 1-6 hours
- Team info: 24 hours

### Configuration & Settings
- **Settings class**: `app/core/config.py` (Pydantic BaseSettings)
- **Access**: `from app.core.config import get_settings; settings = get_settings()`
- **Environment variables**: See `.env` file:
  - `DATABASE_URL`: MySQL connection (format: `mysql+aiomysql://user:pass@host:port/db`)
  - `REDIS_URL`: Redis connection
  - `FOOTBALL_DATA_API_KEY`: Football-Data.org API key
  - `GEMINI_API_KEY` or configure Ollama
  - `STRIPE_API_KEY`, `MONEROO_API_KEY`: Payment providers

### Logging
- **Structured logging**: `app/core/logger.py` with request context
- **Pattern**: 
  ```python
  from app.core.logger import logger
  logger.info("Message", extra={"context": "value"})
  ```
- **Request tracking**: Automatic request_id injection via middleware in `app/main.py`

---

## 🎨 Frontend Conventions

### Architecture
- **Feature-based structure**: `src/features/{feature}/`
  - Each feature: `components/`, `services/`, `store/` (if needed)
  - Example: `features/auth/`, `features/analyze/`, `features/coupons/`
- **Layout components**: `src/layout/`
- **Shared components**: `src/components/`
- **Types**: `src/types/` for shared TypeScript interfaces

### State Management
- **Zustand** for global state (persisted with `zustand/middleware`)
- **Example**: `features/auth/store/auth-store.ts` manages authentication state
- **Pattern**:
  ```typescript
  export const useAuthStore = create<AuthState>()(
    persist(
      (set) => ({
        user: null,
        token: null,
        login: async (email, password) => { ... },
        // ...
      }),
      { name: 'auth-storage' }
    )
  );
  ```

### API Communication
- **ALWAYS use `apiClient`** from `src/lib/api-client.ts` (Axios instance)
- **Features**:
  - Auto-injects auth token from localStorage
  - Token refresh on 401 responses
  - Base URL from `VITE_API_URL` env var (defaults to `http://localhost:8000/api/v1`)
- **Do NOT**: Use `axios` or `fetch` directly in components
- **Pattern**:
  ```typescript
  // In feature services (e.g., features/analyze/services/analyze-service.ts)
  import { apiClient } from '../../../lib/api-client';
  
  export const analyzeMatch = async (data: MatchRequest) => {
    const response = await apiClient.post('/analyze', data);
    return response.data;
  };
  ```

### Internationalization (i18n)
- **Library**: react-i18next
- **Usage**: 
  ```typescript
  import { useTranslation } from 'react-i18next';
  const { t } = useTranslation();
  
  return <h1>{t('welcome.title')}</h1>;
  ```
- **Translation files**: `src/i18n/locales/{lang}.json`

### Styling
- **Tailwind CSS v4** with Vite plugin
- **Icons**: `lucide-react` (e.g., `import { Search } from 'lucide-react'`)
- **Utilities**: `tailwind-merge` for conditional classes:
  ```typescript
  import { cn } from '../lib/utils';  // If available
  <div className={cn("base-class", condition && "conditional-class")} />
  ```

---

## 🚀 Critical Workflows

### Local Development
```bash
# Start infrastructure (MySQL + Redis)
docker-compose up -d mysql redis

# Backend (from backend/ directory)
pip install -r requirements.txt
alembic upgrade head  # Apply migrations
uvicorn app.main:app --reload

# Frontend (from frontend/ directory)
pnpm install
pnpm dev
```

**Access Points:**
- Frontend: `http://localhost:5173` (Vite default)
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs` (Swagger UI)
- ReDoc: `http://localhost:8000/redoc`

### Database Migrations
```bash
# After modifying models in app/models/
cd backend
alembic revision --autogenerate -m "Add new field to User"
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

**Important**: Docker entrypoint (`entrypoint.sh`) automatically runs migrations on startup.

### Testing & Debugging
- **Backend tests**: `backend/test_api.py`, `backend/test_hybrid.py`
  ```bash
  cd backend
  python test_hybrid.py  # Test hybrid provider
  ```
- **API manual testing**: Use `/docs` Swagger UI or Postman
- **Logs**: Check Docker logs: `docker-compose logs -f api`

### Adding a New AI Provider
1. Create `backend/app/providers/ai/your_provider.py`
2. Implement `BaseAIProvider` abstract methods:
   - `analyze_match(...)`
   - `analyze_coupon(...)`
3. Update `app/providers/__init__.py`:
   ```python
   @lru_cache()
   def get_ai_provider() -> BaseAIProvider:
       ai_provider = settings.ai_provider.lower()
       if ai_provider == 'your_provider':
           return YourAIProvider()
       # ...
   ```
4. Add `AI_PROVIDER=your_provider` to `.env`

### Adding a New Football Data Source
Same pattern as AI providers, but implement `BaseFootballProvider`.

---

## 📝 Common Patterns & Gotchas

### AI Analysis Response Format
**Critical**: AI providers MUST return JSON matching expected schemas:
- Match analysis: See `app/schemas/analysis.py` → `MatchAnalysisResponse`
- Coupon analysis: See `app/schemas/coupon.py` → `CouponAnalysisResponse`
- **Prompts**: Located in `app/services/ai/prompts.py` (defines expected JSON structure)

### Subscription Limits
- Users have daily analysis limits based on subscription tier
- **Check before analysis**: `check_analysis_limit(user, db)` in `app/services/analysis/__init__.py`
- **Subscription types**: `FREE`, `STARTER`, `PRO`, `LIFETIME` (enum in `app/models/user.py`)

### Payment Integration
- **Stripe**: For cards/international (webhooks at `/api/v1/subscription/stripe-webhook`)
- **Moneroo**: For Mobile Money - Benin/Africa (webhooks at `/api/v1/subscription/moneroo-webhook`)
- **Services**: `stripe_service.py`, `moneroo_service.py` in `app/services/`

### Celery Background Tasks
- **Broker**: Redis
- **Tasks**: `app/tasks/` (e.g., `email.py` for email sending)
- **Run worker**: `celery -A app.core.celery.celery_app worker --loglevel=info`
- **Used for**: Email notifications, subscription renewals, data refresh jobs

---

## 📚 Key Documentation Files
- `PRD.md`: Product requirements and technical vision (original scope)
- `HYBRID_DATA_ARCHITECTURE.md`: Data sources, scrapers, fallback strategy
- `PRODUCTION_CHECKLIST.md`: Deployment readiness, config, todos
- `SUPPORTED_LEAGUES.md`: List of supported football leagues
- `FOOTBALL_DATA_LIMITATIONS.md`: API constraints and workarounds
- `LOGGING_SYSTEM.md`: Structured logging patterns
- `SUBSCRIPTION_TESTING.md`: How to test payment flows
- `backend/README.md`: Backend setup and API endpoints
- `backend/TESTING_GUIDE.md`: Testing strategies

---

## 🎯 Quick Reference

**Adding a new API endpoint:**
1. Create route in `app/api/v1/{resource}.py`
2. Define request/response schemas in `app/schemas/`
3. Add business logic in `app/services/` or use providers
4. Update `app/api/__init__.py` to register router

**Modifying database schema:**
1. Update model in `app/models/`
2. Run `alembic revision --autogenerate -m "description"`
3. Review generated migration in `alembic/versions/`
4. Apply with `alembic upgrade head`

**Frontend: Adding a new feature:**
1. Create `src/features/{feature}/` directory
2. Add components, services (API calls), store (if needed)
3. Use `apiClient` for backend communication
4. Add routes in `src/App.tsx` or routing config

**Debugging cache issues:**
- Check Redis: `docker exec -it <redis-container> redis-cli`
- Clear cache: `FLUSHDB` in redis-cli
- Verify TTL: `TTL <key>`

**Environment setup checklist:**
- Copy `.env.example` to `.env`
- Set `DATABASE_URL` (MySQL format)
- Set `FOOTBALL_DATA_API_KEY` (free tier: https://www.football-data.org/)
- Choose AI: Set `GEMINI_API_KEY` OR configure Ollama locally
- Payment keys (Stripe/Moneroo) for subscription features
