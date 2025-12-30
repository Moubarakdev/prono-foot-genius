import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { TrendingUp, Zap, BarChart3, Star, ChevronRight, Sparkles, ArrowRight, CheckCircle, Trophy, Target, Brain, ShieldCheck, Globe, Play } from 'lucide-react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { SupportedLeagues } from '../components/SupportedLeagues';
import { useAuthStore } from '../features/auth/store/auth-store';
import logo from '../assets/logo.png';

export const LandingPage: React.FC = () => {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuthStore();
    const { scrollY } = useScroll();

    const headerBlur = useTransform(scrollY, [0, 100], [0, 20]);
    const headerOpacity = useTransform(scrollY, [0, 100], [0, 0.9]);
    const heroScale = useTransform(scrollY, [0, 300], [1, 1.1]);
    const heroY = useTransform(scrollY, [0, 500], [0, 100]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen bg-[#050816] text-white overflow-hidden selection:bg-emerald selection:text-navy">
            {/* --- ANIMATED AMBIENT BACKGROUND --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald/10 blur-[150px] rounded-full animate-glow-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan/10 blur-[150px] rounded-full" style={{ animation: 'glow-pulse 8s infinite alternate-reverse' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
            </div>

            {/* --- STICKY HEADER --- */}
            <motion.header
                style={{ backdropFilter: `blur(${headerBlur}px)`, backgroundColor: `rgba(5, 8, 22, ${headerOpacity})` }}
                className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5"
            >
                <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center space-x-3">
                        <img src={logo} alt="Foot Genius" className="h-10 w-auto filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="hidden md:block text-xl font-black italic tracking-tighter uppercase">Foot <span className="text-emerald">Genius</span></span>
                    </motion.div>

                    <nav className="hidden md:flex items-center space-x-10">
                        {['features', 'pricing'].map((item) => (
                            <a key={item} href={`#${item}`} className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-emerald transition-all relative group">
                                {t(`nav.${item}`)}
                                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-emerald group-hover:w-full transition-all duration-500"></span>
                            </a>
                        ))}
                        <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
                        <LanguageSwitcher />

                        {isAuthenticated ? (
                            <Link to="/dashboard" className="btn-primary group relative px-8 py-3 overflow-hidden rounded-xl border border-emerald/50">
                                <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em]">{t('nav.dashboard')}</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald to-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </Link>
                        ) : (
                            <div className="flex items-center space-x-6">
                                <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors">
                                    {t('nav.login')}
                                </Link>
                                <Link to="/register" className="btn-primary group relative px-8 py-3 overflow-hidden rounded-xl border border-emerald/50">
                                    <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em]">{t('nav.start')}</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald to-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </Link>
                            </div>
                        )}
                    </nav>

                    <button className="md:hidden glass p-3 rounded-xl border-white/10">
                        <div className="w-6 h-[2px] bg-white mb-1.5"></div>
                        <div className="w-4 h-[2px] bg-white ml-auto"></div>
                    </button>
                </div>
            </motion.header>

            {/* --- HERO SECTION --- */}
            <motion.section
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative pt-48 pb-32 px-6 flex flex-col items-center text-center overflow-visible"
            >
                {/* Background Decor */}
                <motion.div style={{ y: heroY, scale: heroScale }} className="absolute top-40 left-1/2 -translate-x-1/2 w-full max-w-6xl aspect-video bg-emerald/5 blur-[120px] rounded-full -z-10 pointer-events-none opacity-50"></motion.div>

                <motion.div variants={itemVariants} className="inline-flex items-center space-x-3 bg-emerald/10 border border-emerald/20 px-6 py-2 rounded-full backdrop-blur-md mb-12 cursor-pointer hover:bg-emerald/20 transition-all group">
                    <Sparkles size={16} className="text-emerald animate-pulse fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald leading-none select-none">{t('landing.hero.badge')}</span>
                    <ChevronRight size={14} className="text-emerald group-hover:translate-x-1 transition-transform" />
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-6xl md:text-9xl font-black italic tracking-tighter leading-[0.85] uppercase mb-12">
                    <span className="block text-white opacity-90 drop-shadow-2xl">{t('landing.hero.title')}</span>
                    <span className="block text-glow-emerald text-emerald group relative">
                        {t('landing.hero.subtitle')}
                        <Sparkles className="absolute -top-12 -right-12 text-white/10 w-32 h-32 rotate-12 -z-10 pointer-events-none" />
                    </span>
                </motion.h1>

                <motion.p variants={itemVariants} className="text-xl md:text-2xl text-gray-400 max-w-3xl font-medium leading-relaxed mb-16 px-4">
                    {t('landing.hero.description')}
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-8 mb-24 w-full justify-center px-4">
                    <Link to="/register" className="btn-primary px-14 py-6 text-sm font-black uppercase tracking-[0.3em] w-full sm:w-auto overflow-hidden group relative shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:shadow-[0_25px_60px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center space-x-4">
                        <span className="relative z-10">{t('landing.hero.cta.trial')}</span>
                        <ArrowRight size={20} className="relative z-10 group-hover:translate-x-2 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan via-emerald to-cyan bg-[length:200%_100%] animate-[shimmer_3s_infinite] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </Link>
                    <a href="#features" className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 hover:text-white transition-all flex items-center space-x-4 group/sec">
                        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover/sec:border-emerald/50 group-hover/sec:bg-emerald/10 transition-all">
                            <Play size={16} className="text-emerald fill-current ml-1" />
                        </div>
                        <span>{t('landing.hero.cta.discover')}</span>
                    </a>
                </motion.div>

                {/* VISUAL MOCKUP SECTION */}
                <motion.div
                    variants={itemVariants}
                    className="relative w-full max-w-7xl px-4 perspective-[2000px]"
                >
                    <div className="relative glass rounded-[2rem] md:rounded-[4rem] border border-white/10 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] rotate-x-[5deg] hover:rotate-x-0 transition-transform duration-1000 group">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050816] to-transparent z-10 pointer-events-none md:block hidden"></div>
                        <img
                            src="/hero-illustration.png"
                            alt="Foot Genius Platform"
                            className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-1000 hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                            <div className="w-24 h-24 rounded-full bg-emerald/20 border border-emerald/50 flex items-center justify-center backdrop-blur-xl animate-glow-pulse cursor-pointer group/play">
                                <Play size={32} className="text-white fill-current translate-x-1 group-hover/play:scale-110 transition-transform" />
                            </div>
                        </div>
                    </div>
                    {/* Floating stats badge */}
                    <div className="absolute -top-10 -right-5 md:right-10 glass p-6 rounded-3xl border-emerald/20 shadow-2xl animate-float md:block hidden">
                        <div className="flex items-center space-x-4 mb-2">
                            <div className="w-3 h-3 rounded-full bg-emerald animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald">Live Analysis</span>
                        </div>
                        <p className="text-2xl font-black italic tracking-tighter">PREMIER LEAGUE</p>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Confidence Score: 92%</p>
                    </div>
                </motion.div>
            </motion.section>

            {/* --- TRUSTED BY SLIDER --- */}
            <section className="py-20 border-y border-white/5 relative bg-white/[0.01]">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-[9px] font-black uppercase tracking-[0.5em] text-gray-700 mb-12">{t('landing.trusted.title')}</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                        {["BETLAB", "ODDSPRO", "SPORTSENSE", "WINTIP", "DATAWIN"].map((name) => (
                            <span key={name} className="text-2xl font-black italic tracking-tighter text-white hover:text-emerald transition-colors cursor-default">{name}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FEATURES GRID --- */}
            <section id="features" className="py-40 px-6 relative">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-32">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-block px-5 py-2 rounded-full glass border border-emerald/20 mb-8"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald">{t('features.badge')}</span>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-5xl md:text-8xl font-black italic tracking-tighter mb-8 uppercase leading-tight"
                        >
                            {t('features.title')}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-xl text-gray-500 max-w-2xl mx-auto font-medium"
                        >
                            {t('features.subtitle')}
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[
                            {
                                icon: Brain,
                                title: t('features.analysis.title'),
                                desc: t('features.analysis.desc'),
                                gradient: 'from-emerald/20 to-transparent',
                                color: 'text-emerald'
                            },
                            {
                                icon: Zap,
                                title: t('features.optimization.title'),
                                desc: t('features.optimization.desc'),
                                gradient: 'from-cyan/20 to-transparent',
                                color: 'text-cyan'
                            },
                            {
                                icon: TrendingUp,
                                title: t('features.tracking.title'),
                                desc: t('features.tracking.desc'),
                                gradient: 'from-white/10 to-transparent',
                                color: 'text-white'
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="glass p-12 rounded-[3.5rem] border border-white/5 hover:bg-white/[0.03] transition-all group relative overflow-hidden flex flex-col items-start text-left"
                            >
                                <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br ${feature.gradient} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>

                                <div className={`w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-10 group-hover:border-emerald/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                    <feature.icon size={36} className={`${feature.color} opacity-80`} />
                                </div>

                                <h3 className="text-3xl font-black italic tracking-tighter mb-6 uppercase group-hover:text-white transition-colors">{feature.title}</h3>
                                <p className="text-gray-500 font-medium leading-relaxed mb-10 flex-1">{feature.desc}</p>

                                <div className="flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-emerald opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 duration-500 cursor-pointer">
                                    <span>{t('features.learnMore')}</span>
                                    <ArrowRight className="ml-3" size={16} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CORE STATS BANNER --- */}
            <section className="py-40 relative px-6">
                <div className="max-w-7xl mx-auto glass p-16 md:p-32 rounded-[5rem] border border-white/5 relative overflow-hidden text-center">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02]"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald/10 via-transparent to-cyan/10 pointer-events-none"></div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-24 relative z-10">
                        {[
                            { value: '94%', label: t('landing.stats.accuracy'), sub: t('landing.stats.accuracy.sub') },
                            { value: '1M+', label: t('landing.stats.analyses'), sub: t('landing.stats.analyses.sub') },
                            { value: '2.4x', label: t('landing.stats.roi'), sub: t('landing.stats.roi.sub') }
                        ].map((stat, idx) => (
                            <div key={idx} className="space-y-4 group">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 1, delay: idx * 0.2 }}
                                    className="text-7xl md:text-9xl font-black italic tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:text-emerald transition-colors"
                                >
                                    {stat.value}
                                </motion.div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black uppercase tracking-[0.4em] text-emerald">{stat.label}</p>
                                    <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic">{stat.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- PRICING SECTION --- */}
            <section id="pricing" className="py-40 px-6 relative bg-white/[0.01]">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-32">
                        <div className="inline-block px-5 py-2 rounded-full glass border border-emerald/20 mb-8">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald">{t('pricing.badge')}</span>
                        </div>
                        <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase mb-6">{t('pricing.title')}</h2>
                        <p className="text-xl text-gray-500 font-medium">{t('pricing.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                        {/* Example card - I'll keep the logic from before but update styling */}
                        {[
                            {
                                name: t('pricing.starter.name'),
                                price: t('pricing.starter.price'),
                                period: t('pricing.starter.period'),
                                features: [t('pricing.starter.feature1'), t('pricing.starter.feature2'), t('pricing.starter.feature3')],
                                cta: t('pricing.free.cta'),
                                highlighted: false
                            },
                            {
                                name: t('pricing.pro.name'),
                                price: t('pricing.pro.price'),
                                period: t('pricing.pro.period'),
                                features: [t('pricing.pro.feature1'), t('pricing.pro.feature2'), t('pricing.pro.feature3'), t('pricing.pro.feature4')],
                                cta: t('pricing.pro.cta'),
                                badge: t('pricing.pro.badge'),
                                highlighted: true
                            },
                            {
                                name: t('pricing.lifetime.name'),
                                price: t('pricing.lifetime.price'),
                                period: t('pricing.lifetime.period'),
                                features: [t('pricing.lifetime.feature1'), t('pricing.lifetime.feature2'), t('pricing.lifetime.feature3')],
                                cta: t('pricing.lifetime.cta'),
                                highlighted: false
                            }
                        ].map((plan, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.15 }}
                                className={`glass p-12 rounded-[4rem] relative group border ${plan.highlighted ? 'border-emerald/50 bg-emerald/5' : 'border-white/5'} overflow-hidden h-full flex flex-col translate-y-0 hover:translate-y-[-10px] transition-all duration-500`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute top-0 right-0 px-6 py-2 bg-emerald text-navy text-[9px] font-black uppercase tracking-[0.2em] rounded-bl-3xl">POPULAR</div>
                                )}
                                <div className="mb-12">
                                    <h3 className="text-xl font-black uppercase tracking-[0.3em] text-gray-500 mb-6">{plan.name}</h3>
                                    <div className="flex items-baseline space-x-2 mb-2">
                                        <span className="text-6xl font-black italic tracking-tighter text-white">{plan.price}</span>
                                        <span className="text-gray-600 font-black uppercase text-[10px] tracking-widest">{plan.period}</span>
                                    </div>
                                </div>
                                <ul className="space-y-6 mb-16 flex-1">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="flex items-center space-x-4">
                                            <div className="w-5 h-5 rounded-full bg-emerald/20 flex items-center justify-center shrink-0">
                                                <CheckCircle size={12} className="text-emerald" />
                                            </div>
                                            <span className="text-gray-400 font-medium text-sm">{f}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link to="/register" className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center space-x-4 ${plan.highlighted ? 'bg-emerald text-navy hover:shadow-[0_20px_40px_rgba(16,185,129,0.3)]' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                                    <span>{plan.cta}</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- SUPPORTED LEAGUES --- */}
            <section className="py-40 relative px-6">
                <div className="max-w-7xl mx-auto relative z-10">
                    <SupportedLeagues />
                </div>
            </section>

            {/* --- FINAL CTA SECTION --- */}
            <section className="py-60 px-6 relative overflow-visible">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    className="max-w-5xl mx-auto glass p-20 md:p-32 rounded-[5rem] border border-emerald/30 bg-gradient-to-br from-emerald/10 via-transparent to-cyan/10 relative text-center group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-emerald/5 blur-[80px] rounded-full animate-float opacity-30"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-12 pointer-events-none scale-150">
                        <img src={logo} alt="" className="w-64 h-auto" />
                    </div>

                    <Brain size={80} className="text-emerald mx-auto mb-10 group-hover:scale-110 transition-transform duration-700 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" strokeWidth={1} />
                    <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter mb-10 uppercase leading-none">
                        {t('cta.title')}
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-400 mb-16 max-w-2xl mx-auto font-medium leading-relaxed">
                        {t('cta.description')}
                    </p>
                    <Link to="/register" className="btn-primary px-16 py-7 text-sm font-black uppercase tracking-[0.4em] group/btn inline-flex items-center space-x-6 shadow-[0_30px_60px_rgba(16,185,129,0.4)]">
                        <span>{t('cta.button')}</span>
                        <ArrowRight size={24} className="group-hover/btn:translate-x-3 transition-transform duration-500" />
                    </Link>
                </motion.div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="border-t border-white/5 py-12 px-6 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex items-center space-x-4">
                        <img src={logo} alt="Foot Genius" className="h-8 w-auto grayscale group-hover:grayscale-0 transition-all opacity-50" />
                        <span className="text-sm font-black italic tracking-tighter uppercase text-gray-600">Foot Genius</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700">© 2025 FOOT GENIUS. {t('footer.rights')}</p>
                    <div className="flex space-x-10">
                        {[
                            { key: 'terms', link: '#' },
                            { key: 'privacy', link: '#' },
                            { key: 'contact', link: '#' }
                        ].map(item => (
                            <a key={item.key} href={item.link} className="text-[9px] font-black uppercase tracking-widest text-gray-700 hover:text-emerald transition-colors">{t(`footer.${item.key}`)}</a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
};
