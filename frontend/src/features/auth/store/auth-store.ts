import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../../../lib/api-client';

interface User {
    id: string;
    email: string;
    full_name: string;
    subscription: string;
    avatar_url?: string;
    is_verified: boolean;
    profile_type: string;
    daily_analyses_used?: number;
    analyses_limit?: number;
}

interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    setAuth: (user: User, token: string, refreshToken: string) => void;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    verifyOtp: (email: string, otpCode: string) => Promise<void>;
    resendOtp: (email: string) => Promise<void>;
    requestForgotPassword: (email: string) => Promise<void>;
    resetPassword: (email: string, otpCode: string, password: string) => Promise<void>;
    updateProfile: (data: { full_name?: string; avatar_url?: string; profile_type?: string }) => Promise<void>;
    changePassword: (data: { current_password: string; new_password: string }) => Promise<void>;
    refreshAccessToken: () => Promise<boolean>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: localStorage.getItem('auth_token'),
            refreshToken: localStorage.getItem('refresh_token'),
            isAuthenticated: !!localStorage.getItem('auth_token'),
            isLoading: false,
            error: null,
            setAuth: (user, token, refreshToken) => {
                localStorage.setItem('auth_token', token);
                localStorage.setItem('refresh_token', refreshToken);
                set({ user, token, refreshToken, isAuthenticated: true, error: null });
            },
            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    // 1. Get Token
                    const formData = new URLSearchParams();
                    formData.append('username', email);
                    formData.append('password', password);

                    const { data: tokenData } = await apiClient.post('/auth/login', formData, {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    });

                    const token = tokenData.access_token;
                    const refreshToken = tokenData.refresh_token;
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('refresh_token', refreshToken);

                    // 2. Get User Details
                    const { data: user } = await apiClient.get<User>('/auth/me');

                    set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
                } catch (err: any) {
                    const message = err.response?.data?.detail || 'Login failed';
                    set({ error: message, isLoading: false });
                    throw new Error(message);
                }
            },
            register: async (email, password, fullName) => {
                set({ isLoading: true, error: null });
                try {
                    // 1. Register
                    await apiClient.post('/auth/register', {
                        email,
                        password,
                        full_name: fullName,
                    });

                    // 2. Auto Login
                    const formData = new URLSearchParams();
                    formData.append('username', email);
                    formData.append('password', password);

                    const { data: tokenData } = await apiClient.post('/auth/login', formData, {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    });

                    const token = tokenData.access_token;
                    const refreshToken = tokenData.refresh_token;
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('refresh_token', refreshToken);

                    // 3. Get User Details
                    const { data: user } = await apiClient.get<User>('/auth/me');

                    set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
                } catch (err: any) {
                    const message = err.response?.data?.detail || 'Registration failed';
                    set({ error: message, isLoading: false });
                    throw new Error(message);
                }
            },
            verifyOtp: async (email, otpCode) => {
                set({ isLoading: true, error: null });
                try {
                    // 1. Verify OTP
                    const { data: user } = await apiClient.post<User>('/auth/verify-otp', {
                        email,
                        otp_code: otpCode
                    });
                    
                    // 2. Auto-login after verification - need to get tokens
                    // Note: Frontend should store password temporarily or ask user to login after verification
                    // For now, just set the user and mark as verified
                    set({ user, isLoading: false });
                } catch (err: any) {
                    const message = err.response?.data?.detail || 'Verification failed';
                    set({ error: message, isLoading: false });
                    throw new Error(message);
                }
            },
            resendOtp: async (email) => {
                set({ isLoading: true, error: null });
                try {
                    await apiClient.post('/auth/resend-otp', null, { params: { email } });
                    set({ isLoading: false });
                } catch (err: any) {
                    const message = err.response?.data?.detail || 'Failed to resend OTP';
                    set({ error: message, isLoading: false });
                    throw new Error(message);
                }
            },
            requestForgotPassword: async (email) => {
                set({ isLoading: true, error: null });
                try {
                    await apiClient.post('/auth/forgot-password/request', { email });
                    set({ isLoading: false });
                } catch (err: any) {
                    const message = err.response?.data?.detail || 'Request failed';
                    set({ error: message, isLoading: false });
                    throw new Error(message);
                }
            },
            resetPassword: async (email, otpCode, password) => {
                set({ isLoading: true, error: null });
                try {
                    await apiClient.post('/auth/forgot-password/reset', {
                        email,
                        otp_code: otpCode,
                        new_password: password
                    });
                    set({ isLoading: false });
                } catch (err: any) {
                    const message = err.response?.data?.detail || 'Reset failed';
                    set({ error: message, isLoading: false });
                    throw new Error(message);
                }
            },
            updateProfile: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const { data: user } = await apiClient.put<User>('/auth/me', data);
                    set({ user, isLoading: false });
                } catch (err: any) {
                    const message = err.response?.data?.detail || 'Update failed';
                    set({ error: message, isLoading: false });
                    throw new Error(message);
                }
            },
            changePassword: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    await apiClient.put('/auth/me/password', data);
                    set({ isLoading: false });
                } catch (err: any) {
                    const message = err.response?.data?.detail || 'Password change failed';
                    set({ error: message, isLoading: false });
                    throw new Error(message);
                }
            },
            refreshAccessToken: async () => {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    return false;
                }

                try {
                    const { data } = await apiClient.post('/auth/refresh', {
                        refresh_token: refreshToken
                    });

                    const newToken = data.access_token;
                    const newRefreshToken = data.refresh_token;
                    
                    localStorage.setItem('auth_token', newToken);
                    localStorage.setItem('refresh_token', newRefreshToken);
                    
                    set({ token: newToken, refreshToken: newRefreshToken });
                    return true;
                } catch (err) {
                    console.error('Failed to refresh token:', err);
                    return false;
                }
            },
            logout: () => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
                window.location.href = '/login';
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
