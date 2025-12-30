import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, Shield, TrendingUp, History, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { DuelSelector } from '../components/DuelSelector';
import { SupportedLeagues } from '../components/SupportedLeagues';
import { AnalysisResult } from '../features/analyze/components/AnalysisResult';
import { TeamCard } from '../features/analyze/components/TeamCard';
import { FixtureItem } from '../features/analyze/components/FixtureItem';
import { AnalysisHistoryList, ChatPanel } from '../components/analyze';
import { useAnalysis } from '../hooks';
import { cn } from '../lib/utils';

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
        resetAnalysis
    } = useAnalysis();

    const suggestions = [
        "Quels sont les points faibles de l'équipe à domicile ?",
        "Analyse de la forme récente des deux équipes.",
        "Historique détaillé des confrontations directes.",
        "Conseil stratégique pour un pari sur ce match."
    ];

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20 relative">
            {/* Success Message */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-[100] glass p-4 rounded-xl border-2 border-emerald bg-emerald/10 animate-in slide-in-from-top duration-300">
                    <p className="text-emerald font-bold flex items-center space-x-2">
                        <CheckCircle2 size={20} />
                        <span>{successMessage}</span>
                    </p>
                </div>
            )}

            {/* Error Message */}
            {errorMessage && (
                <div className="fixed top-4 right-4 z-[100] glass p-4 rounded-xl border-2 border-red-500 bg-red-500/10 animate-in slide-in-from-top duration-300">
                    <p className="text-red-500 font-bold flex items-center space-x-2">
                        <XCircle size={20} />
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
                        onClick={() => { setActiveTab('search'); resetAnalysis(); }}
                        className={cn(
                            "px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center space-x-2 cursor-pointer",
                            activeTab === 'search' ? "bg-emerald text-navy shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-white/5 text-gray-500 hover:text-white"
                        )}
                    >
                        <TrendingUp size={14} />
                        <span>{t('analyze.new')}</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('duel'); resetAnalysis(); }}
                        className={cn(
                            "px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center space-x-2 cursor-pointer",
                            activeTab === 'duel' ? "bg-emerald text-navy shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-white/5 text-gray-500 hover:text-white"
                        )}
                    >
                        <Shield size={14} />
                        <span>{t('analyze.duelTitle')}</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('history'); loadHistory(); resetAnalysis(); }}
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
                                    onClick={resetAnalysis}
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
                        <DuelSelector onAnalyze={handleDuelAnalysis} isLoading={loading} />
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

