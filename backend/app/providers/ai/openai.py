import json
from openai import AsyncOpenAI
from typing import Any, Dict, List, Optional
from ..base import BaseAIProvider
from app.core.config import get_settings
from app.core.logger import logger

settings = get_settings()


ANALYSIS_PROMPTS = {
    "fr": """Tu es un expert en analyse de football avec accès à des données professionnelles.
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

### Contexte de la communauté (Infos utilisateur)
{user_context}

## Ta mission

1. **Calcule les probabilités 1X2** (la somme doit faire 100%)
   - Victoire domicile (1)
   - Match nul (X)
   - Victoire extérieur (2)

2. **Identifie les 3-5 facteurs clés** qui influenceront le match

3. **Décris 2-3 scénarios probables** avec leurs probabilités

4. **Rédige un résumé clair et engageant** (3-4 phrases) expliquant ton analyse en français.

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
""",
    "en": """You are a football analysis expert with access to professional data.
You must analyze a match and provide accurate predictions.

## Match to Analyze
- **{home_team}** vs **{away_team}**
- Competition: {league_name}
- Date: {match_date}

## Available Data

### Team Stats
{team_stats}

### Head-to-Head (H2H)
{h2h_data}

### Injuries/Suspensions
{injuries_data}

### Current Odds
{odds_data}

### Recent News
{news_data}

### Community Context (User Info)
{user_context}

## Your Mission

1. **Calculate 1X2 Probabilities** (sum must be 100%)
   - Home Win (1)
   - Draw (X)
   - Away Win (2)

2. **Identify 3-5 Key Factors** influencing the match

3. **Describe 2-3 Probable Scenarios** with their probabilities

4. **Write a clear and engaging summary** (3-4 sentences) explaining your analysis in English.

## MANDATORY Response Format (Valid JSON)

Reply ONLY with this JSON, no text before or after:

{{
  "probabilities": {{
    "home": 0.45,
    "draw": 0.30,
    "away": 0.25
  }},
  "predicted_outcome": "1",
  "confidence": 0.72,
  "key_factors": [
    "Key factor 1",
    "Key factor 2",
    "Key factor 3"
  ],
  "scenarios": [
    {{
      "name": "Main Scenario",
      "probability": 0.45,
      "description": "Scenario description"
    }},
    {{
      "name": "Alternative Scenario",
      "probability": 0.30,
      "description": "Scenario description"
    }}
  ],
  "summary": "Analysis summary in 3-4 sentences."
}}
""",
    "de": """Du bist ein Fußball-Experte mit Zugang zu professionellen Daten.
Du musst ein Spiel analysieren und genaue Vorhersagen treffen.

## Zu analysierendes Spiel
- **{home_team}** vs **{away_team}**
- Wettbewerb: {league_name}
- Datum: {match_date}

## Verfügbare Daten

### Team-Statistiken
{team_stats}

### Direkter Vergleich (H2H)
{h2h_data}

### Verletzungen/Sperren
{injuries_data}

### Aktuelle Quoten
{odds_data}

### Aktuelle Nachrichten
{news_data}

### Community-Kontext (Nutzerinfos)
{user_context}

## Deine Mission

1. **Berechne die 1X2-Wahrscheinlichkeiten** (Summe muss 100% sein)
   - Heimsieg (1)
   - Unentschieden (X)
   - Auswärtssieg (2)

2. **Identifiziere 3-5 Schlüsselfaktoren**, die das Spiel beeinflussen

3. **Beschreibe 2-3 wahrscheinliche Szenarien** mit ihren Wahrscheinlichkeiten

4. **Schreibe eine klare und ansprechende Zusammenfassung** (3-4 Sätze), die deine Analyse auf Deutsch erklärt.

## OBLIGATORISCHES Antwortformat (Gültiges JSON)

Antworte NUR mit diesem JSON, kein Text davor oder danach:

{{
  "probabilities": {{
    "home": 0.45,
    "draw": 0.30,
    "away": 0.25
  }},
  "predicted_outcome": "1",
  "confidence": 0.72,
  "key_factors": [
    "Schlüsselfaktor 1",
    "Schlüsselfaktor 2",
    "Schlüsselfaktor 3"
  ],
  "scenarios": [
    {{
      "name": "Hauptszenario",
      "probability": 0.45,
      "description": "Beschreibung des Szenarios"
    }},
    {{
      "name": "Alternatives Szenario",
      "probability": 0.30,
      "description": "Beschreibung des Szenarios"
    }}
  ],
  "summary": "Zusammenfassung der Analyse in 3-4 Sätzen."
}}
"""
}

COUPON_PROMPTS = {
    "fr": """Tu es un expert en paris sportifs et analyse de données footballistiques. 
Tu dois analyser un coupon composé de plusieurs sélections (combiné) et évaluer sa viabilité globale.

## Coupon à analyser
{matches_info}

## Ta mission
1. **Évalue la probabilité globale de succès** du coupon (combiné).
2. **Identifie le "maillon faible"** (la sélection la plus risquée).
3. **Analyse la cohérence globale** (ex: sélections contradictoires, corrélations).
4. **Donne des conseils stratégiques** (ex: retirer une sélection, type de mise recommandée).

## Format de réponse OBLIGATOIRE (JSON valide)
{{
  "overall_probability": 0.15,
  "risk_score": 0.85,
  "weakest_link": "Nom du match et sélection",
  "coherence_score": 0.9,
  "recommendation": "Conseil stratégique court",
  "detailed_analysis": "Analyse globale en 2-3 phrases",
  "selection_insights": [
    {{
      "match": "Team A vs Team B",
      "insight": "Détail spécifique sur pourquoi cette sélection est bonne ou risquée"
    }}
  ]
}}
""",
    "en": """You are a sports betting and football data analysis expert.
You must analyze a betting slip composed of multiple selections (accumulator) and evaluate its overall viability.

## Coupon to Analyze
{matches_info}

## Your Mission
1. **Evaluate the overall success probability** of the coupon.
2. **Identify the "weakest link"** (the riskiest selection).
3. **Analyze global coherence** (e.g., conflicting selections, correlations).
4. **Provide strategic advice** (e.g., remove a selection, recommended stake type).

## MANDATORY Response Format (Valid JSON)
{{
  "overall_probability": 0.15,
  "risk_score": 0.85,
  "weakest_link": "Match name and selection",
  "coherence_score": 0.9,
  "recommendation": "Short strategic advice",
  "detailed_analysis": "Global analysis in 2-3 sentences",
  "selection_insights": [
    {{
      "match": "Team A vs Team B",
      "insight": "Specific detail on why this selection is good or risky"
    }}
  ]
}}
""",
    "de": """Du bist ein Experte für Sportwetten und Fußball-Datenanalyse.
Du musst einen Wettschein mit mehreren Auswahlen (Kombi-Wette) analysieren und dessen allgemeine Machbarkeit bewerten.

## Zu analysierender Wettschein
{matches_info}

## Deine Mission
1. **Bewerte die Gesamtwahrscheinlichkeit** des Erfolgs.
2. **Identifiziere das "schwächste Glied"** (die riskanteste Auswahl).
3. **Analysiere die Gesamtkohärenz** (z.B. widersprüchliche Auswahlen, Korrelationen).
4. **Gib strategische Ratschläge** (z.B. Auswahl entfernen, empfohlene Wettart).

## OBLIGATORISCHES Antwortformat (Gültiges JSON)
{{
  "overall_probability": 0.15,
  "risk_score": 0.85,
  "weakest_link": "Name des Spiels und Auswahl",
  "coherence_score": 0.9,
  "recommendation": "Kurzer strategischer Rat",
  "detailed_analysis": "Globale Analyse in 2-3 Sätzen",
  "selection_insights": [
    {{
      "match": "Team A vs Team B",
      "insight": "Spezifisches Detail, warum diese Auswahl gut oder riskant ist"
    }}
  ]
}}
"""
}

class OpenAIAIProvider(BaseAIProvider):
    """Concrete implementation of AI Provider using OpenAI."""
    
    def __init__(self):
        if settings.openai_api_key:
            self.client = AsyncOpenAI(api_key=settings.openai_api_key)
            self.model = settings.openai_model
            logger.info(f"OpenAI AI Provider initialized with model: {self.model}")
        else:
            self.client = None
            logger.warning("OpenAI AI Provider initialized WITHOUT API KEY. Fallback will be used.")
            
    def _format_stats(self, stats: Dict[str, Any]) -> str:
        if not stats: return "Statistiques non disponibles"
        return json.dumps(stats, indent=2, ensure_ascii=False)[:2000]
    
    def _format_h2h(self, h2h: List[Dict[str, Any]]) -> str:
        if not h2h: return "Pas d'historique disponible"
        results = []
        for match in h2h[:5]:
            home = match.get("teams", {}).get("home", {}).get("name", "?")
            away = match.get("teams", {}).get("away", {}).get("name", "?")
            score = match.get("score", {}).get("fulltime", {})
            results.append(f"- {home} {score.get('home', '?')}-{score.get('away', '?')} {away}")
        return "\n".join(results)
    
    def _format_injuries(self, injuries: List[Dict[str, Any]]) -> str:
        if not injuries: return "Aucune blessure signalée"
        return "\n".join([f"- {i.get('player', {}).get('name')} ({i.get('team', {}).get('name')}): {i.get('player', {}).get('reason', 'Blessure')}" for i in injuries[:10]])
    
    def _format_odds(self, odds: List[Dict[str, Any]]) -> str:
        if not odds: return "Cotes non disponibles"
        try:
            bets = odds[0].get("bookmakers", [{}])[0].get("bets", [])
            for bet in bets:
                if bet.get("name") == "Match Winner":
                    return " | ".join([f"{v.get('value')}: {v.get('odd')}" for v in bet.get("values", [])])
        except (IndexError, KeyError): pass
        return "Cotes non disponibles"

    async def analyze_match(self, home_team, away_team, league_name, match_date, team_stats, h2h_data, injuries_data, odds_data, news_context=[], user_context=None, language="fr"):
        if not self.client: return self._get_fallback_analysis(home_team, away_team)
        
        # Select prompt template based on language, fallback to French
        template = ANALYSIS_PROMPTS.get(language, ANALYSIS_PROMPTS["fr"])
        
        prompt = template.format(
            home_team=home_team, away_team=away_team, league_name=league_name, match_date=match_date,
            team_stats=self._format_stats(team_stats), h2h_data=self._format_h2h(h2h_data),
            injuries_data=self._format_injuries(injuries_data), odds_data=self._format_odds(odds_data),
            news_data="\n".join([f"- {n}" for n in news_context]) if news_context else "Aucune actualité trouvée." if language == "fr" else "No news found.",
            user_context=user_context if user_context else "Aucun contexte additionnel fourni." if language == "fr" else "No additional context provided."
        )
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Tu es un assistant utile spécialisé dans l'analyse de football."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=1500
            )
            return self._validate_result(json.loads(response.choices[0].message.content.strip()))
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            return self._get_fallback_analysis(home_team, away_team)

    async def analyze_coupon(self, matches, language="fr"):
        if not self.client: return self._get_fallback_coupon_analysis(matches)
        
        matches_info = "\n".join([f"{i+1}. {m.get('home_team')} vs {m.get('away_team')} - {m.get('selection_type')} ({m.get('odds')})" for i, m in enumerate(matches)])
        
        # Select prompt template based on language, fallback to French
        template = COUPON_PROMPTS.get(language, COUPON_PROMPTS["fr"])
        prompt = template.format(matches_info=matches_info)
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Tu es un expert en paris sportifs." if language == "fr" else "You are a sports betting expert." if language == "en" else "Du bist ein Experte für Sportwetten."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            return json.loads(response.choices[0].message.content.strip())
        except Exception as e:
            logger.error(f"OpenAI coupon analysis error: {str(e)}")
            return self._get_fallback_coupon_analysis(matches)

    async def chat_analysis(self, analysis_summary, history, user_question):
        if not self.client: return "Désolé, l'assistant IA est indisponible."
        messages = [
            {"role": "system", "content": f"Tu es un expert en football. Voici le résumé d'analyse initiale pour contexte: {analysis_summary}"}
        ]
        for msg in history:
            messages.append({"role": "user" if msg.role == "user" else "assistant", "content": msg.content})
        messages.append({"role": "user", "content": user_question})
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI Chat error: {str(e)}")
            return "Une erreur est survenue."

    def _validate_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and normalize AI result."""
        probs = result.get("probabilities", {})
        total = probs.get("home", 0.33) + probs.get("draw", 0.33) + probs.get("away", 0.34)
        if total > 0:
            probs["home"] = round(probs.get("home", 0.33) / total, 3)
            probs["draw"] = round(probs.get("draw", 0.33) / total, 3)
            probs["away"] = round(1 - probs["home"] - probs["draw"], 3)
        else:
            probs = {"home": 0.333, "draw": 0.333, "away": 0.334}
        
        scenarios = [{
            "name": s.get("name") or "Scénario",
            "probability": float(s.get("probability", 0.0)),
            "description": s.get("description", "N/A")
        } for s in result.get("scenarios", []) if isinstance(s, dict)]
        
        if not scenarios:
            scenarios = [{"name": "Défaut", "probability": 1.0, "description": "Analyse standard."}]

        return {
            "probabilities": probs,
            "predicted_outcome": result.get("predicted_outcome", "X"),
            "confidence": min(max(result.get("confidence", 0.5), 0), 1),
            "key_factors": [str(k) for k in result.get("key_factors", [])[:5]],
            "scenarios": scenarios[:3],
            "summary": str(result.get("summary", "N/A"))
        }

    def _get_fallback_analysis(self, home_team, away_team):
        return {"probabilities": {"home": 0.40, "draw": 0.30, "away": 0.30}, "predicted_outcome": "1", "confidence": 0.40, "key_factors": ["Données limitées"], "scenarios": [{"name": "Équilibré", "probability": 1.0, "description": "Force similaire."}], "summary": "Analyse limitée."}

    def _get_fallback_coupon_analysis(self, matches):
        return {"overall_probability": 0.1, "risk_score": 0.9, "weakest_link": "N/A", "coherence_score": 0.5, "recommendation": "Calcul impossible.", "detailed_analysis": "IA indisponible.", "selection_insights": []}
