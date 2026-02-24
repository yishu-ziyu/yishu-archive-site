import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, Tag, ExternalLink } from 'lucide-react';
import { Article } from '../types';
import { Document, Page, pdfjs } from 'react-pdf';

// Initialize PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

// Define PDF options outside component to prevent reloading
const pdfOptions = {
    cMapUrl: `https://esm.sh/pdfjs-dist@4.4.168/cmaps/`,
    cMapPacked: true,
};

interface ArticleDetailProps {
    article: Article;
    onBack: () => void;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onBack }) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Calculate optimal width for the PDF page
    const pdfWidth = Math.min(windowWidth - 48, 800); // 48px is padding

    // Use direct string for file prop to avoid object shape validation errors in pdfjs
    const file = article.pdfUrl;

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    const changePage = (offset: number) => {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    };

    const previousPage = () => changePage(-1);
    const nextPage = () => changePage(1);

    return (
        <article className="py-8 md:py-12 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500 min-h-screen flex flex-col">
            {/* Top Navigation Bar */}
            <div className="flex justify-between items-center mb-8 px-4 md:px-0">
                <button 
                    onClick={onBack}
                    className="group flex items-center text-taupe hover:text-accent transition-colors font-sans text-sm tracking-wide"
                >
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span className="hidden md:inline">返回目录</span>
                </button>
                
                <div className="flex items-center gap-4 text-taupe text-sm">
                   {article.externalUrl && (
                        <a 
                            href={article.externalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:text-text flex items-center gap-1 transition-colors" 
                            title="访问原文链接"
                        >
                            <ExternalLink size={16} /> <span className="hidden md:inline">阅读原文</span>
                        </a>
                   )}
                   {article.pdfUrl && (
                        <a href={article.pdfUrl} download className="hover:text-text flex items-center gap-1 transition-colors" title="下载 PDF">
                            <Download size={16} /> <span className="hidden md:inline">下载</span>
                        </a>
                   )}
                </div>
            </div>

            {/* Article Header */}
            <header className="text-center mb-10 px-4">
                <div className="text-accent text-xs font-bold tracking-[0.2em] uppercase mb-4">
                    {article.pdfUrl ? 'Academic Paper' : 'Original Essay'}
                </div>
                <h1 className="font-serif text-3xl md:text-5xl leading-tight mb-6 text-text">
                    {article.title}
                </h1>
                
                {/* Meta info & Tags */}
                <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-taupe font-sans text-sm">
                    <div className="flex items-center">
                        <Calendar size={14} className="mr-2" />
                        {new Date(article.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                    </div>
                    {article.tags && article.tags.length > 0 && (
                        <div className="hidden md:block w-1 h-1 bg-taupe/40 rounded-full"></div>
                    )}
                    <div className="flex flex-wrap justify-center gap-2">
                        {article.tags?.map(tag => (
                            <span key={tag} className="flex items-center bg-gray-100 px-2 py-1 rounded text-xs text-taupe">
                                <Tag size={10} className="mr-1" /> {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            {/* Content Section */}
            <div className="flex-grow flex flex-col items-center bg-[#F4F4F4]/50 border-y border-border py-8 md:rounded-lg md:border-x min-h-[600px] relative">
                {file ? (
                    <>
                        {/* PDF Controls - Floating Style */}
                        <div className="sticky top-24 z-10 bg-white/90 backdrop-blur border border-border rounded-full px-6 py-2 shadow-sm mb-8 flex items-center gap-6 transition-all duration-300">
                             <div className="flex items-center gap-2 border-r border-border pr-6">
                                <button 
                                    onClick={previousPage} 
                                    disabled={pageNumber <= 1}
                                    className="p-1 hover:text-accent disabled:opacity-30 transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="font-sans text-sm font-medium w-16 text-center tabular-nums">
                                    {pageNumber} / {numPages || '--'}
                                </span>
                                <button 
                                    onClick={nextPage} 
                                    disabled={numPages ? pageNumber >= numPages : false}
                                    className="p-1 hover:text-accent disabled:opacity-30 transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={() => setScale(s => Math.max(0.6, s - 0.1))} className="p-1 hover:text-accent transition-colors">
                                    <ZoomOut size={18} />
                                </button>
                                <span className="text-xs font-sans text-taupe w-12 text-center">{Math.round(scale * 100)}%</span>
                                <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-1 hover:text-accent transition-colors">
                                    <ZoomIn size={18} />
                                </button>
                            </div>
                        </div>

                        {/* PDF Document */}
                        <div className="shadow-lg transition-transform duration-200">
                            <Document
                                file={file}
                                onLoadSuccess={onDocumentLoadSuccess}
                                options={pdfOptions}
                                loading={
                                    <div className="flex flex-col items-center justify-center h-96 text-taupe animate-pulse">
                                        <div className="w-12 h-16 border-2 border-taupe mb-4 rounded-sm"></div>
                                        <p>Loading PDF...</p>
                                    </div>
                                }
                                error={
                                    <div className="flex flex-col items-center justify-center h-96 text-taupe max-w-md text-center px-6">
                                        <p className="mb-2 font-serif text-lg">无法加载 PDF 文件</p>
                                        <p className="text-sm">请检查网络连接或确认文件地址支持跨域访问。</p>
                                        <p className="text-xs mt-2 text-taupe/60">文件路径: {file}</p>
                                        <div className="mt-8 p-6 bg-white border border-border text-left w-full shadow-sm">
                                            <p className="font-bold text-xs uppercase text-taupe mb-2">Fallback Text View:</p>
                                            <p className="font-serif leading-relaxed text-text/80 text-sm line-clamp-6">{article.content}</p>
                                        </div>
                                    </div>
                                }
                            >
                                <Page 
                                    pageNumber={pageNumber} 
                                    scale={scale} 
                                    width={pdfWidth}
                                    className="bg-white"
                                    renderAnnotationLayer={false}
                                    renderTextLayer={false}
                                />
                            </Document>
                        </div>
                    </>
                ) : (
                    // Fallback / Standard Text Content (For WeChat articles etc)
                    <div className="w-full max-w-3xl px-6 md:px-12 py-8 bg-white shadow-sm font-serif-body text-text">
                         {article.externalUrl && (
                             <div className="mb-8 p-4 bg-gray-50 border border-border rounded text-sm text-taupe flex items-start gap-3">
                                 <ExternalLink size={16} className="shrink-0 mt-0.5" />
                                 <div>
                                     <p className="mb-1 font-bold">来源提示</p>
                                     <p>本文原始内容发布于外部平台。如果下方内容显示不完整，请点击右上角的“阅读原文”跳转浏览。</p>
                                 </div>
                             </div>
                         )}
                         {article.content.split('\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-6 leading-loose text-lg text-justify">
                                {paragraph || <br />}
                            </p>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-12 text-center">
                {article.pdfUrl ? (
                    <p className="font-serif italic text-taupe text-sm">Powered by React PDF</p>
                ) : (
                    <p className="font-serif italic text-taupe text-sm">YiShu Archive Original</p>
                )}
            </div>
        </article>
    );
};