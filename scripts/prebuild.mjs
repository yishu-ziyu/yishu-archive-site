#!/usr/bin/env node
/**
 * 预构建脚本：直连 Supabase REST API 拉取所有 published 数据，
 * 写入 constants.ts，使静态部署（如 PinMe/IPFS）也能展示完整内容。
 *
 * 用法：node scripts/prebuild.mjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qrmmlolsslnxiamznicf.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_p4HHa8VVccEHGTxgOjk9bg_44H3MP51';

async function fetchTable(table) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&status=eq.published&order=created_at.desc`;
    console.log(`  → 拉取: ${table}`);
    const res = await fetch(url, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
    });
    if (!res.ok) throw new Error(`fetch ${table} 失败: ${res.status} ${res.statusText}`);
    return res.json();
}

function escapeForTemplate(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function toTimestamp(value) {
    if (!value) return 'Date.now()';
    const t = Date.parse(value);
    return Number.isNaN(t) ? 'Date.now()' : String(t);
}

function serializeArticle(row) {
    const tags = (row.tags || []).map((t) => JSON.stringify(t)).join(', ');
    const lines = [
        `        id: ${JSON.stringify(row.id)},`,
        `        title: ${JSON.stringify(row.title)},`,
        `        excerpt: ${JSON.stringify(row.excerpt || '')},`,
        `        content: \`${escapeForTemplate(row.content || '')}\`,`,
    ];
    if (row.pdf_url) lines.push(`        pdfUrl: ${JSON.stringify(row.pdf_url)},`);
    if (row.external_url) lines.push(`        externalUrl: ${JSON.stringify(row.external_url)},`);
    lines.push(`        tags: [${tags}],`);
    lines.push(`        status: ${JSON.stringify(row.status || 'published')},`);
    lines.push(`        createdAt: ${toTimestamp(row.created_at)},`);
    if (row.updated_at) lines.push(`        updatedAt: ${toTimestamp(row.updated_at)},`);
    return `    {\n${lines.join('\n')}\n    }`;
}

function serializeProject(row) {
    const techStack = (row.tech_stack || []).map((t) => JSON.stringify(t)).join(', ');
    const lines = [
        `        id: ${JSON.stringify(row.id)},`,
        `        title: ${JSON.stringify(row.title)},`,
        `        description: ${JSON.stringify(row.description)},`,
        `        repoUrl: ${JSON.stringify(row.repo_url)},`,
        `        techStack: [${techStack}],`,
        `        imageUrl: ${JSON.stringify(row.image_url)},`,
        `        year: ${JSON.stringify(row.year)},`,
    ];
    if (row.stars != null) lines.push(`        stars: ${row.stars},`);
    if (row.content) lines.push(`        content: \`${escapeForTemplate(row.content)}\`,`);
    lines.push(`        status: ${JSON.stringify(row.status || 'published')},`);
    if (row.created_at) lines.push(`        createdAt: ${toTimestamp(row.created_at)},`);
    if (row.updated_at) lines.push(`        updatedAt: ${toTimestamp(row.updated_at)},`);
    return `    {\n${lines.join('\n')}\n    }`;
}

function serializePaper(row) {
    const lines = [
        `        id: ${JSON.stringify(row.id)},`,
        `        title: ${JSON.stringify(row.title)},`,
        `        abstract: ${JSON.stringify(row.abstract)},`,
        `        journal: ${JSON.stringify(row.journal)},`,
    ];
    if (row.pdf_url) lines.push(`        pdfUrl: ${JSON.stringify(row.pdf_url)},`);
    lines.push(`        imageUrl: ${JSON.stringify(row.image_url)},`);
    lines.push(`        year: ${JSON.stringify(row.year)},`);
    lines.push(`        category: ${JSON.stringify(row.category)},`);
    lines.push(`        status: ${JSON.stringify(row.status || 'published')},`);
    if (row.created_at) lines.push(`        createdAt: ${toTimestamp(row.created_at)},`);
    if (row.updated_at) lines.push(`        updatedAt: ${toTimestamp(row.updated_at)},`);
    return `    {\n${lines.join('\n')}\n    }`;
}

async function main() {
    console.log(`🔄 从 Supabase 拉取 published 数据...`);

    const [articles, projects, papers] = await Promise.all([
        fetchTable('articles'),
        fetchTable('projects'),
        fetchTable('papers'),
    ]);

    console.log(`  ✅ 文章: ${articles.length} 篇`);
    console.log(`  ✅ 项目: ${projects.length} 个`);
    console.log(`  ✅ 论文: ${papers.length} 篇`);

    const output = `import { Article, Project, Paper } from './types';

// ⚠️ 此文件由 scripts/prebuild.mjs 自动生成
// 生成时间: ${new Date().toISOString()}
// 数据来源: Supabase (published only)

export const INITIAL_ARTICLES: Article[] = [
${articles.map(serializeArticle).join(',\n')}
];

export const INITIAL_PROJECTS: Project[] = [
${projects.map(serializeProject).join(',\n')}
];

export const INITIAL_PAPERS: Paper[] = [
${papers.map(serializePaper).join(',\n')}
];
`;

    const fs = await import('node:fs');
    const path = await import('node:path');
    const outPath = path.resolve(import.meta.dirname, '..', 'constants.ts');
    fs.writeFileSync(outPath, output, 'utf-8');
    console.log(`\n✅ 已写入 constants.ts (${(output.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
    console.error('❌ 预构建失败:', err.message);
    process.exit(1);
});
