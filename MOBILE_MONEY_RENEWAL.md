# Système de Renouvellement Manuel pour Mobile Money

## Vue d'Ensemble

Le système d'abonnement distingue maintenant deux modes de paiement:

### 1. Stripe (Carte Bancaire) - Renouvellement AUTOMATIQUE
- ✅ Abonnement géré par Stripe
- ✅ Renouvellement automatique mensuel
- ✅ Pas de date d'expiration en base (géré par Stripe)
- ✅ Webhooks pour gérer les renouvellements/échecs

### 2. Moneroo (Mobile Money) - Renouvellement MANUEL
- ⚠️ Paiement mensuel NON récurrent
- ⚠️ Utilisateur doit renouveler manuellement
- ⚠️ Date d'expiration: 30 jours après paiement
- ⚠️ Downgrade automatique vers FREE si expiré
- 📧 Rappels par email envoyés automatiquement

## Modifications Apportées

### 1. Base de Données

**Nouveau champ ajouté:**
```sql
ALTER TABLE users ADD COLUMN payment_method VARCHAR(20) NULL 
COMMENT 'stripe or moneroo - used to determine renewal behavior';
```

**Migration:** `10a24c5a209e_add_payment_method_to_users.py`

### 2. Backend - Models

**Fichier:** `app/models/user.py`

```python
payment_method: Mapped[str | None] = mapped_column(
    String(20),
    nullable=True,
    comment="stripe or moneroo - used to determine renewal behavior"
)
```

### 3. Backend - Services

**Nouveau service:** `app/services/renewal_service.py`

Fonctions:
- `get_users_needing_renewal_reminder()` - Trouve utilisateurs nécessitant rappel
- `get_expired_moneroo_subscriptions()` - Trouve abonnements expirés
- `downgrade_expired_subscriptions()` - Downgrade vers FREE
- `get_renewal_email_subject()` - Génère sujet email
- `get_renewal_email_body()` - Génère corps email HTML

**Critères de rappel:**
- Abonnement actif (Starter ou Pro)
- `payment_method` = 'moneroo'
- Expire dans X jours (configurable: 7, 3, ou 1 jour)
- Pas encore expiré

### 4. Backend - Celery Tasks

**Nouveau fichier:** `app/tasks/renewal_tasks.py`

**Tâches:**

1. **`send_renewal_reminders_task(days_before=7)`**
   - Envoie rappels X jours avant expiration
   - Génère emails personnalisés
   - Logs succès/échecs

2. **`downgrade_expired_subscriptions_task()`**
   - Downgrade abonnements Mobile Money expirés
   - Change plan vers FREE
   - Supprime date d'expiration

3. **`send_expiration_warning_task()`**
   - Envoie rappels multiples (7j, 3j, 1j)
   - Tâche combinée pour automatisation

**Configuration Celery Beat (à ajouter):**
```python
from celery.schedules import crontab

CELERYBEAT_SCHEDULE = {
    'send-renewal-reminders': {
        'task': 'send_expiration_warning',
        'schedule': crontab(hour=9, minute=0),  # Chaque jour à 9h
    },
    'downgrade-expired-subscriptions': {
        'task': 'downgrade_expired_subscriptions',
        'schedule': crontab(hour=2, minute=0),  # Chaque jour à 2h du matin
    },
}
```

### 5. Backend - API Updates

**Fichier:** `app/api/v1/subscription.py`

**Webhook Stripe:**
```python
if user:
    user.payment_method = 'stripe'  # Stripe = auto-renewal
    user.subscription_expires_at = None  # Géré par Stripe
```

**Webhook Moneroo:**
```python
if user:
    user.payment_method = 'moneroo'  # Moneroo = manual renewal
    user.subscription_expires_at = datetime.utcnow() + timedelta(days=30)
```

### 6. Frontend - Integration

**Route ajoutée:** `/subscription`

**Menu mis à jour:** Dashboard layout avec icône Crown

**Page SubscriptionPage:**
- Affiche méthode de paiement (implicite)
- Alerte si date d'expiration proche
- Message spécifique Mobile Money

**Message d'avertissement:**
```tsx
{status?.expires_at && currentPlan !== 'lifetime' && (
    <AlertCircle />
    "🔄 Renouvellement manuel requis"
    "Votre abonnement Mobile Money n'est pas renouvelé automatiquement..."
)}
```

## Flux Utilisateur

### Abonnement Stripe (Automatique)

```
1. Utilisateur souscrit via Stripe Checkout
   ↓
2. Webhook: checkout.session.completed
   → payment_method = 'stripe'
   → subscription_expires_at = NULL
   ↓
3. Stripe gère le renouvellement automatique chaque mois
   ↓
4. Webhook: customer.subscription.updated
   → Abonnement renouvelé automatiquement
```

### Abonnement Mobile Money (Manuel)

```
1. Utilisateur souscrit via Moneroo (Mobile Money)
   ↓
2. Webhook: payment.success
   → payment_method = 'moneroo'
   → subscription_expires_at = NOW + 30 jours
   ↓
3. Rappels automatiques envoyés:
   - J-7: Email de rappel
   - J-3: Email de rappel
   - J-1: Email de rappel urgent
   ↓
4a. Utilisateur renouvelle manuellement → OK
    → Nouvelle expiration = NOW + 30 jours
    
4b. Utilisateur ne renouvelle PAS
    ↓
    Tâche Celery: downgrade_expired_subscriptions
    → subscription = 'free'
    → subscription_expires_at = NULL
    → Perd accès premium
```

## Emails de Rappel

### Template Email (Français)

**Sujet:** "⏰ Votre abonnement FootIntel expire bientôt"

**Contenu:**
- Salutation personnalisée
- Nombre de jours restants
- Liste des fonctionnalités à perdre
- Bouton CTA "Renouveler Mon Abonnement"
- Note sur renouvellement manuel
- Footer avec coordonnées support

### Langues Supportées
- 🇫🇷 Français
- 🇬🇧 Anglais
- 🇩🇪 Allemand (à venir)

## Configuration Celery

### Installation (si nécessaire)

```bash
pip install celery redis
```

### Fichier de Configuration

**Créer:** `app/celery_app.py`

```python
from celery import Celery
from celery.schedules import crontab
from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    'footintel',
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=['app.tasks.renewal_tasks', 'app.tasks.email_tasks']
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

# Schedule des tâches
celery_app.conf.beat_schedule = {
    'send-renewal-warnings': {
        'task': 'send_expiration_warning',
        'schedule': crontab(hour=9, minute=0),  # 9h chaque jour
    },
    'downgrade-expired': {
        'task': 'downgrade_expired_subscriptions',
        'schedule': crontab(hour=2, minute=0),  # 2h chaque jour
    },
}
```

### Démarrage

```bash
# Worker
celery -A app.celery_app worker --loglevel=info

# Beat (scheduler)
celery -A app.celery_app beat --loglevel=info

# Flower (monitoring)
celery -A app.celery_app flower
```

### Docker Compose

```yaml
worker:
  build:
    context: ./backend
  command: celery -A app.celery_app worker --loglevel=info
  depends_on:
    - redis
    - mysql

beat:
  build:
    context: ./backend
  command: celery -A app.celery_app beat --loglevel=info
  depends_on:
    - redis
    - mysql
```

## Tests

### Test Manuel - Rappels

```python
# Dans le shell Python
from app.tasks.renewal_tasks import send_renewal_reminders_task

# Test avec 7 jours
result = send_renewal_reminders_task.apply(args=[7])
print(result.get())  # {'sent': 0, 'failed': 0}
```

### Test Manuel - Downgrade

```python
from app.tasks.renewal_tasks import downgrade_expired_subscriptions_task

result = downgrade_expired_subscriptions_task.apply()
print(result.get())  # {'downgraded': 0}
```

### Simuler Expiration (Dev)

```sql
-- Créer un abonnement qui expire demain
UPDATE users 
SET 
    subscription = 'pro',
    payment_method = 'moneroo',
    subscription_expires_at = DATE_ADD(NOW(), INTERVAL 1 DAY)
WHERE email = 'test@example.com';

-- Attendre 24h ou exécuter la tâche manuellement
```

## Monitoring

### Logs Importants

```bash
# Rappels envoyés
docker-compose logs worker | grep "Renewal reminder sent"

# Downgrades
docker-compose logs worker | grep "Downgraded"

# Erreurs
docker-compose logs worker | grep "ERROR"
```

### Métriques Celery

- **Flower Dashboard**: http://localhost:5555
- Tâches réussies/échouées
- Temps d'exécution
- Workers actifs

## Checklist Production

- [ ] Configurer Celery Worker en production
- [ ] Configurer Celery Beat (scheduler)
- [ ] Configurer Flower (monitoring)
- [ ] Vérifier SMTP configuré (emails)
- [ ] Tester rappels sur compte test
- [ ] Configurer alertes pour échecs de tâches
- [ ] Vérifier timezone correcte (UTC)
- [ ] Logs centralisés (Sentry, CloudWatch, etc.)
- [ ] Backup régulier de la base de données
- [ ] Monitoring des abonnements expirés

## FAQ

**Q: Pourquoi Stripe n'a pas de date d'expiration?**
R: Stripe gère automatiquement les renouvellements. La date est dans leur système, pas le nôtre.

**Q: Que se passe-t-il si un utilisateur ne renouvelle pas?**
R: Il est automatiquement downgradé vers FREE après expiration. Il peut se réabonner à tout moment.

**Q: Les utilisateurs reçoivent combien de rappels?**
R: 3 rappels par défaut: 7 jours, 3 jours, et 1 jour avant expiration.

**Q: Peut-on forcer un downgrade manuel?**
R: Oui, via l'API `/subscription/cancel` ou directement en base de données.

**Q: Moneroo supporte le renouvellement automatique?**
R: Non, Mobile Money ne supporte pas les prélèvements automatiques. C'est une limitation du système de paiement.
