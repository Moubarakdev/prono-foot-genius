import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FixtureItemProps {
    fixture: any;
    onClick: (fixtureId: number) => void;
}

export const FixtureItem: React.FC<FixtureItemProps> = ({ fixture: f, onClick }) => {
    const { t } = useTranslation();

    return (
        <button
            onClick={() => onClick(f.fixture.id)}
            className="glass p-6 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all group cursor-pointer"
        >
            <div className="flex items-center space-x-8">
                <div className="text-center w-20">
                    <p className="text-[10px] font-black text-gray-500 uppercase">{f.league.name}</p>
                    <p className="text-xs font-black text-emerald mt-1">{new Date(f.fixture.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="text-right w-32">
                        <p className="font-black text-sm truncate">{f.teams.home.name}</p>
                    </div>
                    <div className="text-[10px] font-black opacity-30 italic">{t('analyze.vs')}</div>
                    <div className="text-left w-32">
                        <p className="font-black text-sm truncate">{f.teams.away.name}</p>
                    </div>
                </div>
            </div>
            <ChevronRight className="text-gray-700 group-hover:text-emerald transition-colors" />
        </button>
    );
};
