
import React from 'react';
import { Paper } from '../types';
import { PaperCard } from './PaperCard';

interface PaperListProps {
    papers: Paper[];
}

export const PaperList: React.FC<PaperListProps> = ({ papers }) => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
             <header className="mb-16 text-center">
                <span className="text-amber-700 text-xs font-bold tracking-widest uppercase mb-3 block">Research Archive</span>
                <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mb-6">研究论文与报告</h2>
                <p className="text-gray-500 max-w-2xl mx-auto font-light">
                    收录经济学、心理学与社会科学方向的研究成果，点击可查看原文 PDF。
                </p>
            </header>

            <div className="divide-y divide-gray-100">
                {papers.map(paper => (
                   <PaperCard key={paper.id} paper={paper} />
                ))}
            </div>
        </div>
    );
};
