import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, TrendingUp, Ticket, Crown, ArrowRight, Loader2, Zap, Brain, ShieldCheck, Sparkles, Star, Target, Activity } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { SupportedLeagues } from '../components/SupportedLeagues';

export const HomePage: React.FC = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await apiClient.get('/auth/me/stats');
                setStats(response.data);
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald/20 blur-3xl rounded-full animate-pulse"></div>
                    <Loader2 className="animate-spin text-emerald relative z-10" size={48} />
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-x-hidden -mx-4 md:-mx-8 px-4 md:px-8">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-16 pb-20"
            >
                {/* --- HERO SECTION --- */}
                <motion.section variants={itemVariants} className="relative mt-8">
                    {/* Visual Background Elements */}
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald/10 blur-[120px] rounded-full opacity-50 pointer-events-none animate-glow-pulse"></div>
                    <div className="absolute top-1/2 -right-24 w-64 h-64 bg-cyan/10 blur-[100px] rounded-full opacity-30 pointer-events-none"></div>

                    <div className="glass p-10 md:p-20 rounded-[50px] border border-white/5 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-12">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none select-none">
                            <Sparkles size={400} />
                        </div>

                        <div className="flex-1 space-y-8 relative z-10 text-center md:text-left">
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="inline-flex items-center space-x-3 bg-emerald/10 border border-emerald/20 px-5 py-2 rounded-full backdrop-blur-md"
                            >
                                <Sparkles size={14} className="text-emerald fill-current" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald leading-none">Intelligence Artificielle de Pointe</span>
                            </motion.div>

                            <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-[0.9] uppercase group">
                                Dominez le <span className="text-glow-emerald text-emerald group-hover:text-white transition-colors duration-700">Terrain</span> avec l'IA
                            </h1>

                            <p className="text-gray-400 text-lg md:text-xl font-medium max-w-xl leading-relaxed">
                                {t('dashboard.home.subtitle')} Nous analysons des milliers de données pour vous offrir le verdict final.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                                <Link to="/analyze" className="btn-primary px-10 py-5 w-full sm:w-auto flex items-center justify-center space-x-4 uppercase font-black tracking-widest text-sm shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                    <span>Lancer une Analyse</span>
                                    <ArrowRight size={18} />
                                </Link>
                                <Link to="/coupons" className="text-gray-500 hover:text-white transition-all uppercase font-black text-xs tracking-widest flex items-center space-x-3 group/link">
                                    <span>Voir mes coupons</span>
                                    <Ticket size={16} className="group-hover/link:rotate-12 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        <motion.div
                            variants={itemVariants}
                            className="hidden lg:flex flex-col items-center justify-center relative scale-110"
                        >
                            <div className="relative p-12 glass rounded-[3rem] border-white/10 shadow-2xl overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <div className="relative z-10 space-y-4 text-center">
                                    <div className="w-20 h-20 bg-emerald/20 rounded-[1.5rem] flex items-center justify-center mx-auto border border-emerald/30 group-hover:scale-110 transition-transform duration-500">
                                        <Brain size={40} className="text-emerald" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-3xl font-black italic tracking-tighter text-white">92%</p>
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Précision Moyenne</p>
                                    </div>
                                </div>
                                {/* Orbiting Elements */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-full h-full relative">
                                        <div className="absolute top-0 left-1/2 -ml-2 w-4 h-4 bg-emerald rounded-full blur-md"></div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.section>

                {/* --- STATS GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {[
                        {
                            title: t('dashboard.stats.aiAnalyses'),
                            value: stats?.total_analyses || '0',
                            subtext: t('dashboard.stats.performed'),
                            icon: TrendingUp,
                            color: 'emerald',
                            progress: stats?.total_analyses > 0 ? '100%' : '0%',
                            description: "Analyses complètes"
                        },
                        {
                            title: t('dashboard.stats.successRate'),
                            value: `${stats?.success_rate || 0}%`,
                            subtext: t('dashboard.stats.global'),
                            icon: Target,
                            color: 'cyan',
                            note: t('dashboard.stats.increase'),
                            description: "Fiabilité globale"
                        },
                        {
                            title: t('dashboard.stats.validatedCoupons'),
                            value: stats?.validated_coupons || '0',
                            subtext: t('dashboard.stats.tickets'),
                            icon: Ticket,
                            color: 'white',
                            note: t('dashboard.stats.lastGain'),
                            description: "Performances"
                        }
                    ].map((stat, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            whileHover={{ y: -5 }}
                            className="glass group p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden transition-all duration-500"
                        >
                            <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-${stat.color === 'white' ? 'white/20' : stat.color} to-transparent opacity-30`}></div>

                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-12 h-12 rounded-2xl bg-${stat.color === 'white' ? 'white/5' : stat.color + '/10'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <stat.icon size={22} className={`text-${stat.color === 'white' ? 'white/50' : stat.color}`} />
                                </div>
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">{stat.description}</span>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-baseline space-x-3">
                                    <p className="text-5xl font-black text-white italic tracking-tighter">{stat.value}</p>
                                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">{stat.subtext}</p>
                                </div>
                                {stat.progress && (
                                    <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: stat.progress }}
                                            transition={{ duration: 1.5, ease: "easeOut", delay: 1 }}
                                            className="h-full bg-emerald rounded-full"
                                        ></motion.div>
                                    </div>
                                )}
                                {stat.note && (
                                    <p className={`mt-4 text-[10px] font-black uppercase tracking-widest ${stat.color === 'cyan' ? 'text-cyan' : 'text-gray-600'}`}>
                                        {stat.note}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* --- RECENT ACTIVITY & UPGRADE --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                    <motion.div variants={itemVariants} className="glass rounded-[3rem] p-8 border border-white/5 space-y-8 min-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald">
                                    <Activity size={20} />
                                </div>
                                <h3 className="text-xl font-black italic tracking-tighter uppercase">{t('dashboard.recent.title')}</h3>
                            </div>
                            <Link to="/history" className="text-[10px] font-black text-emerald uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center gap-2 group">
                                Tout voir <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="space-y-3 flex-1">
                            {stats?.recent_analyses?.length > 0 ? (
                                stats.recent_analyses.map((analysis: any, idx: number) => (
                                    <Link to={`/analyze/${analysis.id}`} key={analysis.id}>
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 1 + (idx * 0.1) }}
                                            className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-emerald/5 hover:border-emerald/20 transition-all group overflow-hidden relative cursor-pointer"
                                        >
                                            <div className="flex items-center space-x-5 relative z-10">
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 p-2.5 flex items-center justify-center group-hover:bg-emerald/20 transition-colors">
                                                    {analysis.home_team_logo ? (
                                                        <img src={analysis.home_team_logo} className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all" alt="" />
                                                    ) : <ShieldCheck className="text-gray-700" size={24} />}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2">
                                                        <p className="font-black text-sm text-gray-300 group-hover:text-white transition-colors uppercase tracking-tight">{analysis.home_team}</p>
                                                        <span className="text-gray-700 font-bold italic text-[10px]">VS</span>
                                                        <p className="font-black text-sm text-gray-300 group-hover:text-white transition-colors uppercase tracking-tight">{analysis.away_team}</p>
                                                    </div>
                                                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">{analysis.league_name} • {new Date(analysis.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right relative z-10">
                                                <p className="text-emerald font-black italic text-lg tracking-tighter drop-shadow-sm">VERDICT {analysis.predicted_outcome}</p>
                                                <div className="flex items-center justify-end space-x-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald/40"></div>
                                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{Math.round(analysis.confidence_score * 100)}%</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-30 grayscale">
                                    <Zap size={48} className="text-gray-600" />
                                    <p className="text-sm font-black uppercase tracking-widest text-gray-600 italic">Aucun historique récent</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass rounded-[3rem] p-10 border border-white/5 flex flex-col items-center justify-center text-center space-y-8 hover:bg-white/[0.03] transition-all group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                            <Crown size={200} />
                        </div>

                        <div className="w-24 h-24 rounded-[2rem] bg-emerald/5 p-6 flex items-center justify-center text-emerald border border-emerald/10 group-hover:scale-110 group-hover:border-emerald/30 group-hover:bg-emerald/10 transition-all duration-700 relative">
                            <div className="absolute inset-0 bg-emerald/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Crown size={56} className="relative z-10 animate-glow-pulse" />
                        </div>

                        <div className="relative z-10 space-y-3">
                            <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-2">
                                <Star size={10} className="text-amber-500 fill-current" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-amber-500">Abonnement Foot Genius Premium</span>
                            </div>
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-lg">{t('dashboard.upgrade.title')}</h3>
                            <p className="text-gray-400 max-w-sm mt-4 text-sm font-medium leading-relaxed">{t('dashboard.upgrade.description')}</p>
                        </div>

                        <div className="w-full space-y-4 relative z-10">
                            <Link to="/pricing" className="btn-secondary w-full uppercase tracking-[0.3em] font-black text-xs py-6 group/btn shadow-xl flex items-center justify-center space-x-3">
                                <span>{t('dashboard.upgrade.button')}</span>
                            </Link>
                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">Accès illimité • Support Prioritaire • Analyses Exclusives</p>
                        </div>
                    </motion.div>
                </div>

                {/* --- LEAGUES FOOTER --- */}
                <motion.div variants={itemVariants} className="pt-8">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="h-[1px] flex-1 bg-white/5"></div>
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] italic">Couverture Ligue Worldwide</span>
                        <div className="h-[1px] flex-1 bg-white/5"></div>
                    </div>
                    <SupportedLeagues />
                </motion.div>
            </motion.div>
        </div>
    );
};
