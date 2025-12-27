# Guide d'utilisation de l'architecture hybride de données football

## Vue d'ensemble

Le système utilise désormais une **architecture hybride** combinant API gratuite et web scraping pour obtenir les données de football :

### Sources de données

| Type de données | Source | Méthode | Coût |
|----------------|--------|---------|------|
| **Fixtures** (calendrier) | [Football-Data.org](https://www.football-data.org/) | API REST gratuite | ✅ GRATUIT |
| **Scores** (résultats en direct) | [SofaScore.com](https://www.sofascore.com/) | Web Scraping | ✅ GRATUIT |
| **Cotes** (odds) | [OddsChecker.com](https://www.oddschecker.com/) | Web Scraping | ✅ GRATUIT |
| **Statistiques** (stats détaillées) | [FBref.com](https://fbref.com/) | Web Scraping | ✅ GRATUIT |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│          HybridFootballProvider                      │
│  (Orchestrateur principal - app/providers/football/) │
└──────────────┬──────────────────────────────────────┘
               │
    ┌──────────┴──────────┬──────────┬────────────┐
    │                     │          │            │
    ▼                     ▼          ▼            ▼
┌────────┐        ┌─────────┐  ┌──────────┐  ┌────────┐
│Football│        │SofaScore│  │OddsChecker│  │ FBref  │
│Data.org│        │ Scraper │  │  Scraper  │  │Scraper │
└────────┘        └─────────┘  └──────────┘  └────────┘
  API REST         Scraping      Scraping     Scraping
```

## Fichiers créés

### 1. Services de scraping
**`backend/app/services/scrapers.py`**
- `SofaScoreScraper`: Récupère les scores en direct
- `OddsCheckerScraper`: Récupère les cotes des bookmakers
- `FBrefScraper`: Récupère les statistiques détaillées

### 2. Provider Football-Data.org
**`backend/app/providers/football/football_data_org.py`**
- Implémente `BaseFootballProvider`
- Accès à l'API gratuite Football-Data.org
- Gère fixtures, leagues, teams
- Limite: 10 requêtes/minute (tier gratuit)

### 3. Provider Hybride
**`backend/app/providers/football/hybrid_provider.py`**
- Orchestre toutes les sources
- Combine les données de multiples sources
- Enrichit automatiquement les fixtures avec scores/odds/stats
- Méthode spéciale: `get_fixture_with_all_data()`

## Configuration

### 1. Obtenir une clé API Football-Data.org

1. Créer un compte sur https://www.football-data.org/client/register
2. Confirmer l'email
3. Copier la clé API depuis le dashboard

### 2. Mettre à jour `.env`

```bash
# Ajouter cette ligne au fichier backend/.env
FOOTBALL_DATA_API_KEY=votre_cle_api_ici

# L'ancienne clé peut rester (legacy) mais ne sera plus utilisée
FOOTBALL_API_KEY=ancienne_cle_rapidapi
```

### 3. Installer les dépendances

```bash
cd backend
pip install -r requirements.txt
```

Nouvelles dépendances ajoutées :
- `beautifulsoup4==4.12.3` - Parsing HTML
- `lxml==5.3.0` - Parser rapide pour BeautifulSoup

## Utilisation

### Dans le code (aucun changement nécessaire!)

L'API reste identique. Le `HybridFootballProvider` implémente la même interface que `ApiFootballProvider` :

```python
from app.providers import get_football_provider

football_api = get_football_provider()

# Récupère les fixtures (depuis Football-Data.org)
fixtures = await football_api.get_fixtures(date="2024-12-27")

# Récupère un fixture avec toutes les données enrichies
fixture = await football_api.get_fixture_with_all_data(fixture_id=123)
# Contient: fixture + live_score (SofaScore) + statistics (FBref) + odds (OddsChecker)

# Récupère les statistiques (depuis FBref)
stats = await football_api.get_statistics(fixture_id=123)

# Récupère les cotes (depuis OddsChecker)
odds = await football_api.get_odds(fixture_id=123)
```

### Endpoints API (inchangés)

Tous les endpoints existants continuent de fonctionner :

- `GET /api/v1/football/fixtures` - Liste des matchs
- `GET /api/v1/football/teams/search` - Recherche d'équipes
- `GET /api/v1/football/teams/{team_id}/stats` - Stats d'une équipe
- `GET /api/v1/football/fixtures/{fixture_id}/odds` - Cotes d'un match
- etc.

## Avantages de l'approche hybride

### ✅ Avantages

1. **Coût zéro** : Toutes les sources sont gratuites
2. **Pas de limite stricte** : Les scrapers n'ont pas de quotas
3. **Données riches** : Combine le meilleur de chaque source
4. **Fallback automatique** : Si une source échoue, les autres continuent
5. **Compatibilité** : Interface identique à l'ancienne API

### ⚠️ Limitations

1. **Rate limiting** : Football-Data.org a une limite de 10 req/min
2. **Scraping fragile** : Les sites peuvent changer leur structure HTML
3. **Latence** : Les requêtes de scraping sont plus lentes
4. **Données partielles** : Certaines données peuvent être manquantes

### 💡 Recommandations

1. **Cache agressif** : Utiliser Redis pour cacher les résultats (déjà implémenté)
2. **Surveillance** : Logger les erreurs de scraping pour détecter les changements
3. **Fallback** : Si un scraper échoue, continuer avec les données disponibles
4. **User-Agent rotation** : Pour éviter les blocages (à implémenter si nécessaire)

## Dépannage

### Erreur : "X-Auth-Token required"
➡️ Ajouter `FOOTBALL_DATA_API_KEY` dans `.env`

### Erreur : "Too Many Requests (429)"
➡️ Limite de 10 req/min atteinte. Attendre 1 minute ou améliorer le cache.

### Scraping échoue
➡️ Normal si le site change. Vérifier les logs et adapter le scraper si nécessaire.

### Données manquantes
➡️ Certaines ligues/équipes peuvent ne pas être disponibles sur toutes les sources.

## Migration depuis API-Football

L'ancien provider `ApiFootballProvider` reste disponible mais n'est plus utilisé par défaut.

Pour revenir à l'ancienne API (en cas de problème) :

```python
# Dans app/providers/__init__.py
def get_football_provider() -> BaseFootballProvider:
    # Décommenter pour revenir à l'ancienne API
    # return ApiFootballProvider()
    
    return HybridFootballProvider()  # Nouveau (actuel)
```

## Tests

### Test rapide en local

```python
# backend/test_hybrid.py
import asyncio
from app.providers.football.hybrid_provider import HybridFootballProvider

async def test():
    provider = HybridFootballProvider()
    
    # Test fixtures
    fixtures = await provider.get_fixtures(next=5)
    print(f"Found {len(fixtures)} upcoming fixtures")
    
    # Test avec un fixture_id
    if fixtures:
        fixture_id = fixtures[0]["fixture"]["id"]
        complete = await provider.get_fixture_with_all_data(fixture_id)
        print(f"Complete data: {complete.keys()}")

asyncio.run(test())
```

## Monitoring

Logs à surveiller :

```
INFO: Hybrid Football Provider initialized with multiple sources
INFO: Enriched fixture 12345 with SofaScore data
INFO: Retrieved complete fixture data for 12345 from all sources
WARNING: Statistics not available in Football-Data.org - use scraper
ERROR: SofaScore scraping error for match 12345: ...
ERROR: OddsChecker scraping error for ...
```

## Roadmap

### 🚀 Améliorations futures

1. **Selenium pour JavaScript** : Certains sites nécessitent un navigateur
2. **Proxies** : Rotation de proxies pour éviter les blocages
3. **Cache distribué** : Partager le cache entre instances
4. **API alternatives** : Ajouter d'autres sources gratuites en fallback
5. **Monitoring avancé** : Dashboard pour suivre la santé des scrapers

## Support

En cas de problème :
1. Vérifier les logs : `docker logs api-football-api-1`
2. Tester les scrapers individuellement
3. Vérifier que la clé API Football-Data.org est valide
4. Contacter l'équipe de développement

---

**Date de création** : 27/12/2024  
**Version** : 1.0  
**Auteur** : CouponFoot Team
