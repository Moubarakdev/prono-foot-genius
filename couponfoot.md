# Plan de Développement et de Réalisation (PDR)
## Plateforme d'Analyse de Coupons de Football avec IA

---

## 1. Vue d'ensemble du projet

### 1.1 Description
Plateforme web d'analyse de coupons de paris sportifs utilisant l'intelligence artificielle pour évaluer la probabilité de réussite des paris combinés et générer des pronostics optimisés.

### 1.2 Fonctionnalités principales
- **Analyse de coupons** : Upload et analyse de tickets de paris
- **Calcul de probabilité** : Évaluation basée sur statistiques et données historiques
- **Génération de coupons** : Suggestions quotidiennes personnalisées (safe/équilibré/ambitieux)
- **Historique** : Suivi des coupons et résultats
- **Dashboard utilisateur** : Statistiques personnelles et performances

---

## 2. Architecture technique

### 2.1 Stack technologique

#### Backend
- **Framework** : FastAPI (Python 3.11+)
- **Base de données** : PostgreSQL 15 + Redis (cache)
- **ORM** : SQLAlchemy 2.0
- **Authentification** : JWT avec FastAPI-Users
- **Task Queue** : Celery + Redis
- **Conteneurisation** : Docker + Docker Compose

#### IA/ML
**IMPORTANT** : Gemini n'est PAS open-source. Options réalistes :

**Option A - API Gemini (Recommandée)**
- Google Gemini Flash via API (gratuit jusqu'à 1500 requêtes/jour)
- Coût après limite : ~$0.075/1M tokens

**Option B - Modèles Open Source auto-hébergés**
- **Llama 3.1 8B** (via Ollama en Docker)
- **Mistral 7B** (via Ollama en Docker)
- **Phi-3** (modèle compact de Microsoft)

**Option C - Hybride (Recommandée pour production)**
- Gemini Flash pour analyses complexes
- Modèle léger local pour tâches simples

#### APIs Sportives

**API Recommandée : API-Football (API-Sports.io)**
- **Plan gratuit** : 100 requêtes/jour
- Toutes les ligues majeures
- Données en temps réel
- Statistiques détaillées
- Cotes des bookmakers
- Historique des matchs
- Base URL : `https://v3.football.api-sports.io/`

**Alternative : Football-Data.org**
- Gratuit pour ligues européennes majeures
- Limité mais fiable
- 10 requêtes/minute

### 2.2 Architecture de l'API

```
┌─────────────────┐
│   Client Web    │
│   (React/Vue)   │
└────────┬────────┘
         │
    ┌────▼────────────┐
    │   API Gateway   │
    │    (FastAPI)    │
    └─────┬───────────┘
          │
    ┌─────▼──────────────────────┐
    │     Services Layer          │
    ├─────────────────────────────┤
    │ - Auth Service              │
    │ - Coupon Analysis Service   │
    │ - Prediction Service        │
    │ - Statistics Service        │
    │ - Notification Service      │
    └──┬──────────┬────────┬──────┘
       │          │        │
  ┌────▼───┐ ┌───▼────┐ ┌─▼─────┐
  │  DB    │ │ Redis  │ │ Gemini│
  │  PG    │ │ Cache  │ │  API  │
  └────────┘ └────────┘ └───────┘
```

---

## 3. Structure du projet

```
coupon-foot-api/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── coupons.py
│   │   │   ├── predictions.py
│   │   │   ├── users.py
│   │   │   └── statistics.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py
│   │   ├── dependencies.py
│   │   └── config.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── coupon.py
│   │   ├── match.py
│   │   └── prediction.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── coupon.py
│   │   └── prediction.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ai_service.py         # Gemini/Ollama integration
│   │   ├── football_api.py       # API-Football client
│   │   ├── coupon_analyzer.py    # Analyse de coupons
│   │   ├── prediction_engine.py  # Moteur de prédiction
│   │   └── cache_service.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── session.py
│   └── utils/
│       ├── __init__.py
│       ├── ocr.py               # Extraction texte depuis images
│       └── odds_calculator.py
├── tests/
│   ├── __init__.py
│   ├── test_api/
│   └── test_services/
├── alembic/                     # Migrations DB
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── ollama.Dockerfile        # Si utilisation Ollama
├── requirements.txt
├── .env.example
└── README.md
```

---

## 4. Modèles de données

### 4.1 User
```python
class User(Base):
    id: UUID
    email: str
    hashed_password: str
    full_name: str
    profile_type: Enum  # safe, balanced, ambitious
    subscription_type: Enum  # free, premium
    created_at: datetime
    is_active: bool
```

### 4.2 Coupon
```python
class Coupon(Base):
    id: UUID
    user_id: UUID (FK)
    matches: List[Match]  # Relation many-to-many
    total_odds: float
    stake: float
    potential_win: float
    status: Enum  # pending, won, lost, cancelled
    analyzed_at: datetime
    probability_score: float
    risk_level: Enum  # low, medium, high
    ai_analysis: JSON
```

### 4.3 Match
```python
class Match(Base):
    id: UUID
    api_fixture_id: int  # ID depuis API-Football
    league_id: int
    home_team: str
    away_team: str
    match_date: datetime
    prediction: str  # 1, X, 2, Over/Under, etc.
    odds: float
    result: str (nullable)
    statistics: JSON
```

### 4.4 DailyCoupon
```python
class DailyCoupon(Base):
    id: UUID
    date: date
    profile_type: Enum
    matches: List[Match]
    total_odds: float
    confidence_score: float
    reasoning: Text
    generated_by_ai: bool
```

---

## 5. Endpoints API

### 5.1 Authentification
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
```

### 5.2 Coupons
```
POST   /api/v1/coupons/analyze          # Analyser un coupon
POST   /api/v1/coupons/upload-image     # Upload photo ticket
GET    /api/v1/coupons/                 # Liste coupons user
GET    /api/v1/coupons/{id}             # Détails coupon
DELETE /api/v1/coupons/{id}
```

### 5.3 Prédictions
```
GET    /api/v1/predictions/daily        # Coupon du jour
GET    /api/v1/predictions/matches      # Matchs disponibles
POST   /api/v1/predictions/generate     # Générer coupon custom
GET    /api/v1/predictions/history      # Historique résultats
```

### 5.4 Statistiques
```
GET    /api/v1/stats/user               # Stats personnelles
GET    /api/v1/stats/leagues            # Stats par ligue
GET    /api/v1/stats/teams/{id}         # Stats équipe
```

---

## 6. Services clés

### 6.1 AI Service (ai_service.py)

#### Option A - Gemini API
```python
import google.generativeai as genai
from typing import Dict, List

class GeminiAIService:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
    async def analyze_coupon(
        self,
        matches: List[Dict],
        statistics: Dict
    ) -> Dict:
        prompt = self._build_analysis_prompt(matches, statistics)
        response = await self.model.generate_content_async(prompt)
        return self._parse_response(response)
```

#### Option B - Ollama Local
```python
import ollama
from typing import Dict, List

class OllamaAIService:
    def __init__(self, model: str = "llama3.1:8b"):
        self.model = model
        self.client = ollama.Client(host='http://ollama:11434')
    
    async def analyze_coupon(
        self,
        matches: List[Dict],
        statistics: Dict
    ) -> Dict:
        prompt = self._build_analysis_prompt(matches, statistics)
        response = self.client.chat(
            model=self.model,
            messages=[{'role': 'user', 'content': prompt}]
        )
        return self._parse_response(response)
```

### 6.2 Football API Service (football_api.py)
```python
import httpx
from typing import Dict, List, Optional

class FootballAPIService:
    def __init__(self, api_key: str):
        self.base_url = "https://v3.football.api-sports.io"
        self.headers = {
            "x-rapidapi-key": api_key,
            "x-rapidapi-host": "v3.football.api-sports.io"
        }
        self.client = httpx.AsyncClient()
    
    async def get_fixtures(
        self,
        date: str,
        league_ids: Optional[List[int]] = None
    ) -> List[Dict]:
        """Récupère les matchs du jour"""
        params = {"date": date}
        if league_ids:
            params["league"] = ",".join(map(str, league_ids))
        
        response = await self.client.get(
            f"{self.base_url}/fixtures",
            headers=self.headers,
            params=params
        )
        return response.json()["response"]
    
    async def get_statistics(
        self,
        fixture_id: int
    ) -> Dict:
        """Statistiques détaillées d'un match"""
        response = await self.client.get(
            f"{self.base_url}/fixtures/statistics",
            headers=self.headers,
            params={"fixture": fixture_id}
        )
        return response.json()["response"]
    
    async def get_h2h(
        self,
        team1_id: int,
        team2_id: int
    ) -> List[Dict]:
        """Historique face à face"""
        response = await self.client.get(
            f"{self.base_url}/fixtures/headtohead",
            headers=self.headers,
            params={"h2h": f"{team1_id}-{team2_id}"}
        )
        return response.json()["response"]
    
    async def get_odds(
        self,
        fixture_id: int
    ) -> Dict:
        """Cotes pour un match"""
        response = await self.client.get(
            f"{self.base_url}/odds",
            headers=self.headers,
            params={"fixture": fixture_id}
        )
        return response.json()["response"]
```

### 6.3 Coupon Analyzer (coupon_analyzer.py)
```python
from typing import Dict, List
import numpy as np

class CouponAnalyzer:
    def __init__(
        self,
        ai_service: AIService,
        football_api: FootballAPIService
    ):
        self.ai_service = ai_service
        self.football_api = football_api
    
    async def analyze(
        self,
        matches: List[Dict],
        user_stake: float
    ) -> Dict:
        """Analyse complète d'un coupon"""
        
        # 1. Enrichir avec données API
        enriched_matches = await self._enrich_matches(matches)
        
        # 2. Calculer statistiques
        stats = await self._calculate_statistics(enriched_matches)
        
        # 3. Analyse IA
        ai_analysis = await self.ai_service.analyze_coupon(
            enriched_matches,
            stats
        )
        
        # 4. Calculer probabilité globale
        probability = self._calculate_probability(
            enriched_matches,
            ai_analysis
        )
        
        # 5. Évaluer le risque
        risk_assessment = self._assess_risk(
            probability,
            len(matches),
            stats
        )
        
        return {
            "probability": probability,
            "risk_level": risk_assessment["level"],
            "potential_win": user_stake * self._total_odds(matches),
            "expected_value": probability * user_stake * self._total_odds(matches),
            "ai_insights": ai_analysis,
            "statistics": stats,
            "recommendations": self._generate_recommendations(
                risk_assessment,
                ai_analysis
            )
        }
    
    def _calculate_probability(
        self,
        matches: List[Dict],
        ai_analysis: Dict
    ) -> float:
        """Calcule probabilité basée sur cotes et analyse IA"""
        # Probabilité implicite des cotes
        implied_prob = np.prod([1/m["odds"] for m in matches])
        
        # Ajustement par analyse IA
        ai_confidence = ai_analysis.get("confidence", 0.5)
        
        # Formule pondérée
        return (implied_prob * 0.6 + ai_confidence * 0.4) * 0.85
```

---

## 7. Configuration Docker

### 7.1 docker-compose.yml
```yaml
version: '3.8'

services:
  # API FastAPI
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/couponfoot
      - REDIS_URL=redis://redis:6379
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - FOOTBALL_API_KEY=${FOOTBALL_API_KEY}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./app:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=couponfoot
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  # Celery Worker (tâches asynchrones)
  celery:
    build:
      context: .
      dockerfile: docker/Dockerfile
    command: celery -A app.celery worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/couponfoot
      - REDIS_URL=redis://redis:6379
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - FOOTBALL_API_KEY=${FOOTBALL_API_KEY}
    depends_on:
      - postgres
      - redis
  
  # Ollama (Option si utilisation modèles locaux)
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    # Après démarrage, exécuter: docker exec -it ollama ollama pull llama3.1:8b

volumes:
  postgres_data:
  ollama_data:
```

### 7.2 Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 8. Algorithme de génération de coupons

### Processus quotidien
```python
async def generate_daily_coupons():
    """Génère 3 coupons quotidiens (safe/équilibré/ambitieux)"""
    
    # 1. Récupérer matchs du jour
    today_matches = await football_api.get_fixtures(date=today)
    
    # 2. Filtrer matchs de qualité
    quality_matches = filter_quality_matches(today_matches)
    
    # 3. Pour chaque profil
    for profile in ["safe", "balanced", "ambitious"]:
        
        # 4. Sélectionner matchs selon profil
        selected_matches = select_matches_by_profile(
            quality_matches,
            profile
        )
        
        # 5. Analyser avec IA
        analysis = await ai_service.analyze_coupon(selected_matches)
        
        # 6. Optimiser sélection
        optimized = optimize_selection(
            selected_matches,
            analysis,
            profile
        )
        
        # 7. Sauvegarder
        await save_daily_coupon(optimized, profile)
```

### Critères de sélection par profil
```python
PROFILE_CRITERIA = {
    "safe": {
        "max_matches": 3,
        "min_odds": 1.3,
        "max_odds": 2.0,
        "target_total_odds": 2.5,
        "min_confidence": 0.7
    },
    "balanced": {
        "max_matches": 5,
        "min_odds": 1.5,
        "max_odds": 3.0,
        "target_total_odds": 8.0,
        "min_confidence": 0.55
    },
    "ambitious": {
        "max_matches": 8,
        "min_odds": 1.8,
        "max_odds": 5.0,
        "target_total_odds": 30.0,
        "min_confidence": 0.4
    }
}
```

---

## 9. Roadmap de développement

### Phase 1 - MVP (4-6 semaines)
- ✅ Setup infrastructure (Docker, DB, FastAPI)
- ✅ Intégration API-Football
- ✅ Intégration Gemini API
- ✅ Auth basique (JWT)
- ✅ Endpoint analyse de coupon
- ✅ Calcul probabilités basique
- ✅ Tests unitaires core

### Phase 2 - Features principales (4 semaines)
- ✅ Génération coupons quotidiens
- ✅ Historique et tracking
- ✅ Profils utilisateurs
- ✅ OCR pour upload tickets
- ✅ Cache Redis optimisé
- ✅ API v1 complète

### Phase 3 - Optimisations (3 semaines)
- ✅ Machine Learning (prédiction améliorée)
- ✅ Système de notifications
- ✅ Statistiques avancées
- ✅ Webhooks bookmakers
- ✅ Tests de charge

### Phase 4 - Scale & Premium (4 semaines)
- ✅ Abonnements premium
- ✅ Features avancées (live betting)
- ✅ Mobile app (React Native)
- ✅ Monitoring (Prometheus/Grafana)
- ✅ CI/CD pipeline

---

## 10. Coûts estimés

### Infrastructure (mensuel)
- **Serveur VPS** : $20-40/mois (Hetzner, DigitalOcean)
- **Base de données** : Inclus dans VPS
- **Stockage** : $5/mois (images, backups)

### APIs
- **Gemini Flash** : $0 (gratuit jusqu'à 1500 req/jour)
- **API-Football** : 
  - Gratuit : 100 req/jour ❌ Insuffisant
  - Basic : $15/mois (1000 req/jour) ✅
  - Pro : $40/mois (10k req/jour)

### Développement
- Option A : Solo (3-4 mois)
- Option B : Équipe 2-3 devs (1.5-2 mois)

**Budget total MVP** : ~$1000-2000
**Coûts récurrents** : ~$60/mois

---

## 11. Recommandations finales

### Configuration recommandée
1. **IA** : Gemini Flash API (gratuit au début, payant si scale)
2. **Sports Data** : API-Football plan Basic ($15/mois)
3. **Hébergement** : VPS Hetzner 4GB RAM ($10/mois)
4. **Cache** : Redis pour limiter appels API
5. **Backup** : PostgreSQL daily backups

### Optimisations clés
- **Cache agressif** : TTL 6h pour statistiques équipes
- **Rate limiting** : Protéger endpoints publics
- **Batch processing** : Générer coupons quotidiens en off-peak
- **CDN** : Pour assets statiques
- **Monitoring** : Sentry pour erreurs, DataDog pour metrics

### Sécurité
- Rate limiting par IP
- Validation stricte inputs
- Sanitization données API externes
- JWT avec refresh tokens
- HTTPS obligatoire
- Backup automatique DB

---

## 12. Prochaines étapes

1. **Clarifier besoin IA** : Gemini API ou vraiment besoin local ?
2. **S'inscrire API-Football** : Obtenir clé gratuite pour tests
3. **Setup environnement** : Docker + PostgreSQL
4. **Implémenter MVP** : Focus sur analyse coupon
5. **Tester avec vraies données** : Valider précision prédictions
6. **Itérer** : Améliorer algorithmes basé sur résultats

**Contact support technique :**
- API-Football : support@api-sports.io
- Google AI : cloud.google.com/vertex-ai/docs/generative-ai/pricing

---

*Document créé le 23 décembre 2025*
*Version 1.0*