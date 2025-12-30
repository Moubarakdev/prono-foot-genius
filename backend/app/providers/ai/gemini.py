import json
import google.generativeai as genai
from typing import Any, Dict, List, Optional
from ..base import BaseAIProvider
from app.core.config import get_settings
from app.core.logger import logger

settings = get_settings()

ANALYSIS_PROMPT_TEMPLATE = """Tu es un expert en analyse de football avec accès à des données professionnelles.
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

COUPON_ANALYSIS_PROMPT_TEMPLATE = """Tu es un expert en paris sportifs et analyse de données footballistiques. 
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
"""

class GeminiAIProvider(BaseAIProvider):
    """Concrete implementation of AI Provider using Google Gemini."""
    
    def __init__(self):
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel(
                model_name='gemini-1.5-flash-latest',
                generation_config={
                    "response_mime_type": "application/json",
                }
            )
            logger.info("Gemini AI Provider initialized with model: gemini-1.5-flash-latest")
        else:
            self.model = None
            logger.warning("Gemini AI Provider initialized WITHOUT API KEY. Fallback will be used.")
            
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

    async def analyze_match(self, home_team, away_team, league_name, match_date, team_stats, h2h_data, injuries_data, odds_data, news_context=[], user_context=None):
        if not self.model: return self._get_fallback_analysis(home_team, away_team)
        
        prompt = ANALYSIS_PROMPT_TEMPLATE.format(
            home_team=home_team, away_team=away_team, league_name=league_name, match_date=match_date,
            team_stats=self._format_stats(team_stats), h2h_data=self._format_h2h(h2h_data),
            injuries_data=self._format_injuries(injuries_data), odds_data=self._format_odds(odds_data),
            news_data="\n".join([f"- {n}" for n in news_context]) if news_context else "Aucune actualité trouvée.",
            user_context=user_context if user_context else "Aucun contexte additionnel fourni."
        )
        
        try:
            response = await self.model.generate_content_async(prompt, generation_config=genai.GenerationConfig(temperature=0.3, max_output_tokens=1500, response_mime_type="application/json"))
            return self._validate_result(json.loads(response.text.strip()))
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return self._get_fallback_analysis(home_team, away_team)

    async def analyze_coupon(self, matches):
        if not self.model: return self._get_fallback_coupon_analysis(matches)
        matches_info = "\n".join([f"{i+1}. {m.get('home_team')} vs {m.get('away_team')} - {m.get('selection_type')} ({m.get('odds')})" for i, m in enumerate(matches)])
        prompt = COUPON_ANALYSIS_PROMPT_TEMPLATE.format(matches_info=matches_info)
        try:
            response = await self.model.generate_content_async(prompt, generation_config=genai.GenerationConfig(temperature=0.2, response_mime_type="application/json"))
            return json.loads(response.text.strip())
        except Exception as e:
            logger.error(f"Gemini coupon analysis error: {str(e)}")
            return self._get_fallback_coupon_analysis(matches)

    async def chat_analysis(self, analysis_summary, history, user_question):
        if not self.model: return "Désolé, l'assistant IA est indisponible."
        messages = [{"role": "user", "parts": [f"Résumé d'analyse: {analysis_summary}"]}, {"role": "model", "parts": ["Entendu."]}]
        for msg in history: messages.append({"role": "user" if msg.role == "user" else "model", "parts": [msg.content]})
        messages.append({"role": "user", "parts": [user_question]})
        try:
            chat = self.model.start_chat(history=messages[:-1])
            response = await chat.send_message_async(user_question)
            return response.text
        except Exception as e:
            logger.error(f"Gemini Chat error: {str(e)}")
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
