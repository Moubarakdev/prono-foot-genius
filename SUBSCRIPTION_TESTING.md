# Guide de Test - Système d'Abonnement

## Prérequis

1. **Backend démarré**: `docker-compose up -d`
2. **Frontend démarré**: `cd frontend && pnpm dev`
3. **Compte utilisateur créé**: Inscription via `/register`

## Endpoints API

### 1. Obtenir les tarifs régionaux
```http
GET /api/v1/subscription/pricing
Authorization: Bearer {access_token}
```

**Réponse attendue:**
```json
{
  "currency": "EUR",
  "symbol": "€",
  "plans": {
    "starter": 9.99,
    "pro": 19.99,
    "lifetime": 99.99
  },
  "country_code": "FR"
}
```

### 2. Créer une session de paiement
```http
POST /api/v1/subscription/checkout
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "plan_type": "pro",
  "payment_method": "stripe",
  "success_url": "http://localhost:5173/dashboard?success=true",
  "cancel_url": "http://localhost:5173/pricing?canceled=true"
}
```

**Réponse attendue:**
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

### 3. Vérifier le statut de l'abonnement
```http
GET /api/v1/subscription/status
Authorization: Bearer {access_token}
```

**Réponse attendue:**
```json
{
  "plan": "pro",
  "expires_at": "2026-01-27T16:30:00",
  "is_active": true
}
```

### 4. Créer une session Customer Portal
```http
POST /api/v1/subscription/portal
Authorization: Bearer {access_token}
```

**Réponse attendue:**
```json
{
  "checkout_url": "https://billing.stripe.com/p/session/..."
}
```

### 5. Annuler l'abonnement
```http
POST /api/v1/subscription/cancel
Authorization: Bearer {access_token}
```

**Réponse attendue:**
```json
{
  "status": "success",
  "message": "Subscription canceled successfully"
}
```

## Flux de Test Complet

### Étape 1: Configuration Stripe

1. Allez sur https://dashboard.stripe.com
2. Créez 3 produits (Starter, Pro, Lifetime) - voir `STRIPE_SETUP.md`
3. Copiez les Price IDs dans `.env`:
   ```env
   STRIPE_PRICE_STARTER=price_xxxxx
   STRIPE_PRICE_PRO=price_xxxxx
   STRIPE_PRICE_LIFETIME=price_xxxxx
   ```
4. Configurez le webhook Stripe

### Étape 2: Test Frontend - Page Pricing

1. Démarrez le frontend: `cd frontend && pnpm dev`
2. Allez sur http://localhost:5173/pricing
3. Vérifiez que les prix s'affichent correctement
4. Testez le changement de méthode de paiement (Stripe/Moneroo)
5. Vérifiez que les prix sont en EUR (ou adaptés à votre région)

### Étape 3: Test Checkout Stripe

1. Connectez-vous à votre compte
2. Cliquez sur "S'abonner" pour le plan **Pro**
3. Vous devriez être redirigé vers Stripe Checkout
4. Utilisez une carte de test: `4242 4242 4242 4242`
5. Date: `12/25`, CVC: `123`, ZIP: `12345`
6. Complétez le paiement

### Étape 4: Vérification Webhook

1. Vérifiez les logs du webhook:
   ```bash
   docker-compose logs api | grep "webhook"
   ```
2. Vous devriez voir:
   ```
   INFO - Received Stripe webhook: checkout.session.completed
   INFO - User xxx upgraded to pro
   ```

### Étape 5: Vérification Base de Données

```sql
-- Connectez-vous à MySQL
docker exec -it api-football-mysql-1 mysql -u root -p

USE couponfoot;

-- Vérifiez que l'utilisateur a été mis à jour
SELECT id, email, subscription, stripe_customer_id, stripe_subscription_id, subscription_expires_at
FROM users
WHERE email = 'votre-email@example.com';
```

**Résultat attendu:**
```
subscription: pro
stripe_customer_id: cus_xxxxx
stripe_subscription_id: sub_xxxxx
subscription_expires_at: NULL (géré par Stripe)
```

### Étape 6: Test Page Subscription

1. Allez sur http://localhost:5173/subscription
2. Vérifiez que votre plan actuel s'affiche (**Pro**)
3. Vérifiez le statut: **Actif**
4. Vérifiez les analyses utilisées: `0 / Illimité`

### Étape 7: Test Customer Portal

1. Sur la page `/subscription`, cliquez sur **Gérer l'abonnement**
2. Vous devriez être redirigé vers le Stripe Customer Portal
3. Testez la mise à jour de la carte bancaire
4. Testez l'annulation de l'abonnement

### Étape 8: Test d'Annulation

1. Sur `/subscription`, cliquez sur **Annuler l'abonnement**
2. Confirmez l'annulation
3. Vérifiez que:
   - Le plan est revenu à **Gratuit**
   - Le statut est **Inactif**
   - Les analyses sont limitées à `1 / jour`

## Test des Webhooks en Local

### Avec Stripe CLI

```bash
# Installation
scoop install stripe  # Windows
brew install stripe/stripe-cli/stripe  # macOS

# Connexion
stripe login

# Écoute des webhooks
stripe listen --forward-to localhost:8000/api/v1/subscription/webhook

# Dans un autre terminal, déclenchez un événement
stripe trigger checkout.session.completed
```

### Avec ngrok (alternative)

```bash
# Installation
choco install ngrok  # Windows
brew install ngrok  # macOS

# Démarrage
ngrok http 8000

# Copiez l'URL HTTPS et configurez-la dans Stripe Dashboard
# https://xxxx.ngrok.io/api/v1/subscription/webhook
```

## Tests de Cas Limites

### 1. Paiement Échoué

Carte de test: `4000 0000 0000 0002`

**Résultat attendu:**
- Le paiement échoue
- L'utilisateur reste sur le plan Gratuit
- Un webhook `invoice.payment_failed` est envoyé

### 2. Authentification 3D Secure

Carte de test: `4000 0027 6000 3184`

**Résultat attendu:**
- Une popup d'authentification 3DS s'affiche
- Le paiement est complété après validation
- L'abonnement est activé

### 3. Abonnement Expiré (Moneroo)

Pour Moneroo (paiement mensuel non récurrent):

1. Créez un abonnement via Moneroo
2. La `subscription_expires_at` est définie à +30 jours
3. Attendez l'expiration (ou modifiez manuellement en base)
4. Vérifiez que le statut passe à **Inactif**

### 4. Plan Lifetime

1. Souscrivez au plan **Lifetime** (paiement unique)
2. Vérifiez que:
   - `subscription_expires_at` = dans 100 ans
   - Pas de `stripe_subscription_id` (paiement unique)
   - Le Customer Portal ne propose pas d'annulation

## Surveillance en Production

### Logs Importants

```bash
# Webhooks Stripe
docker-compose logs api | grep "Stripe webhook"

# Paiements réussis
docker-compose logs api | grep "upgraded to"

# Paiements échoués
docker-compose logs api | grep "payment_failed"

# Annulations
docker-compose logs api | grep "canceled for customer"
```

### Métriques Stripe Dashboard

1. **Revenue**: Tableau de bord → Revenue
2. **MRR (Monthly Recurring Revenue)**: Rapports → MRR
3. **Churn Rate**: Rapports → Churn
4. **Failed Payments**: Paiements → Échecs

## Dépannage

### Problème: "Could not create Stripe checkout session"

**Causes possibles:**
- `STRIPE_API_KEY` non définie ou invalide
- Price IDs non configurés
- Clé API en mode Test mais Price IDs en mode Live (ou vice-versa)

**Solution:**
1. Vérifiez `.env`
2. Vérifiez que les Price IDs existent dans Stripe Dashboard
3. Redémarrez l'API: `docker-compose restart api`

### Problème: Webhook non reçu

**Causes possibles:**
- Signature incorrecte
- URL du webhook mal configurée
- ngrok/tunnel fermé

**Solution:**
1. Vérifiez `STRIPE_WEBHOOK_SECRET` dans `.env`
2. Testez avec Stripe CLI: `stripe listen --forward-to localhost:8000/api/v1/subscription/webhook`
3. Vérifiez les logs: `docker-compose logs api --tail 50`

### Problème: Utilisateur non mis à jour après paiement

**Causes possibles:**
- Webhook non traité
- `user_id` manquant dans les métadonnées

**Solution:**
1. Vérifiez les logs webhook: `docker-compose logs api | grep webhook`
2. Vérifiez que le paiement contient bien `metadata.user_id` dans Stripe Dashboard
3. Relancez manuellement le webhook depuis Stripe Dashboard

## Checklist de Production

- [ ] Mode Test Stripe désactivé
- [ ] Produits recréés en mode Live
- [ ] Webhook configuré avec URL HTTPS en production
- [ ] `STRIPE_WEBHOOK_SECRET` mis à jour (mode Live)
- [ ] Price IDs mis à jour (mode Live)
- [ ] Monitoring des webhooks activé
- [ ] Emails de confirmation configurés
- [ ] Customer Portal activé et configuré
- [ ] Conditions générales de vente ajoutées
- [ ] Politique de remboursement définie
- [ ] Gestion des disputes configurée
