import { apiClient } from '../../../lib/api-client';

export interface CouponSelection {
    fixture_id: number;
    home_team: string;
    away_team: string;
    match_date: string;
    selection_type: string;
    odds: number;
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

/**
 * Safely parse a float value, returning a default if invalid
 */
function safeParseFloat(value: any, defaultValue: number = 1.5): number {
    const parsed = parseFloat(value);
    return !isNaN(parsed) && isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

/**
 * Parse raw odds data from API into a simpler format
 */
function parseOddsData(oddsData: any[]): ParsedOdds | null {
    if (!oddsData || oddsData.length === 0) return null;

    try {
        const bookmaker = oddsData[0]?.bookmakers?.[0];
        if (!bookmaker) return null;

        const result: ParsedOdds = { home: 1.5, draw: 3.5, away: 5.0 };

        for (const bet of bookmaker.bets || []) {
            if (bet.name === 'Match Winner') {
                for (const v of bet.values || []) {
                    if (v.value === 'Home') result.home = safeParseFloat(v.odd, 1.5);
                    else if (v.value === 'Draw') result.draw = safeParseFloat(v.odd, 3.5);
                    else if (v.value === 'Away') result.away = safeParseFloat(v.odd, 5.0);
                }
            } else if (bet.name === 'Goals Over/Under' && bet.values) {
                for (const v of bet.values) {
                    if (v.value === 'Over 2.5') result.over25 = safeParseFloat(v.odd, 1.8);
                    else if (v.value === 'Under 2.5') result.under25 = safeParseFloat(v.odd, 2.0);
                }
            } else if (bet.name === 'Both Teams Score') {
                for (const v of bet.values || []) {
                    if (v.value === 'Yes') result.btts_yes = safeParseFloat(v.odd, 1.8);
                    else if (v.value === 'No') result.btts_no = safeParseFloat(v.odd, 2.0);
                }
            }
        }

        return result;
    } catch (error) {
        console.error('Error parsing odds data:', error);
        return null;
    }
}

export const couponService = {
    createCoupon: async (data: CouponCreate) => {
        const response = await apiClient.post('/coupons/create', data);
        return response.data;
    },

    getDailyCoupons: async () => {
        const response = await apiClient.get('/coupons/daily');
        return response.data;
    },

    listCoupons: async (limit = 20, offset = 0) => {
        const response = await apiClient.get('/coupons/', {
            params: { limit, offset }
        });
        return response.data;
    },

    getCouponById: async (id: string) => {
        const response = await apiClient.get(`/coupons/${id}`);
        return response.data;
    },

    deleteCoupon: async (id: string) => {
        await apiClient.delete(`/coupons/${id}`);
    },

    reanalyzeCoupon: async (id: string) => {
        const response = await apiClient.put(`/coupons/${id}/reanalyze`);
        return response.data;
    },

    /**
     * Fetch odds for a specific fixture
     */
    getFixtureOdds: async (fixtureId: number): Promise<ParsedOdds | null> => {
        try {
            const response = await apiClient.get(`/football/fixtures/${fixtureId}/odds`);
            return parseOddsData(response.data.odds);
        } catch (error) {
            console.error('Error fetching odds:', error);
            return null;
        }
    }
};
