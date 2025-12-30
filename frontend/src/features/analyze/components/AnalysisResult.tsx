import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart2, Shield, TrendingUp, MessageSquare, ChevronRight, AlertCircle } from 'lucide-react';
import { type MatchAnalysis } from '../../../types';
import { cn } from '../../../lib/utils';

interface AnalysisResultProps {
    analysis: MatchAnalysis;
    isPremium: boolean;
    onChatOpen: () => void;
    onClose?: () => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({
    analysis,
    isPremium,
    onChatOpen,
    onClose
}) => {
    const { t } = useTranslation();

    const stats = [
        { label: 'DOM', val: `${Math.round(analysis.predictions.home * 100)}%`, color: 'from-emerald to-emerald/20' },
        { label: 'NUL', val: `${Math.round(analysis.predictions.draw * 100)}%`, color: 'from-gray-500 to-gray-500/20' },
        { label: 'EXT', val: `${Math.round(analysis.predictions.away * 100)}%`, color: 'from-cyan to-cyan/20' }
    ];

    return (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="glass p-8 rounded-3xl border-t-4 border-emerald relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <BarChart2 size={120} />
                </div>

                {/* Value Bet Badge */}
                {analysis.value_bet && analysis.value_bet.is_value && (
                    <div className="absolute top-0 left-0 bg-emerald text-navy px-4 py-1.5 rounded-br-2xl font-black text-[10px] uppercase tracking-widest animate-pulse z-10 flex items-center space-x-2">
                        <TrendingUp size={12} />
                        <span>{t('analyze.result.valueBet')}: +{analysis.value_bet.value_percentage}%</span>
                    </div>
                )}

                {/* Match Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
                    <div className="flex items-center space-x-6">
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-2xl bg-white/5 p-4 flex items-center justify-center">
                                <Shield className="text-gray-600" size={40} />
                                {/* Note: In a real app, we'd have the logo here too, passed in data or fetched */}
                            </div>
                            <p className="mt-2 font-black text-[10px] uppercase tracking-widest">{analysis.home_team}</p>
                        </div>
                        <div className="text-4xl font-black italic opacity-20">{t('analyze.vs')}</div>
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-2xl bg-white/5 p-4 flex items-center justify-center">
                                <Shield size={40} className="text-gray-600" />
                            </div>
                            <p className="mt-2 font-black text-[10px] uppercase tracking-widest text-gray-500">{analysis.away_team}</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse"></div>
                            <span className="text-xs font-black text-emerald uppercase tracking-widest">
                                {t('landing.stats.accuracy')}: {Math.round(analysis.confidence_score * 100)}%
                            </span>
                        </div>
                        <div className="text-5xl font-black text-white italic">
                            {t('features.analysis.prognostic')}: {analysis.predicted_outcome}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Summary & News */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center space-x-2">
                            <TrendingUp className="text-emerald" size={20} />
                            <span>{t('features.analysis.title')}</span>
                        </h3>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            {analysis.summary}
                        </p>

                        {/* Scenarios - NEW feature integration */}
                        {analysis.scenarios && analysis.scenarios.length > 0 && (
                            <div className="mt-6 space-y-3">
                                <h4 className="text-xs font-black text-emerald uppercase tracking-widest">{t('analyze.result.scenarios')}</h4>
                                <div className="space-y-2">
                                    {analysis.scenarios.map((scenario, idx) => (
                                        <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-white">{scenario.name}</span>
                                                <span className="text-emerald font-black uppercase tracking-tighter">{Math.round(scenario.probability * 100)}%</span>
                                            </div>
                                            <p className="text-gray-500 italic">{scenario.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Key Factors & Predictions */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-2">
                            {stats.map((stat) => (
                                <div key={stat.label} className="glass p-4 rounded-xl text-center space-y-1">
                                    <p className="text-[10px] font-black text-gray-500">{stat.label}</p>
                                    <p className="text-lg font-black text-white">{stat.val}</p>
                                    <div className={`h-1 w-full bg-gradient-to-r ${stat.color} rounded-full`}></div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">{t('features.analysis.keyFactors')}</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {analysis.key_factors.map((factor, idx) => (
                                    <div key={idx} className="flex items-start space-x-2 text-xs text-gray-400">
                                        <ChevronRight size={14} className="text-emerald shrink-0" />
                                        <span>{factor}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Value Bet Card */}
                        {analysis.value_bet && (
                            <div className={cn(
                                "p-5 rounded-2xl border-2 transition-all shadow-lg",
                                analysis.value_bet.is_value
                                    ? "bg-emerald/10 border-emerald/30 animate-in slide-in-from-right duration-500"
                                    : "bg-white/5 border-white/5 opacity-80"
                            )}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <TrendingUp size={18} className={analysis.value_bet.is_value ? "text-emerald" : "text-gray-500"} />
                                        <span className="text-[11px] font-black uppercase tracking-widest text-white">{t('analyze.result.valueAnalysis')}</span>
                                    </div>
                                    {analysis.value_bet.is_value && (
                                        <div className="flex items-center space-x-1 px-2 py-1 bg-emerald/20 text-emerald text-[8px] font-black rounded border border-emerald/30 uppercase tracking-tighter">
                                            <AlertCircle size={10} />
                                            <span>{t('analyze.result.rareOpportunity')}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-500 uppercase mb-1">{t('analyze.result.bestOutcome')}</p>
                                        <p className="text-base font-black text-white italic">
                                            {analysis.value_bet.outcome === '1' ? t('analyze.result.home') : analysis.value_bet.outcome === '2' ? t('analyze.result.away') : t('analyze.result.draw')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-500 uppercase mb-1">{t('analyze.result.currentOdds')}</p>
                                        <p className="text-xl font-black text-white italic tracking-tighter">
                                            {isNaN(analysis.value_bet.market_odds) ? 'N/A' : analysis.value_bet.market_odds.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-gray-400 block uppercase">{t('analyze.result.expectedValue')}</span>
                                        <span className="text-[10px] text-gray-600">{t('analyze.result.basedOnProba')}</span>
                                    </div>
                                    <div className={cn(
                                        "text-2xl font-black italic tracking-tighter",
                                        analysis.value_bet.value_percentage > 0 ? "text-emerald shadow-emerald/20 drop-shadow-sm" : "text-red-500"
                                    )}>
                                        {analysis.value_bet.value_percentage > 0 ? '+' : ''}{analysis.value_bet.value_percentage}%
                                    </div>
                                </div>

                                {analysis.value_bet.is_value && (
                                    <div className="mt-3 p-2 rounded-lg bg-emerald/5 border border-emerald/10 text-[10px] text-emerald/80 italic text-center">
                                        {t('analyze.result.mathematicalAdvantage')}
                                    </div>
                                )}
                            </div>
                        )}
                        {isPremium && (
                            <button
                                onClick={onChatOpen}
                                className="w-full btn-secondary py-3 flex items-center justify-center space-x-2 uppercase font-black text-xs tracking-widest mt-4 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <MessageSquare size={16} />
                                <span>{t('pricing.pro.feature2')}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest flex items-center space-x-2 cursor-pointer"
                >
                    <span>← {t('common.cancel')}</span>
                </button>
            )}
        </div>
    );
};
