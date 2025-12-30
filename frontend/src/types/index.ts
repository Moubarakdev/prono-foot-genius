/**
 * Centralized TypeScript types for the Frontend.
 * Re-exports all types from feature modules.
 */

// Analysis types
export type {
    Team,
    Prediction,
    Scenario,
    ValueBet,
    MatchAnalysis,
    MatchHistoryItem,
    ChatMessage,
} from './analysis.types';

// Coupon types  
export type {
    CouponSelection,
    CouponCreate,
    ParsedOdds,
    OddValue,
    Bet,
    Bookmaker,
    FixtureOdds,
    Coupon,
    CouponListItem,
    SelectionInsight,
    AIAnalysis,
} from './coupon.types';

// User types
export type { User, AuthState } from './user.types';

// API types
export type { ApiError, PaginatedResponse } from './api.types';
