import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Zap, Crown, ShieldCheck, Loader2, Sparkles, Star, CreditCard, Smartphone } from 'lucide-react';
import { subscriptionService, type PricingData } from '../features/subscription/services/subscription-service';
import { cn } from '../lib/utils';

// Pays africains supportés pour Mobile Money (Moneroo)
const AFRICAN_COUNTRIES = [
    'BJ', 'CI', 'SN', 'TG', 'ML', 'NE', 'BF', 'GW', // Afrique de l'Ouest (XOF)
    'CM', 'GA', 'CG', 'TD', 'CF', 'GQ',             // Afrique Centrale (XAF)
    'KE', 'TZ', 'UG', 'RW', 'BI',                   // Afrique de l'Est
    'GH', 'NG', 'ZA', 'MA', 'TN', 'EG'              // Autres pays africains
];

export const PricingPage: React.FC = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState<string | null>(null);
    const [pricing, setPricing] = useState<PricingData | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'moneroo'>('stripe');
    const [isAfricanCountry, setIsAfricanCountry] = useState(false);

    useEffect(() => {
        const loadPricing = async () => {
            try {
                const data = await subscriptionService.getPricing();
                setPricing(data);

                // Vérifier si le pays est en Afrique
                const isAfrican = AFRICAN_COUNTRIES.includes(data.country_code);
                setIsAfricanCountry(isAfrican);

                // Default to moneroo if in Africa for mobile money
                if (isAfrican) {
                    setPaymentMethod('moneroo');
                } else {
                    // Forcer Stripe si hors Afrique
                    setPaymentMethod('stripe');
                }
            } catch (err) {
                console.error("Failed to load pricing", err);
            }
        };
        loadPricing();
    }, []);

    const handleSubscribe = async (plan: 'starter' | 'pro' | 'lifetime') => {
        setLoading(plan);
        try {
            const { checkout_url } = await subscriptionService.createCheckoutSession({
                plan_type: plan,
                payment_method: paymentMethod,
                success_url: window.location.origin + '/dashboard?success=true',
                cancel_url: window.location.origin + '/pricing?canceled=true',
            });
            window.location.href = checkout_url;
        } catch (err) {
            console.error(err);
            setLoading(null);
        }
    };

    const plans = [
        {
            id: 'free',
            name: t('pricing.free.name'),
            price: t('pricing.free.price'),
            period: t('pricing.free.period'),
            features: [
                t('pricing.free.feature1'),
                t('pricing.free.feature2'),
                t('pricing.free.feature3'),
                'Support standard'
            ],
            icon: <Star className="text-gray-400" size={24} />,
            buttonText: t('pricing.free.cta'),
            disabled: true,
            popular: false
        },
        {
            id: 'starter',
            name: 'Starter',
            price: pricing ? `${pricing.plans.starter}${pricing.symbol}` : '10€',
            period: t('pricing.free.period'),
            features: [
                t('pricing.starter.feature1'),
                t('pricing.starter.feature2'),
                t('pricing.starter.feature3'),
                t('pricing.starter.feature4')
            ],
            icon: <Zap className="text-emerald" size={24} />,
            buttonText: t('pricing.pro.cta'),
            disabled: false,
            popular: false
        },
        {
            id: 'pro',
            name: t('pricing.pro.name'),
            price: pricing ? `${pricing.plans.pro}${pricing.symbol}` : t('pricing.pro.price'),
            period: t('pricing.pro.period'),
            features: [
                t('pricing.pro.feature1'),
                t('pricing.pro.feature2'),
                t('pricing.pro.feature3'),
                t('pricing.pro.feature4')
            ],
            icon: <Crown className="text-cyan" size={24} />,
            buttonText: t('pricing.pro.cta'),
            disabled: false,
            popular: true
        },
        {
            id: 'lifetime',
            name: t('pricing.lifetime.name'),
            price: pricing ? `${pricing.plans.lifetime}${pricing.symbol}` : t('pricing.lifetime.price'),
            period: t('pricing.lifetime.period'),
            features: [
                t('pricing.lifetime.feature1'),
                t('pricing.lifetime.feature2'),
                t('pricing.lifetime.feature3'),
                t('pricing.lifetime.feature4')
            ],
            icon: <Sparkles className="text-yellow-500" size={24} />,
            buttonText: t('pricing.lifetime.cta'),
            disabled: false,
            popular: false
        }
    ];

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 space-y-16">
            <div className="text-center space-y-4 animate-in slide-in-from-top duration-700">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald/10 border border-emerald/20 rounded-full text-emerald text-xs font-black uppercase tracking-widest mb-4">
                    <ShieldCheck size={14} />
                    <span>GARANTIE D'ANALYSES EXPERTES</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
                    {t('pricing.title')} <span className="text-emerald">Gains</span>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">
                    {t('pricing.subtitle')}
                </p>

                {/* Payment Method Selector - Only for African countries */}
                {isAfricanCountry && (
                    <div className="flex items-center justify-center mt-8">
                        <div className="glass p-1 rounded-2xl flex items-center border border-white/5">
                            <button
                                onClick={() => setPaymentMethod('stripe')}
                                className={cn(
                                    "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer",
                                    paymentMethod === 'stripe' ? "bg-white/10 text-white shadow-xl" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                <CreditCard size={14} />
                                <span>Carte / Stripe</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('moneroo')}
                                className={cn(
                                    "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer",
                                    paymentMethod === 'moneroo' ? "bg-emerald/20 text-emerald shadow-xl" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                <Smartphone size={14} />
                                <span>Mobile Money</span>
                            </button>
                        </div>
                    </div>
                )}
                {!isAfricanCountry && (
                    <div className="flex items-center justify-center mt-8 text-gray-500 text-sm">
                        <CreditCard size={16} className="mr-2" />
                        <span>{t('pricing.cardPaymentOnly')}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {plans.map((plan, index) => (
                    <div
                        key={plan.id}
                        className={cn(
                            "relative glass p-8 rounded-3xl flex flex-col border transition-all duration-500 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-8",
                            plan.popular ? "border-emerald/50 shadow-[0_0_40px_rgba(16,185,129,0.15)] bg-emerald/[0.02]" : "border-white/5",
                            plan.id === 'pro' && "bg-gradient-to-b from-cyan/5 to-transparent"
                        )}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald text-navy font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap">
                                {t('pricing.pro.badge')}
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                {plan.icon}
                            </div>
                            <div className="text-right">
                                <p className="text-4xl font-black text-white italic">{plan.price}</p>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{plan.period}</p>
                            </div>
                        </div>

                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-6">{plan.name}</h3>

                        <div className="space-y-4 flex-1">
                            {plan.features.map((feature, idx) => (
                                <div key={idx} className="flex items-start space-x-3 text-sm">
                                    <Check className="text-emerald shrink-0 mt-0.5" size={16} />
                                    <span className="text-gray-400 font-medium leading-tight">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => handleSubscribe(plan.id as any)}
                            disabled={plan.disabled || (loading !== null)}
                            className={cn(
                                "w-full py-4 mt-10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer",
                                plan.popular
                                    ? "bg-emerald text-navy hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                    : "bg-white/5 text-white hover:bg-white/10",
                                plan.disabled && "opacity-50 cursor-not-allowed grayscale"
                            )}
                        >
                            {loading === plan.id ? <Loader2 className="animate-spin mx-auto" size={18} /> : plan.buttonText}
                        </button>
                    </div>
                ))}
            </div>

            <div className="glass p-10 rounded-[3rem] text-center space-y-6 max-w-4xl mx-auto border-emerald/10 animate-in fade-in zoom-in-95 duration-700 delay-300">
                <h4 className="text-2xl font-black text-white italic uppercase">Des questions ?</h4>
                <p className="text-gray-400 font-medium px-10">
                    Notre équipe d'experts et notre support technique sont disponibles 7j/7 pour vous accompagner dans votre utilisation de Foot Genius.
                </p>
                <button className="btn-secondary px-10 py-3 uppercase font-black text-xs tracking-widest hover:border-emerald/50 cursor-pointer">
                    Contacter le Support
                </button>
            </div>
        </div>
    );
};
