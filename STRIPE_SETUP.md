# Configuration Stripe pour CouponFoot

## 1. Créer un compte Stripe

1. Allez sur [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Créez votre compte (mode Test activé par défaut)
3. Récupérez vos clés API dans **Developers → API keys**

## 2. Créer les produits et prix

### Produit 1: Starter Plan
1. Allez dans **Products → Add product**
2. Remplissez:
   - Name: `FootIntel Starter`
   - Description: `5 analyses IA par jour + fonctionnalités de base`
   - Pricing model: `Standard pricing`
   - Price: `9.99 EUR` (ou votre devise)
   - Billing period: `Monthly`
3. Cochez `Recurring` 
4. Cliquez sur **Add product**
5. Copiez le **Price ID** (commence par `price_...`)
6. Ajoutez-le dans `.env` comme `STRIPE_PRICE_STARTER=price_xxxxx`

### Produit 2: Pro Plan
1. Répétez les étapes ci-dessus avec:
   - Name: `FootIntel Pro`
   - Description: `Analyses illimitées + assistant IA + support prioritaire`
   - Price: `19.99 EUR`
   - Billing period: `Monthly`
2. Copiez le Price ID → `STRIPE_PRICE_PRO=price_xxxxx`

### Produit 3: Lifetime Plan
1. Créez un nouveau produit:
   - Name: `FootIntel Lifetime`
   - Description: `Accès à vie + toutes les fonctionnalités premium`
   - Pricing model: `Standard pricing`
   - Price: `99.99 EUR`
   - **NE COCHEZ PAS "Recurring"** (paiement unique)
2. Copiez le Price ID → `STRIPE_PRICE_LIFETIME=price_xxxxx`

## 3. Configurer les webhooks

1. Allez dans **Developers → Webhooks**
2. Cliquez sur **Add endpoint**
3. Endpoint URL: `https://votre-domaine.com/api/v1/subscription/webhook`
   - En local: `https://yourdomain.ngrok.io/api/v1/subscription/webhook` (utilisez ngrok)
4. Sélectionnez ces événements:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
5. Cliquez sur **Add endpoint**
6. Copiez le **Signing secret** (commence par `whsec_...`)
7. Ajoutez-le dans `.env` comme `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

## 4. Tester les webhooks en local avec Stripe CLI

### Installation
```bash
# Windows (avec Scoop)
scoop install stripe

# macOS (avec Homebrew)
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.16.8/stripe_1.16.8_linux_x86_64.tar.gz
tar -xzf stripe_1.16.8_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### Utilisation
```bash
# Connecter le CLI à votre compte Stripe
stripe login

# Écouter les webhooks et les rediriger vers votre API locale
stripe listen --forward-to localhost:8000/api/v1/subscription/webhook

# Tester un événement spécifique
stripe trigger checkout.session.completed
```

## 5. Activer le Customer Portal (optionnel)

Le Customer Portal permet aux utilisateurs de gérer leur abonnement (mettre à jour la carte, annuler, etc.).

1. Allez dans **Settings → Billing → Customer portal**
2. Cliquez sur **Activate test link**
3. Configurez:
   - **Customer information**: Allow customers to update email
   - **Payment methods**: Allow customers to update payment methods
   - **Subscriptions**: Allow customers to cancel subscriptions
   - **Invoices**: Allow customers to view invoices

## 6. Variables d'environnement finales

Votre fichier `.env` devrait ressembler à:

```env
# Stripe
STRIPE_API_KEY=sk_test_51Xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_STARTER=price_1XxxxxxxxxxxxxxStarter
STRIPE_PRICE_PRO=price_1XxxxxxxxxxxxxxPro
STRIPE_PRICE_LIFETIME=price_1XxxxxxxxxxxxxxLifetime
```

## 7. Passer en production

Quand vous êtes prêt pour la production:

1. **Désactivez le mode Test** dans le dashboard Stripe
2. Recréez les produits/prix en mode Live
3. Recréez le webhook en mode Live
4. Remplacez `sk_test_...` par `sk_live_...`
5. Mettez à jour tous les Price IDs avec ceux du mode Live

## 8. Tests de paiement

### Cartes de test Stripe

- **Succès**: `4242 4242 4242 4242`
- **Décliné**: `4000 0000 0000 0002`
- **Authentification 3D Secure**: `4000 0027 6000 3184`

Date d'expiration: N'importe quelle date future (ex: 12/25)
CVC: N'importe quel 3 chiffres (ex: 123)
ZIP: N'importe quel code postal

## 9. Sécurité

⚠️ **Important**: 
- Ne commitez JAMAIS vos clés API dans Git
- Utilisez `.env` (déjà dans `.gitignore`)
- En production, utilisez des secrets managers (AWS Secrets, Azure Key Vault, etc.)
- Validez toujours les webhooks avec la signature

## Support

Documentation Stripe: [https://stripe.com/docs](https://stripe.com/docs)
Dashboard: [https://dashboard.stripe.com](https://dashboard.stripe.com)
