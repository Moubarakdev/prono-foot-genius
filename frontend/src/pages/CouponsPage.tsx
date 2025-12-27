import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket, Loader2, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Plus, ChevronRight, PieChart, Activity, X, PlusCircle, Trash2, Send, Zap, Sparkles, RefreshCw } from 'lucide-react';
import { couponService, type ParsedOdds } from '../features/coupons/services/coupon-service';
import { TeamSearchInput } from '../components/TeamSearchInput';
import { cn } from '../lib/utils';

export const CouponsPage: React.FC = () => {
    const { t } = useTranslation();
    const [coupons, setCoupons] = useState<any[]>([]);
    const [dailyCoupons, setDailyCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [reanalyzing, setReanalyzing] = useState(false);

    // Builder State
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

    useEffect(() => {
        loadCoupons();
        loadDailyCoupons();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            loadCoupons(true); // silent refresh
            loadDailyCoupons();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const loadCoupons = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const data = await couponService.listCoupons();
            setCoupons(data);
        } catch (err) {
            console.error(err);
        } finally {
            if (!silent) setLoading(false);
            else setRefreshing(false);
        }
    };

    const loadDailyCoupons = async () => {
        try {
            const data = await couponService.getDailyCoupons();
            setDailyCoupons(data);
        } catch (err) {
            console.error(err);
        }
    };

    const viewCouponDetail = async (id: string) => {
        setLoading(true);
        try {
            const data = await couponService.getCouponById(id);
            setSelectedCoupon(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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
            setSuccessMessage('✅ Coupon créé avec succès !');
            setTimeout(() => setSuccessMessage(null), 3000);
            loadCoupons();
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err?.response?.data?.detail || '❌ Erreur lors de la création du coupon');
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
        // Reset selected teams
        setFixtureOdds(null);
    };

    const removeSelection = (idx: number) => {
        setNewSelections(newSelections.filter((_, i) => i !== idx));
    };

    const handleReanalyzeCoupon = async () => {
        if (!selectedCoupon) return;
        setReanalyzing(true);
        setErrorMessage(null);
        try {
            const updatedCoupon = await couponService.reanalyzeCoupon(selectedCoupon.id);
            setSelectedCoupon(updatedCoupon);
            setSuccessMessage('✅ Analyse IA mise à jour !');
            setTimeout(() => setSuccessMessage(null), 3000);
            loadCoupons(true); // Silent refresh to update the list
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err?.response?.data?.detail || '❌ Erreur lors de la relance de l\'analyse');
            setTimeout(() => setErrorMessage(null), 5000);
        } finally {
            setReanalyzing(false);
        }
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

    // NO DEBOUNCED SEARCH NEEDED HERE ANYMORE AS IT'S IN TeamSearchInput

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
        <div className="space-y-8 max-w-6xl mx-auto pb-20 relative">
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

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in slide-in-from-top duration-700">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">{t('coupons.list.title')}</h2>
                        {refreshing && (
                            <div className="flex items-center gap-2 text-emerald text-xs animate-pulse">
                                <Activity size={14} className="animate-spin" />
                                <span className="font-bold">{t('common.refreshing')}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-gray-400 font-medium">{t('coupons.create.subtitle')}</p>
                </div>

                <button
                    onClick={() => setIsBuilderOpen(true)}
                    className="btn-primary px-8 py-3 flex items-center space-x-2 cursor-pointer"
                >
                    <Plus size={20} />
                    <span className="font-black uppercase tracking-widest text-xs">{t('coupons.create.title')}</span>
                </button>
            </div>

            {!selectedCoupon ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
                    {/* Main List */}
                    <div className="lg:col-span-2 space-y-4">
                        {loading && coupons.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl">
                                <Loader2 className="animate-spin text-emerald mb-4" size={40} />
                                <p className="text-gray-500 font-bold">{t('common.loading')}</p>
                            </div>
                        ) : coupons.length > 0 ? (
                            coupons.map((coupon) => (
                                <div
                                    key={coupon.id}
                                    onClick={() => viewCouponDetail(coupon.id)}
                                    className="glass p-6 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group flex items-center justify-between border border-transparent hover:border-white/10"
                                >
                                    <div className="flex items-center space-x-6">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-emerald">
                                            <Ticket size={28} />
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-3">
                                                <span className="font-black text-lg text-white">{t('coupons.totalOdds')}: {coupon.total_odds}</span>
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                    getRiskColor(coupon.risk_level)
                                                )}>
                                                    {t('coupons.risk.label')}: {coupon.risk_level}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 font-black uppercase tracking-widest mt-1">
                                                {coupon.selections_count} {t('analyze.matches')} • {t('analyze.recent')} {new Date(coupon.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-8 text-right">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase">{t('coupons.confidence')}</p>
                                            <p className="text-xl font-black text-emerald italic">{Math.round(coupon.success_probability * 100)}%</p>
                                        </div>
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center border-2",
                                            coupon.status === 'won' ? "border-emerald text-emerald bg-emerald/10" :
                                                coupon.status === 'lost' ? "border-red-500 text-red-500 bg-red-500/10" :
                                                    "border-white/10 text-gray-600"
                                        )}>
                                            {coupon.status === 'won' ? <CheckCircle2 size={24} /> :
                                                coupon.status === 'lost' ? <XCircle size={24} /> :
                                                    <Activity size={20} className="animate-pulse" />}
                                        </div>
                                        <ChevronRight className="text-gray-700 group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 glass rounded-3xl border-dashed border-2 border-white/5">
                                <Ticket size={64} className="mx-auto text-gray-700 mb-6" />
                                <h3 className="text-xl font-bold text-gray-500 uppercase">{t('coupons.list.empty')}</h3>
                                <p className="text-gray-600 mt-2">{t('coupons.builder.empty')}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        <div className="glass p-8 rounded-[2.5rem] border-emerald/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <Zap size={80} className="text-emerald" />
                            </div>
                            <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2">
                                <Sparkles className="text-emerald" size={20} />
                                Suggestions IA
                            </h3>

                            <div className="space-y-4">
                                {dailyCoupons.length > 0 ? (
                                    dailyCoupons.map((daily) => (
                                        <div
                                            key={daily.id}
                                            onClick={() => viewCouponDetail(daily.id)}
                                            className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald/20 transition-all cursor-pointer group/item"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald bg-emerald/10 px-2 py-0.5 rounded">
                                                    {daily.coupon_type.split('_')[1]}
                                                </span>
                                                <span className="text-xs font-black text-white italic">{t('coupons.odds')}: {daily.total_odds}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 font-medium">{t('coupons.probability')}: {Math.round(daily.success_probability * 100)}%</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-gray-500 text-xs font-bold italic">
                                        Génération des suggestions en cours...
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="glass p-8 rounded-3xl space-y-6 border-t-4 border-emerald">
                            <h3 className="font-black text-xs uppercase tracking-widest text-gray-500 flex items-center space-x-2">
                                <PieChart size={16} className="text-emerald" />
                                <span>{t('features.tracking.title')}</span>
                            </h3>

                            <div className="space-y-4">
                                {[
                                    { label: t('dashboard.stats.successRate'), val: coupons.length > 0 ? `${Math.round((coupons.filter(c => c.status === 'won').length / coupons.length) * 100)}%` : '0%', sub: t('dashboard.stats.increase'), color: 'bg-emerald' },
                                    { label: t('coupons.confidence'), val: coupons.length > 0 ? `${(coupons.reduce((acc, c) => acc + c.success_probability, 0) / coupons.length * 10).toFixed(1)}/10` : '0/10', sub: 'Moyenne par coupon', color: 'bg-white' }
                                ].map((stat) => (
                                    <div key={stat.label} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black text-gray-500 uppercase">{stat.label}</span>
                                            <span className="text-lg font-black text-white">{stat.val}</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all duration-1000", stat.color)} style={{ width: stat.val.includes('%') ? stat.val : `${parseFloat(stat.val) * 10}%` }}></div>
                                        </div>
                                        <p className="text-[9px] font-bold text-gray-600 uppercase italic">{stat.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass p-8 rounded-3xl bg-linear-to-br from-emerald/20 to-transparent border border-emerald/10">
                            <TrendingUp className="text-emerald mb-4" size={32} />
                            <h3 className="text-lg font-black text-white italic uppercase leading-none mb-2">{t('coupons.premiumTip.title')}</h3>
                            <p className="text-xs text-gray-400 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: t('coupons.premiumTip.desc') }}>
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Detailed View */
                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setSelectedCoupon(null)}
                            className="text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest flex items-center space-x-2 cursor-pointer"
                        >
                            <span>← {t('common.close')}</span>
                        </button>

                        <button
                            onClick={handleReanalyzeCoupon}
                            disabled={reanalyzing}
                            className="glass px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-emerald hover:bg-emerald/10 transition-all border border-emerald/20 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {reanalyzing ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Analyse en cours...</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={14} />
                                    <span>🔄 Relancer l'analyse</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="glass p-8 rounded-3xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Ticket size={160} />
                                </div>

                                <div className="flex items-start justify-between mb-10">
                                    <div>
                                        <span className={cn(
                                            "px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border mb-4 inline-block",
                                            getRiskColor(selectedCoupon.risk_level)
                                        )}>
                                            {t('coupons.risk.level')}: {selectedCoupon.risk_level}
                                        </span>
                                        <h3 className="text-5xl font-black text-white italic leading-none">{t('coupons.totalOdds')}: {selectedCoupon.total_odds}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{t('coupons.confidence')}</p>
                                        <p className="text-5xl font-black text-emerald italic leading-none">{Math.round(selectedCoupon.success_probability * 100)}%</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-emerald uppercase tracking-widest flex items-center space-x-2">
                                        <AlertTriangle size={14} />
                                        <span>{t('coupons.recommendation')}</span>
                                    </h4>
                                    <p className="text-lg font-bold text-white italic leading-relaxed">
                                        "{selectedCoupon.ai_recommendation}"
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-black text-sm uppercase tracking-widest text-gray-500">{t('coupons.selections')} ({selectedCoupon.selections.length})</h3>
                                <div className="space-y-3">
                                    {selectedCoupon.selections.map((match: any) => (
                                        <div key={match.id} className="glass p-6 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-all">
                                            <div className="flex items-center space-x-6">
                                                <div className="text-center w-10">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase">{t('coupons.odds')}</p>
                                                    <p className="text-lg font-black text-white">{isNaN(match.odds) ? '1.50' : Number(match.odds).toFixed(2)}</p>
                                                </div>
                                                <div className="h-10 w-px bg-white/10"></div>
                                                <div>
                                                    <p className="text-base font-black text-white">
                                                        {match.home_team} <span className="opacity-20 italic font-medium px-2">{t('analyze.vs')}</span> {match.away_team}
                                                    </p>
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">
                                                        {match.selection_type} • {new Date(match.match_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-500 uppercase">{t('coupons.aiProba')}</p>
                                                <p className="text-lg font-black text-white">{Math.round(match.ai_probability * 100)}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="glass p-8 rounded-3xl space-y-6">
                                <h3 className="font-black text-xs uppercase tracking-widest text-orange-500 flex items-center space-x-2">
                                    <AlertTriangle size={16} />
                                    <span>{t('coupons.attention')}</span>
                                </h3>
                                <div className="space-y-4">
                                    {selectedCoupon.ai_analysis && (
                                        <div className="space-y-4">
                                            <div className="p-4 bg-emerald/5 border border-emerald/10 rounded-xl">
                                                <p className="text-[10px] font-black text-emerald uppercase tracking-widest mb-1">{t('coupons.analysis.global')}</p>
                                                <p className="text-xs text-gray-300 italic">"{selectedCoupon.ai_analysis.detailed_analysis}"</p>
                                            </div>
                                            <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cohérence</p>
                                                    <p className="text-sm font-black text-white">{Math.round((selectedCoupon.ai_analysis.coherence_score || 0) * 100)}%</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('coupons.analysis.weakLink')}</p>
                                                    <p className="text-[10px] font-bold text-red-500 uppercase max-w-[120px] truncate">{selectedCoupon.ai_analysis.weakest_link}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedCoupon.weak_points && selectedCoupon.weak_points.length > 0 ? (
                                        selectedCoupon.weak_points.map((point: string, idx: number) => (
                                            <div key={idx} className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl space-y-1">
                                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{t('coupons.riskDetected')}</p>
                                                <p className="text-xs font-bold text-gray-300 italic">"{point}"</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-500 italic">{t('coupons.noWeakness')}</p>
                                    )}
                                </div>

                                {selectedCoupon.ai_analysis?.selection_insights && (
                                    <div className="pt-4 space-y-3">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('coupons.analysis.matchInsights')}</h4>
                                        {selectedCoupon.ai_analysis.selection_insights.map((insight: any, idx: number) => (
                                            <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5">
                                                <p className="text-[10px] font-bold text-white mb-1">{insight.match}</p>
                                                <p className="text-[10px] text-gray-400 font-medium italic">"{insight.insight}"</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>

                            <div className="glass p-8 rounded-3xl space-y-4 text-center">
                                <div className="hidden"></div>
                                <button 
                                    onClick={handleShareCoupon}
                                    className="w-full btn-primary py-4 uppercase font-black text-xs tracking-widest mt-4 hover:scale-105 transition-transform"
                                >
                                    {t('coupons.share')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Coupon Builder Modal */}
            {isBuilderOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm" onClick={() => setIsBuilderOpen(false)} />

                    <div className="relative w-full max-w-4xl glass bg-navy/95 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald/10 flex items-center justify-center text-emerald">
                                    <PlusCircle size={28} />
                                </div>
                                <h3 className="text-2xl font-black text-white italic uppercase">{t('coupons.create.title')}</h3>
                            </div>
                            <button onClick={() => setIsBuilderOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={32} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Left: Add Selection Form */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">{t('coupons.builder.addMatch')}</h4>

                                <div className="space-y-4">

                                    <div className="grid grid-cols-2 gap-4">
                                        <TeamSearchInput
                                            label={t('coupons.builder.homeTeam')}
                                            value={tempSelection.home_team}
                                            onChange={(value) => setTempSelection({ ...tempSelection, home_team: value })}
                                            onTeamSelect={(team) => {
                                                setTempSelection({ ...tempSelection, home_team: team.name });
                                            }}
                                            placeholder={t('coupons.builder.homeTeamPlaceholder')}
                                        />
                                        <TeamSearchInput
                                            label={t('coupons.builder.awayTeam')}
                                            value={tempSelection.away_team}
                                            onChange={(value) => setTempSelection({ ...tempSelection, away_team: value })}
                                            onTeamSelect={(team) => {
                                                setTempSelection({ ...tempSelection, away_team: team.name });
                                            }}
                                            placeholder={t('coupons.builder.awayTeamPlaceholder')}
                                        />
                                    </div>


                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{t('coupons.builder.prediction')}</label>
                                            <select
                                                value={tempSelection.selection_type}
                                                onChange={(e) => {
                                                    const type = e.target.value;
                                                    let newOdds = tempSelection.odds;

                                                    // Auto-update odds based on selection type if we have real odds
                                                    if (fixtureOdds) {
                                                        switch (type) {
                                                            case '1': newOdds = isNaN(fixtureOdds.home) ? 1.5 : fixtureOdds.home; break;
                                                            case 'X': newOdds = isNaN(fixtureOdds.draw) ? 3.5 : fixtureOdds.draw; break;
                                                            case '2': newOdds = isNaN(fixtureOdds.away) ? 5.0 : fixtureOdds.away; break;
                                                            default: break;
                                                        }
                                                    }

                                                    setTempSelection({ ...tempSelection, selection_type: type, odds: newOdds });
                                                }}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-emerald/50"
                                            >
                                                <option value="1">
                                                    {t('coupons.builder.homeWin')} {fixtureOdds?.home ? `(${fixtureOdds.home})` : ''}
                                                </option>
                                                <option value="X">
                                                    {t('coupons.builder.draw')} {fixtureOdds?.draw ? `(${fixtureOdds.draw})` : ''}
                                                </option>
                                                <option value="2">
                                                    {t('coupons.builder.awayWin')} {fixtureOdds?.away ? `(${fixtureOdds.away})` : ''}
                                                </option>
                                                <option value="1X">1X</option>
                                                <option value="X2">X2</option>
                                                <option value="12">12</option>
                                            </select>
                                            {loadingOdds && (
                                                <p className="text-[10px] text-emerald flex items-center gap-1">
                                                    <Loader2 size={10} className="animate-spin" />
                                                    Chargement des cotes...
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{t('coupons.builder.odds')}</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={isNaN(tempSelection.odds) ? 1.5 : tempSelection.odds}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    setTempSelection({ ...tempSelection, odds: !isNaN(val) && val > 0 ? val : 1.5 });
                                                }}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-emerald/50"
                                            />
                                            {fixtureOdds && (
                                                <p className="text-[10px] text-emerald">
                                                    ✓ Cotes réelles chargées
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={addSelection}
                                        className="w-full btn-secondary py-3 uppercase font-black text-xs tracking-widest cursor-pointer"
                                    >
                                        {t('coupons.builder.addToCoupon')}
                                    </button>
                                </div>

                                <div className="p-6 bg-emerald/5 rounded-2xl border border-emerald/10">
                                    <div className="flex items-center space-x-3 text-emerald mb-2">
                                        <Zap size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{t('coupons.builder.adviceTitle')}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 italic">
                                        {t('coupons.builder.advice')}
                                    </p>
                                </div>
                            </div>

                            {/* Right: Current selection list */}
                            <div className="flex flex-col h-full space-y-6">
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest flex justify-between">
                                    <span>{t('coupons.builder.yourCoupon')}</span>
                                    <span>{newSelections.length} {t('coupons.builder.matches')}</span>
                                </h4>

                                <div className="flex-1 space-y-3 min-h-50">
                                    {newSelections.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 border border-dashed border-white/10 rounded-2xl">
                                            <Ticket size={48} className="mb-4" />
                                            <p className="text-xs font-bold px-10">{t('coupons.builder.empty')}</p>
                                        </div>
                                    ) : (
                                        newSelections.map((sel, idx) => (
                                            <div key={idx} className="glass p-4 rounded-xl flex items-center justify-between group">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-xs text-white">
                                                        {sel.selection_type}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white">{sel.home_team} {t('analyze.vs')} {sel.away_team}</p>
                                                        <p className="text-[9px] font-black text-gray-500 uppercase">{t('coupons.builder.odds')}: {isNaN(sel.odds) ? '1.50' : Number(sel.odds).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeSelection(idx)}
                                                    className="text-gray-600 hover:text-red-500 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <div className="space-y-1"></div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('coupons.totalOdds')}</p>
                                            <p className="text-2xl font-black text-white italic">
                                                {newSelections.reduce((acc, s) => {
                                                    const odds = isNaN(s.odds) ? 1.5 : s.odds;
                                                    return acc * odds;
                                                }, 1).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        disabled={newSelections.length === 0 || isCreating}
                                        onClick={handleCreateCoupon}
                                        className="w-full btn-primary py-4 flex items-center justify-center space-x-3 uppercase font-black text-xs tracking-widest cursor-pointer"
                                    >
                                        {isCreating ? <Loader2 className="animate-spin" /> : (
                                            <>
                                                <Send size={16} />
                                                <span>{t('common.save')}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
