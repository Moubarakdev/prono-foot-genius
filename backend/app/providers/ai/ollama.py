import json
import httpx
import asyncio
from typing import Any, Dict, List, Optional
from ..base import BaseAIProvider
from app.core.config import get_settings
from app.core.logger import get_logger

settings = get_settings()
logger = get_logger("providers.ollama")

# System prompt optimisé pour analyses de paris sportifs
SYSTEM_PROMPT = """Tu es un analyste sportif professionnel avec 15 ans d'expérience en paris sportifs.

**Tes expertises:**
- Analyse statistique de matchs de football (xG, possession, tirs cadrés)
- Évaluation des probabilités 1X2, BTTS, Over/Under
- Identification des facteurs de risque et opportunités de value betting
- Analyse des tendances et formes récentes des équipes
- Compréhension des contextes (enjeux, blessures, motivations, fatigue)

**Tes principes:**
1. TOUJOURS baser tes analyses sur des données CONCRÈTES et mesurables
2. Calculer des probabilités RÉALISTES (home + draw + away = 1.0 EXACTEMENT)
3. Identifier 3-5 facteurs clés MAXIMUM (pertinents, concrets, avec chiffres)
4. Être transparent sur le niveau de confiance (0.0 à 1.0)
5. Format JSON strictement respecté (pas de texte avant/après)
6. Langage clair, professionnel, actionnable

**Exemples de BONS facteurs clés:**
✅ "PSG invaincu sur 15 derniers matchs domicile (12V-3N)"
✅ "Lyon sans Lacazette (40% des buts cette saison)"
✅ "H2H: Marseille gagne 7/10 derniers affrontements"

**Exemples de MAUVAIS facteurs (INTERDIT):**
❌ "PSG en bonne forme"
❌ "Lyon est une forte équipe"
❌ "Match important"

**Tu ne dois JAMAIS:**
- Inventer des statistiques ou données
- Garantir un résultat
- Être vague ou générique
- Utiliser des facteurs sans chiffres
- Sortir du format JSON demandé
- Donner des probabilités incohérentes (total ≠ 100%)"""

ANALYSIS_PROMPT_TEMPLATE = """Analyse ce match de football pour un pari sportif.

## MATCH
**{home_team}** 🆚 **{away_team}**
📍 Compétition: {league_name}
📅 Date: {match_date}

## CONSIGNES D'ANALYSE

1. **Probabilités 1X2** (⚠️ CRITIQUE: home + draw + away = 1.0 EXACTEMENT)
   - Victoire {home_team} (1): X%
   - Match nul (X): Y%
   - Victoire {away_team} (2): Z%

2. **Prédiction finale** ("1", "X" ou "2") avec **confiance** (0.0 à 1.0)

3. **Facteurs clés** (3-5 maximum, CONCRETS avec chiffres/statistiques)
   ✅ BON: "PSG invaincu sur 10 derniers matchs domicile (8V-2N)"
   ❌ MAUVAIS: "PSG en bonne forme à domicile"
   
   Privilégie:
   - Bilan domicile/extérieur récent (5-10 derniers matchs)
   - Confrontations directes (H2H)
   - Absences de joueurs clés avec impact chiffré
   - Enjeux du match (course au titre, relégation)
   - Stats offensives/défensives concrètes

4. **Scénarios probables** (2-3 maximum avec probabilités)
   Format: {{nom, probabilité (0.0-1.0), description courte}}
   Exemples:
   - "Victoire large" (0.40): "Domination dès 1ère mi-temps, score 2-0 ou 3-0"
   - "Match nul" (0.30): "Forces équilibrées, nul 1-1 probable"

5. **Résumé actionnable** (2-3 phrases maximum, ~100 mots)
   - Issue la plus probable + raison principale
   - Mention value bet si cote intéressante
   - Conseil final clair

## EXEMPLE D'ANALYSE DE QUALITÉ

```json
{{
  "probabilities": {{
    "home": 0.65,
    "draw": 0.20,
    "away": 0.15
  }},
  "predicted_outcome": "1",
  "confidence": 0.75,
  "key_factors": [
    "PSG invaincu sur 15 derniers matchs domicile (12V-3N)",
    "Lyon sans victoire sur 5 derniers déplacements (2N-3D)",
    "H2H: PSG gagne 7/10 derniers affrontements",
    "Lyon sans Lacazette (40% des buts cette saison)",
    "PSG en quête de titre, motivation maximale"
  ],
  "scenarios": [
    {{
      "name": "Victoire large PSG",
      "probability": 0.50,
      "description": "Domination PSG dès 1ère mi-temps, score 2-0 ou 3-0"
    }},
    {{
      "name": "Victoire serrée PSG",
      "probability": 0.30,
      "description": "Match disputé, PSG s'impose 1-0 ou 2-1 en fin de match"
    }},
    {{
      "name": "Match nul",
      "probability": 0.15,
      "description": "Lyon résiste avec bloc bas, nul 0-0 ou 1-1"
    }}
  ],
  "summary": "PSG largement favori avec 65% de chances. Bilan domicile impeccable et absence clé chez Lyon. Cote 1.50 offre valeur limitée, préférer +1.5 buts PSG (moyenne 2.3 buts/match domicile)."
}}
```

## FORMAT JSON STRICT

Réponds UNIQUEMENT avec ce JSON (SANS texte avant/après):

```json
{{
  "probabilities": {{
    "home": 0.45,
    "draw": 0.30,
    "away": 0.25
  }},
  "predicted_outcome": "1",
  "confidence": 0.65,
  "key_factors": [
    "Facteur concret avec chiffres",
    "Facteur concret avec chiffres",
    "Facteur concret avec chiffres"
  ],
  "scenarios": [
    {{
      "name": "Nom scénario",
      "probability": 0.50,
      "description": "Description précise"
    }}
  ],
  "summary": "Résumé actionnable en 2-3 phrases max."
}}
```

⚠️ RÉPONDS UNIQUEMENT AVEC LE JSON - PAS DE TEXTE AVANT OU APRÈS"""

COUPON_ANALYSIS_PROMPT_TEMPLATE = """Analyse ce combiné de paris sportifs (coupon).

## Matchs sélectionnés
{matches_info}

## Ta mission

Évalue ce coupon et fournis:
- Probabilité globale de réussite (0.0 à 1.0)
- Score de risque (0.0=faible, 1.0=extrême)
- Point faible (match le plus risqué)
## MATCHS DU COMBINÉ
{matches_info}

## CONSIGNES

1. **Probabilité globale** du combiné (produit des probabilités individuelles)

2. **Score de risque** (0.0 = sûr, 1.0 = très risqué)
   Basé sur: nombre de sélections, cohérence, cotes

3. **Maillon faible** (sélection la plus risquée avec explication)

4. **Score de cohérence** (0.0 = incohérent, 1.0 = excellent)
   Évalue: logique du combiné, corrélations, conflits

5. **Recommandation** (VALIDER, MODIFIER, ÉVITER)
   Avec justification claire

6. **Insights par sélection** (1 insight concret par match)

## FORMAT JSON STRICT

```json
{{
  "overall_probability": 0.15,
  "risk_score": 0.75,
  "weakest_link": "Lille vs Rennes - Victoire Lille (30% de chance)",
  "coherence_score": 0.6,
  "recommendation": "MODIFIER - Remplacer Lille par Draw ou retirer du combiné",
  "detailed_analysis": "Analyse globale en 2-3 phrases sur la stratégie du combiné.",
  "selection_insights": [
    {{
      "match": "Lille vs Rennes",
      "insight": "Rennes invaincu à l'extérieur (5 matchs)"
    }}
  ]
}}
```

⚠️ RÉPONDS UNIQUEMENT AVEC LE JSON - PAS DE TEXTE AVANT OU APRÈS"""

class OllamaAIProvider(BaseAIProvider):
    """
    Ollama AI Provider - Modèle auto-hébergé optimisé pour paris sportifs.
    
    Utilise mistral:7b par défaut (meilleur équilibre performance/vitesse).
    Alternatives: llama3:8b (plus précis), llama3.2:3b (plus rapide).
    """
    
    def __init__(self):
        self.base_url = getattr(settings, 'ollama_url', 'http://ollama:11434')
        self.model = getattr(settings, 'ollama_model', 'mistral')  # mistral par défaut
        self.available = False
        self.client = None
        
        # Paramètres optimisés pour analyse de paris (équilibre qualité/vitesse)
        self.model_options = {
            "temperature": 0.2,  # Très bas pour cohérence maximale (0.2 = analyses stables)
            "top_p": 0.9,  # Légèrement augmenté pour diversité contrôlée
            "top_k": 50,  # Plus de choix pour nuances
            "repeat_penalty": 1.15,  # Réduit pour fluidité texte
            "num_predict": 1500,  # Réduit pour éviter timeouts (1500 tokens ≈ 10-15s)
        }
        
        # La vérification de disponibilité sera faite au premier appel (pas dans __init__)
            
    async def _check_availability(self):
        """Check if Ollama service is available."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    self.available = True
                    models = response.json().get("models", [])
                    model_names = [m.get("name") for m in models]
                    logger.info(
                        f"✅ Ollama available at {self.base_url}\n"
                        f"   Model: {self.model}\n"
                        f"   Available models: {', '.join(model_names) if model_names else 'None'}"
                    )
                else:
                    logger.warning(f"⚠️ Ollama service responded with status {response.status_code}")
        except Exception as e:
            logger.warning(f"⚠️ Ollama service not available: {str(e)}")
    
    
    async def _generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Generate response from Ollama with optimized parameters.
        
        Args:
            prompt: User prompt
            system_prompt: System context (optional, uses SYSTEM_PROMPT by default)
            
        Returns:
            Generated response text
        """
        try:
            if not self.client:
                # Timeout 90s pour analyses rapides (num_predict=1500)
                self.client = httpx.AsyncClient(timeout=90.0)
            
            # Combine system + user prompt
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            else:
                full_prompt = f"{SYSTEM_PROMPT}\n\n{prompt}"
            
            logger.debug(
                f"🤖 Ollama generation starting - Model: {self.model}, Prompt: {len(full_prompt)} chars"
            )
            
            start_time = asyncio.get_event_loop().time()
            
            response = await self.client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": full_prompt,
                    "stream": False,
                    "options": self.model_options,  # Paramètres optimisés
                    "format": "json"  # Force JSON output
                }
            )
            
            duration = asyncio.get_event_loop().time() - start_time
            
            if response.status_code != 200:
                logger.error(
                    f"❌ Ollama API error: {response.status_code} - {response.text}",
                    extra={'extra_data': {
                        'provider': 'ollama',
                        'model': self.model,
                        'status_code': response.status_code
                    }}
                )
                return None
            
            result = response.json()
            generated_text = result.get("response", "")
            
            logger.info(
                f"✅ Ollama generation successful - Duration: {duration:.2f}s, Response: {len(generated_text)} chars",
                extra={'extra_data': {
                    'provider': 'ollama',
                    'model': self.model,
                    'duration': duration,
                    'prompt_length': len(full_prompt),
                    'response_length': len(generated_text)
                }}
            )
            
            return generated_text
                
        except httpx.ReadTimeout:
            logger.error(
                f"⏱️ Ollama timeout (>90s) - Modèle trop lent, fallback vers Gemini",
                extra={'extra_data': {
                    'provider': 'ollama',
                    'model': self.model,
                    'error': 'ReadTimeout',
                    'timeout': 90
                }}
            )
            return None
        except Exception as e:
            logger.error(
                f"❌ Ollama generation error: {str(e)}",
                exc_info=True,
                extra={'extra_data': {
                    'provider': 'ollama',
                    'model': self.model,
                    'error': str(e)
                }}
            )
            return None

    async def analyze_match(self, home_team, away_team, league_name, match_date, team_stats=None, h2h_data=None, injuries_data=None, odds_data=None, news_context=None):
        """Analyze a match using Ollama with retry logic."""
        if not self.available:
            await self._check_availability()
            if not self.available:
                logger.warning("Ollama not available, using fallback")
                return self._get_fallback_analysis(home_team, away_team)
        
        prompt = ANALYSIS_PROMPT_TEMPLATE.format(
            home_team=home_team,
            away_team=away_team,
            league_name=league_name,
            match_date=match_date
        )
        
        # Tentative avec retry (2 tentatives max)
        for attempt in range(2):
            try:
                response_text = await self._generate(prompt)
                if not response_text:
                    if attempt == 0:
                        logger.warning("⚠️ Réponse vide, retry...")
                        continue
                    return self._get_fallback_analysis(home_team, away_team)
                
                # Nettoyer réponse (enlever markdown si présent)
                cleaned_response = response_text.strip()
                if cleaned_response.startswith("```"):
                    # Extraire JSON du bloc markdown
                    lines = cleaned_response.split("\n")
                    cleaned_response = "\n".join(lines[1:-1]) if len(lines) > 2 else cleaned_response
                
                # Parse JSON response
                result = json.loads(cleaned_response)
                validated = self._validate_result(result)
                
                logger.info(f"✅ Analyse match réussie - {home_team} vs {away_team}")
                return validated
                
            except json.JSONDecodeError as e:
                logger.error(
                    f"❌ JSON invalide (attempt {attempt+1}/2): {str(e)}",
                    extra={'extra_data': {
                        'response_preview': response_text[:200] if response_text else None,
                        'error': str(e)
                    }}
                )
                if attempt == 0:
                    # Retry avec prompt simplifié
                    prompt += "\n\n⚠️ IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte avant ni après."
                    continue
                return self._get_fallback_analysis(home_team, away_team)
                
            except Exception as e:
                logger.error(f"❌ Erreur analyse (attempt {attempt+1}/2): {str(e)}", exc_info=True)
                if attempt == 0:
                    continue
                return self._get_fallback_analysis(home_team, away_team)
        
        return self._get_fallback_analysis(home_team, away_team)

    async def analyze_coupon(self, matches):
        """Analyze a coupon using Ollama."""
        if not self.available:
            await self._check_availability()
            if not self.available:
                logger.warning("Ollama not available, using fallback")
                return self._get_fallback_coupon_analysis(matches)
        
        matches_info = "\n".join([
            f"{i+1}. {m.get('home_team')} vs {m.get('away_team')} - {m.get('selection_type')} ({m.get('odds')})"
            for i, m in enumerate(matches)
        ])
        
        prompt = COUPON_ANALYSIS_PROMPT_TEMPLATE.format(matches_info=matches_info)
        
        try:
            response_text = await self._generate(prompt)
            if not response_text:
                return self._get_fallback_coupon_analysis(matches)
            
            return json.loads(response_text)
            
        except Exception as e:
            logger.error(f"Ollama coupon analysis error: {str(e)}", exc_info=True)
            return self._get_fallback_coupon_analysis(matches)

    async def chat_analysis(self, analysis_summary, history, user_question):
        """Chat about an analysis using Ollama."""
        if not self.available:
            await self._check_availability()
            if not self.available:
                return "Désolé, l'assistant IA est indisponible."
        
        # Build conversation context
        context = f"Contexte: {analysis_summary}\n\n"
        for msg in history[-5:]:  # Last 5 messages
            role = "Utilisateur" if msg.role == "user" else "Assistant"
            context += f"{role}: {msg.content}\n"
        
        context += f"\nUtilisateur: {user_question}\nAssistant:"
        
        try:
            return await self._generate(context) or "Une erreur est survenue."
        except Exception as e:
            logger.error(f"Ollama chat error: {str(e)}", exc_info=True)
            return "Une erreur est survenue."

    def _validate_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and normalize AI result with strict checks."""
        probs = result.get("probabilities", {})
        total = probs.get("home", 0.33) + probs.get("draw", 0.33) + probs.get("away", 0.34)
        
        # Normaliser si incohérent
        if abs(total - 1.0) > 0.01:  # Tolérance 1%
            logger.warning(
                f"⚠️ Probabilités incohérentes (total={total:.3f}), normalisation appliquée",
                extra={'extra_data': {
                    'original_probs': probs,
                    'total': total
                }}
            )
            if total > 0:
                probs["home"] = round(probs.get("home", 0.33) / total, 3)
                probs["draw"] = round(probs.get("draw", 0.33) / total, 3)
                probs["away"] = round(1 - probs["home"] - probs["draw"], 3)
            else:
                probs = {"home": 0.333, "draw": 0.333, "away": 0.334}
        
        # Valider scénarios
        scenarios = []
        for s in result.get("scenarios", []):
            if isinstance(s, dict):
                scenario = {
                    "name": s.get("name") or "Scénario",
                    "probability": max(0.0, min(1.0, float(s.get("probability", 0.0)))),  # Clamp 0-1
                    "description": s.get("description", "N/A")
                }
                scenarios.append(scenario)
        
        if not scenarios:
            logger.warning("⚠️ Aucun scénario généré, création scénario par défaut")
            scenarios = [{"name": "Défaut", "probability": 1.0, "description": "Analyse standard."}]
        
        # Normaliser probabilités scénarios
        scenario_total = sum(s["probability"] for s in scenarios)
        if scenario_total > 0 and abs(scenario_total - 1.0) > 0.1:  # Tolérance 10%
            logger.debug(f"Normalisation scénarios: {scenario_total:.2f} → 1.0")
            for s in scenarios:
                s["probability"] = round(s["probability"] / scenario_total, 3)
        
        # Valider facteurs clés (max 5, longueur min 10 chars)
        key_factors = [str(k).strip() for k in result.get("key_factors", []) if len(str(k).strip()) >= 10][:5]
        if not key_factors:
            logger.warning("⚠️ Aucun facteur clé valide, ajout facteur par défaut")
            key_factors = ["Analyse basée sur données disponibles"]

        validated_result = {
            "probabilities": probs,
            "predicted_outcome": str(result.get("predicted_outcome", "X")).upper(),
            "confidence": min(max(float(result.get("confidence", 0.5)), 0.0), 1.0),
            "key_factors": key_factors,
            "scenarios": scenarios[:3],  # Max 3 scénarios
            "summary": str(result.get("summary", "N/A"))[:500]  # Max 500 chars
        }
        
        logger.debug(
            f"✅ Validation OK - Proba: {probs['home']:.2f}/{probs['draw']:.2f}/{probs['away']:.2f}, "
            f"Facteurs: {len(key_factors)}, Scénarios: {len(scenarios)}"
        )
        
        return validated_result

    def _get_fallback_analysis(self, home_team, away_team):
        """Fallback analysis when Ollama is unavailable."""
        return {
            "probabilities": {"home": 0.40, "draw": 0.30, "away": 0.30},
            "predicted_outcome": "1",
            "confidence": 0.40,
            "key_factors": ["Données limitées"],
            "scenarios": [{"name": "Équilibré", "probability": 1.0, "description": "Force similaire."}],
            "summary": "Analyse limitée - Service IA indisponible."
        }

    def _get_fallback_coupon_analysis(self, matches):
        """Fallback coupon analysis when Ollama is unavailable."""
        return {
            "overall_probability": 0.1,
            "risk_score": 0.9,
            "weakest_link": "N/A",
            "coherence_score": 0.5,
            "recommendation": "Service IA indisponible.",
            "detailed_analysis": "IA indisponible.",
            "selection_insights": []
        }
