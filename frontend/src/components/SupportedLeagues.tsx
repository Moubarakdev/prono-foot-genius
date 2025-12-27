import React from 'react';
import { Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface League {
    id: number;
    name: string;
    country: string;
    flag: string;
}

export const SupportedLeagues: React.FC<{ variant?: 'default' | 'compact' }> = ({ variant = 'default' }) => {
    const { t } = useTranslation();
    const leagues: League[] = [
        { id: 2021, name: 'Premier League', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
        { id: 2014, name: 'La Liga', country: 'Spain', flag: '🇪🇸' },
        { id: 2002, name: 'Bundesliga', country: 'Germany', flag: '🇩🇪' },
        { id: 2019, name: 'Serie A', country: 'Italy', flag: '🇮🇹' },
        { id: 2015, name: 'Ligue 1', country: 'France', flag: '🇫🇷' },
        { id: 2003, name: 'Eredivisie', country: 'Netherlands', flag: '🇳🇱' },
        { id: 2017, name: 'Liga Portugal', country: 'Portugal', flag: '🇵🇹' },
        { id: 2001, name: 'Champions League', country: 'UEFA', flag: '⚽' },
        { id: 2146, name: 'Europa League', country: 'UEFA', flag: '⚽' },
    ];

    if (variant === 'compact') {
        return (
            <div className="flex flex-wrap items-center justify-center gap-3">
                {leagues.map((league) => (
                    <div
                        key={league.id}
                        className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full border border-white/10 hover:border-emerald/30 transition-all group"
                    >
                        <span className="text-xl">{league.flag}</span>
                        <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">
                            {league.name}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="glass rounded-3xl p-8 border border-white/5">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald/10 rounded-xl">
                    <Trophy className="text-emerald" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white italic">{t('leagues.title')}</h3>
                    <p className="text-sm text-gray-400 font-medium">{t('leagues.subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leagues.map((league) => (
                    <div
                        key={league.id}
                        className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all group cursor-pointer border border-transparent hover:border-emerald/20"
                    >
                        <span className="text-3xl">{league.flag}</span>
                        <div className="flex-1">
                            <p className="font-bold text-white group-hover:text-emerald transition-colors">
                                {league.name}
                            </p>
                            <p className="text-xs text-gray-400 font-medium">{league.country}</p>
                        </div>
                        <div className="w-2 h-2 bg-emerald rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-emerald/5 rounded-xl border border-emerald/20">
                <p className="text-xs text-emerald font-bold text-center">
                    ✨ {t('leagues.weeklyMatches')}
                </p>
            </div>
        </div>
    );
};
