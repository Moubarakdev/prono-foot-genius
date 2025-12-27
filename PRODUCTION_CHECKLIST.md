# ✅ Checklist Production - CouponFoot

## 🎯 Status Global

| Composant | Status | Notes |
|-----------|--------|-------|
| **Architecture Hybride** | ✅ **PRÊT** | Football-Data.org + Scrapers |
| **Backend API** | ✅ **PRÊT** | FastAPI déployé avec succès |
| **Frontend** | ✅ **PRÊT** | Build production réussi |
| **Base de données** | ✅ **PRÊT** | MySQL 8.0 + migrations |
| **Redis/Cache** | ✅ **PRÊT** | Cache opérationnel |
| **Paiements** | ⚠️ **CONFIG REQUIS** | Stripe + Moneroo |
| **Web Scraping** | ⚠️ **AMÉLIORER** | Bloqués (403) - User-Agents requis |

---

## 📊 Architecture Hybride - NOUVEAU

### ✅ Implémenté
- [x] **Football-Data.org** - Fixtures (API gratuite, 10 req/min)
- [x] **SofaScore** - Scores en direct (scraping)
- [x] **OddsChecker** - Cotes bookmakers (scraping)
- [x] **FBref** - Statistiques détaillées (scraping)
- [x] Provider hybride orchestrateur
- [x] Cache Redis pour toutes les sources
- [x] Fallback automatique si source échoue

### ⚠️ À Améliorer pour Prod
```bash
# Les scrapers retournent 403 Forbidden
# Solutions:
1. Ajouter User-Agents variés et rotation
2. Utiliser Selenium/Playwright pour JavaScript
3. Proxies rotatifs (optionnel mais recommandé)
4. Rate limiting intelligent
```

---

## 🔧 Configuration Immédiate

### 1. Fichier `.env` - ✅ CONFIGURÉ

```bash
# ✅ Base de données
DATABASE_URL=mysql+aiomysql://root:rootpassword@mysql:3306/couponfoot

# ✅ Redis
REDIS_URL=redis://redis:6379

# ✅ JWT
JWT_SECRET=4d429de450902093157e07b8b23ddbea103174b9155055adcdbc67c2995eddce

# ✅ API Gratuites
FOOTBALL_DATA_API_KEY=63bcc22696e644ebb253a882c42a57c2
GEMINI_API_KEY=AIzaSyBtsJ-YDofhKahZxgJ2Iqe9Yr6e41Fh298

# ⚠️ Paiements - À CONFIGURER EN PROD
STRIPE_API_KEY=sk_live_...  # Changer en Live mode
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook Live
STRIPE_PRICE_STARTER=price_...  # Prix Stripe Starter
STRIPE_PRICE_PRO=price_...  # Prix Stripe Pro
STRIPE_PRICE_LIFETIME=price_...  # Prix Stripe Lifetime

MONEROO_API_KEY=your-moneroo-api-key  # Production key
MONEROO_WEBHOOK_SECRET=your-moneroo-webhook-secret

# ✅ SMTP Configuré (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@magnia.io
SMTP_PASSWORD=Magnia2023_
SMTP_FROM=info@magnia.io
SMTP_SSL=true
```

### 2. Football-Data.org API - ✅ CONFIGURÉ

```bash
# Clé API gratuite déjà dans .env
# Limites: 10 requêtes/minute, ligues européennes majeures
# Dashboard: https://www.football-data.org/client/myprofile
```

---

## 🚀 Déploiement Production

### Option 1: Docker (Recommandé)

```bash
# 1. Build production
docker-compose -f docker-compose.prod.yml build

# 2. Démarrer
docker-compose -f docker-compose.prod.yml up -d

# 3. Vérifier
docker-compose logs -f api
```

### Option 2: Serveur Direct

```bash
# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Frontend
cd frontend
pnpm build
# Servir dist/ avec Nginx/Apache

# Celery (renouvellements)
celery -A app.celery_app worker --loglevel=info
celery -A app.celery_app beat --loglevel=info
```

---

## 🛡️ Sécurité Production

### ✅ Implémenté
- [x] JWT avec refresh tokens (30 jours)
- [x] Hashing bcrypt pour mots de passe
- [x] Rate limiting via Redis
- [x] CORS configuré
- [x] HTTPS ready (Nginx/Traefik)

### ⚠️ À Configurer
- [ ] **DEBUG=false** en production
- [ ] Variables d'environnement sécurisées (secrets)
- [ ] Firewall Docker (limiter ports)
- [ ] SSL/TLS pour base de données
- [ ] Monitoring (Sentry/Prometheus)

---

## 🔍 Tests de Production

### Test API
```bash
# 1. Health check
curl https://api.couponfoot.com/health

# 2. Test fixtures (Football-Data.org)
curl https://api.couponfoot.com/api/v1/football/fixtures?next=5

# 3. Test recherche équipe
curl https://api.couponfoot.com/api/v1/football/teams/search?name=Manchester

# 4. Test authentification
curl -X POST https://api.couponfoot.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Test Paiements
```bash
# 1. Stripe Checkout (test mode)
curl -X POST https://api.couponfoot.com/api/v1/subscription/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"plan":"starter","payment_method":"stripe"}'

# 2. Webhook test
stripe listen --forward-to localhost:8000/api/v1/subscription/webhook
```

---

## 📈 Monitoring & Logs

### Logs Docker
```bash
# API
docker logs -f api-football-api-1 --tail 100

# Worker (Celery)
docker logs -f api-football-worker-1 --tail 100

# MySQL
docker logs -f api-football-mysql-1 --tail 50
```

### Métriques à surveiller
- **Rate Limiting**: Football-Data.org (10 req/min)
- **Cache Hit Rate**: Redis (devrait être >80%)
- **Scraping Success Rate**: SofaScore/OddsChecker/FBref
- **API Response Time**: <500ms pour /fixtures
- **Celery Tasks**: Renewal reminders (quotidien)

---

## 🐛 Problèmes Connus & Solutions

### 1. Scrapers bloqués (403 Forbidden)
**Symptôme**: `Client error '403 Forbidden' for url`
**Solution**:
```python
# Dans scrapers.py, ajouter rotation User-Agents
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
    # etc.
]
headers = {"User-Agent": random.choice(USER_AGENTS)}
```

### 2. Rate Limit Football-Data.org (429)
**Symptôme**: `Too Many Requests (429)`
**Solution**: Cache Redis déjà implémenté, ajuster TTL si nécessaire

### 3. Import circulaire
**Symptôme**: `ImportError: cannot import ... from partially initialized module`
**Solution**: ✅ Déjà résolu - services/__init__.py ne doit pas importer providers

---

## 📝 Migrations Base de Données

```bash
# Créer migration
docker exec api-football-api-1 alembic revision --autogenerate -m "description"

# Appliquer migrations
docker exec api-football-api-1 alembic upgrade head

# Rollback
docker exec api-football-api-1 alembic downgrade -1
```

---

## 🎯 Prochaines Étapes Recommandées

### Court Terme (Semaine 1)
1. **Améliorer scrapers**
   - Rotation User-Agents
   - Gestion meilleure des erreurs 403
   - Fallback si scraping échoue

2. **Stripe Production**
   - Créer produits en Live mode
   - Configurer webhooks production
   - Tester Customer Portal

3. **Frontend Production**
   - Build optimisé (`pnpm build`)
   - CDN pour assets statiques
   - Service Worker (PWA optionnel)

### Moyen Terme (Mois 1)
4. **Monitoring Avancé**
   - Sentry pour erreurs
   - Prometheus + Grafana
   - Uptime monitoring (UptimeRobot)

5. **Performance**
   - CDN CloudFlare
   - Compression Brotli
   - Database indexing

6. **Celery Beat**
   - Configurer tâches planifiées
   - Renewal reminders (Mobile Money)
   - Daily coupons refresh

### Long Terme (Trimestre 1)
7. **Scaling**
   - Load balancer (Nginx)
   - Multiple workers Gunicorn
   - Read replicas MySQL

8. **Features**
   - Notifications push (Firebase)
   - Chat IA avancé
   - Analytics dashboard admin

---

## 📞 Support & Documentation

- **Architecture Hybride**: [HYBRID_DATA_ARCHITECTURE.md](HYBRID_DATA_ARCHITECTURE.md)
- **Stripe Setup**: [STRIPE_SETUP.md](STRIPE_SETUP.md)
- **Mobile Money**: [MOBILE_MONEY_RENEWAL.md](MOBILE_MONEY_RENEWAL.md)
- **Testing**: [SUBSCRIPTION_TESTING.md](SUBSCRIPTION_TESTING.md)

---

## ✅ Go/No-Go Production

### ✅ PRÊT (GO)
- Architecture hybride opérationnelle
- API fonctionnelle avec fixtures
- Frontend build sans erreurs
- Base de données migrée
- Cache Redis opérationnel
- Emails configurés (Hostinger)
- JWT + Auth sécurisés
- Documentation complète

### ⚠️ À FINALISER AVANT PROD
- [ ] Stripe Live mode + webhooks
- [ ] Moneroo Production keys
- [ ] Améliorer scrapers (User-Agents)
- [ ] DEBUG=false
- [ ] Monitoring (Sentry)
- [ ] SSL/TLS certificates
- [ ] Domain name + DNS

### 🟢 Recommandation
**Status: PRÊT POUR STAGING** 🎉

L'application peut être déployée sur un environnement de staging pour tests finaux.
Pour production complète, finaliser les paiements Stripe Live et améliorer les scrapers.

---

**Date**: 27/12/2024  
**Version**: 2.0.0 (Hybrid Architecture)  
**Dernière mise à jour**: Migration vers Football-Data.org + Scrapers
