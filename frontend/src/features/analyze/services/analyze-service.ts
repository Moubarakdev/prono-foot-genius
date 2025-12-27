import { apiClient } from '../../../lib/api-client';

export interface Team {
    id: number;
    name: string;
    logo: string;
}

export interface Prediction {
    home: number;
    draw: number;
    away: number;
}

export interface Scenario {
    name: string;
    probability: number;
    description: string;
}

export interface ValueBet {
    outcome: string;
    ai_probability: number;
    market_odds: number;
    value_percentage: number;
    is_value: boolean;
}

export interface MatchAnalysis {
    id: string;
    fixture_id: number;
    home_team: string;
    away_team: string;
    league_name: string;
    match_date: string;
    predictions: Prediction;
    predicted_outcome: string;
    confidence_score: number;
    summary: string;
    key_factors: string[];
    scenarios: Scenario[];
    value_bet?: ValueBet;
    actual_result?: string;
    was_correct?: boolean;
    created_at: string;
}

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
