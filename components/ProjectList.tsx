import React from 'react';
import { Project } from '../types';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
    projects: Project[];
    onViewProject?: (project: Project) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onViewProject }) => {
    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <header className="mb-16 text-center">
                <span className="text-amber-700 text-xs font-bold tracking-widest uppercase mb-3 block">Open Source</span>
                <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mb-6">Selected Projects</h2>
                <p className="text-gray-500 max-w-2xl mx-auto font-light">
                    Explorations in software, tools, and digital experiments.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map(project => (
                    <ProjectCard 
                        key={project.id} 
                        project={project} 
                        onClick={() => onViewProject && onViewProject(project)}
                    />
                ))}
            </div>
        </div>
    );
};
