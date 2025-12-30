import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, Shield, TrendingUp, History, Activity, CheckCircle2, XCircle, Brain, Zap } from 'lucide-react';
import { DuelSelector } from '../components/DuelSelector';
import { SupportedLeagues } from '../components/SupportedLeagues';
import { AnalysisResult } from '../features/analyze/components/AnalysisResult';
import { TeamCard } from '../features/analyze/components/TeamCard';
import { FixtureItem } from '../features/analyze/components/FixtureItem';
import { AnalysisHistoryList, ChatPanel } from '../components/analyze';
import { useAnalysis } from '../hooks';
import { cn } from '../lib/utils';

import { motion, AnimatePresence } from 'framer-motion';

export const AnalyzePage: React.FC = () => {
    const { t } = useTranslation();

    const {
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
        userContext,
        setUserContext
    } = useAnalysis();

    const tabs = [
        { id: 'search', label: t('analyze.new'), icon: <TrendingUp size={14} />, showLoading: false },
        { id: 'duel', label: t('analyze.duelTitle'), icon: <Shield size={14} />, showLoading: false },
        { id: 'history', label: t('analyze.history'), icon: <History size={14} />, showLoading: refreshing }
    ] as const;

    const suggestions = [
        t('analyze.suggestions.form') || "Parle-moi de la forme récente",
        t('analyze.suggestions.injuries') || "Quelles sont les absences clés ?",
        t('analyze.suggestions.betting') || "Quel est l'avis sur le Value Bet ?"
    ];

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20 relative">
            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 right-4 z-[100] glass-emerald p-4 rounded-2xl border-2 border-emerald animate-glow-pulse"
                    >
                        <p className="text-emerald font-black flex items-center space-x-2 text-sm">
                            <CheckCircle2 size={18} />
                            <span>{successMessage}</span>
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 right-4 z-[100] glass p-4 rounded-2xl border-2 border-red-500 bg-red-500/10"
                    >
                        <p className="text-red-500 font-bold flex items-center space-x-2 text-sm">
                            <XCircle size={18} />
                            <span>{errorMessage}</span>
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="text-center space-y-4 animate-in slide-in-from-top duration-700">
                <div className="inline-block">
                    <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-2 text-glow-emerald">
                        {t('features.analysis.title')}
                    </h2>
                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-emerald to-transparent opacity-50"></div>
                </div>

                <div className="pt-2">
                    <SupportedLeagues variant="compact" />
                </div>

                <div className="flex justify-center mt-8">
                    <div className="p-1 glass rounded-2xl flex relative overflow-hidden">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    if (tab.id === 'history') loadHistory();
                                    resetAnalysis();
                                }}
                                className={cn(
                                    "relative px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center space-x-2 cursor-pointer z-10",
                                    activeTab === tab.id ? "text-navy" : "text-gray-500 hover:text-white"
                                )}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                                {tab.showLoading && activeTab === 'history' && (
                                    <Activity size={12} className="animate-spin ml-2" />
                                )}

                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-emerald rounded-xl -z-10 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {activeTab === 'search' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {!selectedTeam && (
                        <div className="space-y-12">
                            <div className="relative group max-w-2xl mx-auto">
                                <motion.div
                                    initial={false}
                                    animate={loading ? { opacity: 0.5, scale: 0.98 } : { opacity: 1, scale: 1 }}
                                    className="relative flex items-center glass rounded-3xl overflow-hidden p-2 border border-white/10 group-focus-within:border-emerald/50 group-focus-within:shadow-[0_0_40px_rgba(16,185,129,0.15)] transition-all duration-500"
                                >
                                    <Search className="ml-5 text-emerald" size={24} />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={t('analyze.search.placeholder')}
                                        className="flex-1 bg-transparent border-none text-white px-5 py-5 focus:outline-none font-bold text-lg w-full min-w-0 placeholder:text-gray-600"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        onClick={handleSearch}
                                        className="btn-primary h-14 px-10 flex items-center space-x-3 shrink-0 cursor-pointer"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : (
                                            <>
                                                <Zap size={18} />
                                                <span className="font-black uppercase tracking-widest text-sm hidden sm:inline">{t('analyze.search.button')}</span>
                                            </>
                                        )}
                                    </button>
                                </motion.div>
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
                                    onClick={resetAnalysis}
                                    className="text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest cursor-pointer"
                                >
                                    {t('common.close')}
                                </button>
                            </div>

                            {/* Community Context Input */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-emerald p-6 rounded-3xl border-emerald/20 space-y-4 relative z-10 overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                    <Brain size={100} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 text-emerald">
                                        <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center">
                                            <Brain size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-widest leading-none">Détails d'Informateur</h4>
                                            <p className="text-[10px] text-gray-500 font-bold mt-1 italic">Votre intelligence, amplifiée par l'IA.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-emerald/10 px-3 py-1 rounded-full border border-emerald/20 border-dashed">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse"></div>
                                        <span className="text-[9px] font-black text-emerald uppercase tracking-widest">IA Active</span>
                                    </div>
                                </div>

                                <div className="relative">
                                    <textarea
                                        value={userContext}
                                        onChange={(e) => setUserContext(e.target.value)}
                                        placeholder="Ex: Mbappé est incertain. Terrain très gras suite aux pluies..."
                                        className="w-full bg-navy/40 border border-white/5 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-emerald/30 h-28 resize-none placeholder:text-gray-600 font-medium leading-relaxed transition-all"
                                    />
                                    <div className="absolute bottom-3 right-3 opacity-20">
                                        <Zap size={14} className="text-emerald" />
                                    </div>
                                </div>
                                <p className="text-[9px] text-emerald/60 font-black uppercase tracking-tighter">L'IA prendra en compte ces informations pour affiner son verdict final.</p>
                            </motion.div>

                            <div className="grid grid-cols-1 gap-4">
                                {fixtures.length > 0 ? (
                                    fixtures.map((f: any) => (
                                        <FixtureItem key={f.fixture.id} fixture={f} onClick={startAnalysis} />
                                    ))
                                ) : (
                                    <div className="text-center py-20 glass rounded-2xl border-dashed border-2 border-white/5">
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
                            onClose={resetAnalysis}
                        />
                    )}
                </div>
            ) : activeTab === 'duel' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {!currentAnalysis ? (
                        <div className="space-y-8">
                            <DuelSelector onAnalyze={handleDuelAnalysis} isLoading={loading} />

                            {/* Community Context Input for Duel */}
                            <div className="glass p-6 rounded-2xl border-emerald/20 bg-emerald/5 space-y-3 max-w-2xl mx-auto relative z-10">
                                <div className="flex items-center space-x-2 text-emerald">
                                    <Brain size={18} />
                                    <h4 className="text-xs font-black uppercase tracking-widest leading-none">Context d'Informateur (Bonus)</h4>
                                </div>
                                <textarea
                                    value={userContext}
                                    onChange={(e) => setUserContext(e.target.value)}
                                    placeholder="Ajoutez des détails pour affiner l'analyse du duel..."
                                    className="w-full bg-navy/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald/50 h-20 resize-none"
                                />
                            </div>
                        </div>
                    ) : (
                        <AnalysisResult
                            analysis={currentAnalysis}
                            isPremium={isPremium}
                            onChatOpen={() => setIsChatOpen(true)}
                            onClose={resetAnalysis}
                        />
                    )}
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <AnalysisHistoryList
                        history={history}
                        loading={loading}
                        onViewItem={viewHistoryItem}
                        onNewAnalysis={() => setActiveTab('search')}
                    />
                </div>
            )}


            <ChatPanel
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={chatMessages}
                isSending={isSending}
                newMessage={newMessage}
                onNewMessageChange={setNewMessage}
                onSendMessage={handleSendMessage}
                suggestions={suggestions}
            />
        </div>
    );
};

