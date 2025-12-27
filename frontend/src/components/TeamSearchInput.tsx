import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { cn } from '../lib/utils';

interface Team {
    id: number;
    name: string;
    logo: string;
}

interface TeamSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onTeamSelect: (team: Team) => void;
    placeholder?: string;
    label?: string;
    className?: string;
}

export const TeamSearchInput: React.FC<TeamSearchInputProps> = ({
    value,
    onChange,
    onTeamSelect,
    placeholder = "Rechercher une équipe...",
    label,
    className
}) => {
    const [searchResults, setSearchResults] = useState<Team[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const debouncedSearch = useDebounce(value, 300);

    // Search teams when debounced value changes
    useEffect(() => {
        const searchTeams = async () => {
            // Don't search if we just selected a team
            if (selectedTeam && value === selectedTeam.name) {
                return;
            }

            if (debouncedSearch.length < 2) {
                setSearchResults([]);
                setIsDropdownOpen(false);
                return;
            }

            setIsSearching(true);
            try {
                const { analyzeService } = await import('../features/analyze/services/analyze-service');
                const teams = await analyzeService.searchTeams(debouncedSearch);
                setSearchResults(teams);
                setIsDropdownOpen(teams.length > 0);
            } catch (err) {
                console.error('Team search error:', err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        searchTeams();
    }, [debouncedSearch, selectedTeam, value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTeamClick = (team: Team) => {
        setSelectedTeam(team);
        onChange(team.name);
        onTeamSelect(team);
        setIsDropdownOpen(false);
        setSearchResults([]);
    };

    const handleClear = () => {
        setSelectedTeam(null);
        onChange('');
        setSearchResults([]);
        inputRef.current?.focus();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        // Clear selected team if user is typing something different
        if (selectedTeam && newValue !== selectedTeam.name) {
            setSelectedTeam(null);
        }
    };

    return (
        <div className={cn("space-y-2 relative", className)} ref={dropdownRef}>
            {label && (
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                    {label}
                </label>
            )}

            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {isSearching ? (
                        <Loader2 size={16} className="animate-spin text-emerald" />
                    ) : selectedTeam ? (
                        <img
                            src={selectedTeam.logo}
                            alt=""
                            className="w-5 h-5 object-contain"
                        />
                    ) : (
                        <Search size={16} />
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => searchResults.length > 0 && setIsDropdownOpen(true)}
                    placeholder={placeholder}
                    className={cn(
                        "w-full bg-white/5 border rounded-xl py-3 pl-10 pr-10 text-white text-sm focus:outline-none transition-colors",
                        selectedTeam
                            ? "border-emerald/30 focus:border-emerald/50"
                            : "border-white/10 focus:border-emerald/50"
                    )}
                />

                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {isDropdownOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 glass bg-navy/95 border border-white/10 rounded-xl max-h-60 overflow-y-auto shadow-xl">
                    {searchResults.map((team) => (
                        <div
                            key={team.id}
                            onClick={() => handleTeamClick(team)}
                            className="p-3 hover:bg-white/10 cursor-pointer flex items-center space-x-3 border-b border-white/5 last:border-0 transition-colors"
                        >
                            <img
                                src={team.logo}
                                alt=""
                                className="w-7 h-7 object-contain"
                            />
                            <span className="text-sm font-bold text-white">{team.name}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Selected indicator */}
            {selectedTeam && (
                <p className="text-[10px] text-emerald flex items-center gap-1">
                    ✓ {selectedTeam.name} sélectionné
                </p>
            )}
        </div>
    );
};
