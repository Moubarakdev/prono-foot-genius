/**
 * ChatPanel Component
 * Side panel for AI chat interaction during match analysis
 */
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, X, Clock, Send, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { cn } from '../../lib/utils';
import type { ChatMessage } from '../../types';

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    isSending: boolean;
    newMessage: string;
    onNewMessageChange: (val: string) => void;
    onSendMessage: (e?: React.FormEvent, suggestion?: string) => void;
    suggestions: string[];
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    isOpen,
    onClose,
    messages,
    isSending,
    newMessage,
    onNewMessageChange,
    onSendMessage,
    suggestions,
}) => {
    const { t } = useTranslation();
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isSending, isOpen]);

    return (
        <div className={cn(
            "fixed right-0 top-0 h-screen w-96 glass bg-navy/95 border-l border-white/10 z-50 transition-transform duration-500 shadow-2xl flex flex-col",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center space-x-3">
                    <MessageSquare className="text-emerald" size={20} />
                    <h3 className="font-black text-sm uppercase tracking-widest">{t('pricing.pro.feature2')}</h3>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                    <X size={24} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <MessageSquare size={48} />
                        <p className="text-sm font-medium px-10">{t('features.analysis.chatEmpty')}</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={cn(
                            "flex flex-col space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                            msg.role === 'user' ? "items-end" : "items-start"
                        )}>
                            <div className={cn(
                                "p-4 rounded-2xl max-w-[90%] text-sm shadow-sm transition-all",
                                msg.role === 'user'
                                    ? "bg-emerald text-navy font-bold rounded-tr-none"
                                    : "bg-white/5 text-gray-300 rounded-tl-none border border-white/10"
                            )}>
                                {msg.role === 'assistant' ? (
                                    <MarkdownRenderer content={msg.content} />
                                ) : (
                                    msg.content
                                )}
                            </div>
                            <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest flex items-center space-x-1">
                                {msg.role === 'user' ? (
                                    <><span>{t('features.analysis.you')}</span><Clock size={8} className="ml-1" /></>
                                ) : (
                                    <><span>{t('features.analysis.ai')}</span><Clock size={8} className="ml-1" /></>
                                )}
                            </span>
                        </div>
                    ))
                )}

                {isSending && (
                    <div className="flex flex-col items-start space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white/5 text-gray-400 p-4 rounded-2xl rounded-tl-none border border-white/10 flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-emerald rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-emerald rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-emerald rounded-full animate-bounce"></span>
                        </div>
                        <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">{t('features.analysis.ai')}...</span>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white/5 border-t border-white/10 space-y-4">
                {messages.length < 5 && !isSending && (
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => onSendMessage(undefined, s)}
                                className="text-[10px] font-black uppercase tracking-widest px-3 py-2 bg-white/5 hover:bg-emerald/10 hover:text-emerald border border-white/10 hover:border-emerald/30 rounded-lg transition-all text-left cursor-pointer"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={onSendMessage} className="relative">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => onNewMessageChange(e.target.value)}
                        placeholder={t('features.analysis.chatPlaceholder')}
                        className="w-full bg-navy/50 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-emerald/50 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={isSending || !newMessage.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-emerald text-navy flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:scale-100"
                    >
                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
};
