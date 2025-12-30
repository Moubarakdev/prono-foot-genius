import { apiClient } from '../../../lib/api-client';
import type { Team, Prediction, Scenario, ValueBet, MatchAnalysis } from '../../../types';

// Re-export types for backward compatibility
export type { Team, Prediction, Scenario, ValueBet, MatchAnalysis };

export const analyzeService = {
    searchTeams: async (query: string): Promise<Team[]> => {
        try {
            const response = await apiClient.get('/football/teams/search', {
                params: { name: query }
            });
            const list = response.data?.teams || response.data || [];
            return list.map((item: any) => ({
                id: item.team.id,
                name: item.team.name,
                logo: item.team.logo
            }));
        } catch (error) {
            console.error('Error searching teams:', error);
            throw error;
        }
    },

    getFixtures: async (teamId: number): Promise<any[]> => {
        try {
            const response = await apiClient.get('/football/fixtures', {
                params: { team: teamId, next: 5 }
            });
            return response.data.fixtures;
        } catch (error) {
            console.error('Error fetching fixtures:', error);
            throw error;
        }
    },

    analyzeMatch: async (fixtureId: number): Promise<MatchAnalysis> => {
        try {
            const response = await apiClient.post('/analyze/match', { fixture_id: fixtureId });
            return response.data;
        } catch (error) {
            console.error('Error analyzing match:', error);
            throw error;
        }
    },

    analyzeDuel: async (homeTeamId: number, awayTeamId: number): Promise<MatchAnalysis> => {
        try {
            const response = await apiClient.post('/analyze/custom', {
                home_team_id: homeTeamId,
                away_team_id: awayTeamId
            });
            return response.data;
        } catch (error) {
            console.error('Error analyzing duel:', error);
            throw error;
        }
    },

    getHistory: async (limit = 20, offset = 0): Promise<any[]> => {
        try {
            const response = await apiClient.get('/analyze/history', {
                params: { limit, offset }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching history:', error);
            throw error;
        }
    },

    getAnalysisById: async (analysisId: string): Promise<MatchAnalysis> => {
        try {
            const response = await apiClient.get(`/analyze/${analysisId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching analysis:', error);
            throw error;
        }
    }
};
