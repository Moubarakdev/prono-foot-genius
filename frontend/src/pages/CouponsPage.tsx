import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket, Loader2, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Plus, PieChart, Activity, Zap, Sparkles, RefreshCw } from 'lucide-react';
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
                    <div className="lg:col-span-2 space-y-4">
                        <CouponList
                            coupons={coupons}
                            loading={loading}
                            onViewCoupon={viewCouponDetail}
                        />
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
                            onClick={clearSelectedCoupon}
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
        </div>
    );
};
