
export interface Article {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    pdfUrl?: string; 
    externalUrl?: string; // Support for external links like WeChat articles
    tags: string[]; // Added tags
    status: 'draft' | 'published';
    createdAt: number;
    updatedAt?: number;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    repoUrl: string;
    techStack: string[];
    imageUrl: string;
    year: string;
    stars?: number; // Optional social proof
    content?: string; // Markdown content for detail view
    status: 'draft' | 'published';
    createdAt?: number;
    updatedAt?: number;
}

export interface Paper {
    id: string;
    title: string;
    abstract: string;
    journal: string; // or conference
    pdfUrl?: string; // Link to PDF if available, or external link
    imageUrl: string;
    year: string;
    category: string; // e.g., "Economics", "AI"
    status: 'draft' | 'published';
    createdAt?: number;
    updatedAt?: number;
}

export interface User {
    uid: string;
    email: string;
}

export type ViewState = 'home' | 'articles' | 'article-detail' | 'projects' | 'papers' | 'admin' | 'login';
