# PRD - Plateforme d'Analyse Football avec IA
## Vision Unifiée Visifoot + Couponfoot

---

## 1. Vue d'ensemble

### 1.1 Vision Produit
Plateforme web premium d'analyse de matchs de football propulsée par l'IA, combinant:
- **Analyse prédictive** : Prédictions basées sur 50+ variables et données temps réel
- **Analyse de coupons** : Évaluation de paris combinés avec probabilité de réussite
- **IA contextuelle** : Intégration des actualités sportives (blessures, forme, etc.)
- **Assistant personnel** : Chat IA pour questions personnalisées sur les matchs

### 1.2 Positionnement Marché
- **Cible** : Passionnés de football, parieurs informés, analystes sportifs
- **Différenciation** : IA connectée aux actualités (pas juste des stats historiques)
- **Benchmark** : Visifoot (+100K utilisateurs, modèle freemium réussi)

### 1.3 Fonctionnalités Core

| Fonctionnalité | Description | Priorité |
|----------------|-------------|----------|
| **Analyse IA de matchs** | Prédictions 1X2 avec probabilités et scénarios | P0 |
| **Analyse de coupons** | Upload/saisie de paris combinés + évaluation | P0 |
| **Coupons quotidiens** | 3 suggestions/jour (safe/équilibré/ambitieux) | P1 |
| **Historique** | Suivi des analyses et résultats | P1 |
| **Chat IA personnel** | Questions personnalisées sur un match | P2 |
| **Dashboard stats** | Performances personnelles et métriques | P2 |

---

## 2. Architecture Technique

### 2.1 Stack Frontend
- **Framework** : Next.js 14+ (App Router)
- **Styling** : Tailwind CSS + shadcn/ui
- **État** : Zustand ou React Query
- **Auth** : NextAuth.js (Google Login, Email)
- **Design** : Mode sombre premium (inspiré Visifoot)

### 2.2 Stack Backend
- **Framework** : FastAPI (Python 3.11+)
- **Base de données** : PostgreSQL 15 + Redis (cache)
- **ORM** : SQLAlchemy 2.0 + Alembic (migrations)
- **Task Queue** : Celery + Redis
- **Conteneurisation** : Docker + Docker Compose

### 2.3 Intelligence Artificielle

#### Stratégie IA Recommandée (Hybride)

| Cas d'usage | Solution | Coût |
|-------------|----------|------|
| Analyses complexes | Gemini 1.5 Flash API | Gratuit jusqu'à 1500 req/jour |
| Chat personnel | Gemini 1.5 Flash | Inclus |
| Résumés rapides | Modèle local (Ollama) | $0 |
| Fallback | Mistral 7B via Ollama | $0 |

```python
# Configuration IA
AI_CONFIG = {
    "primary": "gemini-1.5-flash",
    "fallback": "ollama/llama3.1:8b",
    "embedding": "text-embedding-004",
    "max_tokens": 4096,
    "temperature": 0.3  # Précision > créativité
}
```

### 2.4 APIs Sportives

#### API-Football (API-Sports.io) - Recommandée
```
Base URL: https://v3.football.api-sports.io/
Headers: x-rapidapi-key: {API_KEY}
```

| Endpoint | Usage | Cache TTL |
|----------|-------|-----------|
| `/fixtures` | Matchs du jour | 15 min |
| `/fixtures/statistics` | Stats détaillées | 1h |
| `/fixtures/headtohead` | Face à face | 24h |
| `/odds` | Cotes bookmakers | 30 min |
| `/teams/statistics` | Stats équipe | 6h |
| `/injuries` | Blessures | 1h |

#### Coûts API-Football
- **Free** : 100 req/jour ❌ Insuffisant
- **Basic** : $15/mois (1000 req/jour) ✅ MVP
- **Pro** : $40/mois (10k req/jour) → Scale

### 2.5 Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Next.js)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Analyser  │  │  Historique │  │   Pricing   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway (FastAPI)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  /api/v1/auth  │  /api/v1/analyze  │  /api/v1/coupons   │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────┬──────────────────┬─────────────────┬─────────────────┘
           │                  │                 │
     ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
     │ PostgreSQL│     │   Redis   │     │  Celery   │
     │    DB     │     │   Cache   │     │  Workers  │
     └───────────┘     └───────────┘     └─────┬─────┘
                                               │
                       ┌───────────────────────┼───────────────┐
                       │                       │               │
                 ┌─────▼─────┐          ┌─────▼─────┐   ┌─────▼─────┐
                 │  Gemini   │          │API-Football│   │  Ollama  │
                 │   API     │          │    API     │   │  (Local) │
                 └───────────┘          └───────────┘   └───────────┘
```

---

## 3. Modèle de Données

### 3.1 User
```python
class User(Base):
    __tablename__ = "users"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str | None  # None si Google Auth
    full_name: str
    avatar_url: str | None
    
    # Préférences
    profile_type: ProfileType = "balanced"  # safe, balanced, ambitious
    favorite_leagues: list[int] = []
    
    # Abonnement
    subscription: SubscriptionType = "free"  # free, starter, pro, lifetime
    subscription_expires_at: datetime | None
    daily_analyses_used: int = 0
    daily_analyses_limit: int = 1  # Dépend du plan
    
    # Métadonnées
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: datetime | None
    is_active: bool = True
```

### 3.2 MatchAnalysis
```python
class MatchAnalysis(Base):
    __tablename__ = "match_analyses"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id")
    
    # Match info
    fixture_id: int  # ID API-Football
    home_team: str
    away_team: str
    home_team_id: int
    away_team_id: int
    league_id: int
    match_date: datetime
    
    # Prédictions IA
    prediction_1x2: dict  # {"home": 0.45, "draw": 0.30, "away": 0.25}
    predicted_outcome: str  # "1", "X", "2"
    confidence_score: float  # 0.0 - 1.0
    
    # Contenu généré
    summary: str  # Analyse textuelle
    key_factors: list[str]  # ["Blessure de X", "Série de 5 victoires"]
    scenarios: list[dict]  # Scénarios probables
    
    # Données utilisées
    statistics_snapshot: dict  # Stats au moment de l'analyse
    news_context: list[str]  # Actualités intégrées
    
    # Résultat (après match)
    actual_result: str | None  # "1", "X", "2"
    was_correct: bool | None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### 3.3 Coupon
```python
class Coupon(Base):
    __tablename__ = "coupons"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id")
    
    # Type de coupon
    coupon_type: CouponType  # user_created, daily_safe, daily_balanced, daily_ambitious
    
    # Matchs inclus
    selections: list[CouponSelection]  # Relation
    
    # Métriques
    total_odds: float
    stake: float | None  # Mise (optionnel)
    potential_win: float | None
    
    # Analyse IA
    success_probability: float  # Probabilité combinée
    risk_level: RiskLevel  # low, medium, high, extreme
    ai_recommendation: str  # "Coupon équilibré avec bon potentiel..."
    weak_points: list[str]  # Matchs les plus risqués
    
    # Résultat
    status: CouponStatus = "pending"  # pending, won, lost, partial
    matches_won: int = 0
    matches_lost: int = 0
    
    created_at: datetime
    resolved_at: datetime | None
```

### 3.4 CouponSelection
```python
class CouponSelection(Base):
    __tablename__ = "coupon_selections"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    coupon_id: UUID = Field(foreign_key="coupons.id")
    
    fixture_id: int
    home_team: str
    away_team: str
    match_date: datetime
    
    selection_type: str  # "1", "X", "2", "Over 2.5", "BTTS", etc.
    odds: float
    
    # Analyse individuelle
    implied_probability: float  # 1/odds
    ai_probability: float  # Estimation IA
    edge: float  # ai_probability - implied_probability
    
    # Résultat
    result: SelectionResult = "pending"  # pending, won, lost, void
```

---

## 4. API Endpoints

### 4.1 Authentification
```
POST   /api/v1/auth/register          # Inscription email
POST   /api/v1/auth/login             # Connexion email
POST   /api/v1/auth/google            # OAuth Google
POST   /api/v1/auth/refresh           # Refresh token
POST   /api/v1/auth/logout            # Déconnexion
GET    /api/v1/auth/me                # Profil utilisateur
```

### 4.2 Analyses
```
POST   /api/v1/analyze/match          # Analyser un match (teams ou fixture_id)
GET    /api/v1/analyze/history        # Historique des analyses
GET    /api/v1/analyze/{id}           # Détails d'une analyse
POST   /api/v1/analyze/{id}/chat      # Question personnalisée (Pro)
```

### 4.3 Coupons
```
POST   /api/v1/coupons/create         # Créer un coupon
POST   /api/v1/coupons/analyze        # Analyser un coupon existant
GET    /api/v1/coupons/daily          # Coupons du jour (3 profils)
GET    /api/v1/coupons/               # Liste mes coupons
GET    /api/v1/coupons/{id}           # Détails coupon
DELETE /api/v1/coupons/{id}           # Supprimer coupon
```

### 4.4 Données Football
```
GET    /api/v1/football/fixtures      # Matchs (date, league_id)
GET    /api/v1/football/leagues       # Ligues disponibles
GET    /api/v1/football/teams/{id}    # Stats équipe
GET    /api/v1/football/h2h           # Face à face
```

### 4.5 Abonnements
```
GET    /api/v1/subscription/plans     # Plans disponibles
POST   /api/v1/subscription/checkout  # Initier paiement
POST   /api/v1/subscription/webhook   # Webhook Stripe
GET    /api/v1/subscription/status    # Mon abonnement
```

---

## 5. Plans Tarifaires

### Modèle Freemium (inspiré Visifoot)

| Feature | Free | Starter (10€/mois) | Pro (19€/mois) | Lifetime (99€) |
|---------|------|---------------------|----------------|----------------|
| Analyses/jour | 1 | 5 | ∞ | ∞ |
| Coupons quotidiens | Vue seule | ✅ | ✅ | ✅ |
| Stats détaillées | Basiques | ✅ | ✅ | ✅ |
| Probabilités exactes | ❌ | ✅ | ✅ | ✅ |
| Scénarios match | ❌ | ❌ | ✅ | ✅ |
| Actualités intégrées | ❌ | ❌ | ✅ | ✅ |
| Questions IA perso | ❌ | ❌ | 1/jour | ∞ |
| Support prioritaire | ❌ | ❌ | ✅ | ✅ |

### Implémentation Stripe
```python
STRIPE_PRODUCTS = {
    "starter": {
        "price_id": "price_starter_monthly",
        "amount": 1000,  # 10€ en centimes
        "analyses_limit": 5,
        "features": ["detailed_stats", "exact_probabilities", "daily_coupons"]
    },
    "pro": {
        "price_id": "price_pro_monthly",
        "amount": 1900,
        "analyses_limit": -1,  # Illimité
        "features": ["all_starter", "scenarios", "news_context", "ai_chat"]
    },
    "lifetime": {
        "price_id": "price_lifetime_once",
        "amount": 9900,
        "analyses_limit": -1,
        "features": ["all_pro", "priority_updates", "unlimited_chat"]
    }
}
```

---

## 6. Algorithme d'Analyse IA

### 6.1 Prompt Engineering
```python
ANALYSIS_PROMPT = """
Tu es un expert en analyse de football avec accès à des données professionnelles.

## Match à analyser
- {home_team} vs {away_team}
- Compétition: {league_name}
- Date: {match_date}

## Données disponibles
### Statistiques récentes (5 derniers matchs)
{recent_form_stats}

### Historique confrontations directes
{h2h_data}

### Actualités récentes
{news_context}

### Blessures/Suspensions
{injuries_data}

## Ta mission
1. Calcule les probabilités 1X2 (somme = 100%)
2. Identifie les 3-5 facteurs clés influençant le match
3. Décris 2-3 scénarios probables
4. Rédige un résumé clair et engageant (3-4 phrases)

Réponds en JSON structuré:
{
  "probabilities": {"home": 0.xx, "draw": 0.xx, "away": 0.xx},
  "predicted_outcome": "1|X|2",
  "confidence": 0.xx,
  "key_factors": ["...", "..."],
  "scenarios": [{"name": "...", "probability": 0.xx, "description": "..."}],
  "summary": "..."
}
"""
```

### 6.2 Pipeline d'Analyse
```python
async def analyze_match(home_team: str, away_team: str) -> MatchAnalysis:
    # 1. Résoudre les équipes via API-Football
    fixture = await football_api.find_fixture(home_team, away_team)
    
    # 2. Collecter données (parallèle)
    stats, h2h, odds, injuries = await asyncio.gather(
        football_api.get_team_statistics(fixture.home_team_id),
        football_api.get_h2h(fixture.home_team_id, fixture.away_team_id),
        football_api.get_odds(fixture.id),
        football_api.get_injuries(fixture.id)
    )
    
    # 3. Enrichir avec actualités (optionnel Pro)
    news = await news_service.get_relevant_news(
        [fixture.home_team, fixture.away_team]
    )
    
    # 4. Générer analyse IA
    prompt = build_analysis_prompt(fixture, stats, h2h, odds, injuries, news)
    ai_response = await gemini.generate(prompt)
    
    # 5. Parser et valider
    analysis = parse_ai_response(ai_response)
    
    # 6. Sauvegarder
    return await db.save_match_analysis(analysis)
```

---

## 7. UI/UX Design

### 7.1 Principes Design (inspirés Visifoot)
- **Mode sombre** : Fond #0a0a0a, accents teal/cyan (#14F195)
- **Glassmorphisme** : Cards avec backdrop-blur
- **Animations** : Smooth transitions, micro-interactions
- **Typography** : Inter ou Outfit (Google Fonts)
- **Mobile-first** : Optimisé pour usage rapide

### 7.2 Pages Principales

```
/                     → Landing page (marketing)
/app                  → Dashboard (auth required)
/app/analyze          → Interface d'analyse
/app/analyze/[id]     → Résultat d'analyse
/app/coupons          → Mes coupons
/app/coupons/daily    → Coupons du jour
/app/history          → Historique
/app/pricing          → Plans tarifaires
/app/account          → Mon compte
```

### 7.3 Composants Clés
- **TeamSelector** : Autocomplete avec logos équipes
- **PredictionCard** : Probabilités 1X2 avec jauges visuelles
- **CouponBuilder** : Interface drag & drop
- **AnalysisResult** : Summary + facteurs + scénarios
- **ChatBox** : Interface conversationnelle (Pro)

---

## 8. Roadmap Développement

### Phase 1 - MVP (6 semaines)
- [ ] Setup infrastructure (Docker, DB, Next.js, FastAPI)
- [ ] Auth (Email + Google OAuth)
- [ ] Intégration API-Football
- [ ] Intégration Gemini API
- [ ] Endpoint analyse de match
- [ ] UI analyse basique
- [ ] Déploiement staging

### Phase 2 - Core Features (4 semaines)
- [ ] Système de coupons (création + analyse)
- [ ] Génération coupons quotidiens
- [ ] Historique et tracking résultats
- [ ] Cache Redis optimisé
- [ ] Pages UI complètes

### Phase 3 - Monétisation (3 semaines)
- [ ] Intégration Stripe
- [ ] Plans d'abonnement
- [ ] Limitations par plan
- [ ] Landing page marketing

### Phase 4 - Premium Features (4 semaines)
- [ ] Chat IA personnalisé
- [ ] Intégration actualités
- [ ] Statistiques avancées
- [ ] Notifications (résultats)
- [ ] PWA mobile

---

## 9. Coûts & Ressources

### Infrastructure Mensuelle
| Service | Plan | Coût |
|---------|------|------|
| VPS (Hetzner/DO) | 4GB RAM | $10-20/mois |
| PostgreSQL | Inclus VPS | $0 |
| Redis | Inclus VPS | $0 |
| Vercel (Frontend) | Pro | $20/mois |
| **Total Infra** | | **~$40/mois** |

### APIs
| API | Plan | Coût |
|-----|------|------|
| Gemini Flash | Free tier | $0 (1500 req/j) |
| API-Football | Basic | $15/mois |
| Stripe | Usage | 1.4% + 0.25€/tx |
| **Total APIs** | | **~$15/mois** |

### Budget Total
- **MVP** : ~$1000-2000 (développement)
- **Récurrent** : ~$55/mois
- **Break-even** : ~6 abonnés Pro

---

## 10. Métriques de Succès

### KPIs Produit
- **Analyses/jour** : Nombre d'analyses générées
- **Conversion Free→Paid** : Taux de conversion
- **Rétention J7/J30** : Utilisateurs actifs
- **Précision prédictions** : % correct après résolution

### KPIs Business
- **MRR** : Revenu récurrent mensuel
- **Churn** : Taux de désabonnement
- **LTV** : Valeur vie client
- **CAC** : Coût acquisition client

---

## 11. Risques & Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Limites API-Football | Blocage service | Cache agressif + fallback |
| Coûts Gemini explosent | Marge réduite | Modèle local en backup |
| Régulation paris | Légal | Disclaimer + pas de liens bookmakers |
| Prédictions incorrectes | Réputation | Afficher % confiance, disclaimers |

---

## 12. Prochaines Étapes

1. ✅ Finaliser PRD (ce document)
2. ⬜ Créer plan d'implémentation détaillé
3. ⬜ Setup environnement de développement
4. ⬜ Obtenir clés API (API-Football, Gemini)
5. ⬜ Développer MVP

---

*Document créé le 23 décembre 2024*
*Version 2.0 - Fusion Visifoot + Couponfoot*
