import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Zap, BarChart3, Star, ChevronRight, Sparkles, ArrowRight, CheckCircle, Trophy, Target, Brain } from 'lucide-react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { SupportedLeagues } from '../components/SupportedLeagues';
import logo from '../assets/logo.png';

export const LandingPage: React.FC = () => {
    const { t } = useTranslation();
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-navy text-white overflow-hidden relative">
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-3 group cursor-pointer">
                        <img src={logo} alt="FootIntel" className="h-12 w-auto" />
                    </Link>
                    <nav className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-sm font-bold text-gray-400 hover:text-emerald transition-colors relative group">
                            {t('nav.features')}
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald group-hover:w-full transition-all"></span>
                        </a>
                        <a href="#pricing" className="text-sm font-bold text-gray-400 hover:text-emerald transition-colors relative group">
                            {t('nav.pricing')}
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald group-hover:w-full transition-all"></span>
                        </a>
                        <LanguageSwitcher />
                        <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
                            {t('nav.login')}
                        </Link>
                        <Link to="/register" className="btn-primary px-8 py-3 text-xs relative overflow-hidden group">
                            <span className="relative z-10">{t('nav.start')}</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan to-emerald opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-40 pb-32 px-6" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-full glass border border-emerald/30 mb-8 hover:border-emerald/60 transition-all group cursor-pointer">
                            <Sparkles className="text-emerald animate-pulse" size={20} />
                            <span className="text-sm font-black uppercase tracking-widest bg-gradient-to-r from-emerald to-cyan bg-clip-text text-transparent">
                                {t('landing.hero.badge')}
                            </span>
                            <ArrowRight className="text-emerald group-hover:translate-x-1 transition-transform" size={16} />
                        </div>

                        <h1 className="text-7xl md:text-8xl font-black italic tracking-tighter mb-8 leading-none">
                            <span className="block mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {t('landing.hero.title')}
                            </span>
                            <span className="block bg-gradient-to-r from-emerald via-cyan to-white bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 relative">
                                {t('landing.hero.subtitle')}
                                <div className="absolute -inset-4 bg-gradient-to-r from-emerald/20 to-cyan/20 blur-3xl -z-10"></div>
                            </span>
                        </h1>

                        <p className="text-2xl text-gray-300 max-w-3xl mx-auto mb-16 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                            {t('landing.hero.description')}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                            <Link to="/register" className="btn-primary px-12 py-5 text-base w-full sm:w-auto group relative overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]">
                                <span className="relative z-10 flex items-center justify-center space-x-2">
                                    <span>{t('landing.hero.cta.trial')}</span>
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald via-cyan to-emerald bg-[length:200%_100%] animate-[shimmer_3s_infinite]"></div>
                            </Link>
                            <a href="#features" className="btn-secondary px-12 py-5 text-base w-full sm:w-auto group">
                                <span className="flex items-center justify-center space-x-2">
                                    <span>{t('landing.hero.cta.discover')}</span>
                                    <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                </span>
                            </a>
                        </div>

                        {/* Hero Illustration */}
                        <div className="mt-20 relative animate-in fade-in zoom-in duration-1000 delay-700">
                            <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent z-10"></div>
                            <img
                                src="/hero-illustration.png"
                                alt="AI Football Analytics"
                                className="w-full max-w-4xl mx-auto rounded-3xl shadow-2xl border border-white/10 glow-emerald opacity-90 hover:opacity-100 transition-opacity"
                            />
                        </div>
                    </div>

                    {/* Stats with animations */}
                    <div className="grid grid-cols-3 gap-8 mt-24 max-w-4xl mx-auto relative z-20">
                        {[
                            { value: '94%', label: t('landing.stats.accuracy'), icon: Target, color: 'from-emerald to-emerald/20' },
                            { value: '10K+', label: t('landing.stats.analyses'), icon: Brain, color: 'from-cyan to-cyan/20' },
                            { value: '2.4x', label: t('landing.stats.roi'), icon: Trophy, color: 'from-white to-white/20' }
                        ].map((stat, idx) => (
                            <div key={idx} className="glass p-8 rounded-3xl text-center group hover:bg-white/10 transition-all hover:scale-105 cursor-pointer border border-white/5 hover:border-white/20">
                                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="text-navy" size={32} />
                                </div>
                                <div className="text-5xl font-black bg-gradient-to-r from-emerald to-cyan bg-clip-text text-transparent italic mb-3">
                                    {stat.value}
                                </div>
                                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Trusted By */}
                    <div className="max-w-4xl mx-auto mt-12 flex items-center justify-center gap-8 opacity-90">
                        {["BetLab","PlayStat","OddsPro","SportIQ"].map((name, i) => (
                            <div key={i} className="px-6 py-3 rounded-full bg-white/5 text-gray-300 font-bold text-xs uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                                {name}
                            </div>
                        ))}
                    </div>

                    {/* How it works */}
                    <div className="mt-20 max-w-5xl mx-auto text-center">
                        <h3 className="text-3xl font-black text-white mb-6">{t('landing.how.title')}</h3>
                        <p className="text-gray-400 mx-auto mb-8 max-w-2xl">{t('landing.how.subtitle')}</p>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { icon: CheckCircle, title: t('landing.how.steps.step1.title'), desc: t('landing.how.steps.step1.desc') },
                                { icon: Target, title: t('landing.how.steps.step2.title'), desc: t('landing.how.steps.step2.desc') },
                                { icon: TrendingUp, title: t('landing.how.steps.step3.title'), desc: t('landing.how.steps.step3.desc') }
                            ].map((s, idx) => (
                                <div key={idx} className="glass p-6 rounded-2xl text-left hover:translate-y-[-6px] transition-transform cursor-pointer">
                                    <div className="w-12 h-12 rounded-lg bg-emerald/10 flex items-center justify-center mb-4 text-emerald">
                                        <s.icon size={20} />
                                    </div>
                                    <h4 className="text-lg font-black mb-2">{s.title}</h4>
                                    <p className="text-gray-400 text-sm">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 px-6 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-20">
                        <div className="inline-block px-6 py-2 rounded-full glass border border-emerald/20 mb-6">
                            <span className="text-xs font-black uppercase tracking-widest text-emerald">{t('features.badge')}</span>
                        </div>
                        <h2 className="text-6xl font-black italic tracking-tighter mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            {t('features.title')}
                        </h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            {t('features.subtitle')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: BarChart3,
                                title: t('features.analysis.title'),
                                description: t('features.analysis.desc'),
                                color: 'from-emerald to-emerald/20',
                                gradient: 'from-emerald/20 to-transparent'
                            },
                            {
                                icon: Zap,
                                title: t('features.optimization.title'),
                                description: t('features.optimization.desc'),
                                color: 'from-cyan to-cyan/20',
                                gradient: 'from-cyan/20 to-transparent'
                            },
                            {
                                icon: TrendingUp,
                                title: t('features.tracking.title'),
                                description: t('features.tracking.desc'),
                                color: 'from-white to-white/20',
                                gradient: 'from-white/20 to-transparent'
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="glass p-10 rounded-3xl hover:bg-white/5 transition-all group cursor-pointer border border-white/5 hover:border-white/20 relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${feature.gradient} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg relative z-10`}>
                                    <feature.icon className="text-navy" size={40} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-2xl font-black mb-4 group-hover:text-emerald transition-colors relative z-10">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed relative z-10">{feature.description}</p>
                                <div className="mt-6 flex items-center text-emerald font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                                    <span>{t('features.learnMore')}</span>
                                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-24 px-6 relative">
                <div className="max-w-6xl mx-auto relative z-10 text-center mb-12">
                    <h2 className="text-4xl font-black italic mb-4">{t('landing.testimonials.title')}</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">{t('landing.testimonials.desc')}</p>
                </div>
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
                    {[{
                        quote: t('landing.testimonials.items.0.quote'),
                        author: t('landing.testimonials.items.0.author')
                    },{
                        quote: t('landing.testimonials.items.1.quote'),
                        author: t('landing.testimonials.items.1.author')
                    },{
                        quote: t('landing.testimonials.items.2.quote'),
                        author: t('landing.testimonials.items.2.author')
                    }].map((item, idx) => (
                        <div key={idx} className="glass p-6 rounded-2xl hover:scale-105 transition-transform cursor-pointer border border-white/5">
                            <p className="italic text-gray-300 mb-4">"{item.quote}"</p>
                            <p className="font-bold text-sm text-white">{item.author}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Supported Leagues Section */}
            <section className="py-24 px-6 relative">
                <div className="max-w-7xl mx-auto relative z-10">
                    <SupportedLeagues />
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-32 px-6 relative">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-20">
                        <div className="inline-block px-6 py-2 rounded-full glass border border-emerald/20 mb-6">
                            <span className="text-xs font-black uppercase tracking-widest text-emerald">{t('pricing.badge')}</span>
                        </div>
                        <h2 className="text-6xl font-black italic tracking-tighter mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            {t('pricing.title')}
                        </h2>
                        <p className="text-xl text-gray-400">{t('pricing.subtitle')}</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                name: t('pricing.free.name'),
                                price: t('pricing.free.price'),
                                period: t('pricing.free.period'),
                                features: [
                                    t('pricing.free.feature1'),
                                    t('pricing.free.feature2'),
                                    t('pricing.free.feature3')
                                ],
                                cta: t('pricing.free.cta'),
                                highlighted: false
                            },
                            {
                                name: t('pricing.pro.name'),
                                price: t('pricing.pro.price'),
                                period: t('pricing.pro.period'),
                                features: [
                                    t('pricing.pro.feature1'),
                                    t('pricing.pro.feature2'),
                                    t('pricing.pro.feature3'),
                                    t('pricing.pro.feature4')
                                ],
                                cta: t('pricing.pro.cta'),
                                badge: t('pricing.pro.badge'),
                                highlighted: true
                            },
                            {
                                name: t('pricing.lifetime.name'),
                                price: t('pricing.lifetime.price'),
                                period: t('pricing.lifetime.period'),
                                features: [
                                    t('pricing.lifetime.feature1'),
                                    t('pricing.lifetime.feature2'),
                                    t('pricing.lifetime.feature3'),
                                    t('pricing.lifetime.feature4')
                                ],
                                cta: t('pricing.lifetime.cta'),
                                highlighted: false
                            }
                        ].map((plan, idx) => (
                            <div key={idx} className={`glass p-10 rounded-3xl relative group hover:scale-105 transition-all ${plan.highlighted
                                ? 'border-2 border-emerald shadow-[0_0_60px_rgba(16,185,129,0.3)]'
                                : 'border border-white/10 hover:border-white/20'
                                }`}>
                                {plan.highlighted && (
                                    <>
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-emerald to-cyan rounded-full text-navy text-xs font-black uppercase shadow-lg">
                                            {plan.badge}
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-b from-emerald/10 to-transparent rounded-3xl pointer-events-none"></div>
                                    </>
                                )}
                                <div className="text-center mb-10 relative z-10">
                                    <h3 className="text-2xl font-black mb-6 text-gray-400">{plan.name}</h3>
                                    <div className="flex items-end justify-center mb-2">
                                        <span className="text-6xl font-black italic bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                            {plan.price}
                                        </span>
                                    </div>
                                    <span className="text-gray-500 font-bold">{plan.period}</span>
                                </div>
                                <ul className="space-y-4 mb-10 relative z-10">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start">
                                            <CheckCircle className="text-emerald mr-3 shrink-0 mt-0.5" size={20} />
                                            <span className="text-gray-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to="/register"
                                    className={`block w-full text-center py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all relative z-10 group/btn ${plan.highlighted
                                        ? 'bg-gradient-to-r from-emerald to-cyan text-navy hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]'
                                        : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    <span className="flex items-center justify-center space-x-2">
                                        <span>{plan.cta}</span>
                                        <ArrowRight className="group-hover/btn:translate-x-1 transition-transform" size={16} />
                                    </span>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald/5 to-transparent"></div>
                <div className="max-w-5xl mx-auto text-center glass p-16 rounded-[3rem] bg-gradient-to-br from-emerald/20 via-transparent to-cyan/20 border border-emerald/30 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald/10 to-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Star className="text-emerald mx-auto mb-8 animate-pulse" size={64} strokeWidth={2} />
                    <h2 className="text-6xl font-black italic tracking-tighter mb-6 bg-gradient-to-r from-white via-emerald to-cyan bg-clip-text text-transparent relative z-10">
                        {t('cta.title')}
                    </h2>
                    <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto relative z-10">
                        {t('cta.description')}
                    </p>
                    <Link to="/register" className="btn-primary px-16 py-6 text-base inline-flex items-center space-x-3 group/cta relative z-10 shadow-[0_0_50px_rgba(16,185,129,0.4)] hover:shadow-[0_0_80px_rgba(16,185,129,0.6)]">
                        <span>{t('cta.button')}</span>
                        <ArrowRight className="group-hover/cta:translate-x-2 transition-transform" size={20} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center space-x-3">
                            <img src={logo} alt="FootIntel" className="h-10 w-auto" />
                        </div>
                        <p className="text-gray-500 text-sm">© 2025 FootIntel. {t('footer.rights')}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
