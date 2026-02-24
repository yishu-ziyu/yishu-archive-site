# Real-Time Sync Log

## Log Rule
- Always append new entries; do not overwrite historical records.
- One entry per meaningful change set.
- Record: timestamp, scope, files/DB touched, verification result.

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

## Next Entry Template
```md
## YYYY-MM-DD HH:mm (Local) - <Title>
- Scope:
- Files/DB touched:
- Verification:
- Notes:
```
