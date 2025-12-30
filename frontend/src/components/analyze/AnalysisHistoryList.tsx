/**
 * AnalysisHistoryList Component
 * Displays the list of past analyses with loading and empty states
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, History, BarChart2, Calendar, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HistoryItem {
    id: string;
    home_team: string;
    away_team: string;
    match_date: string;
    created_at: string;
    predicted_outcome: string;
    was_correct?: boolean;
}

interface AnalysisHistoryListProps {
    history: HistoryItem[];
    loading: boolean;
    onViewItem: (id: string) => void;
    onNewAnalysis: () => void;
}

export const AnalysisHistoryList: React.FC<AnalysisHistoryListProps> = ({
    history,
    loading,
    onViewItem,
    onNewAnalysis,
}) => {
    const { t } = useTranslation();

    if (loading && history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="animate-spin text-emerald" size={48} />
                <p className="text-gray-500 font-bold animate-pulse">{t('common.loading')}</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-20 glass rounded-3xl border-dashed border-2 border-white/5">
                <History size={64} className="mx-auto text-gray-700 mb-6" />
                <h3 className="text-xl font-bold text-gray-500 uppercase tracking-widest">{t('coupons.list.empty')}</h3>
                <button
                    onClick={onNewAnalysis}
                    className="mt-8 btn-secondary px-8 py-3 uppercase text-xs tracking-widest cursor-pointer"
                >
                    {t('analyze.new')}
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {history.map((item) => (
                <div
                    key={item.id}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onViewItem(item.id);
                    }}
                    className="glass p-6 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/10 active:scale-[0.98]"
                >
                    <div className="flex items-center space-x-6">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-emerald transition-colors">
                            <BarChart2 size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-white group-hover:text-emerald transition-colors">
                                {item.home_team} <span className="text-gray-600 px-2 italic font-medium">{t('analyze.vs')}</span> {item.away_team}
                            </h4>
                            <div className="flex items-center space-x-4 mt-1 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                <span className="flex items-center space-x-1">
                                    <Calendar size={10} />
                                    <span>{new Date(item.match_date).toLocaleDateString()}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                    <Clock size={10} />
                                    <span>{t('analyze.recent')} {new Date(item.created_at).toLocaleDateString()}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex items-center space-x-6">
                        <div>
                            <p className="text-xs font-black text-gray-500 uppercase">Prognostic</p>
                            <p className="text-xl font-black text-white italic">{item.predicted_outcome}</p>
                        </div>
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2",
                            item.was_correct === true ? "border-emerald text-emerald bg-emerald/10" :
                                item.was_correct === false ? "border-red-500 text-red-500 bg-red-500/10" :
                                    "border-white/10 text-gray-600"
                        )}>
                            {item.was_correct === true ? '✓' : item.was_correct === false ? '✗' : '?'}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
