import json
import time
import google.generativeai as genai
from typing import Any, Dict, List, Optional

from app.core.config import get_settings
from app.core.logger import get_logger

settings = get_settings()
logger = get_logger('services.ai')


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



class GeminiAIService:
    """Service for AI analysis using Google Gemini."""
    
    def __init__(self):
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel(
                model_name='gemini-1.5-flash-latest',
                generation_config={
                    "response_mime_type": "application/json",
                }
            )
            logger.info("Gemini AI Service initialized.")
        else:
            self.model = None
            logger.warning("Gemini AI Service initialized WITHOUT API KEY. Fallback will be used.")
    
    def _format_stats(self, stats: Dict[str, Any]) -> str:
        """Format team statistics for prompt."""
        if not stats:
            return "Statistiques non disponibles"
        
        return json.dumps(stats, indent=2, ensure_ascii=False)[:2000]
    
    def _format_h2h(self, h2h: List[Dict[str, Any]]) -> str:
        """Format H2H data for prompt."""
        if not h2h:
            return "Pas d'historique disponible"
        
        results = []
        for match in h2h[:5]:
            home = match.get("teams", {}).get("home", {}).get("name", "?")
            away = match.get("teams", {}).get("away", {}).get("name", "?")
            score = match.get("score", {}).get("fulltime", {})
            home_goals = score.get("home", "?")
            away_goals = score.get("away", "?")
            results.append(f"- {home} {home_goals}-{away_goals} {away}")
        
        return "\n".join(results) if results else "Pas d'historique disponible"
    
    def _format_injuries(self, injuries: List[Dict[str, Any]]) -> str:
        """Format injuries data for prompt."""
        if not injuries:
            return "Aucune blessure signalée"
        
        injury_list = []
        for inj in injuries[:10]:
            player = inj.get("player", {}).get("name", "?")
            team = inj.get("team", {}).get("name", "?")
            reason = inj.get("player", {}).get("reason", "Blessure")
            injury_list.append(f"- {player} ({team}): {reason}")
        
        return "\n".join(injury_list) if injury_list else "Aucune blessure signalée"
    
    def _format_odds(self, odds: List[Dict[str, Any]]) -> str:
        """Format odds data for prompt."""
        if not odds:
            return "Cotes non disponibles"
        
        try:
            bookmaker = odds[0].get("bookmakers", [{}])[0]
            bets = bookmaker.get("bets", [])
            
            for bet in bets:
                if bet.get("name") == "Match Winner":
                    values = bet.get("values", [])
                    odds_str = []
                    for v in values:
                        odds_str.append(f"{v.get('value')}: {v.get('odd')}")
                    return " | ".join(odds_str)
        except (IndexError, KeyError):
            pass
        
        return "Cotes non disponibles"
    
    async def analyze_match(
        self,
        home_team: str,
        away_team: str,
        league_name: str,
        match_date: str,
        team_stats: Dict[str, Any],
        h2h_data: List[Dict[str, Any]],
        injuries_data: List[Dict[str, Any]],
        odds_data: List[Dict[str, Any]],
        news_context: List[str] = []
    ) -> Dict[str, Any]:
        """Analyze a match using Gemini AI."""
        start_time = time.time()
        
        logger.info(
            f"🤖 Starting AI analysis: {home_team} vs {away_team}",
            extra={'extra_data': {
                'home_team': home_team,
                'away_team': away_team,
                'league': league_name,
                'match_date': match_date
            }}
        )
        
        if not self.model:
            logger.warning(
                f"⚠️ Using fallback analysis: Gemini model not configured",
                extra={'extra_data': {
                    'home_team': home_team,
                    'away_team': away_team
                }}
            )
            return self._get_fallback_analysis(home_team, away_team)
        
        # Build prompt
        prompt = ANALYSIS_PROMPT_TEMPLATE.format(
            home_team=home_team,
            away_team=away_team,
            league_name=league_name,
            match_date=match_date,
            team_stats=self._format_stats(team_stats),
            h2h_data=self._format_h2h(h2h_data),
            injuries_data=self._format_injuries(injuries_data),
            odds_data=self._format_odds(odds_data),
            news_data="\n".join([f"- {n}" for n in news_context]) if news_context else "Aucune actualité récente trouvée."
        )
        
        try:
            logger.debug(f"📝 Generating AI prompt for {home_team} vs {away_team}")
            # Generate response
            response = await self.model.generate_content_async(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=1500,
                    response_mime_type="application/json"
                )
            )
            
            # Parse JSON response
            text = response.text.strip()
            result = json.loads(text)
            
            duration_ms = (time.time() - start_time) * 1000
            logger.log_ai_analysis(
                fixture_id=0,  # Not available at this level
                user_id="system",
                duration_ms=duration_ms,
                success=True
            )
            logger.info(
                f"✅ AI analysis completed successfully ({duration_ms:.0f}ms)",
                extra={'extra_data': {
                    'home_team': home_team,
                    'away_team': away_team,
                    'duration_ms': duration_ms,
                    'predicted_outcome': result.get('predicted_outcome'),
                    'confidence': result.get('confidence')
                }}
            )
            
            return self._validate_result(result)
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(
                f"❌ Gemini API error during match analysis ({duration_ms:.0f}ms): {str(e)}",
                exc_info=True,
                extra={'extra_data': {
                    'home_team': home_team,
                    'away_team': away_team,
                    'duration_ms': duration_ms,
                    'error': str(e)
                }}
            )
            return self._get_fallback_analysis(home_team, away_team)
    
    def _validate_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and normalize AI result."""
        probs = result.get("probabilities", {})
        total = probs.get("home", 0.33) + probs.get("draw", 0.33) + probs.get("away", 0.34)
        
        # Normalize probabilities to sum to 1
        if total > 0:
            probs["home"] = round(probs.get("home", 0.33) / total, 3)
            probs["draw"] = round(probs.get("draw", 0.33) / total, 3)
            probs["away"] = round(1 - probs["home"] - probs["draw"], 3)
        else:
            probs = {"home": 0.333, "draw": 0.333, "away": 0.334}
        
        # Validate scenarios
        raw_scenarios = result.get("scenarios", [])
        if not isinstance(raw_scenarios, list):
            raw_scenarios = []
            
        validated_scenarios = []
        for s in raw_scenarios:
            if not isinstance(s, dict):
                continue
                
            validated_scenarios.append({
                "name": s.get("name") or s.get("title") or "Scénario",
                "probability": float(s.get("probability", 0.0)),
                "description": s.get("description", "Description non disponible")
            })
            
        # Ensure at least one scenario exists
        if not validated_scenarios:
            validated_scenarios.append({
                "name": "Scénario par défaut",
                "probability": 1.0,
                "description": "Analyse basée sur les statistiques disponibles."
            })
        
        return {
            "probabilities": probs,
            "predicted_outcome": result.get("predicted_outcome", "X"),
            "confidence": min(max(result.get("confidence", 0.5), 0), 1),
            "key_factors": [str(k) for k in result.get("key_factors", [])[:5]],
            "scenarios": validated_scenarios[:3],
            "summary": str(result.get("summary", "Analyse non disponible."))
        }
    
    def _get_fallback_analysis(self, home_team: str, away_team: str) -> Dict[str, Any]:
        """Fallback analysis when API is unavailable."""
        return {
            "probabilities": {"home": 0.40, "draw": 0.30, "away": 0.30},
            "predicted_outcome": "1",
            "confidence": 0.40,
            "key_factors": [
                "Avantage du terrain pour l'équipe à domicile",
                "Analyse basée sur des données limitées"
            ],
            "scenarios": [
                {
                    "name": "Match équilibré",
                    "probability": 0.50,
                    "description": f"{home_team} et {away_team} semblent de force similaire."
                }
            ],
            "summary": f"Match entre {home_team} et {away_team}. Analyse générée avec des données limitées. Veuillez configurer la clé API Gemini pour des analyses plus précises."
        }


    async def chat_analysis(
        self,
        analysis_summary: str,
        history: List[Any],
        user_question: str
    ) -> str:
        """Handle follow-up questions about a match analysis."""
        if not self.model:
            return "Désolé, l'assistant IA est actuellement indisponible."
            
        # Build conversation context
        messages = [
            {"role": "user", "parts": [f"Voici le résumé d'une analyse de match: {analysis_summary}"]},
            {"role": "model", "parts": ["Entendu. Je suis prêt à répondre à vos questions sur ce match."]}
        ]
        
        # Add history
        for msg in history:
            messages.append({
                "role": "user" if msg.role == "user" else "model",
                "parts": [msg.content]
            })
            
        # Add current question
        messages.append({"role": "user", "parts": [user_question]})
        
        try:
            logger.info(f"Handling AI chat for question: {user_question[:50]}...")
            # Start chat session (with existing context)
            chat = self.model.start_chat(history=messages[:-1])
            response = await chat.send_message_async(user_question)
            return response.text
        except Exception as e:
            logger.error(f"Gemini Chat error: {str(e)}")
            return "Une erreur est survenue lors du traitement de votre question."

    async def analyze_coupon(self, matches: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze a full coupon (multiple matches) using Gemini IA."""
        if not self.model:
            return self._get_fallback_coupon_analysis(matches)

        matches_info = ""
        for i, m in enumerate(matches):
            matches_info += f"{i+1}. {m.get('home_team')} vs {m.get('away_team')} - Sélection: {m.get('selection_type')} - Cotes: {m.get('odds')}\n"

        prompt = COUPON_ANALYSIS_PROMPT_TEMPLATE.format(matches_info=matches_info)

        try:
            response = await self.model.generate_content_async(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.2,
                    response_mime_type="application/json"
                )
            )
            return json.loads(response.text.strip())
        except Exception as e:
            logger.error(f"Gemini API error during coupon analysis: {str(e)}")
            return self._get_fallback_coupon_analysis(matches)

    def _get_fallback_coupon_analysis(self, matches: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Fallback for coupon analysis."""
        return {
            "overall_probability": 0.1,
            "risk_score": 0.9,
            "weakest_link": "N/A",
            "coherence_score": 0.5,
            "recommendation": "Analyse indisponible pour le moment.",
            "detailed_analysis": "Le service d'IA n'a pas pu analyser ce coupon.",
            "selection_insights": []
        }


# Singleton instance
gemini_ai = GeminiAIService()
