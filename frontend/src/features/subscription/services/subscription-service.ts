import { apiClient } from '../../../lib/api-client';

export interface CheckoutSessionRequest {
    plan_type: 'starter' | 'pro' | 'lifetime';
    payment_method?: 'stripe' | 'moneroo';
    success_url: string;
    cancel_url: string;
}

export interface PricingData {
    currency: string;
    symbol: string;
    plans: {
        starter: number;
        pro: number;
        lifetime: number;
    };
    country_code: string;
}

export interface SubscriptionStatus {
    plan: string;
    expires_at: string | null;
    is_active: boolean;
}

export interface SubscriptionDetails {
    plan: string;
    status: string;
    expires_at: string | null;
    cancel_at_period_end: boolean;
    analyses_limit: number;
    analyses_used: number;
}

export const subscriptionService = {
    getPricing: async (): Promise<PricingData> => {
        const response = await apiClient.get('/subscription/pricing');
        return response.data;
    },

    createCheckoutSession: async (data: CheckoutSessionRequest): Promise<{ checkout_url: string }> => {
        const response = await apiClient.post('/subscription/checkout', data);
        return response.data;
    },

    getStatus: async (): Promise<SubscriptionStatus> => {
        const response = await apiClient.get('/subscription/status');
        return response.data;
    },

    createPortalSession: async (): Promise<{ checkout_url: string }> => {
        const response = await apiClient.post('/subscription/portal');
        return response.data;
    },

    cancelSubscription: async (): Promise<{ status: string; message: string }> => {
        const response = await apiClient.post('/subscription/cancel');
        return response.data;
    }
};
