/**
 * useAnalysis Hook
 * Manages analysis state, search, history, and chat interaction.
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { analyzeService } from '../features/analyze/services/analyze-service';
import { chatService } from '../features/analyze/services/chat-service';
import { useAuthStore } from '../features/auth/store/auth-store';
import type { Team, MatchAnalysis, ChatMessage } from '../types';

export const useAnalysis = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const isPremium = user?.subscription === 'pro' || user?.subscription === 'lifetime';

    const [activeTab, setActiveTab] = useState<'search' | 'duel' | 'history'>('search');
    const [query, setQuery] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [fixtures, setFixtures] = useState<any[]>([]);
    const [currentAnalysis, setCurrentAnalysis] = useState<MatchAnalysis | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [userContext, setUserContext] = useState('');

    // Auto-clear messages
    useEffect(() => {
        if (successMessage || errorMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setErrorMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, errorMessage]);

    const loadHistory = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const data = await analyzeService.getHistory();
            setHistory(data);
        } catch (err) {
            console.error(err);
        } finally {
            if (!silent) setLoading(false);
            else setRefreshing(false);
        }
    }, []);

    // Auto-refresh history when on history tab
    useEffect(() => {
        if (activeTab === 'history') {
            loadHistory();
            const interval = setInterval(() => {
                loadHistory(true);
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [activeTab, loadHistory]);

    // Auto-refresh fixtures when a team is selected
    useEffect(() => {
        if (selectedTeam && activeTab === 'search') {
            const interval = setInterval(async () => {
                try {
                    setRefreshing(true);
                    const data = await analyzeService.getFixtures(selectedTeam.id);
                    setFixtures(data);
                } catch (err) {
                    console.error(err);
                } finally {
                    setRefreshing(false);
                }
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [selectedTeam, activeTab]);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query) return;
        setLoading(true);
        try {
            const results = await analyzeService.searchTeams(query);
            setTeams(results);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTeam = async (team: Team) => {
        setLoading(true);
        setSelectedTeam(team);
        try {
            const data = await analyzeService.getFixtures(team.id);
            setFixtures(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDuelAnalysis = async (teamA: Team, teamB: Team) => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const result = await analyzeService.analyzeDuel(teamA.id, teamB.id, userContext);
            setCurrentAnalysis(result);
            setSelectedTeam(teamA);
            if (result.id) {
                const chatHist = await chatService.getHistory(result.id);
                setChatMessages(chatHist);
            }
            setSuccessMessage('✅ Analyse générée avec succès !');
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err?.response?.data?.detail || '❌ Erreur lors de l\'analyse');
        } finally {
            setLoading(false);
        }
    };

    const startAnalysis = async (fixtureId: number) => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const result = await analyzeService.analyzeMatch(fixtureId, userContext);
            setCurrentAnalysis(result);
            const chatHist = await chatService.getHistory(result.id);
            setChatMessages(chatHist);
            setSuccessMessage('✅ Analyse générée avec succès !');
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err?.response?.data?.detail || '❌ Erreur lors de l\'analyse');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent, customMsg?: string) => {
        if (e) e.preventDefault();
        const messageText = customMsg || newMessage;
        if (!messageText.trim() || !currentAnalysis || isSending) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            created_at: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, userMsg]);
        if (!customMsg) setNewMessage('');
        setIsSending(true);

        try {
            const assistantMsg = await chatService.sendMessage(currentAnalysis.id, userMsg.content);
            setChatMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    const viewHistoryItem = async (id: string) => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const data = await analyzeService.getAnalysisById(id);
            setCurrentAnalysis(data);
            setSelectedTeam({ id: data.fixture_id, name: data.home_team, logo: '' });
            setActiveTab('search');
            const chatHist = await chatService.getHistory(id);
            setChatMessages(chatHist);
            setSuccessMessage(t('analyze.historyLoaded'));
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err.response?.data?.detail || t('analyze.historyLoadError'));
        } finally {
            setLoading(false);
        }
    };

    const resetAnalysis = () => {
        setSelectedTeam(null);
        setCurrentAnalysis(null);
        setIsChatOpen(false);
    };

    return {
        activeTab,
        setActiveTab,
        query,
        setQuery,
        teams,
        history,
        loading,
        refreshing,
        selectedTeam,
        fixtures,
        currentAnalysis,
        successMessage,
        errorMessage,
        isChatOpen,
        setIsChatOpen,
        chatMessages,
        newMessage,
        setNewMessage,
        isSending,
        isPremium,
        loadHistory,
        handleSearch,
        handleSelectTeam,
        handleDuelAnalysis,
        startAnalysis,
        handleSendMessage,
        viewHistoryItem,
        resetAnalysis,
        setSuccessMessage,
        setErrorMessage,
        userContext,
        setUserContext
    };
};
