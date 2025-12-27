import { apiClient } from '../../../lib/api-client';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export const chatService = {
    sendMessage: async (analysisId: string, content: string): Promise<ChatMessage> => {
        const response = await apiClient.post(`/analyze/${analysisId}/chat`, { content });
        return response.data;
    },

    getHistory: async (analysisId: string): Promise<ChatMessage[]> => {
        const response = await apiClient.get(`/analyze/${analysisId}/chat/history`);
        return response.data.messages;
    }
};
