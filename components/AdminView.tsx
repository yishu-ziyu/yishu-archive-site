import React, { useMemo, useState } from 'react';
import { Edit2, LogOut, Plus, Save, Trash2 } from 'lucide-react';
import { Article, Paper, Project, User } from '../types';

type Section = 'articles' | 'projects' | 'papers';
type Mode = 'list' | 'editor';

interface AdminViewProps {
    user: User;
    articles: Article[];
    projects: Project[];
    papers: Paper[];
    onArticleCreate: (data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    onArticleEdit: (id: string, data: Partial<Omit<Article, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
    onArticleDelete: (id: string) => Promise<void>;
    onProjectCreate: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    onProjectEdit: (id: string, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
    onProjectDelete: (id: string) => Promise<void>;
    onPaperCreate: (data: Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    onPaperEdit: (id: string, data: Partial<Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
    onPaperDelete: (id: string) => Promise<void>;
    onLogout: () => Promise<void>;
}

const EMPTY_ARTICLE_FORM = {
    title: '',
    excerpt: '',
    content: '',
    pdfUrl: '',
    externalUrl: '',
    tagsText: '',
    status: 'draft' as 'draft' | 'published',
};

const EMPTY_PROJECT_FORM = {
    title: '',
    description: '',
    repoUrl: '',
    techStackText: '',
    imageUrl: '',
    year: '',
    starsText: '',
    content: '',
    status: 'draft' as 'draft' | 'published',
};

const EMPTY_PAPER_FORM = {
    title: '',
    abstract: '',
    journal: '',
    pdfUrl: '',
    imageUrl: '',
    year: '',
    category: '',
    status: 'draft' as 'draft' | 'published',
};

export const AdminView: React.FC<AdminViewProps> = ({
    user,
    articles,
    projects,
    papers,
    onArticleCreate,
    onArticleEdit,
    onArticleDelete,
    onProjectCreate,
    onProjectEdit,
    onProjectDelete,
    onPaperCreate,
    onPaperEdit,
    onPaperDelete,
    onLogout,
}) => {
    const [section, setSection] = useState<Section>('articles');
    const [mode, setMode] = useState<Mode>('list');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [articleForm, setArticleForm] = useState(EMPTY_ARTICLE_FORM);
    const [projectForm, setProjectForm] = useState(EMPTY_PROJECT_FORM);
    const [paperForm, setPaperForm] = useState(EMPTY_PAPER_FORM);

    const sectionTitle = useMemo(() => {
        if (section === 'articles') return '文章';
        if (section === 'projects') return '项目';
        return '研究';
    }, [section]);

    const resetEditor = () => {
        setMode('list');
        setEditingId(null);
        setArticleForm(EMPTY_ARTICLE_FORM);
        setProjectForm(EMPTY_PROJECT_FORM);
        setPaperForm(EMPTY_PAPER_FORM);
        setErrorMessage(null);
    };

    const openCreate = (target: Section) => {
        setSection(target);
        setMode('editor');
        setEditingId(null);
        setErrorMessage(null);
        setArticleForm(EMPTY_ARTICLE_FORM);
        setProjectForm(EMPTY_PROJECT_FORM);
        setPaperForm(EMPTY_PAPER_FORM);
    };

    const safeAction = async (action: () => Promise<void>) => {
        setSaving(true);
        setErrorMessage(null);
        try {
            await action();
            resetEditor();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : '操作失败，请稍后重试。');
        } finally {
            setSaving(false);
        }
    };

    const parseListText = (value: string) =>
        value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

    const startEditArticle = (article: Article) => {
        setSection('articles');
        setMode('editor');
        setEditingId(article.id);
        setErrorMessage(null);
        setArticleForm({
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            pdfUrl: article.pdfUrl || '',
            externalUrl: article.externalUrl || '',
            tagsText: article.tags.join(', '),
            status: article.status,
        });
    };

    const startEditProject = (project: Project) => {
        setSection('projects');
        setMode('editor');
        setEditingId(project.id);
        setErrorMessage(null);
        setProjectForm({
            title: project.title,
            description: project.description,
            repoUrl: project.repoUrl,
            techStackText: project.techStack.join(', '),
            imageUrl: project.imageUrl,
            year: project.year,
            starsText: project.stars ? String(project.stars) : '',
            content: project.content || '',
            status: project.status,
        });
    };

    const startEditPaper = (paper: Paper) => {
        setSection('papers');
        setMode('editor');
        setEditingId(paper.id);
        setErrorMessage(null);
        setPaperForm({
            title: paper.title,
            abstract: paper.abstract,
            journal: paper.journal,
            pdfUrl: paper.pdfUrl || '',
            imageUrl: paper.imageUrl,
            year: paper.year,
            category: paper.category,
            status: paper.status,
        });
    };

    const submitArticle = async (event: React.FormEvent) => {
        event.preventDefault();
        const payload: Omit<Article, 'id' | 'createdAt' | 'updatedAt'> = {
            title: articleForm.title.trim(),
            excerpt: articleForm.excerpt.trim(),
            content: articleForm.content.trim(),
            pdfUrl: articleForm.pdfUrl.trim() || undefined,
            externalUrl: articleForm.externalUrl.trim() || undefined,
            tags: parseListText(articleForm.tagsText),
            status: articleForm.status,
        };

        await safeAction(async () => {
            if (editingId) {
                await onArticleEdit(editingId, payload);
                return;
            }
            await onArticleCreate(payload);
        });
    };

    const submitProject = async (event: React.FormEvent) => {
        event.preventDefault();
        const starsValue = projectForm.starsText.trim();
        const payload: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
            title: projectForm.title.trim(),
            description: projectForm.description.trim(),
            repoUrl: projectForm.repoUrl.trim(),
            techStack: parseListText(projectForm.techStackText),
            imageUrl: projectForm.imageUrl.trim(),
            year: projectForm.year.trim(),
            stars: starsValue ? Number(starsValue) : undefined,
            content: projectForm.content.trim() || undefined,
            status: projectForm.status,
        };

        await safeAction(async () => {
            if (editingId) {
                await onProjectEdit(editingId, payload);
                return;
            }
            await onProjectCreate(payload);
        });
    };

    const submitPaper = async (event: React.FormEvent) => {
        event.preventDefault();
        const payload: Omit<Paper, 'id' | 'createdAt' | 'updatedAt'> = {
            title: paperForm.title.trim(),
            abstract: paperForm.abstract.trim(),
            journal: paperForm.journal.trim(),
            pdfUrl: paperForm.pdfUrl.trim() || undefined,
            imageUrl: paperForm.imageUrl.trim(),
            year: paperForm.year.trim(),
            category: paperForm.category.trim(),
            status: paperForm.status,
        };

        await safeAction(async () => {
            if (editingId) {
                await onPaperEdit(editingId, payload);
                return;
            }
            await onPaperCreate(payload);
        });
    };

    const askDelete = async (type: Section, id: string) => {
        const confirmed = window.confirm(`确认删除这条${type === 'articles' ? '文章' : type === 'projects' ? '项目' : '研究'}吗？`);
        if (!confirmed) return;

        await safeAction(async () => {
            if (type === 'articles') {
                await onArticleDelete(id);
                return;
            }
            if (type === 'projects') {
                await onProjectDelete(id);
                return;
            }
            await onPaperDelete(id);
        });
    };

    if (mode === 'editor') {
        return (
            <div className="py-8 md:py-12 max-w-4xl mx-auto animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="font-serif text-3xl">{editingId ? `编辑${sectionTitle}` : `新建${sectionTitle}`}</h2>
                    <button onClick={resetEditor} className="text-sm text-taupe hover:text-text transition-colors">
                        返回列表
                    </button>
                </div>

                {errorMessage && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                        {errorMessage}
                    </div>
                )}

                {section === 'articles' && (
                    <form onSubmit={submitArticle} className="space-y-5">
                        <input
                            className="neo-input text-3xl font-serif"
                            placeholder="标题"
                            value={articleForm.title}
                            onChange={(event) => setArticleForm((prev) => ({ ...prev, title: event.target.value }))}
                            required
                        />
                        <input
                            className="neo-input text-base"
                            placeholder="摘要"
                            value={articleForm.excerpt}
                            onChange={(event) => setArticleForm((prev) => ({ ...prev, excerpt: event.target.value }))}
                            required
                        />
                        <input
                            className="neo-input text-sm"
                            placeholder="标签（逗号分隔，例如：AI, Product, Learning）"
                            value={articleForm.tagsText}
                            onChange={(event) => setArticleForm((prev) => ({ ...prev, tagsText: event.target.value }))}
                        />
                        <input
                            className="neo-input text-sm"
                            placeholder="PDF 链接（可选）"
                            value={articleForm.pdfUrl}
                            onChange={(event) => setArticleForm((prev) => ({ ...prev, pdfUrl: event.target.value }))}
                        />
                        <input
                            className="neo-input text-sm"
                            placeholder="外部原文链接（可选）"
                            value={articleForm.externalUrl}
                            onChange={(event) => setArticleForm((prev) => ({ ...prev, externalUrl: event.target.value }))}
                        />
                        <div className="flex flex-wrap gap-4 text-sm text-taupe">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="article-status"
                                    checked={articleForm.status === 'draft'}
                                    onChange={() => setArticleForm((prev) => ({ ...prev, status: 'draft' }))}
                                />
                                草稿
                            </label>
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="article-status"
                                    checked={articleForm.status === 'published'}
                                    onChange={() => setArticleForm((prev) => ({ ...prev, status: 'published' }))}
                                />
                                发布
                            </label>
                        </div>
                        <textarea
                            className="w-full h-[46vh] rounded-xl border border-border bg-white p-5 text-sm leading-relaxed outline-none focus:border-accent"
                            placeholder="正文"
                            value={articleForm.content}
                            onChange={(event) => setArticleForm((prev) => ({ ...prev, content: event.target.value }))}
                            required
                        />
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-text text-bg px-5 py-2.5 text-sm hover:bg-accent transition-colors disabled:opacity-60"
                        >
                            <Save size={15} />
                            {saving ? '保存中...' : '保存文章'}
                        </button>
                    </form>
                )}

                {section === 'projects' && (
                    <form onSubmit={submitProject} className="space-y-5">
                        <input
                            className="neo-input text-3xl font-serif"
                            placeholder="项目标题"
                            value={projectForm.title}
                            onChange={(event) => setProjectForm((prev) => ({ ...prev, title: event.target.value }))}
                            required
                        />
                        <textarea
                            className="w-full h-24 rounded-xl border border-border bg-white p-4 text-sm outline-none focus:border-accent"
                            placeholder="项目简介"
                            value={projectForm.description}
                            onChange={(event) => setProjectForm((prev) => ({ ...prev, description: event.target.value }))}
                            required
                        />
                        <input
                            className="neo-input text-sm"
                            placeholder="代码仓库链接"
                            value={projectForm.repoUrl}
                            onChange={(event) => setProjectForm((prev) => ({ ...prev, repoUrl: event.target.value }))}
                            required
                        />
                        <input
                            className="neo-input text-sm"
                            placeholder="封面图链接"
                            value={projectForm.imageUrl}
                            onChange={(event) => setProjectForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                            required
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                className="neo-input text-sm"
                                placeholder="年份，例如 2026"
                                value={projectForm.year}
                                onChange={(event) => setProjectForm((prev) => ({ ...prev, year: event.target.value }))}
                                required
                            />
                            <input
                                className="neo-input text-sm"
                                placeholder="Stars（可选）"
                                value={projectForm.starsText}
                                onChange={(event) => setProjectForm((prev) => ({ ...prev, starsText: event.target.value }))}
                            />
                        </div>
                        <input
                            className="neo-input text-sm"
                            placeholder="技术栈（逗号分隔）"
                            value={projectForm.techStackText}
                            onChange={(event) => setProjectForm((prev) => ({ ...prev, techStackText: event.target.value }))}
                            required
                        />
                        <div className="flex flex-wrap gap-4 text-sm text-taupe">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="project-status"
                                    checked={projectForm.status === 'draft'}
                                    onChange={() => setProjectForm((prev) => ({ ...prev, status: 'draft' }))}
                                />
                                草稿（下架）
                            </label>
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="project-status"
                                    checked={projectForm.status === 'published'}
                                    onChange={() => setProjectForm((prev) => ({ ...prev, status: 'published' }))}
                                />
                                发布（上架）
                            </label>
                        </div>
                        <textarea
                            className="w-full h-[34vh] rounded-xl border border-border bg-white p-5 text-sm leading-relaxed outline-none focus:border-accent"
                            placeholder="项目详细介绍（支持 Markdown 文本）"
                            value={projectForm.content}
                            onChange={(event) => setProjectForm((prev) => ({ ...prev, content: event.target.value }))}
                        />
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-text text-bg px-5 py-2.5 text-sm hover:bg-accent transition-colors disabled:opacity-60"
                        >
                            <Save size={15} />
                            {saving ? '保存中...' : '保存项目'}
                        </button>
                    </form>
                )}

                {section === 'papers' && (
                    <form onSubmit={submitPaper} className="space-y-5">
                        <input
                            className="neo-input text-3xl font-serif"
                            placeholder="研究标题"
                            value={paperForm.title}
                            onChange={(event) => setPaperForm((prev) => ({ ...prev, title: event.target.value }))}
                            required
                        />
                        <textarea
                            className="w-full h-24 rounded-xl border border-border bg-white p-4 text-sm outline-none focus:border-accent"
                            placeholder="摘要"
                            value={paperForm.abstract}
                            onChange={(event) => setPaperForm((prev) => ({ ...prev, abstract: event.target.value }))}
                            required
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                className="neo-input text-sm"
                                placeholder="期刊/报告名"
                                value={paperForm.journal}
                                onChange={(event) => setPaperForm((prev) => ({ ...prev, journal: event.target.value }))}
                                required
                            />
                            <input
                                className="neo-input text-sm"
                                placeholder="分类，例如 Economics"
                                value={paperForm.category}
                                onChange={(event) => setPaperForm((prev) => ({ ...prev, category: event.target.value }))}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                className="neo-input text-sm"
                                placeholder="年份"
                                value={paperForm.year}
                                onChange={(event) => setPaperForm((prev) => ({ ...prev, year: event.target.value }))}
                                required
                            />
                            <input
                                className="neo-input text-sm"
                                placeholder="PDF 链接（可选）"
                                value={paperForm.pdfUrl}
                                onChange={(event) => setPaperForm((prev) => ({ ...prev, pdfUrl: event.target.value }))}
                            />
                        </div>
                        <input
                            className="neo-input text-sm"
                            placeholder="封面图片链接"
                            value={paperForm.imageUrl}
                            onChange={(event) => setPaperForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                            required
                        />
                        <div className="flex flex-wrap gap-4 text-sm text-taupe">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="paper-status"
                                    checked={paperForm.status === 'draft'}
                                    onChange={() => setPaperForm((prev) => ({ ...prev, status: 'draft' }))}
                                />
                                草稿（下架）
                            </label>
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="paper-status"
                                    checked={paperForm.status === 'published'}
                                    onChange={() => setPaperForm((prev) => ({ ...prev, status: 'published' }))}
                                />
                                发布（上架）
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-text text-bg px-5 py-2.5 text-sm hover:bg-accent transition-colors disabled:opacity-60"
                        >
                            <Save size={15} />
                            {saving ? '保存中...' : '保存研究'}
                        </button>
                    </form>
                )}
            </div>
        );
    }

    return (
        <div className="py-8 md:py-10 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="font-serif text-3xl">后台管理</h2>
                    <p className="text-sm text-taupe mt-1">管理员：{user.email}</p>
                </div>
                <button
                    onClick={() => safeAction(onLogout)}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm text-taupe hover:text-text transition-colors"
                >
                    <LogOut size={14} />
                    登出
                </button>
            </div>

            {errorMessage && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                    {errorMessage}
                </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => setSection('articles')}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${section === 'articles' ? 'bg-text text-bg' : 'bg-white border border-border text-taupe'}`}
                >
                    文章 ({articles.length})
                </button>
                <button
                    onClick={() => setSection('projects')}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${section === 'projects' ? 'bg-text text-bg' : 'bg-white border border-border text-taupe'}`}
                >
                    项目 ({projects.length})
                </button>
                <button
                    onClick={() => setSection('papers')}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${section === 'papers' ? 'bg-text text-bg' : 'bg-white border border-border text-taupe'}`}
                >
                    研究 ({papers.length})
                </button>
            </div>

            <div className="flex justify-end mb-4">
                <button
                    onClick={() => openCreate(section)}
                    className="inline-flex items-center gap-2 rounded-xl bg-text text-bg px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                    <Plus size={14} />
                    新建{sectionTitle}
                </button>
            </div>

            <div className="neo-card overflow-hidden">
                {section === 'articles' && (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-hover-bg/70">
                            <tr className="text-xs uppercase tracking-wider text-taupe">
                                <th className="p-4 font-normal">标题</th>
                                <th className="p-4 font-normal">状态</th>
                                <th className="p-4 font-normal hidden md:table-cell">更新时间</th>
                                <th className="p-4 font-normal text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {articles.map((article) => (
                                <tr key={article.id} className="border-t border-border">
                                    <td className="p-4">{article.title}</td>
                                    <td className="p-4 text-sm text-taupe">{article.status === 'published' ? '已发布' : '草稿'}</td>
                                    <td className="p-4 text-sm text-taupe hidden md:table-cell">
                                        {new Date(article.updatedAt || article.createdAt).toLocaleString('zh-CN')}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => startEditArticle(article)} className="text-taupe hover:text-text">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => askDelete('articles', article.id)} className="text-taupe hover:text-accent">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {section === 'projects' && (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-hover-bg/70">
                            <tr className="text-xs uppercase tracking-wider text-taupe">
                                <th className="p-4 font-normal">项目</th>
                                <th className="p-4 font-normal">状态</th>
                                <th className="p-4 font-normal hidden md:table-cell">年份</th>
                                <th className="p-4 font-normal hidden md:table-cell">技术栈</th>
                                <th className="p-4 font-normal text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => (
                                <tr key={project.id} className="border-t border-border">
                                    <td className="p-4">{project.title}</td>
                                    <td className="p-4 text-sm text-taupe">{project.status === 'published' ? '已发布' : '草稿'}</td>
                                    <td className="p-4 text-sm text-taupe hidden md:table-cell">{project.year}</td>
                                    <td className="p-4 text-sm text-taupe hidden md:table-cell">{project.techStack.slice(0, 2).join(', ')}</td>
                                    <td className="p-4">
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => startEditProject(project)} className="text-taupe hover:text-text">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => askDelete('projects', project.id)} className="text-taupe hover:text-accent">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {section === 'papers' && (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-hover-bg/70">
                            <tr className="text-xs uppercase tracking-wider text-taupe">
                                <th className="p-4 font-normal">标题</th>
                                <th className="p-4 font-normal">状态</th>
                                <th className="p-4 font-normal hidden md:table-cell">分类</th>
                                <th className="p-4 font-normal hidden md:table-cell">年份</th>
                                <th className="p-4 font-normal text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {papers.map((paper) => (
                                <tr key={paper.id} className="border-t border-border">
                                    <td className="p-4">{paper.title}</td>
                                    <td className="p-4 text-sm text-taupe">{paper.status === 'published' ? '已发布' : '草稿'}</td>
                                    <td className="p-4 text-sm text-taupe hidden md:table-cell">{paper.category}</td>
                                    <td className="p-4 text-sm text-taupe hidden md:table-cell">{paper.year}</td>
                                    <td className="p-4">
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => startEditPaper(paper)} className="text-taupe hover:text-text">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => askDelete('papers', paper.id)} className="text-taupe hover:text-accent">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
