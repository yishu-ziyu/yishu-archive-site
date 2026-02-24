import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Github, BookOpen } from 'lucide-react';
import { Article, Project, Paper } from '../types';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    articles: Article[];
    projects: Project[];
    papers: Paper[];
    onNavigate: (type: 'article' | 'project' | 'paper', id: string) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, articles, projects, papers, onNavigate }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    // Filter logic
    const filteredArticles = articles.filter(a => 
        a.title.toLowerCase().includes(query.toLowerCase()) || 
        a.excerpt.toLowerCase().includes(query.toLowerCase()) ||
        a.tags?.some(t => t.toLowerCase().includes(query.toLowerCase()))
    );

    const filteredProjects = projects.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) || 
        p.description.toLowerCase().includes(query.toLowerCase())
    );

    const filteredPapers = papers.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) || 
        p.abstract.toLowerCase().includes(query.toLowerCase())
    );

    const hasResults = filteredArticles.length > 0 || filteredProjects.length > 0 || filteredPapers.length > 0;

    return (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-md animate-in fade-in duration-200">
            <div className="max-w-3xl mx-auto px-6 py-20">
                <div className="relative mb-12">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-taupe" size={24} />
                    <input 
                        ref={inputRef}
                        type="text" 
                        className="w-full bg-transparent border-b-2 border-border text-3xl font-serif py-4 pl-10 pr-10 focus:outline-none focus:border-accent placeholder-taupe/30 text-text"
                        placeholder="搜索文章、项目或论文..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <button onClick={onClose} className="absolute right-0 top-1/2 -translate-y-1/2 text-taupe hover:text-text p-2">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-8 overflow-y-auto max-h-[70vh] pb-12">
                    {!query && (
                        <div className="text-center text-taupe mt-20">
                            <p className="font-serif italic text-lg">输入关键词开始搜索</p>
                        </div>
                    )}

                    {query && !hasResults && (
                        <div className="text-center text-taupe mt-20">
                            <p className="font-serif italic">未找到相关内容</p>
                        </div>
                    )}

                    {query && filteredArticles.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold tracking-[0.2em] text-taupe uppercase mb-4">文章</h3>
                            <div className="space-y-2">
                                {filteredArticles.map(article => (
                                    <div 
                                        key={article.id}
                                        onClick={() => { onNavigate('article', article.id); onClose(); }}
                                        className="flex items-start gap-4 p-4 hover:bg-hover-bg cursor-pointer rounded-lg transition-colors group"
                                    >
                                        <div className="mt-1 text-taupe group-hover:text-accent"><FileText size={20} /></div>
                                        <div>
                                            <h4 className="font-serif text-xl group-hover:text-accent transition-colors">{article.title}</h4>
                                            <p className="text-sm text-taupe line-clamp-1 mt-1">{article.excerpt}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {query && filteredProjects.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold tracking-[0.2em] text-taupe uppercase mb-4">项目</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredProjects.map(project => (
                                    <div 
                                        key={project.id}
                                        onClick={() => { onNavigate('project', project.id); onClose(); }}
                                        className="flex items-center gap-4 p-4 hover:bg-hover-bg cursor-pointer rounded-lg transition-colors group border border-transparent hover:border-border"
                                    >
                                        <div className="text-taupe group-hover:text-accent"><Github size={20} /></div>
                                        <div>
                                            <h4 className="font-serif text-lg group-hover:text-accent transition-colors">{project.title}</h4>
                                            <p className="text-xs text-taupe uppercase">Open Source</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                     {query && filteredPapers.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold tracking-[0.2em] text-taupe uppercase mb-4">研究</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredPapers.map(paper => (
                                    <div 
                                        key={paper.id}
                                        onClick={() => { onNavigate('paper', paper.id); onClose(); }}
                                        className="flex items-center gap-4 p-4 hover:bg-hover-bg cursor-pointer rounded-lg transition-colors group border border-transparent hover:border-border"
                                    >
                                         <div className="text-taupe group-hover:text-accent"><BookOpen size={20} /></div>
                                        <div>
                                            <h4 className="font-serif text-lg group-hover:text-accent transition-colors">{paper.title}</h4>
                                            <p className="text-xs text-taupe uppercase">{paper.journal}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};