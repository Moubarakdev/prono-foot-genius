"""
Script de test pour vérifier l'architecture hybride
"""
import asyncio
import sys
sys.path.insert(0, '/app')

from app.providers.football.hybrid_provider import HybridFootballProvider
from app.core.logger import logger


async def test_hybrid_provider():
    """Test complet du provider hybride"""
    
    logger.info("=" * 60)
    logger.info("TEST DE L'ARCHITECTURE HYBRIDE")
    logger.info("=" * 60)
    
    provider = HybridFootballProvider()
    
    # Test 1: Récupération des fixtures
    logger.info("\n[TEST 1] Récupération des prochains fixtures...")
    try:
        fixtures = await provider.get_fixtures(next=5)
        logger.info(f"✅ {len(fixtures)} fixtures récupérés")
        if fixtures:
            first = fixtures[0]
            logger.info(f"   Premier match: {first['teams']['home']['name']} vs {first['teams']['away']['name']}")
            logger.info(f"   Date: {first['fixture']['date']}")
            logger.info(f"   Ligue: {first['league']['name']}")
    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
    
    # Test 2: Recherche d'équipe
    logger.info("\n[TEST 2] Recherche d'équipe...")
    try:
        teams = await provider.search_team("Manchester")
        logger.info(f"✅ {len(teams)} équipes trouvées")
        if teams:
            for i, team_data in enumerate(teams[:3], 1):
                team = team_data.get("team", {})
                logger.info(f"   {i}. {team.get('name')} ({team.get('country')})")
    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
    
    # Test 3: Récupération des ligues
    logger.info("\n[TEST 3] Récupération des ligues...")
    try:
        leagues = await provider.get_leagues()
        logger.info(f"✅ {len(leagues)} ligues disponibles")
        if leagues:
            for i, league_data in enumerate(leagues[:5], 1):
                league = league_data.get("league", {})
                country = league_data.get("country", {})
                logger.info(f"   {i}. {league.get('name')} - {country.get('name')}")
    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
    
    # Test 4: Détails complets d'un fixture (si disponible)
    if fixtures:
        fixture_id = fixtures[0]["fixture"]["id"]
        logger.info(f"\n[TEST 4] Récupération des données complètes du fixture {fixture_id}...")
        try:
            complete_data = await provider.get_fixture_with_all_data(fixture_id)
            if complete_data:
                logger.info("✅ Données complètes récupérées:")
                logger.info(f"   - Fixture: ✓")
                logger.info(f"   - Live Score: {'✓' if 'live_score' in complete_data else '✗'}")
                logger.info(f"   - Statistics: {'✓' if 'statistics' in complete_data else '✗'}")
                logger.info(f"   - Odds: {'✓' if 'odds' in complete_data else '✗'}")
        except Exception as e:
            logger.error(f"❌ Erreur: {e}")
    
    logger.info("\n" + "=" * 60)
    logger.info("FIN DES TESTS")
    logger.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_hybrid_provider())
