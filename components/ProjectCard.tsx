
import React from 'react';
import { Project } from '../types';
import { Github, Star, ExternalLink, ArrowRight } from 'lucide-react';

interface ProjectCardProps {
    project: Project;
    onClick?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-full"
        >
            <div className="aspect-video w-full overflow-hidden bg-gray-50 relative">
                <img 
                    src={project.imageUrl} 
                    alt={project.title} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
            </div>

            <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-serif font-medium text-gray-900 group-hover:text-amber-700 transition-colors">
                        {project.title}
                    </h3>
                    <div className="flex gap-2 shrink-0">
                        {project.stars !== undefined && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                                <Star className="w-3 h-3" />
                                <span>{project.stars}</span>
                            </div>
                        )}
                        <span className="text-xs text-gray-400 font-mono pt-1">{project.year}</span>
                    </div>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-2 flex-1">
                    {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                    {project.techStack.map(tech => (
                        <span key={tech} className="px-2 py-1 text-xs text-gray-500 bg-gray-50 rounded-md border border-gray-100">
                            {tech}
                        </span>
                    ))}
                </div>

                <div className="flex gap-3 mt-auto">
                    <button 
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors gap-2"
                    >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                    </button>
                    <a 
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                        title="View Source"
                    >
                        <Github className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );
};
