import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { analyzeService } from '../services/analyze-service';
import { type Team } from '../../../types';
import { cn } from '../../../lib/utils';
import { useTranslation } from 'react-i18next';

interface TeamSearchInputProps {
    label?: string;
    placeholder?: string;
    selectedTeam: Team | null;
    onSelect: (team: Team | null) => void;
    className?: string;
}

export const TeamSearchInput: React.FC<TeamSearchInputProps> = ({
    label,
    placeholder,
    selectedTeam,
    onSelect,
    className
}) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Team[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Click outside handler to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced Search Logic
    useEffect(() => {
        const search = async () => {
            if (!query || query.length < 3) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const data = await analyzeService.searchTeams(query);
                setResults(data);
                setShowResults(true);
            } catch (error) {
                console.error("Team search error", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(search, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleClear = () => {
        onSelect(null);
        setQuery('');
        setResults([]);
    };

    return (
        <div className={cn("flex-1 w-full max-w-sm relative", className)} ref={containerRef}>
            {label && (
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 text-center md:text-left">
                    {label}
                </label>
            )}

            {selectedTeam ? (
                <div className="glass p-4 rounded-xl flex items-center justify-between group border border-emerald/50 animate-in zoom-in duration-300">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <img src={selectedTeam.logo} alt={selectedTeam.name} className="w-10 h-10 object-contain" />
                        <span className="font-bold whitespace-nowrap truncate">{selectedTeam.name}</span>
                    </div>
                    <button
                        onClick={handleClear}
                        className="text-gray-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                        aria-label="Clear selection"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                            onFocus={() => setShowResults(true)}
                            placeholder={placeholder || t('analyze.search.placeholder')}
                            className={cn(
                                "w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald/50 transition-all",
                                loading && "pr-10"
                            )}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald animate-spin" size={18} />}
                    </div>

                    {showResults && results.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-navy/95 glass border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald/20">
                            {results.map((team) => (
                                <button
                                    key={team.id}
                                    onClick={() => { onSelect(team); setShowResults(false); }}
                                    className="w-full text-left px-4 py-3 hover:bg-white/10 flex items-center space-x-3 transition-colors cursor-pointer"
                                >
                                    <img src={team.logo} alt={team.name} className="w-8 h-8 object-contain" />
                                    <span className="text-sm font-medium">{team.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
