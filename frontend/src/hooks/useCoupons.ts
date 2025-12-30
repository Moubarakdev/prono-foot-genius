/**
 * useCoupons Hook
 * Manages coupon state and operations
 */
import { useState, useEffect, useCallback } from 'react';
import { couponService } from '../features/coupons/services/coupon-service';
import type { Coupon, CouponListItem } from '../types';

interface UseCouponsReturn {
    coupons: CouponListItem[];
    dailyCoupons: CouponListItem[];
    loading: boolean;
    refreshing: boolean;
    selectedCoupon: Coupon | null;
    successMessage: string | null;
    errorMessage: string | null;
    loadCoupons: (silent?: boolean) => Promise<void>;
    loadDailyCoupons: () => Promise<void>;
    viewCouponDetail: (id: string) => Promise<void>;
    clearSelectedCoupon: () => void;
    setSuccessMessage: (msg: string | null) => void;
    setErrorMessage: (msg: string | null) => void;
    reanalyzeCoupon: () => Promise<void>;
    reanalyzing: boolean;
}

export const useCoupons = (): UseCouponsReturn => {
    const [coupons, setCoupons] = useState<CouponListItem[]>([]);
    const [dailyCoupons, setDailyCoupons] = useState<CouponListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [reanalyzing, setReanalyzing] = useState(false);

    const loadCoupons = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const data = await couponService.listCoupons();
            setCoupons(data);
            setErrorMessage(null);
        } catch (err: any) {
            console.error('Error loading coupons:', err);
            setErrorMessage(err?.response?.data?.detail || 'Erreur de chargement des coupons');
        } finally {
            if (!silent) setLoading(false);
            else setRefreshing(false);
        }
    }, []);

    const loadDailyCoupons = useCallback(async () => {
        try {
            const data = await couponService.getDailyCoupons();
            setDailyCoupons(data);
        } catch (err: any) {
            console.error('Error loading daily coupons:', err);
            // Silencieux pour les coupons quotidiens
        }
    }, []);

    const viewCouponDetail = useCallback(async (id: string) => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const data = await couponService.getCouponById(id);
            setSelectedCoupon(data);
        } catch (err: any) {
            console.error('Error loading coupon detail:', err);
            setErrorMessage(err?.response?.data?.detail || 'Erreur de chargement du coupon');
        } finally {
            setLoading(false);
        }
    }, []);

    const clearSelectedCoupon = useCallback(() => {
        setSelectedCoupon(null);
    }, []);

    const reanalyzeCoupon = useCallback(async () => {
        if (!selectedCoupon) return;
        setReanalyzing(true);
        setErrorMessage(null);
        try {
            const updatedCoupon = await couponService.reanalyzeCoupon(selectedCoupon.id);
            setSelectedCoupon(updatedCoupon);
            setSuccessMessage('✅ Analyse IA mise à jour !');
            setTimeout(() => setSuccessMessage(null), 3000);
            loadCoupons(true);
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err?.response?.data?.detail || '❌ Erreur lors de la relance de l\'analyse');
            setTimeout(() => setErrorMessage(null), 5000);
        } finally {
            setReanalyzing(false);
        }
    }, [selectedCoupon, loadCoupons]);

    // Initial load and auto-refresh
    useEffect(() => {
        loadCoupons();
        loadDailyCoupons();

        const interval = setInterval(() => {
            loadCoupons(true);
            loadDailyCoupons();
        }, 30000);

        return () => clearInterval(interval);
    }, [loadCoupons, loadDailyCoupons]);

    return {
        coupons,
        dailyCoupons,
        loading,
        refreshing,
        selectedCoupon,
        successMessage,
        errorMessage,
        loadCoupons,
        loadDailyCoupons,
        viewCouponDetail,
        clearSelectedCoupon,
        setSuccessMessage,
        setErrorMessage,
        reanalyzeCoupon,
        reanalyzing,
    };
};
