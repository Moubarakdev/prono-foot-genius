import React from 'react';
import { type Team } from '../../../types';

interface TeamCardProps {
    team: Team;
    onClick: (team: Team) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, onClick }) => {
    return (
        <button
            onClick={() => onClick(team)}
            className="glass p-6 rounded-2xl hover:border-emerald/50 transition-all group text-center space-y-3 cursor-pointer"
        >
            <img
                src={team.logo}
                alt={team.name}
                className="w-16 h-16 mx-auto object-contain group-hover:scale-110 transition-transform"
            />
            <p className="text-sm font-bold truncate">{team.name}</p>
        </button>
    );
};
