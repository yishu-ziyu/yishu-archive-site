import { Article, Paper, Project } from '../types';
import { ensureSupabase } from './supabase';

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
    const client = ensureSupabase();
    let query = client.from('articles').select('*').order('created_at', { ascending: false });
    if (!includeDrafts) {
        query = query.eq('status', 'published');
    }
    const { data, error } = await query;
    if (error) {
        throw error;
    }
    return (data as ArticleRow[] | null)?.map(mapArticleRow) ?? [];
}

export async function createArticle(
    payload: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Article> {
    const client = ensureSupabase();
    const { data, error } = await client
        .from('articles')
        .insert({
            title: payload.title,
            excerpt: payload.excerpt,
            content: payload.content,
            pdf_url: payload.pdfUrl ?? null,
            external_url: payload.externalUrl ?? null,
            tags: payload.tags,
            status: payload.status,
        })
        .select('*')
        .single();

    if (error || !data) {
        throw error || new Error('创建文章失败');
    }
    return mapArticleRow(data as ArticleRow);
}

export async function updateArticle(
    id: string,
    payload: Partial<Omit<Article, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Article> {
    const client = ensureSupabase();
    const { data, error } = await client
        .from('articles')
        .update({
            ...(payload.title !== undefined ? { title: payload.title } : {}),
            ...(payload.excerpt !== undefined ? { excerpt: payload.excerpt } : {}),
            ...(payload.content !== undefined ? { content: payload.content } : {}),
            ...(payload.pdfUrl !== undefined ? { pdf_url: payload.pdfUrl || null } : {}),
            ...(payload.externalUrl !== undefined ? { external_url: payload.externalUrl || null } : {}),
            ...(payload.tags !== undefined ? { tags: payload.tags } : {}),
            ...(payload.status !== undefined ? { status: payload.status } : {}),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

    if (error || !data) {
        throw error || new Error('更新文章失败');
    }
    return mapArticleRow(data as ArticleRow);
}

export async function deleteArticle(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('articles').delete().eq('id', id);
    if (error) {
        throw error;
    }
}

export async function fetchProjects(includeDrafts: boolean): Promise<Project[]> {
    const client = ensureSupabase();
    let query = client.from('projects').select('*').order('created_at', { ascending: false });
    if (!includeDrafts) {
        query = query.eq('status', 'published');
    }
    const { data, error } = await query;
    if (error) {
        throw error;
    }
    return (data as ProjectRow[] | null)?.map(mapProjectRow) ?? [];
}

export async function createProject(
    payload: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Project> {
    const client = ensureSupabase();
    const { data, error } = await client
        .from('projects')
        .insert({
            title: payload.title,
            description: payload.description,
            repo_url: payload.repoUrl,
            tech_stack: payload.techStack,
            image_url: payload.imageUrl,
            year: payload.year,
            stars: payload.stars ?? null,
            content: payload.content ?? null,
            status: payload.status,
        })
        .select('*')
        .single();

    if (error || !data) {
        throw error || new Error('创建项目失败');
    }
    return mapProjectRow(data as ProjectRow);
}

export async function updateProject(
    id: string,
    payload: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Project> {
    const client = ensureSupabase();
    const { data, error } = await client
        .from('projects')
        .update({
            ...(payload.title !== undefined ? { title: payload.title } : {}),
            ...(payload.description !== undefined ? { description: payload.description } : {}),
            ...(payload.repoUrl !== undefined ? { repo_url: payload.repoUrl } : {}),
            ...(payload.techStack !== undefined ? { tech_stack: payload.techStack } : {}),
            ...(payload.imageUrl !== undefined ? { image_url: payload.imageUrl } : {}),
            ...(payload.year !== undefined ? { year: payload.year } : {}),
            ...(payload.stars !== undefined ? { stars: payload.stars } : {}),
            ...(payload.content !== undefined ? { content: payload.content || null } : {}),
            ...(payload.status !== undefined ? { status: payload.status } : {}),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

    if (error || !data) {
        throw error || new Error('更新项目失败');
    }
    return mapProjectRow(data as ProjectRow);
}

export async function deleteProject(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('projects').delete().eq('id', id);
    if (error) {
        throw error;
    }
}

export async function fetchPapers(includeDrafts: boolean): Promise<Paper[]> {
    const client = ensureSupabase();
    let query = client.from('papers').select('*').order('created_at', { ascending: false });
    if (!includeDrafts) {
        query = query.eq('status', 'published');
    }
    const { data, error } = await query;
    if (error) {
        throw error;
    }
    return (data as PaperRow[] | null)?.map(mapPaperRow) ?? [];
}

export async function createPaper(
    payload: Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Paper> {
    const client = ensureSupabase();
    const { data, error } = await client
        .from('papers')
        .insert({
            title: payload.title,
            abstract: payload.abstract,
            journal: payload.journal,
            pdf_url: payload.pdfUrl ?? null,
            image_url: payload.imageUrl,
            year: payload.year,
            category: payload.category,
            status: payload.status,
        })
        .select('*')
        .single();

    if (error || !data) {
        throw error || new Error('创建研究失败');
    }
    return mapPaperRow(data as PaperRow);
}

export async function updatePaper(
    id: string,
    payload: Partial<Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Paper> {
    const client = ensureSupabase();
    const { data, error } = await client
        .from('papers')
        .update({
            ...(payload.title !== undefined ? { title: payload.title } : {}),
            ...(payload.abstract !== undefined ? { abstract: payload.abstract } : {}),
            ...(payload.journal !== undefined ? { journal: payload.journal } : {}),
            ...(payload.pdfUrl !== undefined ? { pdf_url: payload.pdfUrl || null } : {}),
            ...(payload.imageUrl !== undefined ? { image_url: payload.imageUrl } : {}),
            ...(payload.year !== undefined ? { year: payload.year } : {}),
            ...(payload.category !== undefined ? { category: payload.category } : {}),
            ...(payload.status !== undefined ? { status: payload.status } : {}),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

    if (error || !data) {
        throw error || new Error('更新研究失败');
    }
    return mapPaperRow(data as PaperRow);
}

export async function deletePaper(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('papers').delete().eq('id', id);
    if (error) {
        throw error;
    }
}
