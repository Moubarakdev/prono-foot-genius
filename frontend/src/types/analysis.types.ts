/**
 * Match Analysis Types
 */

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

export interface MatchHistoryItem {
    id: string;
    home_team: string;
    away_team: string;
    league_name: string;
    match_date: string;
    predicted_outcome: string;
    confidence_score: number;
    was_correct?: boolean;
    created_at: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

