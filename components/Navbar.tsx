import React, { useState } from 'react';
import { Menu, X, Search, ArrowUpRight, Mail, Coffee } from 'lucide-react';
import { ViewState, User } from '../types';

interface NavbarProps {
    currentView: ViewState | 'project-detail';
    setCurrentView: (view: ViewState | 'project-detail') => void;
    user: User | null;
    onSearchClick: () => void;
}

type NavItem = {
    view: ViewState;
    label: string;
};

const NAV_ITEMS: NavItem[] = [
    { view: 'home', label: '首页' },
    { view: 'articles', label: '内容' },
    { view: 'projects', label: '项目' },
    { view: 'papers', label: '研究' },
];

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, user, onSearchClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isActive = (view: ViewState) => {
        if (view === 'projects' && currentView === 'project-detail') {
            return true;
        }
        return currentView === view;
    };

    return (
        <>
            <header className="md:hidden fixed top-0 inset-x-0 z-50 h-16 border-b border-border bg-bg/95 backdrop-blur-sm">
                <div className="h-full px-4 flex items-center justify-between">
                    <button
                        onClick={() => setCurrentView('home')}
                        className="font-serif text-xl text-text tracking-tight"
                    >
                        <span className="italic text-taupe">YiShu</span>
                        <span className="ml-1.5 font-semibold">Archive</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onSearchClick}
                            className="p-2 text-taupe hover:text-text transition-colors"
                            aria-label="打开搜索"
                        >
                            <Search size={20} />
                        </button>
                        <button
                            onClick={() => setIsMenuOpen((open) => !open)}
                            className="p-2 text-taupe hover:text-text transition-colors"
                            aria-label={isMenuOpen ? '关闭菜单' : '打开菜单'}
                        >
                            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </header>

            {isMenuOpen && (
                <div className="md:hidden fixed top-16 inset-x-0 z-40 border-b border-border bg-white px-4 py-4 animate-in slide-in-from-top-2 duration-200">
                    <nav className="space-y-1">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.view}
                                onClick={() => {
                                    setCurrentView(item.view);
                                    setIsMenuOpen(false);
                                }}
                                className={`w-full text-left rounded-xl px-4 py-3 text-sm transition-colors ${
                                    isActive(item.view) ? 'bg-text text-bg' : 'text-taupe hover:bg-hover-bg hover:text-text'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                setCurrentView(user ? 'admin' : 'login');
                                setIsMenuOpen(false);
                            }}
                            className="w-full text-left rounded-xl px-4 py-3 text-sm text-taupe hover:bg-hover-bg hover:text-text transition-colors"
                        >
                            {user ? '后台管理' : '作者登录'}
                        </button>
                    </nav>
                </div>
            )}

            <aside className="hidden md:flex fixed top-0 left-0 h-screen w-[280px] border-r border-border bg-sidebar px-6 py-8 z-40 overflow-y-auto neo-scroll">
                <div className="w-full flex flex-col h-full">
                    <button
                        onClick={() => setCurrentView('home')}
                        className="flex items-center gap-3 text-left mb-9 group"
                    >
                        <div className="h-12 w-12 rounded-full overflow-hidden border border-border bg-white shadow-sm">
                            <img
                                src="https://api.dicebear.com/9.x/glass/svg?seed=YiShu"
                                alt="YiShu Avatar"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div>
                            <div className="font-serif text-2xl text-text leading-none">
                                YiShu <span className="italic text-taupe">Archive</span>
                            </div>
                            <div className="text-xs text-taupe mt-1">Personal Dashboard</div>
                        </div>
                    </button>

                    <button
                        onClick={onSearchClick}
                        className="inline-flex items-center justify-between rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-taupe hover:text-text hover:border-accent transition-colors mb-6"
                    >
                        <span className="inline-flex items-center gap-2">
                            <Search size={15} />
                            搜索内容
                        </span>
                        <span className="text-[11px] text-taupe/80">⌘K</span>
                    </button>

                    <nav className="space-y-1">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.view}
                                onClick={() => setCurrentView(item.view)}
                                className={`w-full text-left rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                                    isActive(item.view)
                                        ? 'bg-text text-bg shadow-sm'
                                        : 'text-taupe hover:bg-white hover:text-text'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentView(user ? 'admin' : 'login')}
                            className={`w-full text-left rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                                isActive('admin')
                                    ? 'bg-text text-bg shadow-sm'
                                    : 'text-taupe hover:bg-white hover:text-text'
                            }`}
                        >
                            {user ? '后台管理' : '作者登录'}
                        </button>
                    </nav>

                    <div className="mt-8 space-y-2">
                        <div className="text-[11px] tracking-[0.18em] uppercase text-taupe/70">Social</div>
                        <a
                            href="https://github.com/yishu-ziyu"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm text-taupe hover:bg-white hover:text-text transition-colors"
                        >
                            GitHub <ArrowUpRight size={13} />
                        </a>
                        <a
                            href="#"
                            className="inline-flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm text-taupe hover:bg-white hover:text-text transition-colors"
                        >
                            X (Twitter) <ArrowUpRight size={13} />
                        </a>
                    </div>

                    <div className="mt-auto pt-8">
                        <p className="text-sm leading-relaxed text-text mb-3">
                            Z 世代 Builder，持续构建 AI + Learning 工具。
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentView('login')}
                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border border-border bg-white px-3 py-2 text-xs text-taupe hover:text-text transition-colors"
                            >
                                <Mail size={12} />
                                联系我
                            </button>
                            <button
                                type="button"
                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border border-border bg-white px-3 py-2 text-xs text-taupe hover:text-text transition-colors"
                            >
                                <Coffee size={12} />
                                支持
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};
