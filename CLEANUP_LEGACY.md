# 🧹 Nettoyage Architecture Hybride

## Fichiers à SUPPRIMER (Legacy API-Football)

Ces fichiers ne sont **plus utilisés** depuis la migration vers l'architecture hybride :

### 1. Backend
```bash
# Provider API-Football (RapidAPI) - OBSOLÈTE
rm backend/app/providers/football/api_football.py

# Script de test ancien système
rm backend/test_api.py
```

### 2. Variables d'environnement
```bash
# Dans backend/.env - À SUPPRIMER ou commenter
# FOOTBALL_API_KEY=...  # ← LEGACY, ne plus utiliser
```

### 3. Imports inutiles
```python
# backend/app/providers/__init__.py
# SUPPRIMER: from .football.api_football import ApiFootballProvider
```

---

## ✅ Ce qui est ACTIF (Architecture Hybride)

### Providers utilisés
```python
# backend/app/providers/__init__.py
return HybridFootballProvider()  # ← ACTIF
```

### Sources de données
1. **Football-Data.org** - API gratuite (fixtures)
   - Fichier: `backend/app/providers/football/football_data_org.py`
   - Variable: `FOOTBALL_DATA_API_KEY`

2. **Scrapers** - Web scraping (scores, cotes, stats)
   - Fichier: `backend/app/services/scrapers.py`
   - Sources: SofaScore, OddsChecker, FBref

3. **Provider Hybride** - Orchestrateur
   - Fichier: `backend/app/providers/football/hybrid_provider.py`

---

## 🔧 Actions de nettoyage

### Option 1: Suppression complète (Recommandé)
```bash
cd backend

# Supprimer le provider obsolète
rm app/providers/football/api_football.py

# Supprimer le script de test obsolète
rm test_api.py

# Commenter dans .env
# FOOTBALL_API_KEY=526c50913cc474453b0916bb259191f3  # OBSOLETE
```

### Option 2: Archivage (Précaution)
```bash
cd backend

# Créer un dossier legacy
mkdir -p legacy

# Déplacer les fichiers
mv app/providers/football/api_football.py legacy/
mv test_api.py legacy/

# Ajouter un README
echo "# Legacy API-Football Provider (RapidAPI) - NOT USED" > legacy/README.md
```

---

## 📊 Comparaison

| Critère | API-Football (Ancien) | Architecture Hybride (Actuel) |
|---------|----------------------|------------------------------|
| **Coût** | Payant (100 req/jour gratuit) | 100% Gratuit |
| **Sources** | 1 API unique | 4 sources combinées |
| **Données** | Complètes mais limitées | Riches via scraping |
| **Maintenance** | Simple | Nécessite monitoring scrapers |
| **Fiabilité** | Haute (API stable) | Moyenne (scrapers fragiles) |
| **Status** | ❌ OBSOLÈTE | ✅ ACTIF |

---

## 🎯 Recommandation

**SUPPRIMER les fichiers obsolètes** pour éviter confusion.

Le projet utilise maintenant **exclusivement** :
- Football-Data.org (API gratuite)
- Scrapers maison (SofaScore, OddsChecker, FBref)

---

**Date**: 27/12/2024  
**Raison**: Migration vers architecture hybride gratuite  
**Impact**: Aucun (fichiers non utilisés)
