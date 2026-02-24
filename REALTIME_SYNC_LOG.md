# Real-Time Sync Log / 实时同步日志

## Log Rule / 日志规则
- Always append new entries; do not overwrite historical records.
- 始终追加新记录，不覆盖历史记录。
- One entry per meaningful change set.
- 每个有意义的变更集记录一条。
- Record: timestamp, scope, files/DB touched, verification result.
- 记录要素：时间戳、变更范围、涉及文件/数据库、验证结果。

## 2026-02-24 09:00-11:10 (Local) - Session Summary

### 1) Frontend visual redesign (Nexmoe-inspired dashboard layout)
- Scope:
  - Reworked homepage and navigation into a dashboard style with left sidebar, card sections, and responsive mobile navigation.
- Main files:
  - `App.tsx`
  - `components/Navbar.tsx`
  - `index.css`
  - `index.html`
- Verification:
  - Build passed.

### 2) Supabase integration for real-time content management
- Scope:
  - Added Supabase client, auth service, content CRUD services.
  - Added environment template and setup docs.
- Main files:
  - `lib/supabase.ts`
  - `lib/authService.ts`
  - `lib/contentService.ts`
  - `.env.example`
  - `SUPABASE_SETUP.md`
- Verification:
  - Build passed.

### 3) Single-admin hardening (email/password + admin whitelist)
- Scope:
  - Login now requires both:
    - valid Supabase auth session
    - user exists in `public.admin_users`
  - Non-admin accounts are blocked from backend access.
- Main files:
  - `lib/authService.ts`
  - `supabase/schema.sql`
- Verification:
  - Build passed.

### 4) Content corrections requested by owner
- Scope:
  - Removed `recall-sticker` from article publishing (set to draft in article set).
  - Improved research section titles/copy and paper titles for clarity.
- Main files:
  - `constants.ts`
  - `components/PaperList.tsx`
- Verification:
  - Build passed.

### 5) Added status switch for projects and papers (publish/draft)
- Scope:
  - Added `status` to `Project` and `Paper` model.
  - Backend admin editor supports status toggle for projects/papers.
  - Public frontend now shows only `published` projects/papers.
  - Search visibility aligned with public/admin contexts.
  - Supabase schema and RLS policies updated for project/paper status.
- Main files:
  - `types.ts`
  - `constants.ts`
  - `components/AdminView.tsx`
  - `App.tsx`
  - `lib/contentService.ts`
  - `supabase/schema.sql`
  - `SUPABASE_SETUP.md`
  - `README.md`
- Verification:
  - Build passed.

### 6) Supabase production setup completed with owner
- Scope:
  - Configured `.env.local`:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
  - Executed `supabase/schema.sql` in Supabase SQL Editor.
  - Bound sole admin account: `yishuziyu@gmail.com` in `public.admin_users`.
  - End-to-end backend login and publish/unpublish flow tested successfully.
- Main files / DB:
  - `.env.local`
  - Supabase SQL Editor execution:
    - `supabase/schema.sql`
    - admin binding SQL for `public.admin_users`
- Verification:
  - SQL success confirmed.
  - Owner confirmed full publish/unpublish flow works.

### 7) GitHub project sync tooling added
- Scope:
  - Added script to fetch selected repos from GitHub API and generate idempotent upsert SQL for `public.projects`.
  - Generated sync SQL for 9 repositories:
    - `f5-tts-voice-chat-v2`
    - `logic-arena`
    - `Aegis-Manim`
    - `Recall-Sticker`
    - `mirror-self-monitor`
    - `yishu-svg`
    - `questspace-2.0`
    - `learn-your-way`
    - `newsnow-yi`
- Main files:
  - `scripts/generate_github_projects_sync_sql.mjs`
  - `supabase/sync_github_projects.sql`
- Verification:
  - Script executed successfully and SQL file generated.

### 8) Content consistency diagnosis and article/paper recovery sync prepared
- Scope:
  - Diagnosed production visibility mismatch:
    - `projects` had synced published data.
    - `articles` and `papers` were empty on Supabase public read.
  - Added generator script to sync articles + papers from local canonical content (`constants.ts`) into Supabase with upsert logic (match by title).
  - Generated recovery SQL for immediate execution in Supabase SQL Editor.
- Main files:
  - `scripts/generate_articles_papers_sync_sql.mjs`
  - `supabase/sync_articles_papers.sql`
- Verification:
  - Script executed successfully (`Articles: 6, Papers: 3`).
  - SQL file generated and ready for execution.

### 9) Paper cover redesign and consistency update prepared
- Scope:
  - Replaced paper cover images with 3 local, consistent, non-random design assets.
  - Updated canonical paper image URLs in `constants.ts`.
  - Regenerated article/paper sync SQL so future sync keeps the new covers.
  - Added direct SQL patch to update existing Supabase paper cover URLs in-place.
- Main files:
  - `public/assets/papers/aigc-cover.svg`
  - `public/assets/papers/labor-cover.svg`
  - `public/assets/papers/regional-cover.svg`
  - `constants.ts`
  - `supabase/sync_articles_papers.sql`
  - `supabase/update_paper_cover_urls.sql`
- Verification:
  - Build passed.
  - Cover paths confirmed in constants and generated sync SQL.

### 10) Deployment preparation: GitHub repository created and pushed
- Scope:
  - Initialized git repository for the website project.
  - Created first deploy-ready commit.
  - Created public GitHub repository and pushed `main`.
- Main files / infra:
  - Local git repository in project root
  - Remote repository: `https://github.com/yishu-ziyu/yishu-archive-site`
- Verification:
  - Remote push succeeded.
  - `main` branch tracks `origin/main`.

### 11) 2026-02-24 15:33 (CST) - Switched to Vercel API proxy architecture
- Scope:
  - Migrated from client-direct Supabase calls to same-origin Vercel API proxy (`/api/*`).
  - Added serverless auth endpoints with HttpOnly cookie session:
    - `POST /api/auth/login`
    - `GET /api/auth/session`
    - `POST /api/auth/logout`
  - Added serverless content endpoints for articles/projects/papers (GET/POST/PATCH/DELETE).
  - Rewired frontend `authService` and `contentService` to use API proxy only.
  - Updated setup docs to reflect production env and redeploy requirements.
- Files/DB touched:
  - `api/_utils/supabaseProxy.js`
  - `api/auth/login.js`
  - `api/auth/session.js`
  - `api/auth/logout.js`
  - `api/content/articles.js`
  - `api/content/projects.js`
  - `api/content/papers.js`
  - `lib/apiClient.ts`
  - `lib/authService.ts`
  - `lib/contentService.ts`
  - `lib/supabase.ts`
  - `README.md`
  - `SUPABASE_SETUP.md`
  - `.env.example`
- Verification:
  - `npm run build` passed.
  - `node --check` passed for all new API route files.
- Notes:
  - Frontend now avoids browser-side direct requests to `*.supabase.co`.
  - Vercel still requires Supabase env vars to execute serverless proxy routes.
  - Changes committed and pushed to `main` with commit `7815836`.

### 12) 2026-02-24 16:16 (CST) - Added EdgeOne Node Functions API compatibility
- Scope:
  - Added EdgeOne Node Functions catch-all API route so current `/api/*` proxy architecture works on Tencent EdgeOne.
  - Included auth/session/logout and content CRUD routing in one file: `/api/auth/*`, `/api/content/*`.
  - Kept single-admin auth rules and HttpOnly cookie session behavior aligned with existing Vercel proxy logic.
- Files/DB touched:
  - `node-functions/api/[[default]].js`
  - `REALTIME_SYNC_LOG.md`
- Verification:
  - `node --check node-functions/api/[[default]].js` passed.
  - `npm run build` passed.
- Notes:
  - EdgeOne deployment now needs only a regular redeploy from `main` to activate API routes.

### 13) 2026-02-24 17:09 (CST) - Bilingual checkpoint + CloudBase migration preparation
- Scope:
  - Added bilingual checkpoint entry to summarize all work completed so far.
  - Confirmed current status: local codebase remains end-to-end functional; EdgeOne share path has browser safety warning risk for casual sharing.
  - Prepared a full CloudBase integrated migration blueprint for next session execution.
- 范围：
  - 追加中英双语检查点，汇总当前已完成成果。
  - 确认当前状态：本地代码链路可用；EdgeOne 分享链路对普通用户存在浏览器风险拦截问题。
  - 为下次会话准备完整 CloudBase 一体化迁移蓝图。
- Files/DB touched:
  - `REALTIME_SYNC_LOG.md`
  - `CLOUDBASE_MIGRATION_PLAN.md`
- 涉及文件/数据库：
  - `REALTIME_SYNC_LOG.md`
  - `CLOUDBASE_MIGRATION_PLAN.md`
- Verification:
  - Checkpoint and migration plan documents generated.
- 验证：
  - 双语日志与迁移方案文档已生成。
- Summary (EN):
  - Frontend redesign completed (dashboard style, responsive).
  - Supabase auth + CRUD backend connected.
  - Single-admin policy enforced (`admin_users`, one-owner model).
  - Publish/draft toggle unified for articles/projects/papers.
  - GitHub repo sync SQL tooling created for projects.
  - Recovery SQL prepared for missing articles/papers.
  - Paper cover assets redesigned and synced.
  - Deployment pipeline established (GitHub + Vercel).
  - Architecture upgraded to same-origin API proxy (`/api/*`).
  - EdgeOne compatibility function added (`node-functions/api/[[default]].js`).
- 阶段总结（中文）：
  - 前端改版完成（仪表盘风格 + 响应式）。
  - Supabase 登录鉴权与内容 CRUD 已接通。
  - 单管理员模型已落地（`admin_users` 白名单 + 仅 1 位管理员）。
  - 文章/项目/研究统一支持 `published/draft` 上下架。
  - 已实现 GitHub 项目同步 SQL 生成工具。
  - 已准备文章/研究缺失数据恢复 SQL。
  - 研究封面已完成重设计并可同步到线上。
  - 已建立 GitHub + Vercel 发布流水线。
  - 架构已升级为同域 API 代理（`/api/*`）。
  - 已补齐 EdgeOne Node Functions 兼容入口（`node-functions/api/[[default]].js`）。

## Next Entry Template
```md
## YYYY-MM-DD HH:mm (Local) - <Title>
- Scope:
- Files/DB touched:
- Verification:
- Notes:
```
