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

export interface SmartStats {
    performance: {
        w: number;
        d: number;
        l: number;
        total: number;
    };
    home_strength: number;
    away_strength: number;
    reaction_score: number;
    momentum: number;
    clean_sheet_rate: number;
    avg_goals_sc: {
        scored: number;
        conceded: number;
    };
}

export interface StatisticsSnapshot {
    home: SmartStats;
    away: SmartStats;
    raw_api_stats?: any;
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
    home_team_logo?: string;
    away_team_logo?: string;
    league_name: string;
    match_date: string;
    predictions: Prediction;
    predicted_outcome: string;
    confidence_score: number;
    summary: string;
    key_factors: string[];
    scenarios: Scenario[];
    value_bet?: ValueBet;
    statistics_snapshot?: StatisticsSnapshot;
    actual_result?: string;
    was_correct?: boolean;
    created_at: string;
}

export interface MatchHistoryItem {
    id: string;
    home_team: string;
    away_team: string;
    home_team_logo?: string;
    away_team_logo?: string;
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

