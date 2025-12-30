"""
Service for computing 'Smart Stats' from raw fixture data.
These stats help provide deep insights using only basic score data.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.core.logger import get_logger

logger = get_logger('services.analysis.computed_stats')

class ComputedStatsService:
    """
    Computes advanced insights from basic match results.
    Bypasses the need for expensive 'Advanced Stats' APIs.
    """

    def compute_team_stats(self, matches: List[Dict[str, Any]], team_id: int) -> Dict[str, Any]:
        """
        Compute stats for a specific team based on their recent matches.
        
        Args:
            matches: List of standardized fixture objects
            team_id: The ID of the team to analyze
            
        Returns:
            Dict of calculated smart stats
        """
        if not matches:
            return self._empty_stats()

        # Sort matches by date descending
        sorted_matches = sorted(
            matches, 
            key=lambda x: (x.get("fixture", {}).get("date") or ""), 
            reverse=True
        )

        # Filters
        all_played = [m for m in sorted_matches if m.get("fixture", {}).get("status", {}).get("short") in ["FT", "AET", "PEN"]]
        
        home_matches = [m for m in all_played if m.get("teams", {}).get("home", {}).get("id") == team_id]
        away_matches = [m for m in all_played if m.get("teams", {}).get("away", {}).get("id") == team_id]
        recent_5 = all_played[:5]

        return {
            "performance": self._calculate_performance(all_played, team_id),
            "home_strength": self._calculate_location_strength(home_matches, team_id, is_home=True),
            "away_strength": self._calculate_location_strength(away_matches, team_id, is_home=False),
            "reaction_score": self._calculate_reaction_score(recent_5, team_id),
            "momentum": self._calculate_momentum(recent_5, team_id),
            "clean_sheet_rate": self._calculate_clean_sheet_rate(all_played, team_id),
            "avg_goals_sc": self._calculate_avg_goals(all_played, team_id)
        }

    def _calculate_performance(self, matches: List[Dict[str, Any]], team_id: int) -> Dict[str, Any]:
        """Win/Draw/Loss distribution."""
        total = len(matches)
        if total == 0: return {"w": 0, "d": 0, "l": 0}
        
        wins = draws = losses = 0
        for m in matches:
            res = self._get_match_result(m, team_id)
            if res == "W": wins += 1
            elif res == "D": draws += 1
            else: losses += 1
            
        return {
            "w": round(wins / total, 2),
            "d": round(draws / total, 2),
            "l": round(losses / total, 2),
            "total": total
        }

    def _calculate_location_strength(self, matches: List[Dict[str, Any]], team_id: int, is_home: bool) -> float:
        """Points per game at home/away (0 to 1 scale normalized)."""
        if not matches: return 0.5
        
        points = 0
        for m in matches:
            res = self._get_match_result(m, team_id)
            if res == "W": points += 3
            elif res == "D": points += 1
            
        max_points = len(matches) * 3
        return round(points / max_points, 2)

    def _calculate_reaction_score(self, matches: List[Dict[str, Any]], team_id: int) -> float:
        """
        Compares 2nd half performance to 1st half.
        > 0 means team improves in 2nd half (Reaction).
        < 0 means team collapses in 2nd half.
        """
        if not matches: return 0
        
        scores = []
        for m in matches:
            ht = m.get("score", {}).get("halftime", {})
            ft = m.get("score", {}).get("fulltime", {})
            
            # Check for goals in HT and FT
            h_ht = ht.get("home")
            a_ht = ht.get("away")
            h_ft = ft.get("home")
            a_ft = ft.get("away")

            if h_ht is None or a_ht is None or h_ft is None or a_ft is None:
                continue
            
            is_home = m.get("teams", {}).get("home", {}).get("id") == team_id
            
            # Goals in 1st half
            fh_goals = h_ht if is_home else a_ht
            fh_conc = a_ht if is_home else h_ht
            
            # Goals in 2nd half only
            sh_goals = (h_ft - h_ht) if is_home else (a_ft - a_ht)
            sh_conc = (a_ft - a_ht) if is_home else (h_ft - h_ht)
            
            # Difference in goal difference
            diff = (sh_goals - sh_conc) - (fh_goals - fh_conc)
            scores.append(diff)
            
        return round(sum(scores) / len(scores), 2) if scores else 0

    def _calculate_momentum(self, recent_matches: List[Dict[str, Any]], team_id: int) -> float:
        """Weighted recent form (more weight on the most recent match)."""
        if not recent_matches: return 0.5
        
        weights = [1.0, 0.8, 0.6, 0.4, 0.2]
        score = 0
        total_weight = 0
        
        for i, m in enumerate(recent_matches):
            if i >= len(weights): break
            res = self._get_match_result(m, team_id)
            val = 1.0 if res == "W" else (0.5 if res == "D" else 0.0)
            score += val * weights[i]
            total_weight += weights[i]
            
        return round(score / total_weight, 2)

    def _calculate_clean_sheet_rate(self, matches: List[Dict[str, Any]], team_id: int) -> float:
        """Percentage of matches with zero goals conceded."""
        if not matches: return 0
        
        cs = 0
        for m in matches:
            is_home = m.get("teams", {}).get("home", {}).get("id") == team_id
            conc = m.get("goals", {}).get("away") if is_home else m.get("goals", {}).get("home")
            if conc == 0: cs += 1
            
        return round(cs / len(matches), 2)

    def _calculate_avg_goals(self, matches: List[Dict[str, Any]], team_id: int) -> Dict[str, float]:
        """Average goals scored and conceded."""
        if not matches: return {"scored": 0, "conceded": 0}
        
        sc = conc = 0
        for m in matches:
            is_home = m.get("teams", {}).get("home", {}).get("id") == team_id
            sc += m.get("goals", {}).get("home", 0) if is_home else m.get("goals", {}).get("away", 0)
            conc += m.get("goals", {}).get("away", 0) if is_home else m.get("goals", {}).get("home", 0)
            
        return {
            "scored": round(sc / len(matches), 2),
            "conceded": round(conc / len(matches), 2)
        }

    def _get_match_result(self, match: Dict[str, Any], team_id: int) -> str:
        """Returns W, D, or L for the given team."""
        is_home = match.get("teams", {}).get("home", {}).get("id") == team_id
        home_g = match.get("goals", {}).get("home") or 0
        away_g = match.get("goals", {}).get("away") or 0
        
        if home_g == away_g: return "D"
        
        if is_home:
            return "W" if home_g > away_g else "L"
        else:
            return "W" if away_g > home_g else "L"

    def _empty_stats(self) -> Dict[str, Any]:
        return {
            "performance": {"w": 0, "d": 0, "l": 0, "total": 0},
            "home_strength": 0.5,
            "away_strength": 0.5,
            "reaction_score": 0,
            "momentum": 0.5,
            "clean_sheet_rate": 0,
            "avg_goals_sc": {"scored": 0, "conceded": 0}
        }

# Singleton
computed_stats_service = ComputedStatsService()
