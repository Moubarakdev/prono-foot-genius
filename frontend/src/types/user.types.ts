/**
 * User and Authentication Types
 */

export interface User {
    id: string;
    email: string;
    full_name: string;
    subscription: 'free' | 'starter' | 'pro' | 'lifetime';
    avatar_url?: string;
    is_verified: boolean;
    profile_type: 'safe' | 'balanced' | 'ambitious';
    daily_analyses_used?: number;
    analyses_limit?: number;
    created_at?: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    full_name?: string;
}

export interface UpdateProfileData {
    full_name?: string;
    avatar_url?: string;
    profile_type?: 'safe' | 'balanced' | 'ambitious';
}

export interface ChangePasswordData {
    current_password: string;
    new_password: string;
}
