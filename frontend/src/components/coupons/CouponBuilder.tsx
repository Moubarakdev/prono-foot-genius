/**
 * CouponBuilder Component
 * Modal for creating new coupons with match selections and AI advice
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, PlusCircle, Loader2, Zap, Ticket, Trash2, Send } from 'lucide-react';
import { TeamSearchInput } from '../TeamSearchInput';
import type { ParsedOdds, CouponSelection } from '../../types';

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

    if (!isOpen) return null;

    const totalOdds = newSelections.reduce((acc, s) => {
        const odds = isNaN(s.odds) ? 1.5 : s.odds;
        return acc * odds;
    }, 1);

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-4xl glass bg-navy/95 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald/10 flex items-center justify-center text-emerald">
                            <PlusCircle size={28} />
                        </div>
                        <h3 className="text-2xl font-black text-white italic uppercase">{t('coupons.create.title')}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{t('coupons.builder.prediction')}</label>
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
                                            onTempSelectionChange({ ...tempSelection, odds: !isNaN(val) && val > 0 ? val : 1.5 });
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
                                onClick={onAddSelection}
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
                                            onClick={() => onRemoveSelection(idx)}
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
                                <div className="space-y-1" />
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('coupons.totalOdds')}</p>
                                    <p className="text-2xl font-black text-white italic">
                                        {totalOdds.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <button
                                disabled={newSelections.length === 0 || isCreating}
                                onClick={onCreateCoupon}
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
    );
};
