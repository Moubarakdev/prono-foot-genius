# 🧪 Guide de Test - Optimisations Ollama

## Vue d'ensemble

Ce guide permet de tester et valider les optimisations appliquées au provider Ollama.

---

## 🎯 Tests Prioritaires

### ✅ Test 1: Analyse Match Équilibré

**Objectif**: Vérifier que le modèle génère des probabilités cohérentes pour un match équilibré.

#### Données de Test
```json
{
  "home_team": "Real Madrid",
  "away_team": "Barcelona",
  "league_name": "La Liga",
  "match_date": "2025-02-15"
}
```

#### Résultats Attendus
- **Probabilités**: ~45/30/25 (équilibrées)
- **Facteurs clés**: 
  - H2H récent (ex: "4 derniers El Clásico: 2V-1N-1D")
  - Forme domicile/extérieur (ex: "Real invaincu 8 matchs domicile")
  - Stats concrètes (ex: "Barcelona moyenne 2.1 buts/match extérieur")
- **Scénarios**: 2-3 scénarios réalistes
- **Temps**: <20s
- **JSON**: Valide

#### Commande cURL
```bash
curl -X POST http://localhost:8000/api/v1/football/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "home_team": "Real Madrid",
    "away_team": "Barcelona",
    "league_id": 140
  }'
```

#### Validation Checklist
- [ ] Probabilités home + draw + away = 1.0 exactement
- [ ] Au moins 3 facteurs clés avec chiffres/stats
- [ ] Scénarios avec probabilités cohérentes
- [ ] Résumé <500 chars et actionnable
- [ ] Temps génération <20s
- [ ] JSON valide sans erreurs

---

### ✅ Test 2: Analyse Match Déséquilibré

**Objectif**: Vérifier que le modèle détecte les déséquilibres clairs.

#### Données de Test
```json
{
  "home_team": "PSG",
  "away_team": "Clermont",
  "league_name": "Ligue 1",
  "match_date": "2025-02-15"
}
```

#### Résultats Attendus
- **Probabilités**: ~70/20/10 (PSG favori)
- **Facteurs clés**:
  - Différence niveau (ex: "PSG 2ème vs Clermont 17ème")
  - Bilan domicile PSG (ex: "15 matchs sans défaite")
  - Stats buts (ex: "PSG moyenne 2.8 buts/match, Clermont 0.9")
- **Confiance**: >0.70
- **Value bet**: Si cote PSG >1.60

#### Commande cURL
```bash
curl -X POST http://localhost:8000/api/v1/football/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "home_team": "PSG",
    "away_team": "Clermont",
    "league_id": 61
  }'
```

#### Validation Checklist
- [ ] Probabilités reflètent déséquilibre (>65% favori)
- [ ] Confiance >0.65
- [ ] Facteurs mentionnent classement/stats offensives
- [ ] Résumé recommande pari sur favori
- [ ] Detection value bet si applicable

---

### ✅ Test 3: Validation Automatique

**Objectif**: Vérifier que la validation corrige automatiquement les incohérences.

#### Scénario
1. Forcer analyse avec probas incohérentes (simuler erreur modèle)
2. Observer logs normalisation
3. Valider résultat final = 1.0

#### Logs Attendus
```
⚠️ Probabilités incohérentes (total=1.150), normalisation appliquée
✅ Validation OK - Proba: 0.45/0.30/0.25, Facteurs: 4, Scénarios: 2
```

#### Validation Checklist
- [ ] Log warning si probas incohérentes
- [ ] Normalisation automatique
- [ ] Résultat final: total = 1.0
- [ ] Facteurs filtrés (min 10 chars)
- [ ] Scénarios limités à 3 max

---

### ✅ Test 4: Retry Logic

**Objectif**: Vérifier que le retry fonctionne si JSON invalide.

#### Scénario
1. Analyser match
2. Observer logs retry si première tentative échoue
3. Valider résultat final valide ou fallback

#### Logs Attendus
```
❌ JSON invalide (attempt 1/2): Expecting property name...
⚠️ Réponse vide, retry...
✅ Analyse match réussie - PSG vs Lyon
```

#### Validation Checklist
- [ ] Log erreur JSON détaillé
- [ ] Retry automatique (max 2 tentatives)
- [ ] Prompt enrichi pour retry
- [ ] Fallback analysis si échec 2x
- [ ] Temps total <40s (2x20s)

---

### ✅ Test 5: Facteurs Clés Concrets

**Objectif**: Vérifier qualité des facteurs générés.

#### Critères Qualité
**✅ BONS FACTEURS:**
- "PSG invaincu sur 15 derniers matchs domicile (12V-3N)"
- "Lyon sans Lacazette (40% des buts cette saison)"
- "H2H: PSG gagne 7/10 derniers affrontements"
- "Real Madrid moyenne 2.3 buts/match domicile cette saison"

**❌ MAUVAIS FACTEURS:**
- "PSG en bonne forme"
- "Lyon est une forte équipe"
- "Match important"
- "Défense solide"

#### Validation Checklist
- [ ] Tous facteurs >10 chars
- [ ] Au moins 60% contiennent chiffres/stats
- [ ] Aucun facteur générique
- [ ] Maximum 5 facteurs
- [ ] Facteurs pertinents au match

---

## 📊 Tests Performance

### ⏱️ Test 6: Temps de Génération

**Objectif**: Mesurer performance du modèle.

#### Procédure
1. Lancer 10 analyses consécutives
2. Mesurer temps moyen
3. Identifier outliers (>30s)

#### Résultats Attendus
- **Temps moyen**: 10-20s
- **Temps max**: <30s
- **Taux timeout**: <5%

#### Commande
```powershell
# Script PowerShell pour test batch
$times = @()
1..10 | ForEach-Object {
    $start = Get-Date
    curl -X POST http://localhost:8000/api/v1/football/analyze `
      -H "Content-Type: application/json" `
      -H "Authorization: Bearer YOUR_TOKEN" `
      -d '{"home_team":"PSG","away_team":"Lyon","league_id":61}' | Out-Null
    $duration = (Get-Date) - $start
    $times += $duration.TotalSeconds
}
$times | Measure-Object -Average -Maximum -Minimum
```

#### Validation Checklist
- [ ] Temps moyen <20s
- [ ] Aucun timeout (120s)
- [ ] Écart-type <5s (consistance)

---

### 📈 Test 7: Taux Succès JSON

**Objectif**: Mesurer robustesse du parsing JSON.

#### Procédure
1. Lancer 20 analyses variées
2. Compter succès vs erreurs JSON
3. Calculer taux succès

#### Résultats Attendus
- **Taux succès**: >95%
- **Retry rate**: <10%
- **Fallback rate**: <5%

#### Validation Checklist
- [ ] Taux JSON valide >95%
- [ ] Logs retry détaillés
- [ ] Fallback uniquement si échec 2x

---

## 🌐 Tests Intégration

### 🔗 Test 8: Workflow Complet

**Objectif**: Tester parcours utilisateur complet.

#### Scénario
1. Login utilisateur
2. Accès page Analyze
3. Sélection match (Real Madrid vs Barcelona)
4. Lancement analyse
5. Affichage résultats
6. Partage coupon

#### Validation Checklist
- [ ] Login fonctionnel
- [ ] Sélection match OK
- [ ] Analyse lancée en <2s
- [ ] Résultats affichés en <20s
- [ ] Probabilités visualisées correctement
- [ ] Facteurs clés affichés
- [ ] Scénarios affichés
- [ ] Bouton partage fonctionnel
- [ ] Texte copié ou partagé

---

### 🌍 Test 9: Multilingue

**Objectif**: Vérifier traductions complètes.

#### Langues à Tester
- 🇫🇷 Français
- 🇬🇧 Anglais
- 🇩🇪 Allemand

#### Validation Checklist (par langue)
- [ ] Page Analyze entièrement traduite
- [ ] Résultats analyse traduits
- [ ] Messages partage traduits
- [ ] Page Coupons traduite
- [ ] Page Profile traduite
- [ ] Placeholders formulaires traduits

---

## 🔍 Tests Edge Cases

### 🚨 Test 10: Ollama Indisponible

**Objectif**: Vérifier fallback Gemini.

#### Procédure
1. Stopper service Ollama: `docker stop api-football-ollama-1`
2. Lancer analyse
3. Vérifier fallback Gemini
4. Redémarrer Ollama: `docker start api-football-ollama-1`

#### Résultats Attendus
- **Fallback**: Automatique vers Gemini
- **Temps**: <10s (Gemini plus rapide)
- **Log**: "⚠️ Ollama not available, using Gemini"

#### Validation Checklist
- [ ] Analyse réussie avec Gemini
- [ ] Log fallback présent
- [ ] Résultat cohérent
- [ ] Aucune erreur utilisateur

---

### ⚡ Test 11: Charge

**Objectif**: Tester comportement sous charge.

#### Procédure
```powershell
# Lancer 50 requêtes en parallèle
1..50 | ForEach-Object -Parallel {
    curl -X POST http://localhost:8000/api/v1/football/analyze `
      -H "Content-Type: application/json" `
      -H "Authorization: Bearer YOUR_TOKEN" `
      -d '{"home_team":"PSG","away_team":"Lyon","league_id":61}'
} -ThrottleLimit 10
```

#### Résultats Attendus
- **Taux succès**: >90%
- **Aucun crash**: API reste up
- **Memory**: <2GB
- **CPU**: <80%

#### Validation Checklist
- [ ] Toutes requêtes traitées
- [ ] API reste disponible
- [ ] Pas de memory leak
- [ ] Logs cohérents

---

## 📝 Rapport de Test

### Template

```markdown
# Rapport Test - [Date]

## Résumé Exécutif
- **Tests passés**: X/11
- **Tests échoués**: Y/11
- **Taux succès global**: Z%

## Détails Tests

### Test 1: Match Équilibré
- ✅/❌ Status
- Durée: Xs
- Problèmes: [Liste]

### Test 2: Match Déséquilibré
- ✅/❌ Status
- Durée: Xs
- Problèmes: [Liste]

[... autres tests ...]

## Métriques Clés
- **Temps moyen génération**: Xs
- **Taux JSON valide**: Y%
- **Taux fallback**: Z%
- **Qualité facteurs**: (BONS / TOTAL)

## Recommandations
1. [Action 1]
2. [Action 2]
3. [Action 3]

## Prochaines Étapes
- [ ] [Action 1]
- [ ] [Action 2]
```

---

## 🔧 Outils de Test

### Postman Collection
Importer la collection `tests/CouponFoot.postman_collection.json` pour tests API.

### Scripts Utiles

#### Test Rapide
```powershell
# Test basique
curl -X POST http://localhost:8000/api/v1/football/analyze `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{"home_team":"PSG","away_team":"Lyon","league_id":61}'
```

#### Monitoring Ollama
```powershell
# Logs temps réel
docker logs -f api-football-ollama-1

# Stats utilisation
docker stats api-football-ollama-1
```

#### Monitoring API
```powershell
# Logs temps réel
docker logs -f api-football-api-1 | Select-String "Ollama"

# Grep analyses réussies
docker logs api-football-api-1 | Select-String "✅ Analyse"
```

---

## 📊 Dashboard Monitoring (Future)

### Métriques à Tracker
- **Performance**: Temps génération (p50, p95, p99)
- **Qualité**: Taux facteurs concrets, cohérence probas
- **Robustesse**: Taux JSON valide, taux fallback
- **Usage**: % Ollama vs Gemini, requêtes/min

### Alertes
- ⚠️ Temps moyen >30s (3 analyses consécutives)
- ⚠️ Taux JSON invalide >10%
- ⚠️ Ollama indisponible >5min
- ⚠️ Taux fallback >20%

---

## ✅ Checklist Finale

Avant validation définitive:

- [ ] Tous tests prioritaires (1-5) passés
- [ ] Tests performance (6-7) validés
- [ ] Tests intégration (8-9) OK
- [ ] Tests edge cases (10-11) réussis
- [ ] Rapport de test rédigé
- [ ] Documentation mise à jour
- [ ] Logs propres sans erreurs
- [ ] Métriques baselines établies

**Critère validation globale**: 10/11 tests passés (>90%)

---

## 📞 Support

En cas de problème:
1. Consulter [OLLAMA_FINE_TUNING.md](OLLAMA_FINE_TUNING.md)
2. Vérifier logs: `docker logs api-football-api-1`
3. Tester Ollama isolé: `docker exec api-football-ollama-1 ollama list`
4. Redémarrer services: `docker-compose restart`

---

**Dernière mise à jour**: 2025-01-XX
**Version**: 1.2.0
