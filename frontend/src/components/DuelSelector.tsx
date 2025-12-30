import React, { useState } from 'react';
import { Loader2, Swords } from 'lucide-react';
import type { Team } from '../features/analyze/services/analyze-service';
import { TeamSearchInput } from '../features/analyze/components/TeamSearchInput';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

interface DuelSelectorProps {
    onAnalyze: (teamA: Team, teamB: Team) => void;
    isLoading?: boolean;
}

export const DuelSelector: React.FC<DuelSelectorProps> = ({ onAnalyze, isLoading }) => {
    const { t } = useTranslation();
    const [teamA, setTeamA] = useState<Team | null>(null);
    const [teamB, setTeamB] = useState<Team | null>(null);

    const handleAnalyze = () => {
        if (teamA && teamB) {
            onAnalyze(teamA, teamB);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-20">
            <div className="glass p-8 rounded-3xl border border-white/5 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald to-transparent opacity-20"></div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    {/* Team A Input */}
                    <TeamSearchInput
                        label={t('analyze.homeTeam')}
                        placeholder={t('analyze.search.placeholder')}
                        selectedTeam={teamA}
                        onSelect={setTeamA}
                    />

                    {/* VS Badge */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-emerald shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            <span className="font-black italic text-lg">VS</span>
                        </div>
                    </div>

                    {/* Team B Input */}
                    <TeamSearchInput
                        label={t('analyze.awayTeam')}
                        placeholder={t('analyze.search.placeholder')}
                        selectedTeam={teamB}
                        onSelect={setTeamB}
                    />
                </div>

                {/* Confirm Button */}
                <div className="mt-10 flex flex-col items-center">
                    <button
                        onClick={handleAnalyze}
                        disabled={!teamA || !teamB || isLoading}
                        className={cn(
                            "btn-primary px-12 py-4 rounded-full flex items-center space-x-3 transition-all duration-300 transform cursor-pointer",
                            teamA && teamB ? "scale-100 opacity-100" : "scale-95 opacity-50 grayscale cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                <Swords size={20} />
                                <span className="font-black uppercase tracking-widest">
                                    {t('analyze.analyzeButton')}
                                </span>
                            </>
                        )}
                    </button>

                    {(!teamA || !teamB) && (
                        <p className="mt-4 text-[10px] text-gray-500 font-medium animate-pulse">
                            {t('analyze.duelHelper')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
