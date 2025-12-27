import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, TrendingUp, Ticket, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
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

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter">{t('dashboard.home.title')}</h2>
                    <p className="text-gray-400 font-medium">{t('dashboard.home.subtitle')}</p>
                </div>
                <div className="flex items-center space-x-2 glass px-4 py-2 rounded-xl border-emerald/20 animate-pulse">
                    <Crown size={18} className="text-emerald" />
                    <span className="text-xs font-black uppercase tracking-widest text-emerald">{t('dashboard.common.proMember')}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        title: t('dashboard.stats.aiAnalyses'),
                        value: stats?.total_analyses || '0',
                        subtext: t('dashboard.stats.performed'),
                        icon: TrendingUp,
                        color: 'emerald',
                        progress: stats?.total_analyses > 0 ? '100%' : '0%'
                    },
                    {
                        title: t('dashboard.stats.successRate'),
                        value: `${stats?.success_rate || 0}%`,
                        subtext: t('dashboard.stats.global'),
                        icon: LayoutDashboard,
                        color: 'cyan',
                        note: t('dashboard.stats.increase')
                    },
                    {
                        title: t('dashboard.stats.validatedCoupons'),
                        value: stats?.validated_coupons || '0',
                        subtext: t('dashboard.stats.tickets'),
                        icon: Ticket,
                        color: 'white',
                        note: t('dashboard.stats.lastGain')
                    }
                ].map((stat, idx) => (
                    <div key={idx} className={`glass p-8 rounded-3xl border-l-4 border-${stat.color === 'white' ? 'white/20' : stat.color} group hover:bg-white/10 transition-all hover:scale-105 duration-300`}>
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-gray-400 text-sm font-black uppercase tracking-widest">{stat.title}</p>
                            <stat.icon size={24} className={`text-${stat.color === 'white' ? 'white/50' : stat.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                        </div>
                        <div className="flex items-baseline space-x-2">
                            <p className="text-5xl font-black text-white">{stat.value}</p>
                            <p className="text-gray-500 font-bold">{stat.subtext}</p>
                        </div>
                        {stat.progress && (
                            <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald w-full rounded-full" style={{ width: stat.progress }}></div>
                            </div>
                        )}
                        {stat.note && (
                            <p className={`mt-4 text-xs font-bold ${stat.color === 'cyan' ? 'text-cyan' : 'text-gray-500'}`}>{stat.note}</p>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="glass rounded-3xl p-8 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold italic">{t('dashboard.recent.title')}</h3>
                        <Link to="/analyze" className="text-xs font-black text-emerald uppercase tracking-widest hover:underline flex items-center gap-1">
                            {t('common.viewAll')} <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {stats?.recent_analyses?.length > 0 ? (
                            stats.recent_analyses.map((analysis: any) => (
                                <div key={analysis.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-emerald/10 group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black group-hover:bg-emerald/20 group-hover:text-emerald transition-colors">
                                            {analysis.home_team[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm group-hover:text-white transition-colors">{analysis.home_team} vs {analysis.away_team}</p>
                                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{analysis.league_name} • {new Date(analysis.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-emerald font-black italic group-hover:scale-110 transition-transform">WIN {analysis.predicted_outcome}</p>
                                        <p className="text-[10px] text-gray-500 font-bold">Conf. {Math.round(analysis.confidence_score * 100)}%</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500 font-bold italic">
                                {t('dashboard.recent.empty')}
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 hover:bg-white/5 transition-colors group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div className="w-20 h-20 rounded-full bg-emerald/10 flex items-center justify-center text-emerald group-hover:scale-110 transition-transform duration-500">
                        <Crown size={48} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold italic uppercase">{t('dashboard.upgrade.title')}</h3>
                        <p className="text-gray-400 max-w-xs mt-2">{t('dashboard.upgrade.description')}</p>
                    </div>
                    <Link to="/pricing" className="btn-secondary w-full uppercase tracking-widest text-sm py-4 relative z-10 group/btn">
                        <span className="group-hover/btn:scale-105 block transition-transform">{t('dashboard.upgrade.button')}</span>
                    </Link>
                </div>
            </div>

            {/* Supported Leagues */}
            <div className="mt-8">
                <SupportedLeagues />
            </div>
        </div>
    );
};
