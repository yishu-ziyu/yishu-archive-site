import { Article, Paper, Project } from '../types';
import { requestJson } from './apiClient';

type ArticleRow = {
    id: string;
    title: string;
    excerpt: string | null;
    content: string;
    pdf_url: string | null;
    external_url: string | null;
    tags: string[] | null;
    status: 'draft' | 'published';
    created_at: string;
    updated_at: string | null;
};

type ProjectRow = {
    id: string;
    title: string;
    description: string;
    repo_url: string;
    tech_stack: string[] | null;
    image_url: string;
    year: string;
    stars: number | null;
    content: string | null;
    status: 'draft' | 'published';
    created_at: string;
    updated_at: string | null;
};

type PaperRow = {
    id: string;
    title: string;
    abstract: string;
    journal: string;
    pdf_url: string | null;
    image_url: string;
    year: string;
    category: string;
    status: 'draft' | 'published';
    created_at: string;
    updated_at: string | null;
};

type ListResponse<T> = {
    data: T[];
};

type ItemResponse<T> = {
    data: T;
};

function toTimestamp(value?: string | null): number | undefined {
    if (!value) {
        return undefined;
    }
    const time = Date.parse(value);
    return Number.isNaN(time) ? undefined : time;
}

function mapArticleRow(row: ArticleRow): Article {
    return {
        id: row.id,
        title: row.title,
        excerpt: row.excerpt ?? '',
        content: row.content,
        pdfUrl: row.pdf_url ?? undefined,
        externalUrl: row.external_url ?? undefined,
        tags: row.tags ?? [],
        status: row.status,
        createdAt: toTimestamp(row.created_at) ?? Date.now(),
        updatedAt: toTimestamp(row.updated_at),
    };
}

function mapProjectRow(row: ProjectRow): Project {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        repoUrl: row.repo_url,
        techStack: row.tech_stack ?? [],
        imageUrl: row.image_url,
        year: row.year,
        stars: row.stars ?? undefined,
        content: row.content ?? undefined,
        status: row.status,
        createdAt: toTimestamp(row.created_at),
        updatedAt: toTimestamp(row.updated_at),
    };
}

function mapPaperRow(row: PaperRow): Paper {
    return {
        id: row.id,
        title: row.title,
        abstract: row.abstract,
        journal: row.journal,
        pdfUrl: row.pdf_url ?? undefined,
        imageUrl: row.image_url,
        year: row.year,
        category: row.category,
        status: row.status,
        createdAt: toTimestamp(row.created_at),
        updatedAt: toTimestamp(row.updated_at),
    };
}

export async function fetchArticles(includeDrafts: boolean): Promise<Article[]> {
    const response = await requestJson<ListResponse<ArticleRow>>(
        `/api/content/articles?includeDrafts=${includeDrafts ? '1' : '0'}`,
    );
    return response.data.map(mapArticleRow);
}

export async function createArticle(
    payload: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Article> {
    const response = await requestJson<ItemResponse<ArticleRow>>('/api/content/articles', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return mapArticleRow(response.data);
}

export async function updateArticle(
    id: string,
    payload: Partial<Omit<Article, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Article> {
    const response = await requestJson<ItemResponse<ArticleRow>>(`/api/content/articles?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    return mapArticleRow(response.data);
}

export async function deleteArticle(id: string): Promise<void> {
    await requestJson<{ ok: true }>(`/api/content/articles?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
}

export async function fetchProjects(includeDrafts: boolean): Promise<Project[]> {
    const response = await requestJson<ListResponse<ProjectRow>>(
        `/api/content/projects?includeDrafts=${includeDrafts ? '1' : '0'}`,
    );
    return response.data.map(mapProjectRow);
}

export async function createProject(
    payload: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Project> {
    const response = await requestJson<ItemResponse<ProjectRow>>('/api/content/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return mapProjectRow(response.data);
}

export async function updateProject(
    id: string,
    payload: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Project> {
    const response = await requestJson<ItemResponse<ProjectRow>>(`/api/content/projects?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    return mapProjectRow(response.data);
}

export async function deleteProject(id: string): Promise<void> {
    await requestJson<{ ok: true }>(`/api/content/projects?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
}

export async function fetchPapers(includeDrafts: boolean): Promise<Paper[]> {
    const response = await requestJson<ListResponse<PaperRow>>(
        `/api/content/papers?includeDrafts=${includeDrafts ? '1' : '0'}`,
    );
    return response.data.map(mapPaperRow);
}

export async function createPaper(
    payload: Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Paper> {
    const response = await requestJson<ItemResponse<PaperRow>>('/api/content/papers', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return mapPaperRow(response.data);
}

export async function updatePaper(
    id: string,
    payload: Partial<Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Paper> {
    const response = await requestJson<ItemResponse<PaperRow>>(`/api/content/papers?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    return mapPaperRow(response.data);
}

export async function deletePaper(id: string): Promise<void> {
    await requestJson<{ ok: true }>(`/api/content/papers?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
}
