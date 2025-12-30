/**
 * CouponBuilder Component
 * Modal for creating new coupons with match selections and AI advice
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, PlusCircle, Loader2, Zap, Ticket, Trash2, Send, Sparkles, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TeamSearchInput } from '../TeamSearchInput';
import type { ParsedOdds } from '../../features/coupons/services/coupon-service';

interface CouponSelection {
    home_team: string;
    away_team: string;
    selection_type: string;
    odds: number;
    match_date: string;
    fixture_id: number;
}

interface CouponBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    newSelections: CouponSelection[];
    isCreating: boolean;
    fixtureOdds: ParsedOdds | null;
    loadingOdds: boolean;
    tempSelection: any;
    onTempSelectionChange: (selection: any) => void;
    onAddSelection: () => void;
    onRemoveSelection: (idx: number) => void;
    onCreateCoupon: () => void;
}

export const CouponBuilder: React.FC<CouponBuilderProps> = ({
    isOpen,
    onClose,
    newSelections,
    isCreating,
    fixtureOdds,
    loadingOdds,
    tempSelection,
    onTempSelectionChange,
    onAddSelection,
    onRemoveSelection,
    onCreateCoupon,
}) => {
    const { t } = useTranslation();

    const totalOdds = newSelections.reduce((acc, s) => {
        const odds = isNaN(s.odds) ? 1.5 : s.odds;
        return acc * odds;
    }, 1);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-navy/80 backdrop-blur-xl"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-5xl glass-card bg-navy/90 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] border border-white/10"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md">
                            <div className="flex items-center space-x-5">
                                <div className="w-14 h-14 rounded-2xl bg-emerald/10 flex items-center justify-center text-emerald shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                    <PlusCircle size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{t('coupons.create.title')}</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{t('coupons.create.subtitle')}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                {/* Left Column: Selection Form */}
                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-emerald uppercase tracking-[0.3em] flex items-center gap-3">
                                            <Sparkles size={14} />
                                            {t('coupons.builder.addMatch')}
                                        </h4>

                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-6">
                                                <TeamSearchInput
                                                    label={t('coupons.builder.homeTeam')}
                                                    value={tempSelection.home_team}
                                                    onChange={(value) => onTempSelectionChange({ ...tempSelection, home_team: value })}
                                                    onTeamSelect={(team) => {
                                                        onTempSelectionChange({ ...tempSelection, home_team: team.name });
                                                    }}
                                                    placeholder={t('coupons.builder.homeTeamPlaceholder')}
                                                />
                                                <TeamSearchInput
                                                    label={t('coupons.builder.awayTeam')}
                                                    value={tempSelection.away_team}
                                                    onChange={(value) => onTempSelectionChange({ ...tempSelection, away_team: value })}
                                                    onTeamSelect={(team) => {
                                                        onTempSelectionChange({ ...tempSelection, away_team: team.name });
                                                    }}
                                                    placeholder={t('coupons.builder.awayTeamPlaceholder')}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('coupons.builder.prediction')}</label>
                                                    <select
                                                        value={tempSelection.selection_type}
                                                        onChange={(e) => {
                                                            const type = e.target.value;
                                                            let newOdds = tempSelection.odds;

                                                            if (fixtureOdds) {
                                                                switch (type) {
                                                                    case '1': newOdds = isNaN(fixtureOdds.home) ? 1.5 : fixtureOdds.home; break;
                                                                    case 'X': newOdds = isNaN(fixtureOdds.draw) ? 3.5 : fixtureOdds.draw; break;
                                                                    case '2': newOdds = isNaN(fixtureOdds.away) ? 5.0 : fixtureOdds.away; break;
                                                                    default: break;
                                                                }
                                                            }

                                                            onTempSelectionChange({ ...tempSelection, selection_type: type, odds: newOdds });
                                                        }}
                                                        className="w-full bg-navy/60 border border-white/10 rounded-2xl py-4 px-5 text-white text-sm font-bold focus:outline-none focus:border-emerald/50 hover:bg-white/5 transition-all cursor-pointer appearance-none shadow-inner"
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
                                                        <option value="1X">{t('coupons.builder.doubleChance1X')}</option>
                                                        <option value="X2">{t('coupons.builder.doubleChanceX2')}</option>
                                                        <option value="12">{t('coupons.builder.doubleChance12')}</option>
                                                    </select>
                                                    {loadingOdds && (
                                                        <div className="flex items-center gap-2 px-1">
                                                            <Loader2 size={12} className="animate-spin text-emerald" />
                                                            <span className="text-[9px] text-emerald font-black uppercase tracking-widest italic">{t('common.loading')}...</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('coupons.builder.odds')}</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald font-black italic text-lg">@</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={isNaN(tempSelection.odds) ? 1.5 : tempSelection.odds}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                onTempSelectionChange({ ...tempSelection, odds: !isNaN(val) && val > 0 ? val : 1.5 });
                                                            }}
                                                            className="w-full bg-navy/60 border border-white/10 rounded-2xl py-4 pl-10 pr-5 text-white text-lg font-black italic focus:outline-none focus:border-emerald/50 shadow-inner"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={onAddSelection}
                                                className="w-full py-5 bg-linear-to-r from-emerald to-emerald/80 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_15px_30px_rgba(16,185,129,0.3)] hover:-translate-y-1 transition-all flex items-center justify-center space-x-3 group"
                                            >
                                                <PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                                                <span>{t('coupons.builder.addToCoupon')}</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-4">
                                        <div className="flex items-center space-x-3 text-emerald">
                                            <Zap size={20} fill="currentColor" />
                                            <span className="text-xs font-black uppercase tracking-[0.2em] italic">{t('coupons.builder.adviceTitle')}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 font-medium italic leading-relaxed">
                                            "{t('coupons.builder.advice')}"
                                        </p>
                                    </div>
                                </div>

                                {/* Right Column: Live Coupon Preview */}
                                <div className="flex flex-col h-full space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                            <Ticket size={14} className="text-emerald" />
                                            {t('coupons.builder.yourCoupon')}
                                        </h4>
                                        <span className="text-[9px] font-black text-white bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">{newSelections.length} {t('coupons.builder.matches')}</span>
                                    </div>

                                    <div className="flex-1 space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        <AnimatePresence mode="popLayout">
                                            {newSelections.length === 0 ? (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 0.3 }}
                                                    className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-[2.5rem]"
                                                >
                                                    <Ticket size={64} className="mb-6 text-gray-500" />
                                                    <p className="text-xs font-black uppercase text-gray-500 tracking-[0.2em] px-10 leading-loose">{t('coupons.builder.empty')}</p>
                                                </motion.div>
                                            ) : (
                                                newSelections.map((sel, idx) => (
                                                    <motion.div
                                                        key={`${sel.fixture_id}-${idx}`}
                                                        layout
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        className="glass p-6 rounded-2xl flex items-center justify-between group hover:border-emerald/30 transition-all border border-white/5"
                                                    >
                                                        <div className="flex items-center space-x-6">
                                                            <div className="w-12 h-12 rounded-xl bg-navy/60 flex items-center justify-center font-black text-lg text-emerald italic border border-white/5 shadow-inner">
                                                                {sel.selection_type}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-white italic tracking-tight">{sel.home_team} <span className="text-gray-600 not-italic mx-1 font-medium opacity-40">vs</span> {sel.away_team}</p>
                                                                <p className="text-[9px] font-black text-emerald uppercase tracking-[0.2em] mt-1 italic leading-none">{t('coupons.odds')}: @{sel.odds.toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => onRemoveSelection(idx)}
                                                            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </motion.div>
                                                ))
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="space-y-6 pt-8 border-t border-white/5 bg-white/[0.02] -mx-8 -mb-8 p-10 mt-auto">
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">{t('coupons.totalOdds')}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-5xl font-black text-white italic tracking-tighter leading-none">
                                                        {totalOdds.toFixed(2)}
                                                    </span>
                                                    <TrendingUp className="text-emerald" size={24} />
                                                </div>
                                            </div>
                                            <button
                                                disabled={newSelections.length === 0 || isCreating}
                                                onClick={onCreateCoupon}
                                                className="h-16 px-10 bg-white text-navy font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center space-x-4 shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                                {isCreating ? <Loader2 className="animate-spin" /> : (
                                                    <>
                                                        <Send size={18} />
                                                        <span>{t('common.save')}</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
