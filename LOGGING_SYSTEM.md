# 📊 Système de Logging - FootIntel API

## Vue d'ensemble

Système de logging structuré et organisé pour une observabilité complète de l'application.

---

## 🏗️ Architecture

### Niveaux de logging

```python
# Hiérarchie des loggers
footintel                      # Logger racine
├── api                        # Endpoints API
│   ├── api.auth              # Authentification
│   ├── api.analyze           # Analyses de matchs
│   ├── api.coupons           # Gestion des coupons
│   └── api.subscription      # Abonnements
├── services                   # Services métier
│   ├── services.ai           # Service IA (Gemini)
│   ├── services.cache        # Service de cache Redis
│   └── services.scrapers     # Scrapers web
├── providers                  # Fournisseurs de données
│   └── providers.football_data_org
└── celery                     # Tâches asynchrones
```

### Types de logs

| Type | Niveau | Usage | Emoji |
|------|--------|-------|-------|
| **HTTP Requests** | INFO | Entrée/sortie des requêtes | → ✓ ✗ |
| **Auth Events** | INFO | Login, logout, registration | 🔐 |
| **AI Analysis** | INFO | Analyses Gemini | 🤖 |
| **External API** | INFO | Appels API externes | 📡 |
| **Cache Operations** | DEBUG | Redis GET/SET/HIT/MISS | 💾 |
| **Database** | DEBUG | Requêtes SQL | 🗄️ |
| **Errors** | ERROR | Erreurs récupérables | ❌ |
| **Critical** | CRITICAL | Erreurs système | 🚨 |

---

## 📁 Structure des fichiers de logs

```
backend/
└── logs/
    ├── app.log          # Tous les logs (INFO+)
    └── error.log        # Erreurs uniquement (ERROR+)
```

### Configuration de rotation

- **Taille maximale** : 10 MB par fichier
- **Backups** : 5 fichiers pour app.log, 10 pour error.log
- **Encodage** : UTF-8

---

## 🎨 Formats de sortie

### Console (développement)

```
16:42:31 - INFO     [req:a3f2d8b1] [user:e5c9a2b4] - footintel.api.auth.login:184 - ✅ Login successful: user@example.com
```

**Couleurs** :
- 🔵 DEBUG : Cyan
- 🟢 INFO : Vert
- 🟡 WARNING : Jaune
- 🔴 ERROR : Rouge
- 🟣 CRITICAL : Magenta

### Fichier (production)

```json
{
  "timestamp": "2024-01-15T16:42:31.123456",
  "level": "INFO",
  "logger": "footintel.api.auth",
  "message": "✅ Login successful: user@example.com",
  "module": "auth",
  "function": "login",
  "line": 184,
  "request_id": "a3f2d8b1-4e5f-6g7h-8i9j-0k1l2m3n4o5p",
  "user_id": "e5c9a2b4-1234-5678-9abc-def123456789",
  "extra_data": {
    "email": "user@example.com",
    "subscription_plan": "premium"
  }
}
```

---

## 🔧 Utilisation

### 1. Importer le logger

```python
from app.core.logger import get_logger

logger = get_logger('api.endpoint_name')  # Nom hiérarchique
```

### 2. Logs standards

```python
# Information
logger.info("Processing data")

# Debug (uniquement si DEBUG=true)
logger.debug("Variable value: {value}")

# Warning
logger.warning("Rate limit approaching")

# Error avec traceback
logger.error("Failed to process", exc_info=True)
```

### 3. Logs structurés avec contexte

```python
logger.info(
    "User action completed",
    extra={'extra_data': {
        'user_id': user.id,
        'action': 'subscription_upgrade',
        'plan': 'premium',
        'duration_ms': 123.45
    }}
)
```

### 4. Méthodes spécialisées (LoggerAdapter)

#### Requêtes HTTP
```python
logger.log_request(
    method="POST",
    path="/api/v1/analyze",
    status_code=200,
    duration_ms=456.78
)
```

#### Événements d'authentification
```python
logger.log_auth(
    event='login_success',
    user_id=str(user.id),
    email=user.email,
    success=True
)
```

#### Appels API externes
```python
logger.log_external_api(
    service='Football-Data.org',
    endpoint='fixtures',
    status='200',
    duration_ms=234.56
)
```

#### Opérations de cache
```python
logger.log_cache(
    operation='GET',
    key='fixtures:2024-01-15',
    hit=True  # ou False pour MISS
)
```

#### Analyses IA
```python
logger.log_ai_analysis(
    fixture_id=12345,
    user_id=str(user.id),
    duration_ms=2345.67,
    success=True
)
```

#### Paiements
```python
logger.log_payment(
    event='subscription_created',
    user_id=str(user.id),
    plan='premium',
    amount=9.99,
    success=True
)
```

---

## 🔍 Contexte de requête (request_id, user_id)

### Middleware automatique

Le middleware dans `main.py` injecte automatiquement :
- `request_id` : UUID unique par requête
- `user_id` : ID de l'utilisateur authentifié (si disponible)

Ces valeurs sont ajoutées automatiquement à **tous les logs** pendant le traitement de la requête.

### Accès manuel

```python
from app.core.logger import set_request_context, clear_request_context

# Définir le contexte
set_request_context(request_id="abc-123", user_id="user-456")

# Tous les logs auront ces valeurs
logger.info("Action")  # Contient request_id et user_id automatiquement

# Nettoyer le contexte
clear_request_context()
```

---

## 📍 Points de logging clés

### 1. API Endpoints (`app/api/v1/`)

```python
# Début de traitement
logger.info(
    f"🔄 Processing {operation}",
    extra={'extra_data': {'param': value}}
)

# Succès
logger.info(
    f"✅ {operation} completed",
    extra={'extra_data': {'result': data}}
)

# Erreur
logger.error(
    f"❌ {operation} failed: {error}",
    exc_info=True,
    extra={'extra_data': {'error': str(error)}}
)
```

### 2. Services AI (`app/services/ai_service.py`)

```python
# Début d'analyse
logger.info(
    f"🤖 Starting AI analysis: {home_team} vs {away_team}",
    extra={'extra_data': {
        'home_team': home_team,
        'away_team': away_team
    }}
)

# Succès avec timing
logger.log_ai_analysis(
    fixture_id=fixture_id,
    user_id=user_id,
    duration_ms=duration_ms,
    success=True
)
```

### 3. Cache (`app/services/cache_service.py`)

```python
# Cache HIT
logger.log_cache('GET', key, hit=True)

# Cache MISS
logger.log_cache('GET', key, hit=False)

# Cache SET
logger.log_cache('SET', key)
logger.debug(
    f"💾 Cached: {key} (TTL: {expire}s)",
    extra={'extra_data': {'key': key, 'ttl': expire}}
)
```

### 4. Providers (`app/providers/football/`)

```python
# Appel API
logger.debug(
    f"📡 Football-Data.org API call: {endpoint}",
    extra={'extra_data': {'endpoint': endpoint, 'params': params}}
)

# Succès
logger.log_external_api(
    'Football-Data.org',
    endpoint,
    f"{response.status_code}",
    duration_ms
)

# Erreur 403 (free tier)
logger.warning(
    f"⚠️ Football-Data.org 403 Forbidden: {endpoint}",
    extra={'extra_data': {'endpoint': endpoint, 'status_code': 403}}
)
```

### 5. Authentification (`app/api/v1/auth.py`)

```python
# Tentative de login
logger.log_auth(
    'login_attempt',
    email=email,
    success=False
)

# Login réussi
logger.log_auth(
    'login_success',
    user_id=str(user.id),
    email=user.email,
    success=True
)

# Inscription
logger.log_auth(
    'user_registered',
    user_id=str(user.id),
    email=user.email,
    success=True
)
```

---

## 🛠️ Configuration

### Variables d'environnement

```bash
# .env
DEBUG=false  # true pour DEBUG level, false pour INFO level
```

### Niveaux par module

```python
# backend/app/core/logger.py
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
```

---

## 📊 Monitoring et analyse

### Recherche dans les logs JSON

```bash
# Filtrer par niveau
cat logs/app.log | jq 'select(.level == "ERROR")'

# Filtrer par request_id
cat logs/app.log | jq 'select(.request_id == "a3f2d8b1-...")'

# Filtrer par type d'événement
cat logs/app.log | jq 'select(.extra_data.type == "external_api")'

# Analyses AI lentes (> 2s)
cat logs/app.log | jq 'select(.extra_data.type == "ai_analysis" and .extra_data.duration_ms > 2000)'
```

### Agrégation des métriques

```bash
# Compter les erreurs par logger
cat logs/error.log | jq -r '.logger' | sort | uniq -c

# Temps moyen de réponse API
cat logs/app.log | jq 'select(.extra_data.type == "http_request") | .extra_data.duration_ms' | jq -s 'add/length'

# Top 10 endpoints les plus lents
cat logs/app.log | jq 'select(.extra_data.type == "http_request") | "\(.extra_data.path) \(.extra_data.duration_ms)"' -r | sort -k2 -n | tail -10
```

---

## 🔒 Sécurité

### Données sensibles

**NE JAMAIS logger** :
- ❌ Mots de passe
- ❌ Tokens JWT complets
- ❌ Clés API complètes
- ❌ Numéros de carte bancaire
- ❌ OTP codes

**Acceptables** :
- ✅ Emails (pour traçabilité)
- ✅ User IDs (UUID)
- ✅ Request IDs
- ✅ Premières/dernières lettres de tokens (pour debug)

### Exemple sécurisé

```python
# ❌ MAUVAIS
logger.info(f"User token: {full_token}")

# ✅ BON
logger.info(
    f"Token generated for user",
    extra={'extra_data': {
        'user_id': user.id,
        'token_prefix': full_token[:8] + '...'
    }}
)
```

---

## 🚀 Bonnes pratiques

1. **Utiliser des emojis** pour une lecture rapide
   ```python
   logger.info("🚀 Starting application")
   logger.error("❌ Database connection failed")
   ```

2. **Toujours inclure le contexte**
   ```python
   logger.error(
       f"Failed to process order",
       exc_info=True,  # Traceback complet
       extra={'extra_data': {
           'order_id': order_id,
           'user_id': user_id
       }}
   )
   ```

3. **Mesurer les durées**
   ```python
   start_time = time.time()
   # ... opération ...
   duration_ms = (time.time() - start_time) * 1000
   logger.info(f"Operation completed ({duration_ms:.2f}ms)")
   ```

4. **Logs progressifs pour opérations longues**
   ```python
   logger.info("Step 1/3: Fetching data")
   # ...
   logger.info("Step 2/3: Processing")
   # ...
   logger.info("Step 3/3: Saving results")
   ```

5. **Différencier dev/prod**
   ```python
   if settings.debug:
       logger.debug(f"Raw API response: {response_data}")
   logger.info("API call successful")
   ```

---

## 📈 Métriques de performance

### Logs à surveiller

| Métrique | Seuil | Action |
|----------|-------|--------|
| **HTTP response time** | > 2000ms | Optimiser endpoint |
| **AI analysis time** | > 3000ms | Vérifier Gemini API |
| **External API time** | > 1000ms | Ajouter cache |
| **Cache hit rate** | < 70% | Augmenter TTL |
| **Error rate** | > 1% | Investiguer |

### Dashboard recommandé

Utiliser un outil comme **Grafana** ou **Kibana** pour visualiser :
- Taux de succès/échec par endpoint
- Temps de réponse moyens
- Taux de cache HIT/MISS
- Distribution des erreurs par logger

---

## 🔄 Intégration CI/CD

### Vérification pré-déploiement

```bash
# Vérifier qu'il n'y a pas de secrets dans les logs
grep -r "password\|secret\|api_key" logs/

# Analyser les erreurs critiques
cat logs/error.log | jq 'select(.level == "CRITICAL")'
```

### Alertes production

Configurer des alertes pour :
- `CRITICAL` logs → Alerte immédiate
- `ERROR` > 10/min → Alerte urgente
- Temps de réponse > 5s → Avertissement

---

## 📚 Exemples complets

### Endpoint d'analyse de match

```python
from app.core.logger import get_logger
import time

logger = get_logger('api.analyze')

@router.post("/analyze")
async def analyze_match(fixture_id: int, user: User):
    start_time = time.time()
    
    logger.info(
        f"🔄 Starting match analysis",
        extra={'extra_data': {
            'fixture_id': fixture_id,
            'user_id': str(user.id)
        }}
    )
    
    try:
        # Fetch data
        logger.debug("Fetching fixture data")
        fixture = await get_fixture(fixture_id)
        
        # AI Analysis
        logger.info(f"🤖 Requesting AI analysis")
        analysis = await ai_service.analyze(fixture)
        
        duration_ms = (time.time() - start_time) * 1000
        
        logger.log_ai_analysis(
            fixture_id=fixture_id,
            user_id=str(user.id),
            duration_ms=duration_ms,
            success=True
        )
        
        logger.info(
            f"✅ Analysis completed ({duration_ms:.0f}ms)",
            extra={'extra_data': {
                'fixture_id': fixture_id,
                'confidence': analysis.confidence
            }}
        )
        
        return analysis
        
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        
        logger.error(
            f"❌ Analysis failed ({duration_ms:.0f}ms): {str(e)}",
            exc_info=True,
            extra={'extra_data': {
                'fixture_id': fixture_id,
                'user_id': str(user.id),
                'error': str(e)
            }}
        )
        
        raise HTTPException(500, "Analysis failed")
```

---

## ✅ Checklist de migration

- [x] Logger racine configuré avec rotation
- [x] Middleware HTTP pour request_id
- [x] Logs dans `ai_service.py`
- [x] Logs dans `cache_service.py`
- [x] Logs dans `football_data_org.py`
- [x] Logs dans `scrapers.py`
- [x] Logs dans `auth.py` (register, login)
- [ ] Logs dans `analyze.py`
- [ ] Logs dans `coupons.py`
- [ ] Logs dans `subscription.py`
- [ ] Logs dans `stripe_service.py`
- [ ] Logs dans tâches Celery

---

## 🎯 Prochaines étapes

1. Compléter les logs dans endpoints restants
2. Ajouter logs dans services de paiement (Stripe, Moneroo)
3. Logger les tâches Celery (emails, renewals)
4. Configurer monitoring externe (Sentry, Datadog)
5. Créer dashboard Grafana pour métriques temps réel

---

**Documentation mise à jour** : 2024-01-15  
**Version** : 1.0
