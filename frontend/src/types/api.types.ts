/**
 * API Types - Common types for API interactions
 */

export interface ApiError {
    detail: string;
    status_code?: number;
    request_id?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
}
