import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket, Loader2, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Plus, PieChart, Activity, Zap, Sparkles, RefreshCw, ChevronLeft, Share2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { couponService, type ParsedOdds } from '../features/coupons/services/coupon-service';
import { CouponList, CouponBuilder } from '../components/coupons';
import { useCoupons } from '../hooks';
import { cn } from '../lib/utils';

export const CouponsPage: React.FC = () => {
    const { t } = useTranslation();

    // Use the custom hook for coupon state management
    const {
        coupons,
        dailyCoupons,
        loading,
        refreshing,
        selectedCoupon,
        successMessage,
        errorMessage,
        viewCouponDetail,
        clearSelectedCoupon,
        setSuccessMessage,
        setErrorMessage,
        reanalyzeCoupon,
        reanalyzing,
        loadCoupons,
    } = useCoupons();

    // Builder State (local to this page)
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [newSelections, setNewSelections] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // Odds State
    const [fixtureOdds, setFixtureOdds] = useState<ParsedOdds | null>(null);
    const [loadingOdds] = useState(false);

    // Form State
    const [tempSelection, setTempSelection] = useState({
        home_team: '',
        away_team: '',
        selection_type: '1',
        odds: 1.5,
        match_date: new Date().toISOString().split('T')[0],
        fixture_id: 0
    });

    const handleCreateCoupon = async () => {
        if (newSelections.length === 0) return;
        setIsCreating(true);
        setErrorMessage(null);
        try {
            await couponService.createCoupon({
                selections: newSelections
            });
            setIsBuilderOpen(false);
            setNewSelections([]);
            setSuccessMessage(t('coupons.notifications.success'));
            setTimeout(() => setSuccessMessage(null), 3000);
            loadCoupons();
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err?.response?.data?.detail || t('coupons.notifications.error'));
            setTimeout(() => setErrorMessage(null), 5000);
        } finally {
            setIsCreating(false);
        }
    };

    const addSelection = () => {
        if (!tempSelection.home_team || !tempSelection.away_team) return;
        setNewSelections([...newSelections, { ...tempSelection }]);
        setTempSelection({
            home_team: '',
            away_team: '',
            selection_type: '1',
            odds: 1.5,
            match_date: new Date().toISOString().split('T')[0],
            fixture_id: 0
        });
        setFixtureOdds(null);
    };

    const removeSelection = (idx: number) => {
        setNewSelections(newSelections.filter((_, i) => i !== idx));
    };

    const handleReanalyzeCoupon = async () => {
        await reanalyzeCoupon();
    };


    const handleShareCoupon = async () => {
        if (!selectedCoupon) return;

        const shareText = `${t('coupons.share.text', {
            odds: selectedCoupon.total_odds.toFixed(2),
            proba: Math.round(selectedCoupon.success_probability * 100)
        })}\n\n${selectedCoupon.selections.map((s: any, i: number) =>
            `${i + 1}. ${s.home_team} vs ${s.away_team} - ${s.selection_type === '1' ? t('coupons.builder.homeWin') : s.selection_type === 'X' ? t('coupons.builder.draw') : t('coupons.builder.awayWin')} (${s.odds})`
        ).join('\n')}`;

        const shareUrl = `${window.location.origin}/coupons?id=${selectedCoupon.id}`;

        // Essayer l'API Web Share (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: t('coupons.share.title'),
                    text: shareText,
                    url: shareUrl
                });
                setSuccessMessage(t('coupons.share.success'));
                setTimeout(() => setSuccessMessage(null), 3000);
            } catch (err) {
                // Utilisateur a annulé
                if ((err as Error).name !== 'AbortError') {
                    console.error('Erreur partage:', err);
                }
            }
        } else {
            // Fallback: copier le lien dans le presse-papiers
            try {
                await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
                setSuccessMessage(t('coupons.share.copied'));
                setTimeout(() => setSuccessMessage(null), 3000);
            } catch (err) {
                console.error('Erreur copie:', err);
                setErrorMessage(t('coupons.share.error'));
                setTimeout(() => setErrorMessage(null), 3000);
            }
        }
    };

    const getRiskColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'low': return 'text-emerald border-emerald/20 bg-emerald/5';
            case 'medium': return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5';
            case 'high': return 'text-orange-500 border-orange-500/20 bg-orange-500/5';
            case 'extreme': return 'text-red-500 border-red-500/20 bg-red-500/5';
            default: return 'text-gray-500 border-white/10 bg-white/5';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 max-w-6xl mx-auto pb-20 relative"
        >
            {/* Notifications */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed top-24 right-8 z-[100] glass-emerald p-4 rounded-2xl border-emerald/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                    >
                        <p className="text-emerald font-black flex items-center space-x-3 text-sm tracking-wide">
                            <CheckCircle2 size={18} />
                            <span>{successMessage}</span>
                        </p>
                    </motion.div>
                )}

                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed top-24 right-8 z-[100] glass p-4 rounded-2xl border-red-500/50 bg-red-500/10"
                    >
                        <p className="text-red-400 font-black flex items-center space-x-3 text-sm tracking-wide">
                            <XCircle size={18} />
                            <span>{errorMessage}</span>
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {!selectedCoupon ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{t('coupons.list.title')}</h2>
                                    {refreshing && (
                                        <div className="flex items-center gap-2 text-emerald text-xs font-black uppercase tracking-widest bg-emerald/10 px-3 py-1 rounded-full">
                                            <Activity size={12} className="animate-spin" />
                                            <span>{t('common.refreshing')}</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">{t('coupons.create.subtitle')}</p>
                            </div>

                            <button
                                onClick={() => setIsBuilderOpen(true)}
                                className="btn-primary flex items-center space-x-3 group"
                            >
                                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                                <span>{t('coupons.create.title')}</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <CouponList
                                    coupons={coupons}
                                    loading={loading}
                                    onViewCoupon={viewCouponDetail}
                                />
                            </div>

                            {/* Sidebar Stats */}
                            <div className="space-y-6">
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    className="glass p-8 rounded-[2.5rem] border-emerald/10 relative overflow-hidden group/card"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/card:opacity-10 group-hover/card:scale-125 transition-all duration-700">
                                        <Zap size={100} className="text-emerald" />
                                    </div>
                                    <h3 className="text-xs font-black text-emerald uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                        <Sparkles size={16} />
                                        {t('coupons.details.aiSuggestions')}
                                    </h3>

                                    <div className="space-y-4">
                                        {dailyCoupons.length > 0 ? (
                                            dailyCoupons.map((daily) => (
                                                <div
                                                    key={daily.id}
                                                    onClick={() => viewCouponDetail(daily.id)}
                                                    className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald/30 hover:bg-white/10 transition-all cursor-pointer group/item flex items-center justify-between"
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald bg-emerald/10 px-2 py-0.5 rounded">
                                                                {daily.coupon_type.split('_')[1]}
                                                            </span>
                                                            <span className="text-xs font-black text-white italic">{t('coupons.odds')}: {daily.total_odds}</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('coupons.probability')}: {Math.round(daily.success_probability * 100)}%</p>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-700 group-hover/item:text-emerald group-hover/item:translate-x-1 transition-all" />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10">
                                                <Loader2 size={32} className="mx-auto text-emerald/20 animate-spin mb-3" />
                                                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest italic">
                                                    {t('coupons.notifications.generatingSuggestions')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                <div className="glass p-8 rounded-[2.5rem] space-y-6 border-t-4 border-emerald">
                                    <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 flex items-center space-x-2">
                                        <PieChart size={16} className="text-emerald" />
                                        <span>{t('features.tracking.title')}</span>
                                    </h3>

                                    <div className="space-y-6">
                                        {[
                                            { label: t('dashboard.stats.successRate'), val: coupons.length > 0 ? `${Math.round((coupons.filter(c => c.status === 'won').length / coupons.length) * 100)}%` : '0%', sub: t('dashboard.stats.increase'), color: 'bg-emerald' },
                                            { label: t('coupons.confidence'), val: coupons.length > 0 ? `${(coupons.reduce((acc, c) => acc + c.success_probability, 0) / coupons.length * 10).toFixed(1)}/10` : '0/10', sub: t('coupons.details.averagePerCoupon'), color: 'bg-white' }
                                        ].map((stat) => (
                                            <div key={stat.label} className="space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</span>
                                                    <span className="text-xl font-black text-white italic">{stat.val}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: stat.val.includes('%') ? stat.val : `${parseFloat(stat.val) * 10}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className={cn("h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]", stat.color)}
                                                    />
                                                </div>
                                                <p className="text-[9px] font-black text-emerald uppercase italic tracking-tighter opacity-60">{stat.sub}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center justify-between">
                            <button
                                onClick={clearSelectedCoupon}
                                className="glass px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center space-x-3 group"
                            >
                                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                <span>{t('common.close')}</span>
                            </button>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleShareCoupon}
                                    className="glass px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/5 transition-all flex items-center space-x-3"
                                >
                                    <Share2 size={16} />
                                    <span>{t('coupons.actions.share')}</span>
                                </button>
                                <button
                                    onClick={handleReanalyzeCoupon}
                                    disabled={reanalyzing}
                                    className="glass px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-emerald hover:bg-emerald/10 transition-all border border-emerald/20 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {reanalyzing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                    <span>{reanalyzing ? t('coupons.actions.analyzing') : t('coupons.actions.reanalyze')}</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="glass-emerald p-10 rounded-[3rem] relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                                    <div className="absolute -top-20 -right-20 opacity-5 rotate-12">
                                        <Ticket size={300} className="text-emerald" />
                                    </div>

                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                                        <div className="space-y-2">
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border shadow-sm inline-block mb-3",
                                                getRiskColor(selectedCoupon.risk_level)
                                            )}>
                                                {t('coupons.risk.label')}: {t(`coupons.risk.${selectedCoupon.risk_level.toLowerCase()}`)}
                                            </span>
                                            <h3 className="text-6xl md:text-7xl font-black text-white italic tracking-tighter leading-none">
                                                {t('coupons.details.total')} <span className="text-emerald">{selectedCoupon.total_odds.toFixed(2)}</span>
                                            </h3>
                                        </div>
                                        <div className="p-6 bg-navy/40 backdrop-blur-md rounded-[2rem] border border-white/5 text-center min-w-[140px]">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('coupons.confidence')}</p>
                                            <p className="text-5xl font-black text-emerald italic leading-none">{Math.round(selectedCoupon.success_probability * 100)}%</p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-4">
                                        <h4 className="text-xs font-black text-emerald uppercase tracking-[0.2em] flex items-center space-x-3">
                                            <Zap size={16} fill="currentColor" />
                                            <span>{t('coupons.details.strategicVerdict')}</span>
                                        </h4>
                                        <p className="text-xl font-bold text-white italic leading-relaxed">
                                            "{selectedCoupon.ai_recommendation}"
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-500 ml-4">{t('coupons.selections')} ({selectedCoupon.selections.length})</h3>
                                    <div className="space-y-4">
                                        {selectedCoupon.selections.map((match: any, idx: number) => (
                                            <motion.div
                                                key={match.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="glass-card p-8 rounded-[2rem] flex items-center justify-between group hover:border-emerald/30 transition-all"
                                            >
                                                <div className="flex items-center space-x-8">
                                                    <div className="p-4 bg-navy/60 rounded-2xl border border-white/5 text-center min-w-[80px]">
                                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('coupons.odds')}</p>
                                                        <p className="text-2xl font-black text-white italic">@{isNaN(match.odds) ? '1.50' : Number(match.odds).toFixed(2)}</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h5 className="text-xl font-black text-white italic tracking-tight">
                                                            {match.home_team} <span className="text-emerald mx-2 font-medium not-italic opacity-40">vs</span> {match.away_team}
                                                        </h5>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded">
                                                                {match.selection_type}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-gray-600 uppercase">
                                                                {new Date(match.match_date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-emerald uppercase tracking-widest mb-1">{t('coupons.details.aiProbe')}</p>
                                                    <p className="text-3xl font-black text-white italic">{Math.round(match.ai_probability * 100)}%</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="glass p-8 rounded-[2.5rem] space-y-8 border-t-4 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.05)]">
                                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-orange-500 flex items-center space-x-3">
                                        <AlertTriangle size={18} />
                                        <span>{t('coupons.attention')}</span>
                                    </h3>

                                    <div className="space-y-6">
                                        {selectedCoupon.ai_analysis && (
                                            <div className="space-y-6">
                                                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{t('coupons.details.globalAnalysis')}</p>
                                                    <p className="text-sm text-gray-300 font-medium italic leading-relaxed">"{selectedCoupon.ai_analysis.detailed_analysis}"</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-navy/40 rounded-2xl border border-white/5">
                                                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">{t('coupons.details.coherence')}</p>
                                                        <p className="text-xl font-black text-emerald">{Math.round((selectedCoupon.ai_analysis.coherence_score || 0) * 100)}%</p>
                                                    </div>
                                                    <div className="p-4 bg-navy/40 rounded-2xl border border-white/5">
                                                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">{t('coupons.details.weakPoint')}</p>
                                                        <p className="text-[10px] font-black text-red-500 uppercase leading-tight truncate mt-1">
                                                            {selectedCoupon.ai_analysis.weakest_link || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            {selectedCoupon.weak_points && selectedCoupon.weak_points.length > 0 ? (
                                                selectedCoupon.weak_points.map((point: string, idx: number) => (
                                                    <div key={idx} className="p-5 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-start gap-4">
                                                        <XCircle size={16} className="text-orange-500 mt-1 flex-shrink-0" />
                                                        <p className="text-xs font-bold text-gray-400 italic leading-relaxed">"{point}"</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-6 bg-emerald/5 border border-emerald/10 rounded-2xl text-center">
                                                    <CheckCircle2 className="mx-auto text-emerald mb-3" size={24} />
                                                    <p className="text-xs text-emerald font-black uppercase tracking-widest">{t('coupons.noWeakness')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {selectedCoupon.ai_analysis?.selection_insights && (
                                        <div className="pt-4 space-y-4 border-t border-white/5">
                                            <h4 className="text-[10px] font-black text-emerald uppercase tracking-[0.2em] ml-2">{t('coupons.details.smartInsights')}</h4>
                                            <div className="space-y-3">
                                                {selectedCoupon.ai_analysis.selection_insights.map((insight: any, idx: number) => (
                                                    <div key={idx} className="p-4 bg-navy/40 rounded-2xl border border-white/5 group hover:border-emerald/20 transition-all">
                                                        <p className="text-[10px] font-black text-white uppercase italic mb-2 tracking-tight">{insight.match}</p>
                                                        <p className="text-[11px] text-gray-500 font-medium italic leading-relaxed">"{insight.insight}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="glass-emerald p-8 rounded-[2.5rem] bg-linear-to-br from-emerald/10 to-transparent border border-emerald/20 text-center"
                                >
                                    <TrendingUp className="mx-auto text-emerald mb-4" size={40} />
                                    <p className="text-xs text-gray-400 font-medium italic leading-relaxed px-4">
                                        {t('coupons.details.advice')}
                                    </p>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <CouponBuilder
                isOpen={isBuilderOpen}
                onClose={() => setIsBuilderOpen(false)}
                newSelections={newSelections}
                isCreating={isCreating}
                fixtureOdds={fixtureOdds}
                loadingOdds={loadingOdds}
                tempSelection={tempSelection}
                onTempSelectionChange={setTempSelection}
                onAddSelection={addSelection}
                onRemoveSelection={removeSelection}
                onCreateCoupon={handleCreateCoupon}
            />
        </motion.div>
    );
};
