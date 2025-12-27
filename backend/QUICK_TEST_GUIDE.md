# 🚀 Guide de test rapide - Corrections et Optimisations

## Ce qui a été corrigé

### 1. ✅ Scrapers anti-blocage (403 Forbidden)
- User-Agent rotation avec 5 navigateurs différents
- Retry logic automatique (3 tentatives)
- Délais aléatoires entre les tentatives
- Headers HTTP réalistes

**Fichier modifié:** `backend/app/services/scrapers.py`

**Scrapers concernés:**
- SofaScoreScraper
- OddsCheckerScraper  
- FBrefScraper

### 2. ✅ Analyse UUID 404 fixed
- Même correction que pour les coupons
- Conversion UUID en string pour requêtes DB

**Fichier modifié:** `backend/app/api/v1/analyze.py` (ligne 560)

### 3. ✅ Ollama optimisé pour paris sportifs

**Améliorations:**
- Modèle: Mistral 7B (au lieu de Llama3.2 3B)
- System prompt expert en paris sportifs
- Prompts structurés avec consignes claires
- Paramètres ajustés: temperature=0.3, top_p=0.85
- Timeout augmenté: 120s pour analyses complexes
- Logs détaillés pour monitoring

**Fichiers modifiés:**
- `backend/app/providers/ai/ollama.py` (prompts + paramètres)
- `backend/.env` (OLLAMA_MODEL=mistral)

## 🧪 Comment tester

### Test 1: Scraper anti-blocage

```bash
# Redémarrer l'API avec les corrections
docker-compose restart api

# Tester via logs
docker logs -f api-football-api-1

# Créer une analyse de match sur l'interface
# Les logs doivent montrer:
# - Si 403, vous verrez: "⚠️ FBref 403, retry 1/3"
# - Si succès après retry: "✅ External API call: FBref..."
```

### Test 2: UUID Analysis fix

```bash
# Sur l'interface:
1. Aller dans "Historique des analyses"
2. Cliquer sur une analyse
3. Devrait afficher les détails (pas 404)

# Logs attendus:
# ✅ Analysis {id} retrieved successfully
```

### Test 3: Ollama setup

```bash
# Windows
cd backend
.\setup_ollama.ps1

# Linux/Mac
cd backend
bash setup_ollama.sh
```

**Ce que fait le script:**
1. Démarre le service Ollama
2. Attend qu'il soit prêt (healthcheck)
3. Télécharge Mistral 7B (~4GB, 5-10 min)
4. Vérifie l'installation
5. Redémarre l'API

**Logs attendus:**
```
📦 Démarrage du service Ollama...
⏳ Attente du service Ollama...
✅ Ollama est prêt!
📥 Téléchargement du modèle Mistral (7B)...
✅ Configuration terminée!
```

### Test 4: Analyse IA avec Ollama

```bash
# Sur l'interface:
1. Créer un nouveau coupon avec 2-3 matchs
2. L'analyse devrait se lancer automatiquement

# Logs à vérifier:
docker logs -f api-football-api-1 | grep -i ollama

# Logs attendus:
# 🤖 Ollama provider initialized - Model: mistral
# ✅ Ollama available at http://ollama:11434
# ✅ Ollama generation successful
#    Duration: 8.32s
#    Response length: 1245 chars
```

### Test 5: Qualité de l'analyse

**Vérifier que la réponse contient:**
- ✅ Probabilités (home, draw, away) qui font 100%
- ✅ 3-5 facteurs clés pertinents
- ✅ 2-3 scénarios avec probabilités
- ✅ Résumé clair en français
- ✅ Format JSON valide

**Si l'analyse est incohérente:**
```python
# Ajuster temperature dans ollama.py
self.model_options = {
    "temperature": 0.2,  # Plus bas = plus cohérent
    ...
}
```

## 🔍 Vérifications importantes

### Vérifier que tout tourne

```bash
# Services actifs
docker ps

# Devrait afficher:
# - api-football-api-1 (FastAPI)
# - api-football-mysql-1 (Database)
# - api-football-redis-1 (Cache)
# - api-football-ollama-1 (AI) ← NOUVEAU

# Vérifier Ollama
curl http://localhost:11434/api/tags

# Devrait retourner JSON avec liste des modèles
```

### Vérifier le modèle installé

```bash
docker exec api-football-ollama-1 ollama list

# Devrait afficher:
# NAME            ID              SIZE    MODIFIED
# mistral:latest  xxx             4.1 GB  X minutes ago
```

### Vérifier les logs

```bash
# Logs Ollama
docker logs api-football-ollama-1

# Logs API (filtrer Ollama)
docker logs api-football-api-1 | grep -i ollama

# Logs en temps réel
docker logs -f api-football-api-1
```

## ⚠️ Problèmes courants

### Problème: "Ollama service not available"

**Solution:**
```bash
docker-compose restart ollama
docker logs -f api-football-ollama-1
# Attendre "Ollama is running"
```

### Problème: "Model 'mistral' not found"

**Solution:**
```bash
docker exec api-football-ollama-1 ollama pull mistral
docker-compose restart api
```

### Problème: Scrapers toujours bloqués (403)

**Solutions:**
1. **Vérifier les logs** - Voir si retry fonctionne
2. **Augmenter retries** - Dans `scrapers.py`, changer `max_retries = 5`
3. **Ajouter plus de User-Agents** - Étendre la liste `USER_AGENTS`
4. **Utiliser proxy** - Si persistant, considérer service proxy payant

### Problème: Analyses trop lentes (>30s)

**Solutions:**
1. **Utiliser llama3.2** - Plus rapide mais moins précis
   ```bash
   docker exec api-football-ollama-1 ollama pull llama3.2
   # Modifier .env: OLLAMA_MODEL=llama3.2
   docker-compose restart api
   ```

2. **Réduire num_predict** - Dans `ollama.py`
   ```python
   "num_predict": 2000,  # Au lieu de 3000
   ```

3. **Augmenter RAM container** - Dans `docker-compose.yml`
   ```yaml
   ollama:
     deploy:
       resources:
         limits:
           memory: 12G  # Au lieu de 8G
   ```

## 📊 Benchmarks attendus

Avec Mistral 7B sur machine moyenne (16GB RAM):

| Opération | Temps attendu |
|-----------|---------------|
| Analyse 1 match | 8-12s |
| Analyse coupon 3 matchs | 15-25s |
| Scraper (sans retry) | 2-5s |
| Scraper (avec retry) | 5-15s |

## ✅ Checklist finale

Avant de considérer que tout marche:

- [ ] Services Docker tous actifs (api, mysql, redis, ollama)
- [ ] Ollama répond: `curl http://localhost:11434/api/tags`
- [ ] Modèle Mistral installé: `ollama list`
- [ ] API démarre sans erreur: `docker logs api-football-api-1`
- [ ] Logs montrent: "✅ Ollama available at..."
- [ ] Création de coupon fonctionne
- [ ] Analyse IA retourne JSON valide
- [ ] Probabilités font 100%
- [ ] Facteurs clés pertinents (pas génériques)
- [ ] Temps de réponse < 30s
- [ ] Pas d'erreur 403 sur scrapers (ou retry fonctionne)
- [ ] Historique analyses affiche détails (pas 404)

## 🎯 Prochaines étapes

Si tout fonctionne:

1. **Monitoring production**
   - Ajouter métriques Prometheus/Grafana
   - Alertes si Ollama down ou analyses > 30s

2. **Fine-tuning**
   - Collecter feedback utilisateurs
   - Ajuster prompts si analyses pas assez précises
   - Tester llama3:8b si budget RAM le permet

3. **Scaling**
   - Considérer multiple instances Ollama
   - Load balancing entre modèles
   - GPU pour accélérer (si disponible)

4. **Scrapers**
   - Si blocages persistent, évaluer:
     - ScraperAPI.com (~$50/mois)
     - Bright Data proxies
     - APIs payantes alternatives

## 📚 Documentation

- **Ollama**: `backend/OLLAMA_OPTIMIZATION.md`
- **Scrapers**: `backend/app/services/scrapers.py`
- **Providers**: `backend/app/providers/ai/`
- **Logs**: `backend/logs/app.log`

---

**Setup time:** ~15-20 minutes (dont 5-10 min download Mistral)
**Tests time:** ~10 minutes
**Total:** ~30 minutes pour tout tester

**Questions?** Vérifier les logs et la doc OLLAMA_OPTIMIZATION.md
