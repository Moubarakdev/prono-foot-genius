import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Crown, 
    Calendar, 
    CreditCard, 
    AlertCircle, 
    Check, 
    Loader2,
    ExternalLink,
    XCircle
} from 'lucide-react';
import { subscriptionService, type SubscriptionStatus } from '../features/subscription/services/subscription-service';
import { useAuthStore } from '../features/auth/store/auth-store';
import { useNavigate } from 'react-router-dom';

export const SubscriptionPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            const data = await subscriptionService.getStatus();
            setStatus(data);
        } catch (err) {
            console.error('Failed to load subscription status', err);
        } finally {
            setLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        setActionLoading(true);
        try {
            const { checkout_url } = await subscriptionService.createPortalSession();
            window.location.href = checkout_url;
        } catch (err) {
            console.error('Failed to open portal', err);
            setActionLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!confirm(t('subscription.cancelConfirm'))) return;
        
        setActionLoading(true);
        try {
            await subscriptionService.cancelSubscription();
            await loadStatus();
        } catch (err) {
            console.error('Failed to cancel subscription', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpgrade = () => {
        navigate('/pricing');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-emerald" size={48} />
            </div>
        );
    }

    const planNames: Record<string, string> = {
        free: t('subscription.plans.free'),
        starter: t('subscription.plans.starter'),
        pro: t('subscription.plans.pro'),
        lifetime: t('subscription.plans.lifetime')
    };

    const planColors: Record<string, string> = {
        free: 'bg-gray-100 text-gray-700',
        starter: 'bg-emerald-100 text-emerald-700',
        pro: 'bg-cyan-100 text-cyan-700',
        lifetime: 'bg-purple-100 text-purple-700'
    };

    const currentPlan = status?.plan || 'free';
    const isActive = status?.is_active || false;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    {t('subscription.title')}
                </h1>
                <p className="text-gray-400">
                    {t('subscription.subtitle')}
                </p>
            </div>

            {/* Current Plan Card */}
            <div className="glass-card p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-emerald/20">
                            <Crown className="text-emerald" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">
                                {t('subscription.currentPlan')}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {t('subscription.planDetails')}
                            </p>
                        </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full font-medium ${planColors[currentPlan]}`}>
                        {planNames[currentPlan]}
                    </span>
                </div>

                {/* Plan Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center gap-3 p-4 bg-dark-lighter rounded-lg">
                        <Calendar className="text-emerald" size={20} />
                        <div>
                            <p className="text-sm text-gray-400">{t('subscription.status')}</p>
                            <p className="text-white font-medium">
                                {isActive ? (
                                    <span className="flex items-center gap-2">
                                        <Check size={16} className="text-emerald" />
                                        {t('subscription.active')}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <XCircle size={16} className="text-red-500" />
                                        {t('subscription.inactive')}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {status?.expires_at && (
                        <div className="flex items-center gap-3 p-4 bg-dark-lighter rounded-lg">
                            <Calendar className="text-cyan" size={20} />
                            <div>
                                <p className="text-sm text-gray-400">{t('subscription.expiresAt')}</p>
                                <p className="text-white font-medium">
                                    {new Date(status.expires_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Money Renewal Warning */}
                {status?.expires_at && currentPlan !== 'lifetime' && currentPlan !== 'free' && (
                    <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                        <div className="text-sm text-gray-300">
                            <p className="font-medium text-yellow-400 mb-1">
                                {t('subscription.renewalRequired')}
                            </p>
                            <p>{t('subscription.mobileMoneyRenewalInfo')}</p>
                        </div>
                    </div>
                )}

                {/* Usage Stats */}
                {user && (
                    <div className="mt-6 p-4 bg-dark-lighter rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">
                                {t('subscription.analysesUsed')}
                            </span>
                            <span className="text-white font-medium">
                                {user.analyses_limit === -1 
                                    ? t('subscription.unlimited') 
                                    : `${user.daily_analyses_used || 0} / ${user.analyses_limit || 0}`
                                }
                            </span>
                        </div>
                        {user.analyses_limit && user.analyses_limit > 0 && (
                            <div className="w-full bg-dark h-2 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald transition-all"
                                    style={{ 
                                        width: `${Math.min((user.daily_analyses_used || 0) / user.analyses_limit * 100, 100)}%` 
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mt-6">
                    {currentPlan === 'free' ? (
                        <button
                            onClick={handleUpgrade}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Crown size={18} />
                            {t('subscription.upgrade')}
                        </button>
                    ) : (
                        <>
                            {currentPlan !== 'lifetime' && (
                                <button
                                    onClick={handleManageSubscription}
                                    disabled={actionLoading}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {actionLoading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <CreditCard size={18} />
                                    )}
                                    {t('subscription.manage')}
                                    <ExternalLink size={14} />
                                </button>
                            )}
                            
                            {currentPlan !== 'lifetime' && currentPlan !== 'free' && (
                                <button
                                    onClick={handleCancelSubscription}
                                    disabled={actionLoading}
                                    className="btn-secondary flex items-center gap-2 text-red-500 hover:text-red-400"
                                >
                                    {actionLoading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <XCircle size={18} />
                                    )}
                                    {t('subscription.cancel')}
                                </button>
                            )}

                            <button
                                onClick={handleUpgrade}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <Crown size={18} />
                                {t('subscription.viewPlans')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Plan Features */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                    {t('subscription.yourPlanIncludes')}
                </h3>
                <div className="grid gap-3">
                    {currentPlan === 'free' && (
                        <>
                            <div className="flex items-center gap-3 text-gray-300">
                                <Check className="text-emerald" size={20} />
                                <span>{t('pricing.free.feature1')}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <Check className="text-emerald" size={20} />
                                <span>{t('pricing.free.feature2')}</span>
                            </div>
                        </>
                    )}
                    {currentPlan === 'starter' && (
                        <>
                            <div className="flex items-center gap-3 text-gray-300">
                                <Check className="text-emerald" size={20} />
                                <span>{t('pricing.starter.feature1')}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <Check className="text-emerald" size={20} />
                                <span>{t('pricing.starter.feature2')}</span>
                            </div>
                        </>
                    )}
                    {(currentPlan === 'pro' || currentPlan === 'lifetime') && (
                        <>
                            <div className="flex items-center gap-3 text-gray-300">
                                <Check className="text-emerald" size={20} />
                                <span>{t('pricing.pro.feature1')}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <Check className="text-emerald" size={20} />
                                <span>{t('pricing.pro.feature2')}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <Check className="text-emerald" size={20} />
                                <span>{t('pricing.pro.feature3')}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Info Box */}
            {currentPlan !== 'free' && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                    <div className="text-sm text-gray-300">
                        <p className="font-medium text-white mb-1">
                            {t('subscription.infoTitle')}
                        </p>
                        <p>{t('subscription.infoText')}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
