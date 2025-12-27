# Restriction Mobile Money aux Pays Africains

## Modifications Apportées

### 1. Frontend - PricingPage.tsx

**Pays africains supportés:**
```typescript
const AFRICAN_COUNTRIES = [
    'BJ', 'CI', 'SN', 'TG', 'ML', 'NE', 'BF', 'GW', // Afrique de l'Ouest (XOF)
    'CM', 'GA', 'CG', 'TD', 'CF', 'GQ',             // Afrique Centrale (XAF)
    'KE', 'TZ', 'UG', 'RW', 'BI',                   // Afrique de l'Est
    'GH', 'NG', 'ZA', 'MA', 'TN', 'EG'              // Autres pays africains
];
```

**Comportement:**
- ✅ **En Afrique**: Affiche le sélecteur avec Stripe et Mobile Money (Moneroo par défaut)
- ✅ **Hors Afrique**: Affiche uniquement "Paiement par carte bancaire uniquement" avec Stripe forcé

### 2. Backend - subscription.py

**Validation ajoutée:**
```python
# Restriction: Moneroo disponible uniquement en Afrique
african_countries = [
    'BJ', 'CI', 'SN', 'TG', 'ML', 'NE', 'BF', 'GW',  # Afrique de l'Ouest
    'CM', 'GA', 'CG', 'TD', 'CF', 'GQ',              # Afrique Centrale
    'KE', 'TZ', 'UG', 'RW', 'BI',                    # Afrique de l'Est
    'GH', 'NG', 'ZA', 'MA', 'TN', 'EG'               # Autres pays africains
]

if checkout_data.payment_method == "moneroo":
    if country_code not in african_countries:
        raise HTTPException(
            status_code=400, 
            detail="Mobile Money (Moneroo) is only available in African countries. Please use Stripe instead."
        )
```

**Réponse API en cas d'erreur:**
```json
{
    "detail": "Mobile Money (Moneroo) is only available in African countries. Please use Stripe instead."
}
```

### 3. Traductions

**Ajout de la clé `pricing.cardPaymentOnly`:**
- 🇫🇷 FR: "Paiement par carte bancaire uniquement"
- 🇬🇧 EN: "Card payment only"
- 🇩🇪 DE: "Nur Kartenzahlung"

## Pays Africains Supportés (24 pays)

### Afrique de l'Ouest (UEMOA - XOF)
- 🇧🇯 Bénin (BJ)
- 🇨🇮 Côte d'Ivoire (CI)
- 🇸🇳 Sénégal (SN)
- 🇹🇬 Togo (TG)
- 🇲🇱 Mali (ML)
- 🇳🇪 Niger (NE)
- 🇧🇫 Burkina Faso (BF)
- 🇬🇼 Guinée-Bissau (GW)

### Afrique Centrale (CEMAC - XAF)
- 🇨🇲 Cameroun (CM)
- 🇬🇦 Gabon (GA)
- 🇨🇬 Congo (CG)
- 🇹🇩 Tchad (TD)
- 🇨🇫 République Centrafricaine (CF)
- 🇬🇶 Guinée Équatoriale (GQ)

### Afrique de l'Est
- 🇰🇪 Kenya (KE)
- 🇹🇿 Tanzanie (TZ)
- 🇺🇬 Ouganda (UG)
- 🇷🇼 Rwanda (RW)
- 🇧🇮 Burundi (BI)

### Autres Pays Africains
- 🇬🇭 Ghana (GH)
- 🇳🇬 Nigeria (NG)
- 🇿🇦 Afrique du Sud (ZA)
- 🇲🇦 Maroc (MA)
- 🇹🇳 Tunisie (TN)
- 🇪🇬 Égypte (EG)

## Flux Utilisateur

### Utilisateur en Afrique (ex: Sénégal)

1. **Détection automatique**: IP → Pays: SN
2. **Affichage**: Sélecteur de méthode de paiement
3. **Défaut**: Mobile Money (Moneroo) pré-sélectionné
4. **Options**: 
   - 💳 Carte / Stripe
   - 📱 Mobile Money (Moneroo)
5. **Paiement**: Redirection vers Moneroo pour paiement mobile

### Utilisateur hors Afrique (ex: France)

1. **Détection automatique**: IP → Pays: FR
2. **Affichage**: Message "Paiement par carte bancaire uniquement"
3. **Options**: Stripe uniquement (pas de sélecteur)
4. **Paiement**: Redirection vers Stripe Checkout

### Tentative de contournement

Si un utilisateur hors Afrique tente de forcer `payment_method: moneroo` via l'API:

```bash
curl -X POST "http://localhost:8000/api/v1/subscription/checkout" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_type": "pro",
    "payment_method": "moneroo",
    "success_url": "...",
    "cancel_url": "..."
  }'
```

**Réponse:**
```json
{
    "detail": "Mobile Money (Moneroo) is only available in African countries. Please use Stripe instead."
}
```

## Configuration Moneroo

Pour activer Mobile Money, configurez dans `.env`:

```env
# Moneroo (African Mobile Money)
MONEROO_API_KEY=your-moneroo-api-key
MONEROO_WEBHOOK_SECRET=your-moneroo-webhook-secret
```

**Obtenir les clés:**
1. Créez un compte sur [https://moneroo.io](https://moneroo.io)
2. Allez dans **Settings → API Keys**
3. Copiez vos clés API et Webhook Secret

## Test en Local

### Simuler un utilisateur africain

```bash
# 1. Modifier temporairement pricing_service.py pour forcer un pays africain
# Dans get_country_code(), retourner "SN" (Sénégal)

# 2. Redémarrer l'API
docker-compose restart api

# 3. Ouvrir le frontend
http://localhost:5173/pricing

# Résultat: Le sélecteur Mobile Money s'affiche
```

### Simuler un utilisateur européen

```bash
# 1. pricing_service.py retourne déjà "FR" par défaut en local

# 2. Ouvrir le frontend
http://localhost:5173/pricing

# Résultat: Message "Paiement par carte bancaire uniquement"
```

## Ajout d'un Nouveau Pays

Pour ajouter un pays africain à la liste:

**Frontend** (`PricingPage.tsx`):
```typescript
const AFRICAN_COUNTRIES = [
    // ... existants
    'DZ', // Ajouter Algérie
];
```

**Backend** (`subscription.py`):
```python
african_countries = [
    # ... existants
    'DZ', # Ajouter Algérie
]
```

## Notes Importantes

⚠️ **Détection par IP**: La détection du pays se fait via l'IP de l'utilisateur. En local, elle retourne "FR" par défaut.

⚠️ **VPN**: Si un utilisateur africain utilise un VPN européen, il verra uniquement Stripe. C'est un compromis acceptable pour éviter les fraudes.

⚠️ **Moneroo Coverage**: Vérifiez sur [moneroo.io](https://moneroo.io) que votre pays cible est bien supporté avant de l'ajouter à la liste.

✅ **Double validation**: Frontend + Backend pour éviter toute tentative de contournement.
