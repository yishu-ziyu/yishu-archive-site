
import React from 'react';
import { Paper } from '../types';
import { BookOpen, Download, Calendar } from 'lucide-react';

interface PaperCardProps {
    paper: Paper;
}

export const PaperCard: React.FC<PaperCardProps> = ({ paper }) => {
    return (
        <div className="bg-white border-b border-gray-100 py-8 first:pt-0 last:border-0 hover:bg-gray-50 transition-colors -mx-6 px-6 sm:mx-0 sm:px-6 sm:rounded-xl">
            <div className="flex flex-col sm:flex-row gap-6">
                <div className="sm:w-1/4 md:w-1/5 shrink-0">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                        <img 
                            src={paper.imageUrl} 
                            alt={paper.title} 
                            className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                        />
                    </div>
                </div>
                
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 text-xs text-amber-700 tracking-wider font-medium uppercase">
                        <span>{paper.category}</span>
                        <span>•</span>
                        <span>{paper.year}</span>
                    </div>

                    <h3 className="text-xl font-serif font-medium text-gray-900 mb-2 leading-snug">
                        {paper.title}
                    </h3>

                    <div className="text-xs text-gray-500 font-mono mb-4 flex items-center gap-2">
                        <BookOpen className="w-3 h-3" />
                        <span>{paper.journal}</span>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                        {paper.abstract}
                    </p>

                    <div className="flex gap-4">
                        {paper.pdfUrl && (
                            <a 
                                href={paper.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-amber-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download PDF</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
