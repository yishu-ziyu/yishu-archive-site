import React from 'react';
import { Tag } from 'lucide-react';
import { Article } from '../types';

interface ArticleListProps {
    articles: Article[];
    onRead: (article: Article) => void;
}

export const ArticleList: React.FC<ArticleListProps> = ({ articles, onRead }) => {
    return (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="font-serif text-4xl mb-12 border-b border-text pb-6 inline-block">目录</h2>
            <div className="space-y-0">
                {articles.map((article) => (
                    <div 
                        key={article.id} 
                        onClick={() => onRead(article)}
                        className="group border-b border-border py-8 flex flex-col cursor-pointer hover:bg-hover-bg transition-colors -mx-4 px-4 rounded-sm"
                    >
                        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-3">
                            <h3 className="font-serif text-2xl group-hover:text-accent transition-colors">
                                {article.title}
                            </h3>
                            <div className="font-sans text-sm text-taupe tabular-nums shrink-0 mt-2 md:mt-0">
                                {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                            </div>
                        </div>
                        
                        <p className="text-taupe font-serif-body text-base max-w-3xl line-clamp-2 mb-4">
                            {article.excerpt}
                        </p>

                        {/* Tags */}
                        {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                                {article.tags.map(tag => (
                                    <span key={tag} className="text-xs text-taupe/80 bg-white border border-border px-2 py-0.5 rounded-sm font-sans flex items-center">
                                       <Tag size={10} className="mr-1 opacity-60" /> {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};