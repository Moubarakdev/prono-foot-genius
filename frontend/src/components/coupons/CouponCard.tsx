/**
 * CouponCard Component
 * Displays a single coupon in the list view
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket, CheckCircle2, XCircle, Activity, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CouponListItem } from '../../types';

interface CouponCardProps {
    coupon: CouponListItem;
    onClick: () => void;
}

const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
        case 'low': return 'text-emerald border-emerald/20 bg-emerald/5';
        case 'medium': return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5';
        case 'high': return 'text-orange-500 border-orange-500/20 bg-orange-500/5';
        case 'extreme': return 'text-red-500 border-red-500/20 bg-red-500/5';
        default: return 'text-gray-500 border-white/10 bg-white/5';
    }
};

export const CouponCard: React.FC<CouponCardProps> = ({ coupon, onClick }) => {
    const { t } = useTranslation();

    return (
        <div
            onClick={onClick}
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
    );
};
