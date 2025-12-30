import React from 'react';
import { Shield, MessageSquare, Zap, Target, Brain, Activity, XCircle } from 'lucide-react';
import { type MatchAnalysis } from '../../../types';
import { cn } from '../../../lib/utils';
import { motion, type Variants } from 'framer-motion';

interface AnalysisResultProps {
    analysis: MatchAnalysis;
    isPremium: boolean;
    onChatOpen: () => void;
    onClose?: () => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({
    analysis,
    isPremium,
    onChatOpen,
    onClose
}) => {
    // Removed unused useTranslation

    const stats = [
        { label: 'DOM', val: `${Math.round(analysis.predictions.home * 100)}%`, color: 'emerald', theme: 'text-emerald' },
        { label: 'NUL', val: `${Math.round(analysis.predictions.draw * 100)}%`, color: 'gray-500', theme: 'text-gray-400' },
        { label: 'EXT', val: `${Math.round(analysis.predictions.away * 100)}%`, color: 'cyan', theme: 'text-cyan' }
    ];

    const smartStats = analysis.statistics_snapshot;

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.1 }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-10"
        >
            {/* Header / Main Result Hero Card */}
            <div className="relative group">
                {/* Background Glow */}
                <div className="absolute -inset-4 bg-emerald/10 blur-[60px] rounded-full opacity-50 animate-glow-pulse pointer-events-none"></div>

                <div className="glass p-8 md:p-12 rounded-[40px] border border-white/10 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-10 p-4 opacity-[0.03] pointer-events-none">
                        <Brain size={250} />
                    </div>

                    {/* Value Bet Badge */}
                    {analysis.value_bet && analysis.value_bet.is_value && (
                        <motion.div
                            initial={{ x: -100 }}
                            animate={{ x: 0 }}
                            className="absolute top-0 left-0 bg-emerald text-navy px-6 py-2 rounded-br-3xl font-black text-xs uppercase tracking-[0.2em] z-20 flex items-center space-x-3 shadow-lg"
                        >
                            <Zap size={16} className="fill-current" />
                            <span>Opportunité : +{analysis.value_bet.value_percentage}%</span>
                        </motion.div>
                    )}

                    {/* Close Button */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-8 text-gray-600 hover:text-white transition-colors cursor-pointer p-2 rounded-full hover:bg-white/5"
                        >
                            <XCircle size={24} />
                        </button>
                    )}

                    {/* Match Header Hero */}
                    <div className="flex flex-col items-center justify-center gap-10 mb-16 px-4">
                        <div className="flex items-center space-x-10 md:space-x-20">
                            <motion.div variants={itemVariants} className="text-center group flex flex-col items-center">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-white/5 p-6 flex items-center justify-center group-hover:bg-emerald/10 transition-all duration-500 border border-white/5 relative">
                                    <div className="absolute inset-0 bg-emerald/20 opacity-0 group-hover:opacity-100 blur-2xl rounded-full transition-opacity"></div>
                                    {analysis.home_team_logo ? (
                                        <img src={analysis.home_team_logo} alt="" className="relative w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                                    ) : (
                                        <Shield className="relative text-gray-700 group-hover:text-emerald" size={50} />
                                    )}
                                </div>
                                <p className="mt-4 font-black text-xs md:text-sm uppercase tracking-[0.2em] text-white/90 group-hover:text-emerald transition-colors">{analysis.home_team}</p>
                            </motion.div>

                            <div className="flex flex-col items-center justify-center">
                                <div className="text-5xl md:text-7xl font-black italic opacity-10 tracking-tighter mb-2">VS</div>
                                <div className="h-0.5 w-12 bg-white/10 rounded-full"></div>
                            </div>

                            <motion.div variants={itemVariants} className="text-center group flex flex-col items-center">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-white/5 p-6 flex items-center justify-center group-hover:bg-cyan/10 transition-all duration-500 border border-white/5 relative">
                                    <div className="absolute inset-0 bg-cyan/20 opacity-0 group-hover:opacity-100 blur-2xl rounded-full transition-opacity"></div>
                                    {analysis.away_team_logo ? (
                                        <img src={analysis.away_team_logo} alt="" className="relative w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]" />
                                    ) : (
                                        <Shield size={50} className="relative text-gray-700 group-hover:text-cyan" />
                                    )}
                                </div>
                                <p className="mt-4 font-black text-xs md:text-sm uppercase tracking-[0.2em] text-gray-500 group-hover:text-cyan transition-colors">{analysis.away_team}</p>
                            </motion.div>
                        </div>

                        {/* Centered Verdict */}
                        <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
                            <div className="flex items-center space-x-3 mb-4 bg-emerald/10 px-5 py-2 rounded-full border border-emerald/20 border-dashed backdrop-blur-sm">
                                <Activity size={16} className="text-emerald animate-pulse" />
                                <span className="text-xs font-black text-emerald uppercase tracking-[0.15em] leading-none">
                                    Confiance {Math.round(analysis.confidence_score * 100)}%
                                </span>
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 italic">Verdict de l'Intelligence Artificielle</span>
                            <div className="text-8xl md:text-9xl font-black text-white italic tracking-tighter text-glow-emerald leading-none relative">
                                {analysis.predicted_outcome}
                                <div className="absolute -bottom-2 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald to-transparent opacity-30"></div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                        {/* Left Column: Summary & Scenarios */}
                        <motion.div variants={itemVariants} className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-emerald uppercase tracking-[0.3em] flex items-center space-x-3">
                                    <MessageSquare size={18} className="fill-current" />
                                    <span>Synthèse Analytique</span>
                                </h3>
                                <div className="relative group">
                                    <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald/40 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p className="text-gray-300 leading-relaxed text-base font-medium pl-2 italic">
                                        "{analysis.summary}"
                                    </p>
                                </div>
                            </div>

                            {/* Scenarios - Improved */}
                            {analysis.scenarios && analysis.scenarios.length > 0 && (
                                <div className="space-y-4 pt-4">
                                    <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-6">Chemin vers la Victoire</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {analysis.scenarios.slice(0, 2).map((scenario, idx) => (
                                            <div key={idx} className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl relative overflow-hidden group hover:border-emerald/30 transition-all hover:bg-emerald/5">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="font-black text-white uppercase text-xs tracking-wider">{scenario.name}</span>
                                                    <div className="px-3 py-1 bg-emerald/10 border border-emerald/20 rounded-full">
                                                        <span className="text-emerald font-black text-[10px] tracking-tighter">{Math.round(scenario.probability * 100)}%</span>
                                                    </div>
                                                </div>
                                                <p className="text-gray-500 text-xs font-medium leading-relaxed group-hover:text-gray-300 transition-colors">{scenario.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Right Column: Probabilities & Factors */}
                        <motion.div variants={itemVariants} className="space-y-10">
                            {/* Probabilités Dynamiques */}
                            <div className="grid grid-cols-3 gap-4">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="glass group py-6 px-2 rounded-3xl text-center space-y-2 relative overflow-hidden hover:scale-[1.05] transition-all duration-500 active:scale-95">
                                        <div className={cn("absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r", `from-${stat.color} to-transparent opacity-50`)}></div>
                                        <p className="text-[10px] font-black text-gray-600 uppercase group-hover:text-gray-400 transition-colors italic tracking-widest">{stat.label}</p>
                                        <p className={cn("text-2xl md:text-3xl font-black tracking-tighter", stat.theme)}>{stat.val}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Intel Factors */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-6">Piliers de l'Analyse</h4>
                                <div className="space-y-3">
                                    {analysis.key_factors.map((factor, idx) => (
                                        <div key={idx} className="flex items-start space-x-4 text-xs text-gray-400 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:border-emerald/20 hover:bg-emerald/[0.02] transition-all group">
                                            <div className="shrink-0 w-8 h-8 bg-emerald/10 rounded-xl flex items-center justify-center group-hover:bg-emerald/20 transition-colors">
                                                <Target size={14} className="text-emerald" />
                                            </div>
                                            <span className="font-medium leading-relaxed pt-1">{factor}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Smart Insights Section (NEW) */}
            {smartStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div variants={itemVariants} className="glass p-8 rounded-[3rem] border border-white/5 space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                            <Zap size={150} className="text-emerald" />
                        </div>

                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-white text-sm uppercase tracking-[0.2em] flex items-center space-x-3">
                                <Zap className="text-emerald fill-current" size={18} />
                                <span>ADN {analysis.home_team}</span>
                            </h3>
                            <div className="px-4 py-1.5 bg-emerald/10 rounded-full border border-emerald/20">
                                <span className="text-[10px] font-black text-emerald italic uppercase tracking-widest">Dom : {Math.round(smartStats.home.home_strength * 100)}%</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Reaction Score</p>
                                <div className="flex items-center space-x-3">
                                    <span className={cn(
                                        "text-3xl font-black italic tracking-tighter",
                                        smartStats.home.reaction_score > 0 ? "text-emerald" : "text-amber-500"
                                    )}>
                                        {smartStats.home.reaction_score > 0 ? '+' : ''}{smartStats.home.reaction_score}
                                    </span>
                                    <div className="h-6 w-[1px] bg-white/10"></div>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter leading-none">Indice de<br />Caractère</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Momentum Forme</p>
                                <div className="flex items-center space-x-3">
                                    <span className="text-3xl font-black text-white italic tracking-tighter">{Math.round(smartStats.home.momentum * 100)}%</span>
                                    <div className="h-6 w-[1px] bg-white/10"></div>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter leading-none">Energie<br />Actuelle</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass p-8 rounded-[3rem] border border-white/5 space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                            <Target size={150} className="text-cyan" />
                        </div>

                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-white text-sm uppercase tracking-[0.2em] flex items-center space-x-3">
                                <Target className="text-cyan fill-current" size={18} />
                                <span>ADN {analysis.away_team}</span>
                            </h3>
                            <div className="px-4 py-1.5 bg-cyan/10 rounded-full border border-cyan/20">
                                <span className="text-[10px] font-black text-cyan italic uppercase tracking-widest">Ext : {Math.round(smartStats.away.away_strength * 100)}%</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Reaction Score</p>
                                <div className="flex items-center space-x-3">
                                    <span className={cn(
                                        "text-3xl font-black italic tracking-tighter",
                                        smartStats.away.reaction_score > 0 ? "text-cyan" : "text-amber-500"
                                    )}>
                                        {smartStats.away.reaction_score > 0 ? '+' : ''}{smartStats.away.reaction_score}
                                    </span>
                                    <div className="h-6 w-[1px] bg-white/10"></div>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter leading-none">Indice de<br />Caractère</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Momentum Forme</p>
                                <div className="flex items-center space-x-3">
                                    <span className="text-3xl font-black text-white italic tracking-tighter">{Math.round(smartStats.away.momentum * 100)}%</span>
                                    <div className="h-6 w-[1px] bg-white/10"></div>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter leading-none">Energie<br />Actuelle</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Actions */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-6">
                {isPremium && (
                    <button
                        onClick={onChatOpen}
                        className="flex-1 btn-primary py-6 flex items-center justify-center space-x-4 uppercase font-black text-sm tracking-[0.3em] cursor-pointer"
                    >
                        <MessageSquare size={20} className="fill-navy" />
                        <span>Converser avec le Coach</span>
                    </button>
                )}

                {onClose && (
                    <button
                        onClick={onClose}
                        className="md:w-64 glass py-6 flex items-center justify-center space-x-3 text-xs font-black text-gray-500 uppercase tracking-[0.25em] hover:text-white transition-all cursor-pointer rounded-3xl"
                    >
                        <XCircle size={16} />
                        <span>Archiver l'Analyse</span>
                    </button>
                )}
            </motion.div>
        </motion.div>
    );
};
