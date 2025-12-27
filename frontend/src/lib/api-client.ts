import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Interceptor to add auth token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor to handle errors and refresh token
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const detail = error.response?.data?.detail || error.message;

        // If 401 and not already retrying and not on auth endpoints
        if (status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
            if (isRefreshing) {
                // Wait for the refresh to complete
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh_token');

            if (!refreshToken) {
                console.warn('No refresh token available, redirecting to login...');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                    refresh_token: refreshToken
                });

                const newToken = data.access_token;
                const newRefreshToken = data.refresh_token;

                localStorage.setItem('auth_token', newToken);
                localStorage.setItem('refresh_token', newRefreshToken);

                apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                processQueue(null, newToken);

                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                console.warn('Token refresh failed, redirecting to login...');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // For other errors, just log and reject
        console.error(`API Error [${status || 'No Status'}]:`, detail);

        return Promise.reject(error);
    }
);
