# Migration PostgreSQL vers MySQL

## Changements effectués

### 1. Dépendances (`requirements.txt`)
- ✅ Remplacé `asyncpg` par `aiomysql` et `pymysql`

### 2. Docker Compose (`docker-compose.yml`)
- ✅ Remplacé le service PostgreSQL par MySQL 8.0
- ✅ Configuration UTF8MB4 pour support complet Unicode
- ✅ Mise à jour de la variable `DATABASE_URL`
- ✅ Port MySQL: 3306 (au lieu de 5432)

### 3. Modèles SQLAlchemy
- ✅ Remplacé `UUID(as_uuid=True)` par `String(36)` (MySQL ne supporte pas nativement UUID)
- ✅ Stockage des UUID en tant que chaînes de caractères (format standard)
- ✅ Modèles modifiés:
  - `User`
  - `MatchAnalysis`
  - `Coupon`
  - `CouponSelection`
  - `ChatMessage`

### 4. Types de données
- ✅ `JSON` reste compatible (MySQL 5.7+)
- ✅ `DateTime` reste compatible
- ✅ Pas de `JSONB` (spécifique PostgreSQL) utilisé dans le projet

## Instructions de migration

### Étape 1: Arrêter les conteneurs existants
```bash
docker-compose down -v
```
**⚠️ Attention**: L'option `-v` supprime les volumes (données PostgreSQL).

### Étape 2: Mettre à jour les dépendances Python
```bash
cd backend
pip install -r requirements.txt
```

### Étape 3: Mettre à jour votre fichier `.env`
```env
DATABASE_URL=mysql+aiomysql://root:rootpassword@localhost:3306/couponfoot
```

### Étape 4: Supprimer les anciennes migrations Alembic
```bash
# Supprimer le dossier versions (optionnel, recommandé pour migration propre)
rm -rf backend/alembic/versions/*
```

### Étape 5: Démarrer MySQL
```bash
docker-compose up -d mysql redis
```

### Étape 6: Créer les nouvelles migrations
```bash
cd backend
alembic revision --autogenerate -m "Initial MySQL migration"
alembic upgrade head
```

### Étape 7: Démarrer l'API
```bash
docker-compose up api
# ou localement:
uvicorn app.main:app --reload
```

## Différences MySQL vs PostgreSQL

| Aspect | PostgreSQL | MySQL 8.0 |
|--------|-----------|-----------|
| **UUID natif** | ✅ Oui (`UUID`) | ❌ Non (String 36) |
| **JSON** | ✅ `JSONB` (indexable) | ✅ `JSON` (depuis 5.7) |
| **Performance JSON** | Meilleure | Bonne |
| **Full-text search** | ✅ Excellent | ✅ Bon |
| **Collations** | UTF8 par défaut | UTF8MB4 recommandé |

## Compatibilité des fonctionnalités

✅ **Compatible sans changement:**
- SQLAlchemy ORM (async)
- Alembic migrations
- FastAPI
- Redis caching
- Stripe/Moneroo webhooks
- Google Gemini AI

⚠️ **Attention:**
- Les UUIDs sont maintenant des chaînes (`str`) au lieu de `uuid.UUID` en base
- La conversion est transparente grâce à SQLAlchemy
- Les anciens IDs PostgreSQL ne sont **pas** migrés automatiquement

## Rollback (retour à PostgreSQL)

Si vous souhaitez revenir à PostgreSQL:

1. Restaurer les anciens fichiers depuis Git:
```bash
git checkout HEAD -- backend/requirements.txt docker-compose.yml backend/app/models/
```

2. Supprimer le conteneur MySQL:
```bash
docker-compose down -v
```

3. Redémarrer avec PostgreSQL:
```bash
docker-compose up -d
```

## Support et troubleshooting

### Erreur "Unknown column in field list"
→ Recréer les migrations: `alembic revision --autogenerate`

### Erreur de connexion MySQL
→ Vérifier que le service MySQL est bien démarré: `docker-compose logs mysql`

### Problème d'encodage
→ Vérifier la configuration UTF8MB4 dans `docker-compose.yml`

### Performance JSON plus lente
→ MySQL JSON n'est pas indexable comme `JSONB` de PostgreSQL. Considérer une dénormalisation si nécessaire.
