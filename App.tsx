import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navbar } from './components/Navbar';
import { ArticleList } from './components/ArticleList';
import { ArticleDetail } from './components/ArticleDetail';
import { AdminView } from './components/AdminView';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { PaperList } from './components/PaperList';
import { SearchOverlay } from './components/SearchOverlay';
import {
    AlertTriangle,
    ArrowUpRight,
    BookOpen,
    Clock3,
    Eye,
    Layers3,
    Loader2,
    Search,
    Sparkles,
} from 'lucide-react';
import { INITIAL_ARTICLES, INITIAL_PROJECTS, INITIAL_PAPERS } from './constants';
import { Article, Paper, Project, User, ViewState } from './types';
import {
    createArticle,
    createPaper,
    createProject,
    deleteArticle,
    deletePaper,
    deleteProject,
    fetchArticles,
    fetchPapers,
    fetchProjects,
    updateArticle,
    updatePaper,
    updateProject,
} from './lib/contentService';
import { getCurrentUser, loginWithEmailPassword, logout, subscribeAuthState } from './lib/authService';
import { isSupabaseConfigured } from './lib/supabase';

type AppView = ViewState | 'project-detail';

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<AppView>('home');

    const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
    const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
    const [papers, setPapers] = useState<Paper[]>(INITIAL_PAPERS);

    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const [isInitializing, setIsInitializing] = useState(true);
    const [runtimeMessage, setRuntimeMessage] = useState<string | null>(null);
    const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const publishedArticles = useMemo(
        () => [...articles].filter((article) => article.status === 'published').sort((a, b) => b.createdAt - a.createdAt),
        [articles],
    );
    const publishedProjects = useMemo(
        () => projects.filter((project) => project.status === 'published'),
        [projects],
    );
    const publishedPapers = useMemo(
        () => papers.filter((paper) => paper.status === 'published'),
        [papers],
    );
    const visibleArticles = useMemo(() => (user ? articles : publishedArticles), [articles, publishedArticles, user]);
    const visibleProjects = useMemo(() => (user ? projects : publishedProjects), [projects, publishedProjects, user]);
    const visiblePapers = useMemo(() => (user ? papers : publishedPapers), [papers, publishedPapers, user]);

    const featuredArticle = useMemo(() => publishedArticles[0] ?? null, [publishedArticles]);
    const recentArticles = useMemo(() => publishedArticles.slice(1, 6), [publishedArticles]);

    const topTags = useMemo(() => {
        const counter = new Map<string, number>();
        publishedArticles.forEach((article) => {
            article.tags.forEach((tag) => {
                counter.set(tag, (counter.get(tag) || 0) + 1);
            });
        });
        return [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    }, [publishedArticles]);

    const openPaper = (paper: Paper) => {
        if (paper.pdfUrl) {
            window.open(paper.pdfUrl, '_blank');
        }
    };

    const loadContent = useCallback(async (includeDrafts: boolean) => {
        if (!isSupabaseConfigured) {
            setArticles(INITIAL_ARTICLES);
            setProjects(INITIAL_PROJECTS);
            setPapers(INITIAL_PAPERS);
            return;
        }

        const [nextArticles, nextProjects, nextPapers] = await Promise.all([
            fetchArticles(includeDrafts),
            fetchProjects(includeDrafts),
            fetchPapers(includeDrafts),
        ]);

        setArticles(nextArticles);
        setProjects(nextProjects);
        setPapers(nextPapers);
    }, []);

    useEffect(() => {
        let mounted = true;

        async function initialize() {
            try {
                if (!isSupabaseConfigured) {
                    setRuntimeMessage('当前是本地模式（静态数据）。配置 Supabase 后可启用实时后台管理。');
                    return;
                }

                const currentUser = await getCurrentUser();
                if (!mounted) return;
                setUser(currentUser);

                await loadContent(Boolean(currentUser));
            } catch (error) {
                if (!mounted) return;
                setRuntimeMessage(
                    `Supabase 初始化失败：${error instanceof Error ? error.message : '未知错误'}。当前已回退到本地内容模式。`,
                );
                setArticles(INITIAL_ARTICLES);
                setProjects(INITIAL_PROJECTS);
                setPapers(INITIAL_PAPERS);
            } finally {
                if (mounted) {
                    setIsInitializing(false);
                }
            }
        }

        initialize();

        const unsubscribe = subscribeAuthState(async (_event, authUser) => {
            if (!mounted) return;
            setUser(authUser);
            try {
                await loadContent(Boolean(authUser));
            } catch (error) {
                if (!mounted) return;
                setRuntimeMessage(error instanceof Error ? error.message : '内容同步失败');
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, [loadContent]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleReadArticle = (article: Article) => {
        setSelectedArticle(article);
        setCurrentView('article-detail');
        window.scrollTo(0, 0);
    };

    const handleViewProject = (project: Project) => {
        setSelectedProject(project);
        setCurrentView('project-detail');
        window.scrollTo(0, 0);
    };

    const handleNavigateFromSearch = (type: 'article' | 'project' | 'paper', id: string) => {
        if (type === 'article') {
            const article = visibleArticles.find((candidate) => candidate.id === id);
            if (article) handleReadArticle(article);
            return;
        }

        if (type === 'project') {
            const project = visibleProjects.find((candidate) => candidate.id === id);
            if (project) handleViewProject(project);
            return;
        }

        const paper = visiblePapers.find((candidate) => candidate.id === id);
        if (paper?.pdfUrl) {
            window.open(paper.pdfUrl, '_blank');
        }
    };

    const handleArticleCreate = useCallback(async (data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!isSupabaseConfigured) {
            const nextArticle: Article = {
                ...data,
                id: Date.now().toString(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            setArticles((prev) => [nextArticle, ...prev]);
            return;
        }
        const created = await createArticle(data);
        setArticles((prev) => [created, ...prev]);
    }, []);

    const handleArticleEdit = useCallback(async (id: string, data: Partial<Omit<Article, 'id' | 'createdAt' | 'updatedAt'>>) => {
        if (!isSupabaseConfigured) {
            setArticles((prev) =>
                prev.map((article) => (article.id === id ? { ...article, ...data, updatedAt: Date.now() } : article)),
            );
            return;
        }
        const updated = await updateArticle(id, data);
        setArticles((prev) => prev.map((article) => (article.id === id ? updated : article)));
    }, []);

    const handleArticleDelete = useCallback(async (id: string) => {
        if (!isSupabaseConfigured) {
            setArticles((prev) => prev.filter((article) => article.id !== id));
            return;
        }
        await deleteArticle(id);
        setArticles((prev) => prev.filter((article) => article.id !== id));
    }, []);

    const handleProjectCreate = useCallback(async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!isSupabaseConfigured) {
            const nextProject: Project = {
                ...data,
                id: `project-${Date.now()}`,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            setProjects((prev) => [nextProject, ...prev]);
            return;
        }
        const created = await createProject(data);
        setProjects((prev) => [created, ...prev]);
    }, []);

    const handleProjectEdit = useCallback(async (id: string, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => {
        if (!isSupabaseConfigured) {
            setProjects((prev) =>
                prev.map((project) => (project.id === id ? { ...project, ...data, updatedAt: Date.now() } : project)),
            );
            return;
        }
        const updated = await updateProject(id, data);
        setProjects((prev) => prev.map((project) => (project.id === id ? updated : project)));
    }, []);

    const handleProjectDelete = useCallback(async (id: string) => {
        if (!isSupabaseConfigured) {
            setProjects((prev) => prev.filter((project) => project.id !== id));
            return;
        }
        await deleteProject(id);
        setProjects((prev) => prev.filter((project) => project.id !== id));
    }, []);

    const handlePaperCreate = useCallback(async (data: Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!isSupabaseConfigured) {
            const nextPaper: Paper = {
                ...data,
                id: `paper-${Date.now()}`,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            setPapers((prev) => [nextPaper, ...prev]);
            return;
        }
        const created = await createPaper(data);
        setPapers((prev) => [created, ...prev]);
    }, []);

    const handlePaperEdit = useCallback(async (id: string, data: Partial<Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>>) => {
        if (!isSupabaseConfigured) {
            setPapers((prev) => prev.map((paper) => (paper.id === id ? { ...paper, ...data, updatedAt: Date.now() } : paper)));
            return;
        }
        const updated = await updatePaper(id, data);
        setPapers((prev) => prev.map((paper) => (paper.id === id ? updated : paper)));
    }, []);

    const handlePaperDelete = useCallback(async (id: string) => {
        if (!isSupabaseConfigured) {
            setPapers((prev) => prev.filter((paper) => paper.id !== id));
            return;
        }
        await deletePaper(id);
        setPapers((prev) => prev.filter((paper) => paper.id !== id));
    }, []);

    const handleLogin = useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault();
            setLoginError(null);
            setIsLoginSubmitting(true);
            try {
                if (!isSupabaseConfigured) {
                    setUser({
                        uid: 'local-admin',
                        email: loginEmail.trim() || 'local-admin@example.com',
                    });
                    setCurrentView('admin');
                    return;
                }

                const loggedInUser = await loginWithEmailPassword(loginEmail.trim(), loginPassword);
                setUser(loggedInUser);
                setCurrentView('admin');
                await loadContent(true);
            } catch (error) {
                setLoginError(error instanceof Error ? error.message : '登录失败，请检查邮箱和密码。');
            } finally {
                setIsLoginSubmitting(false);
            }
        },
        [loadContent, loginEmail, loginPassword],
    );

    const handleLogout = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setUser(null);
            setCurrentView('home');
            return;
        }
        await logout();
        setUser(null);
        setCurrentView('home');
        await loadContent(false);
    }, [loadContent]);

    const renderHome = () => (
        <div className="py-6 md:py-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
                <section className="space-y-6 min-w-0">
                    <article className="neo-card p-7 md:p-10 animate-rise">
                        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-taupe mb-6">
                            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1">
                                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                Build in Public
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Sparkles size={13} />
                                Content + Product + Research
                            </span>
                        </div>

                        <h1 className="font-serif text-4xl md:text-6xl leading-tight text-text mb-5">
                            把探索写下来，<br />
                            把作品做出来。
                        </h1>
                        <p className="text-base md:text-lg text-taupe max-w-2xl leading-relaxed">
                            这是一个持续更新的个人数字档案：文章、项目与研究并行，记录真实学习与构建过程。
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <button
                                onClick={() => setCurrentView('projects')}
                                className="px-5 py-2.5 rounded-full bg-text text-bg text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                                查看项目
                            </button>
                            <button
                                onClick={() => setCurrentView('articles')}
                                className="px-5 py-2.5 rounded-full bg-white border border-border text-text text-sm font-medium hover:border-accent transition-colors"
                            >
                                浏览文章
                            </button>
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="px-5 py-2.5 rounded-full bg-white border border-border text-taupe text-sm font-medium hover:text-text transition-colors inline-flex items-center gap-2"
                            >
                                <Search size={14} /> 搜索
                            </button>
                        </div>
                    </article>

                    <article className="neo-card p-0 overflow-hidden animate-rise" style={{ animationDelay: '70ms' }}>
                        <header className="px-6 md:px-8 py-5 border-b border-border flex items-center justify-between gap-3">
                            <div>
                                <h2 className="font-serif text-2xl text-text">内容流</h2>
                                <p className="text-sm text-taupe mt-1">最近更新的文章与思考</p>
                            </div>
                            <button
                                onClick={() => setCurrentView('articles')}
                                className="hidden sm:inline-flex items-center gap-1 text-sm text-taupe hover:text-text transition-colors"
                            >
                                查看全部 <ArrowUpRight size={14} />
                            </button>
                        </header>

                        {recentArticles.length > 0 ? (
                            <div className="divide-y divide-border">
                                {recentArticles.map((article) => (
                                    <button
                                        key={article.id}
                                        onClick={() => handleReadArticle(article)}
                                        className="w-full text-left px-6 md:px-8 py-5 hover:bg-hover-bg transition-colors"
                                    >
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                                            <div className="min-w-0">
                                                <h3 className="font-medium text-lg text-text leading-snug truncate">{article.title}</h3>
                                                <p className="text-sm text-taupe mt-2 line-clamp-2">{article.excerpt}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {article.tags.slice(0, 3).map((tag) => (
                                                        <span key={tag} className="text-xs px-2 py-1 rounded-full border border-border bg-bg text-taupe">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-xs text-taupe flex items-center gap-3">
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock3 size={12} />
                                                    {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                                                </span>
                                                {article.pdfUrl && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Eye size={12} />
                                                        PDF
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="px-8 py-12 text-center text-taupe">暂无已发布内容</div>
                        )}
                    </article>

                    {featuredArticle && (
                        <article
                            onClick={() => handleReadArticle(featuredArticle)}
                            className="neo-card p-7 md:p-8 cursor-pointer group animate-rise"
                            style={{ animationDelay: '120ms' }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] tracking-[0.18em] uppercase font-semibold text-accent">Featured Essay</span>
                                <span className="text-xs text-taupe">
                                    {new Date(featuredArticle.createdAt).toLocaleDateString('zh-CN')}
                                </span>
                            </div>
                            <h3 className="font-serif text-2xl md:text-3xl text-text group-hover:text-accent transition-colors leading-snug">
                                {featuredArticle.title}
                            </h3>
                            <p className="mt-3 text-sm md:text-base text-taupe leading-relaxed line-clamp-3">{featuredArticle.excerpt}</p>
                            <div className="mt-5 inline-flex items-center gap-1 text-sm text-text">
                                阅读全文 <ArrowUpRight size={14} />
                            </div>
                        </article>
                    )}

                    <article className="neo-card p-7 animate-rise" style={{ animationDelay: '170ms' }}>
                        <header className="flex items-center justify-between mb-5">
                            <h3 className="font-serif text-2xl text-text">近期项目</h3>
                            <button onClick={() => setCurrentView('projects')} className="text-sm text-taupe hover:text-text transition-colors">
                                全部项目
                            </button>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {publishedProjects.slice(0, 2).map((project) => (
                                <button
                                    key={project.id}
                                    onClick={() => handleViewProject(project)}
                                    className="text-left rounded-2xl border border-border bg-white overflow-hidden hover:shadow-md transition-all"
                                >
                                    <div className="aspect-[16/9] bg-hover-bg overflow-hidden">
                                        <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-serif text-lg text-text">{project.title}</h4>
                                            <span className="text-xs text-taupe font-mono shrink-0">{project.year}</span>
                                        </div>
                                        <p className="mt-2 text-sm text-taupe line-clamp-2">{project.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </article>
                </section>

                <aside className="space-y-6">
                    <article className="neo-card p-6 animate-rise" style={{ animationDelay: '80ms' }}>
                        <h3 className="text-xs uppercase tracking-[0.22em] text-taupe mb-4">Site Metrics</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-border bg-white p-3">
                                <div className="text-2xl font-semibold text-text">{publishedArticles.length}</div>
                                <div className="text-xs text-taupe mt-1">Articles</div>
                            </div>
                            <div className="rounded-xl border border-border bg-white p-3">
                                <div className="text-2xl font-semibold text-text">{publishedProjects.length}</div>
                                <div className="text-xs text-taupe mt-1">Projects</div>
                            </div>
                            <div className="rounded-xl border border-border bg-white p-3">
                                <div className="text-2xl font-semibold text-text">{publishedPapers.length}</div>
                                <div className="text-xs text-taupe mt-1">Papers</div>
                            </div>
                            <div className="rounded-xl border border-border bg-white p-3">
                                <div className="text-2xl font-semibold text-text">{topTags.length}</div>
                                <div className="text-xs text-taupe mt-1">Topics</div>
                            </div>
                        </div>
                    </article>

                    <article className="neo-card p-6 animate-rise" style={{ animationDelay: '130ms' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-serif text-xl text-text">热门标签</h3>
                            <button onClick={() => setCurrentView('articles')} className="text-xs text-taupe hover:text-text transition-colors">
                                浏览
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {topTags.length > 0 ? (
                                topTags.map(([tag, count]) => (
                                    <button
                                        key={tag}
                                        onClick={() => setCurrentView('articles')}
                                        className="text-xs px-2.5 py-1.5 rounded-full border border-border bg-white text-taupe hover:text-text hover:border-accent transition-colors"
                                    >
                                        {tag} · {count}
                                    </button>
                                ))
                            ) : (
                                <p className="text-sm text-taupe">暂无标签</p>
                            )}
                        </div>
                    </article>

                    <article className="neo-card p-6 animate-rise" style={{ animationDelay: '180ms' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-serif text-xl text-text">研究速览</h3>
                            <button onClick={() => setCurrentView('papers')} className="text-xs text-taupe hover:text-text transition-colors">
                                查看全部
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {publishedPapers.slice(0, 6).map((paper) => (
                                <button
                                    key={paper.id}
                                    onClick={() => openPaper(paper)}
                                    className="aspect-[3/4] rounded-lg overflow-hidden border border-border bg-hover-bg"
                                    title={paper.title}
                                >
                                    <img src={paper.imageUrl} alt={paper.title} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </article>

                    <article className="neo-card p-6 animate-rise" style={{ animationDelay: '230ms' }}>
                        <h3 className="text-xs uppercase tracking-[0.22em] text-taupe mb-4">Current Focus</h3>
                        <ul className="space-y-3 text-sm text-taupe">
                            <li className="inline-flex items-center gap-2">
                                <Layers3 size={14} className="text-accent" />
                                Build tools for learning and memory.
                            </li>
                            <li className="inline-flex items-center gap-2">
                                <BookOpen size={14} className="text-accent" />
                                Write practical notes from real projects.
                            </li>
                        </ul>
                    </article>
                </aside>
            </div>
        </div>
    );

    const renderContent = () => {
        if (isInitializing) {
            return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-taupe">
                    <Loader2 size={32} className="animate-spin mb-3" />
                    <p>正在加载内容...</p>
                </div>
            );
        }

        switch (currentView) {
            case 'home':
                return renderHome();
            case 'articles':
                return <ArticleList articles={publishedArticles} onRead={handleReadArticle} />;
            case 'article-detail':
                return selectedArticle ? <ArticleDetail article={selectedArticle} onBack={() => setCurrentView('articles')} /> : null;
            case 'projects':
                return <ProjectList projects={publishedProjects} onViewProject={handleViewProject} />;
            case 'project-detail':
                return selectedProject ? <ProjectDetail project={selectedProject} onBack={() => setCurrentView('projects')} /> : null;
            case 'papers':
                return <PaperList papers={publishedPapers} />;
            case 'admin':
                return user ? (
                    <AdminView
                        user={user}
                        articles={articles}
                        projects={projects}
                        papers={papers}
                        onArticleCreate={handleArticleCreate}
                        onArticleEdit={handleArticleEdit}
                        onArticleDelete={handleArticleDelete}
                        onProjectCreate={handleProjectCreate}
                        onProjectEdit={handleProjectEdit}
                        onProjectDelete={handleProjectDelete}
                        onPaperCreate={handlePaperCreate}
                        onPaperEdit={handlePaperEdit}
                        onPaperDelete={handlePaperDelete}
                        onLogout={handleLogout}
                    />
                ) : (
                    <div className="text-center py-20 text-taupe">Access Denied</div>
                );
            case 'login':
                return (
                    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                        <div className="w-full max-w-sm neo-card p-8">
                            <div className="text-center mb-8">
                                <BookOpen size={40} className="mx-auto text-text mb-4" />
                                <h2 className="font-serif text-3xl text-text">管理员登录</h2>
                                <p className="text-sm text-taupe mt-2">使用你的邮箱密码进入后台</p>
                            </div>

                            {loginError && (
                                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                                    {loginError}
                                </div>
                            )}

                            {!isSupabaseConfigured && (
                                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 px-3 py-2 text-xs">
                                    当前未配置 Supabase，登录后将以本地模式演示。
                                </div>
                            )}

                            <form onSubmit={handleLogin} className="space-y-5">
                                <input
                                    type="email"
                                    placeholder="邮箱"
                                    className="neo-input"
                                    value={loginEmail}
                                    onChange={(event) => setLoginEmail(event.target.value)}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="密码"
                                    className="neo-input"
                                    value={loginPassword}
                                    onChange={(event) => setLoginPassword(event.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={isLoginSubmitting}
                                    className="w-full rounded-xl bg-text text-bg py-3 text-sm hover:bg-accent transition-colors disabled:opacity-70"
                                >
                                    {isLoginSubmitting ? '登录中...' : '进入后台'}
                                </button>
                            </form>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-bg selection:bg-accent selection:text-white">
            <Navbar currentView={currentView} setCurrentView={setCurrentView} user={user} onSearchClick={() => setIsSearchOpen(true)} />

            <main className="md:ml-[280px] min-h-screen">
                <div className={`${currentView === 'home' ? 'max-w-[1320px]' : 'max-w-6xl'} mx-auto px-4 sm:px-6 lg:px-10 pt-20 md:pt-8 pb-12`}>
                    {runtimeMessage && (
                        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 px-4 py-3 text-sm inline-flex items-start gap-2">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                            <span>{runtimeMessage}</span>
                        </div>
                    )}
                    {renderContent()}

                    <footer className="mt-16 py-8 border-t border-border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-sm text-taupe">
                        <div>© 2026 YiShu Archive</div>
                        <div className="flex items-center gap-5">
                            <a href="https://github.com/yishu-ziyu" target="_blank" rel="noopener noreferrer" className="hover:text-text transition-colors">
                                GitHub
                            </a>
                            <a href="#" className="hover:text-text transition-colors">LinkedIn</a>
                            <a href="#" className="hover:text-text transition-colors">Twitter</a>
                        </div>
                        <div className="italic font-serif">Archive Dashboard Style</div>
                    </footer>
                </div>
            </main>

            <SearchOverlay
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                articles={visibleArticles}
                projects={visibleProjects}
                papers={visiblePapers}
                onNavigate={handleNavigateFromSearch}
            />
        </div>
    );
}

export default App;
