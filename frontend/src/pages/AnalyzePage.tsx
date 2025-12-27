import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, BarChart2, Shield, TrendingUp, History, Calendar, Clock, MessageSquare, Send, X, Activity } from 'lucide-react';
import { DuelSelector } from '../components/DuelSelector';
import { SupportedLeagues } from '../components/SupportedLeagues';
import { AnalysisResult } from '../features/analyze/components/AnalysisResult';
import { TeamCard } from '../features/analyze/components/TeamCard';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { FixtureItem } from '../features/analyze/components/FixtureItem';
import { analyzeService, type Team, type MatchAnalysis } from '../features/analyze/services/analyze-service';
import { chatService, type ChatMessage } from '../features/analyze/services/chat-service';
import { useAuthStore } from '../features/auth/store/auth-store';
import { cn } from '../lib/utils';

export const AnalyzePage: React.FC = () => {
    const { t } = useTranslation();
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
    const chatEndRef = useRef<HTMLDivElement>(null);

    const { user } = useAuthStore();
    const isPremium = user?.subscription === 'pro' || user?.subscription === 'lifetime';

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

    useEffect(() => {
        if (isChatOpen && chatMessages.length > 0) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, isChatOpen]);

    // Auto-refresh history when on history tab
    useEffect(() => {
        if (activeTab === 'history') {
            loadHistory();

            // Auto-refresh every 30 seconds
            const interval = setInterval(() => {
                loadHistory(true); // silent refresh
            }, 30000);

            return () => clearInterval(interval);
        }
    }, [activeTab]);

    // Auto-refresh fixtures when a team is selected
    useEffect(() => {
        if (selectedTeam && activeTab === 'search') {
            // Initial load is done by handleSelectTeam, so we only set up interval
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

    const loadHistory = async (silent = false) => {
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
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
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
            const result = await analyzeService.analyzeDuel(teamA.id, teamB.id);
            setCurrentAnalysis(result);
            // Selected team for context will be Team A
            setSelectedTeam(teamA);

            // Fetch initial chat history if exists (might not for new custom analysis)
            if (result.id) {
                const chatHist = await chatService.getHistory(result.id);
                setChatMessages(chatHist);
            }
            setSuccessMessage('✅ Analyse générée avec succès !');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err?.response?.data?.detail || '❌ Erreur lors de l\'analyse');
            setTimeout(() => setErrorMessage(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    const startAnalysis = async (fixtureId: number) => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const result = await analyzeService.analyzeMatch(fixtureId);
            setCurrentAnalysis(result);
            // Fetch initial chat history if exists
            const chatHist = await chatService.getHistory(result.id);
            setChatMessages(chatHist);
            setSuccessMessage('✅ Analyse générée avec succès !');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err?.response?.data?.detail || '❌ Erreur lors de l\'analyse');
            setTimeout(() => setErrorMessage(null), 5000);
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

    const suggestions = [
        "Quels sont les points faibles de l'équipe à domicile ?",
        "Analyse de la forme récente des deux équipes.",
        "Historique détaillé des confrontations directes.",
        "Conseil stratégique pour un pari sur ce match."
    ];

    const viewHistoryItem = async (id: string) => {
        console.log('📋 Viewing history item:', id);
        setLoading(true);
        setErrorMessage(null);
        try {
            console.log('🔄 Fetching analysis data...');
            const data = await analyzeService.getAnalysisById(id);
            console.log('✅ Analysis data received:', data);
            
            setCurrentAnalysis(data);
            setSelectedTeam({ id: data.fixture_id, name: data.home_team, logo: '' });
            setActiveTab('search');
            
            // Load chat history
            console.log('💬 Loading chat history...');
            const chatHist = await chatService.getHistory(id);
            console.log('✅ Chat history loaded:', chatHist.length, 'messages');
            setChatMessages(chatHist);
            
            setSuccessMessage(t('analyze.historyLoaded'));
        } catch (err: any) {
            console.error('❌ Error viewing history item:', err);
            setErrorMessage(err.response?.data?.detail || t('analyze.historyLoadError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20 relative">
            {/* Success Message */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-[100] glass p-4 rounded-xl border-2 border-emerald bg-emerald/10 animate-in slide-in-from-top duration-300">
                    <p className="text-emerald font-bold flex items-center space-x-2">
                        <Search size={20} />
                        <span>{successMessage}</span>
                    </p>
                </div>
            )}

            {/* Error Message */}
            {errorMessage && (
                <div className="fixed top-4 right-4 z-[100] glass p-4 rounded-xl border-2 border-red-500 bg-red-500/10 animate-in slide-in-from-top duration-300">
                    <p className="text-red-500 font-bold flex items-center space-x-2">
                        <X size={20} />
                        <span>{errorMessage}</span>
                    </p>
                </div>
            )}

            <div className="text-center space-y-2 animate-in slide-in-from-top duration-700">
                <h2 className="text-2xl md:text-4xl font-black text-white italic tracking-tighter uppercase transition-all">{t('features.analysis.title')}</h2>
                
                {/* Supported Leagues - Compact */}
                <div className="pt-4 pb-2">
                    <SupportedLeagues variant="compact" />
                </div>

                <div className="flex flex-wrap justify-center gap-4 mt-6">
                    <button
                        onClick={() => { setActiveTab('search'); setSelectedTeam(null); setCurrentAnalysis(null); setIsChatOpen(false); }}
                        className={cn(
                            "px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center space-x-2 cursor-pointer",
                            activeTab === 'search' ? "bg-emerald text-navy shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-white/5 text-gray-500 hover:text-white"
                        )}
                    >
                        <TrendingUp size={14} />
                        <span>{t('analyze.new')}</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('duel'); setSelectedTeam(null); setCurrentAnalysis(null); setIsChatOpen(false); }}
                        className={cn(
                            "px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center space-x-2 cursor-pointer",
                            activeTab === 'duel' ? "bg-emerald text-navy shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-white/5 text-gray-500 hover:text-white"
                        )}
                    >
                        <Shield size={14} />
                        <span>{t('analyze.duelTitle')}</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('history'); loadHistory(); setIsChatOpen(false); }}
                        className={cn(
                            "px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center space-x-2 cursor-pointer",
                            activeTab === 'history' ? "bg-emerald text-navy shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-white/5 text-gray-500 hover:text-white"
                        )}
                    >
                        <History size={14} />
                        <span>{t('analyze.history')}</span>
                        {refreshing && activeTab === 'history' && (
                            <Activity size={12} className="animate-spin" />
                        )}
                    </button>
                </div>
            </div>

            {activeTab === 'search' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {!selectedTeam && (
                        <div className="space-y-12">
                            <div className="relative group max-w-2xl mx-auto">
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald to-cyan rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <form onSubmit={handleSearch} className="relative flex items-center glass rounded-2xl overflow-hidden p-2">
                                    <Search className="ml-4 text-gray-500" size={24} />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={t('analyze.search.placeholder')}
                                        className="flex-1 bg-transparent border-none text-white px-4 py-4 focus:outline-none font-bold text-base md:text-lg w-full min-w-0"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary h-12 px-4 md:px-8 flex items-center space-x-2 shrink-0 cursor-pointer"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <span className="font-black uppercase tracking-widest text-xs md:text-sm hidden sm:inline">{t('analyze.search.button')}</span>}
                                    </button>
                                </form>
                            </div>

                            {teams.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {teams.map((team) => (
                                        <TeamCard key={team.id} team={team} onClick={handleSelectTeam} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {selectedTeam && !currentAnalysis && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-white italic uppercase">{t('analyze.nextMatches', { team: selectedTeam.name })}</h3>
                                <button
                                    onClick={() => setSelectedTeam(null)}
                                    className="text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest cursor-pointer"
                                >
                                    {t('common.close')}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {fixtures.length > 0 ? (
                                    fixtures.map((f: any) => (
                                        <FixtureItem key={f.fixture.id} fixture={f} onClick={startAnalysis} />
                                    ))
                                ) : (
                                    <div className="text-center py-20 glass rounded-2xl border-dashed border-2 border-white/5">
                                        <Calendar size={48} className="mx-auto text-gray-700 mb-4" />
                                        <p className="text-gray-500 font-bold">{t('analyze.noMatches')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentAnalysis && (
                        <AnalysisResult
                            analysis={currentAnalysis}
                            isPremium={isPremium}
                            onChatOpen={() => setIsChatOpen(true)}
                            onClose={() => { setSelectedTeam(null); setCurrentAnalysis(null); setIsChatOpen(false); }}
                        />
                    )}
                </div>
            ) : activeTab === 'duel' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {!currentAnalysis ? (
                        <DuelSelector onAnalyze={handleDuelAnalysis} isLoading={loading} />
                    ) : (
                        <AnalysisResult
                            analysis={currentAnalysis}
                            isPremium={isPremium}
                            onChatOpen={() => setIsChatOpen(true)}
                            onClose={() => { setSelectedTeam(null); setCurrentAnalysis(null); setIsChatOpen(false); }}
                        />
                    )}
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {loading && history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="animate-spin text-emerald" size={48} />
                            <p className="text-gray-500 font-bold animate-pulse">{t('common.loading')}</p>
                        </div>
                    ) : history.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        viewHistoryItem(item.id);
                                    }}
                                    className="glass p-6 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/10 active:scale-[0.98]"
                                >
                                    <div className="flex items-center space-x-6">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-emerald transition-colors">
                                            <BarChart2 size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-white group-hover:text-emerald transition-colors">
                                                {item.home_team} <span className="text-gray-600 px-2 italic font-medium">{t('analyze.vs')}</span> {item.away_team}
                                            </h4>
                                            <div className="flex items-center space-x-4 mt-1 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                                <span className="flex items-center space-x-1">
                                                    <Calendar size={10} />
                                                    <span>{new Date(item.match_date).toLocaleDateString()}</span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <Clock size={10} />
                                                    <span>{t('analyze.recent')} {new Date(item.created_at).toLocaleDateString()}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center space-x-6">
                                        <div>
                                            <p className="text-xs font-black text-gray-500 uppercase">Prognostic</p>
                                            <p className="text-xl font-black text-white italic">{item.predicted_outcome}</p>
                                        </div>
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center border-2",
                                            item.was_correct === true ? "border-emerald text-emerald bg-emerald/10" :
                                                item.was_correct === false ? "border-red-500 text-red-500 bg-red-500/10" :
                                                    "border-white/10 text-gray-600"
                                        )}>
                                            {item.was_correct === true ? '✓' : item.was_correct === false ? '✗' : '?'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 glass rounded-3xl border-dashed border-2 border-white/5">
                            <History size={64} className="mx-auto text-gray-700 mb-6" />
                            <h3 className="text-xl font-bold text-gray-500 uppercase tracking-widest">{t('coupons.list.empty')}</h3>
                            <button
                                onClick={() => setActiveTab('search')}
                                className="mt-8 btn-secondary px-8 py-3 uppercase text-xs tracking-widest cursor-pointer"
                            >
                                {t('analyze.new')}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Chat Side Panel */}
            <div className={cn(
                "fixed right-0 top-0 h-screen w-96 glass bg-navy/95 border-l border-white/10 z-50 transition-transform duration-500 shadow-2xl flex flex-col",
                isChatOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div className="flex items-center space-x-3">
                        <MessageSquare className="text-emerald" size={20} />
                        <h3 className="font-black text-sm uppercase tracking-widest">{t('pricing.pro.feature2')}</h3>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                            <MessageSquare size={48} />
                            <p className="text-sm font-medium px-10">{t('features.analysis.chatEmpty')}</p>
                        </div>
                    ) : (
                        chatMessages.map((msg, idx) => (
                            <div key={idx} className={cn(
                                "flex flex-col space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                msg.role === 'user' ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "p-4 rounded-2xl max-w-[90%] text-sm shadow-sm transition-all",
                                    msg.role === 'user'
                                        ? "bg-emerald text-navy font-bold rounded-tr-none"
                                        : "bg-white/5 text-gray-300 rounded-tl-none border border-white/10"
                                )}>
                                    {msg.role === 'assistant' ? (
                                        <MarkdownRenderer content={msg.content} />
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                                <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest flex items-center space-x-1">
                                    {msg.role === 'user' ? (
                                        <><span>{t('features.analysis.you')}</span><Clock size={8} className="ml-1" /></>
                                    ) : (
                                        <><span>{t('features.analysis.ai')}</span><Clock size={8} className="ml-1" /></>
                                    )}
                                </span>
                            </div>
                        ))
                    )}

                    {isSending && (
                        <div className="flex flex-col items-start space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-white/5 text-gray-400 p-4 rounded-2xl rounded-tl-none border border-white/10 flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-emerald rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-emerald rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-emerald rounded-full animate-bounce"></span>
                            </div>
                            <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">{t('features.analysis.ai')}...</span>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-6 bg-white/5 border-t border-white/10 space-y-4">
                    {chatMessages.length < 5 && !isSending && (
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSendMessage(undefined, s)}
                                    className="text-[10px] font-black uppercase tracking-widest px-3 py-2 bg-white/5 hover:bg-emerald/10 hover:text-emerald border border-white/10 hover:border-emerald/30 rounded-lg transition-all text-left cursor-pointer"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSendMessage} className="relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={t('features.analysis.chatPlaceholder')}
                            className="w-full bg-navy/50 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-emerald/50 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={isSending}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-emerald text-navy flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:scale-100"
                        >
                            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
