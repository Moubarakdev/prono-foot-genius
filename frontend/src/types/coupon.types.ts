/**
 * Coupon Types
 */

export interface CouponSelection {
    id?: string;
    fixture_id: number;
    home_team: string;
    away_team: string;
    match_date: string;
    selection_type: string;
    odds: number;
    implied_probability?: number;
    ai_probability?: number;
    edge?: number;
    result?: string;
}

export interface CouponCreate {
    selections: CouponSelection[];
}

export interface OddValue {
    value: string;
    odd: string;
}

export interface Bet {
    id: number;
    name: string;
    values: OddValue[];
}

export interface Bookmaker {
    id: number;
    name: string;
    bets: Bet[];
}

export interface FixtureOdds {
    bookmakers: Bookmaker[];
}

export interface ParsedOdds {
    home: number;
    draw: number;
    away: number;
    over25?: number;
    under25?: number;
    btts_yes?: number;
    btts_no?: number;
}

export interface SelectionInsight {
    match: string;
    insight: string;
}

export interface AIAnalysis {
    overall_probability: number;
    risk_score: number;
    weakest_link: string;
    coherence_score: number;
    recommendation: string;
    detailed_analysis: string;
    selection_insights: SelectionInsight[];
}

export interface Coupon {
    id: string;
    user_id: string;
    coupon_type: 'user_created' | 'daily_safe' | 'daily_balanced' | 'daily_ambitious';
    selections: CouponSelection[];
    total_odds: number;
    stake?: number;
    potential_win?: number;
    success_probability: number;
    risk_level: 'low' | 'medium' | 'high' | 'extreme';
    ai_recommendation: string;
    weak_points: string[];
    ai_analysis?: AIAnalysis;
    status: 'pending' | 'won' | 'lost' | 'partial';
    matches_won: number;
    matches_lost: number;
    created_at: string;
    resolved_at?: string;
}

export interface CouponListItem {
    id: string;
    coupon_type: 'user_created' | 'daily_safe' | 'daily_balanced' | 'daily_ambitious';
    total_odds: number;
    success_probability: number;
    risk_level: 'low' | 'medium' | 'high' | 'extreme';
    status: 'pending' | 'won' | 'lost' | 'partial';
    selections_count: number;
    created_at: string;
}
