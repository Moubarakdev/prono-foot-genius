import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
    return (
        <div className={cn("prose prose-invert max-w-none text-sm leading-relaxed", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="text-white font-black">{children}</strong>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-4 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-4 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="marker:text-emerald">{children}</li>,
                    table: ({ children }) => (
                        <div className="overflow-x-auto mb-4 rounded-lg border border-white/10 bg-white/5">
                            <table className="w-full text-left border-collapse">{children}</table>
                        </div>
                    ),
                    thead: ({ children }) => <thead className="bg-white/10">{children}</thead>,
                    th: ({ children }) => <th className="p-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-white/10">{children}</th>,
                    td: ({ children }) => <td className="p-2 text-[10px] border-b border-white/5">{children}</td>,
                    h1: ({ children }) => <h1 className="text-lg font-black uppercase italic mb-4 text-emerald">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-black uppercase italic mb-3 text-emerald/80">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-black uppercase italic mb-2 text-emerald/60">{children}</h3>,
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-emerald/30 pl-4 py-1 italic text-gray-400 mb-4 bg-emerald/5 rounded-r-lg">
                            {children}
                        </blockquote>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
