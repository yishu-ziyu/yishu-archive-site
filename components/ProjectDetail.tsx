
import React from 'react';
import { Project } from '../types';
import { Github, ArrowLeft, Star, ExternalLink, Calendar, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ProjectDetailProps {
    project: Project;
    onBack: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack }) => {
    return (
        <article className="max-w-3xl mx-auto px-6 py-12 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header className="mb-12">
                <button 
                    onClick={onBack}
                    className="flex items-center text-sm text-taupe hover:text-accent transition-colors mb-8 group"
                >
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Projects
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <h1 className="text-3xl md:text-5xl font-serif text-text leading-tight">
                        {project.title}
                    </h1>
                     <div className="flex gap-4">
                        <a 
                            href={project.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors text-sm font-medium"
                        >
                            <Github size={16} />
                            <span>View Source</span>
                        </a>
                     </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm font-sans text-taupe border-y border-border py-4 mb-8">
                     <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{project.year}</span>
                    </div>
                    {project.stars !== undefined && (
                        <div className="flex items-center gap-2">
                            <Star size={16} className="text-amber-400 fill-amber-400" />
                            <span>{project.stars} Stars</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                        <Code size={14} />
                        <span className="font-mono text-xs text-gray-600">{project.techStack.join(' • ')}</span>
                    </div>
                </div>

                <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-sm bg-gray-50 mb-12">
                    <img 
                        src={project.imageUrl} 
                        alt={project.title} 
                        className="w-full h-full object-cover"
                    />
                </div>
            </header>

            {/* Content Body */}
            <div className="prose prose-stone prose-lg max-w-none">
                 {project.content ? (
                    <ReactMarkdown>{project.content}</ReactMarkdown>
                 ) : (
                    <p className="text-gray-500 italic">No detailed description available.</p>
                 )}
            </div>
            
             <div className="mt-16 pt-8 border-t border-border flex justify-between items-center text-sm text-taupe">
                <span>View project on GitHub for latest updates.</span>
                <a 
                    href={project.repoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-accent transition-colors"
                >
                    Open Repository <ExternalLink size={14} />
                </a>
            </div>
        </article>
    );
};
