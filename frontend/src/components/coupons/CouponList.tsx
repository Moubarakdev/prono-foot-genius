/**
 * CouponList Component
 * Displays a list of coupons with loading and empty states
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Ticket } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { CouponCard } from './CouponCard';
import type { CouponListItem } from '../../types';

interface CouponListProps {
    coupons: CouponListItem[];
    loading: boolean;
    onViewCoupon: (id: string) => void;
}

export const CouponList: React.FC<CouponListProps> = ({ coupons, loading, onViewCoupon }) => {
    const { t } = useTranslation();

    if (loading && coupons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl">
                <Loader2 className="animate-spin text-emerald mb-4" size={40} />
                <p className="text-gray-500 font-bold">{t('common.loading')}</p>
            </div>
        );
    }

    if (coupons.length === 0) {
        return (
            <div className="text-center py-20 glass rounded-3xl border-dashed border-2 border-white/5">
                <Ticket size={64} className="mx-auto text-gray-700 mb-6" />
                <h3 className="text-xl font-bold text-gray-500 uppercase">{t('coupons.list.empty')}</h3>
                <p className="text-gray-600 mt-2">{t('coupons.builder.empty')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <AnimatePresence mode="popLayout">
                {coupons.map((coupon) => (
                    <CouponCard
                        key={coupon.id}
                        coupon={coupon}
                        onClick={() => onViewCoupon(coupon.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};
