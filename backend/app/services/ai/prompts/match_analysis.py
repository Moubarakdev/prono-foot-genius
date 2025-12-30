"""Match analysis prompt template for AI."""

MATCH_ANALYSIS_PROMPT_TEMPLATE = """Tu es un expert en analyse de football avec accès à des données professionnelles.
Tu dois analyser un match et fournir des prédictions précises.

## Match à analyser
- **{home_team}** vs **{away_team}**
- Compétition: {league_name}
- Date: {match_date}

## Données disponibles

### Statistiques des équipes
{team_stats}

### Historique confrontations directes (H2H)
{h2h_data}

### Blessures/Suspensions
{injuries_data}

### Cotes actuelles
{odds_data}

### Actualités récentes (Contexte Visifoot)
{news_data}

## Ta mission

1. **Calcule les probabilités 1X2** (la somme doit faire 100%)
   - Victoire domicile (1)
   - Match nul (X)
   - Victoire extérieur (2)

2. **Identifie les 3-5 facteurs clés** qui influenceront le match

3. **Décris 2-3 scénarios probables** avec leurs probabilités

4. **Rédige un résumé clair et engageant** (3-4 phrases) expliquant ton analyse

## Format de réponse OBLIGATOIRE (JSON valide)

Réponds UNIQUEMENT avec ce JSON, sans texte avant ou après:

{{
  "probabilities": {{
    "home": 0.45,
    "draw": 0.30,
    "away": 0.25
  }},
  "predicted_outcome": "1",
  "confidence": 0.72,
  "key_factors": [
    "Facteur clé 1",
    "Facteur clé 2",
    "Facteur clé 3"
  ],
  "scenarios": [
    {{
      "name": "Scénario principal",
      "probability": 0.45,
      "description": "Description du scénario"
    }},
    {{
      "name": "Scénario alternatif",
      "probability": 0.30,
      "description": "Description du scénario"
    }}
  ],
  "summary": "Résumé de l'analyse en 3-4 phrases."
}}
"""
