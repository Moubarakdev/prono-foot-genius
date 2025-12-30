# FootGenius API

API d'analyse de matchs de football avec Intelligence Artificielle.

## Stack

- **Framework**: FastAPI
- **Base de données**: PostgreSQL + Redis
- **IA**: Google Gemini
- **Données football**: API-Football

## Installation

### 1. Cloner et configurer

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos clés API
```

### 2. Lancer avec Docker

```bash
docker-compose up -d
```

L'API sera disponible sur http://localhost:8000

## Documentation API

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

### Auth
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `GET /api/v1/auth/me` - Profil utilisateur

### Analyse
- `POST /api/v1/analyze/match` - Analyser un match
- `GET /api/v1/analyze/history` - Historique
- `GET /api/v1/analyze/{id}` - Détails analyse

### Coupons
- `POST /api/v1/coupons/create` - Créer coupon
- `GET /api/v1/coupons/` - Liste coupons
- `GET /api/v1/coupons/{id}` - Détails
- `DELETE /api/v1/coupons/{id}` - Supprimer

### Football
- `GET /api/v1/football/fixtures` - Matchs
- `GET /api/v1/football/leagues` - Compétitions
- `GET /api/v1/football/teams/search` - Recherche équipe
- `GET /api/v1/football/h2h` - Face à face

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL |
| `REDIS_URL` | URL Redis |
| `JWT_SECRET` | Secret JWT |
| `FOOTBALL_API_KEY` | Clé API-Football |
| `GEMINI_API_KEY` | Clé Google Gemini |
