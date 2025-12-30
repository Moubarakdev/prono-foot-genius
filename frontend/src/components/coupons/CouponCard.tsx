/**
 * CouponCard Component
 * Displays a single coupon in the list view
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Ticket, CheckCircle2, XCircle, Activity, ChevronRight, Sparkles } from 'lucide-react';
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
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={onClick}
            className="glass-card p-6 rounded-[2rem] cursor-pointer group flex items-center justify-between relative overflow-hidden"
        >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald/0 via-emerald/5 to-emerald/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

            <div className="flex items-center space-x-6 relative z-10">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-emerald group-hover:scale-110 group-hover:bg-emerald/10 transition-all duration-500 shadow-inner">
                        <Ticket size={32} />
                    </div>
                    {coupon.success_probability > 0.8 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald flex items-center justify-center text-navy shadow-lg animate-bounce">
                            <Sparkles size={12} />
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                        <span className="font-black text-2xl text-white italic tracking-tighter">
                            {t('coupons.totalOdds')}: <span className="text-emerald">{coupon.total_odds.toFixed(2)}</span>
                        </span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className={cn(
                            "px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                            getRiskColor(coupon.risk_level)
                        )}>
                            {t('coupons.risk.label')}: {t(`coupons.risk.${coupon.risk_level.toLowerCase()}`)}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">
                            {coupon.selections_count} {t('coupons.builder.matches')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-8 text-right relative z-10">
                <div className="hidden sm:block">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('coupons.confidence')}</p>
                    <p className="text-2xl font-black text-white italic bg-emerald/10 px-3 py-1 rounded-xl">
                        {Math.round(coupon.success_probability * 100)}%
                    </p>
                </div>

                <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:rotate-6",
                    coupon.status === 'won' ? "border-emerald/50 text-emerald bg-emerald/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]" :
                        coupon.status === 'lost' ? "border-red-500/50 text-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]" :
                            "border-white/10 text-gray-400 bg-white/5"
                )}>
                    {coupon.status === 'won' ? <CheckCircle2 size={28} /> :
                        coupon.status === 'lost' ? <XCircle size={28} /> :
                            <Activity size={24} className="animate-pulse text-emerald" />}
                </div>

                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald group-hover:text-navy transition-all duration-300">
                    <ChevronRight size={20} />
                </div>
            </div>
        </motion.div>
    );
};
