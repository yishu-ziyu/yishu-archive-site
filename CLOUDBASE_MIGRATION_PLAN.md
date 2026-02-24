# CloudBase Migration Plan / CloudBase 迁移完整方案

Last updated: 2026-02-24

## 1) Goal / 目标

### EN
- Keep current product capability unchanged:
  - Public frontend sharing
  - Admin backend with email + password
  - One-admin-only policy
  - Real-time publish/unpublish for articles/projects/papers
- Improve accessibility for users in Mainland China.
- Reduce dependency on unstable preview/default domains.

### 中文
- 保持当前产品能力不变：
  - 前台公开访问
  - 邮箱密码后台登录
  - 仅 1 位管理员
  - 文章/项目/研究实时上架下架
- 提升中国大陆访问稳定性。
- 降低对临时预览域名和不稳定默认域名的依赖。

---

## 2) Current Baseline / 当前基线

### EN
- Frontend is already switched to same-origin API mode (`/api/*`).
- Current backend logic exists in:
  - `node-functions/api/[[default]].js` (EdgeOne-compatible API gateway)
- Data currently resides in Supabase.

### 中文
- 前端已切换为同域 API 模式（`/api/*`）。
- 当前后端逻辑已集中在：
  - `node-functions/api/[[default]].js`（EdgeOne 兼容 API 网关）
- 目前数据仍在 Supabase。

---

## 3) Target Architecture / 目标架构

### EN
1. CloudBase Hosting: serve frontend static files (`dist`).
2. CloudBase Cloud Function (HTTP): serve `/api/*` endpoints.
3. CloudBase Document Database: store `articles`, `projects`, `papers`, `admin_users`.
4. Custom domain (ICP filed) for stable browser access in Mainland China.

### 中文
1. CloudBase 静态托管：承载前端 `dist`。
2. CloudBase 云函数（HTTP）：承载 `/api/*` 接口。
3. CloudBase 文档型数据库：存储 `articles`、`projects`、`papers`、`admin_users`。
4. 使用已备案自定义域名：保障中国大陆浏览器稳定访问。

---

## 4) Migration Strategy / 迁移策略

## Phase A - Stabilize and freeze / 阶段 A：冻结现网

### EN
- Keep current Vercel/Supabase online as fallback.
- Create a migration branch: `codex/cloudbase-migration`.
- No DNS cutover before full acceptance.

### 中文
- 先保留当前 Vercel/Supabase 作为回滚兜底。
- 创建迁移分支：`codex/cloudbase-migration`。
- 在完整验收前，不切换正式域名 DNS。

---

## Phase B - CloudBase environment setup / 阶段 B：CloudBase 环境准备

### EN
1. Create one CloudBase environment (production).
2. Enable:
   - Hosting
   - Cloud Function
   - Document Database
3. Record env id (for deployment scripts/CLI).

### 中文
1. 新建一个 CloudBase 环境（生产环境）。
2. 开通：
   - 静态托管
   - 云函数
   - 文档型数据库
3. 记录环境 ID（后续部署脚本/CLI 使用）。

---

## Phase C - Backend migration (`/api/*`) / 阶段 C：后端迁移

### EN
- Replace Supabase proxy implementation with CloudBase-native implementation while keeping API contract unchanged.
- Keep endpoint paths exactly the same:
  - `POST /api/auth/login`
  - `GET /api/auth/session`
  - `POST /api/auth/logout`
  - `GET/POST/PATCH/DELETE /api/content/articles`
  - `GET/POST/PATCH/DELETE /api/content/projects`
  - `GET/POST/PATCH/DELETE /api/content/papers`

### 中文
- 将 Supabase 代理实现替换为 CloudBase 原生实现，但保持接口契约不变。
- 路由路径保持完全一致：
  - `POST /api/auth/login`
  - `GET /api/auth/session`
  - `POST /api/auth/logout`
  - `GET/POST/PATCH/DELETE /api/content/articles`
  - `GET/POST/PATCH/DELETE /api/content/projects`
  - `GET/POST/PATCH/DELETE /api/content/papers`

### Auth model / 登录模型

### EN
- Keep one-admin-only by `admin_users` collection (single doc).
- Store admin email and password hash (bcrypt), not plain text.
- Function issues HttpOnly cookie session after login.

### 中文
- 用 `admin_users` 集合实现单管理员（仅 1 条管理员文档）。
- 存储邮箱 + 密码哈希（bcrypt），不存明文。
- 登录成功后由云函数签发 HttpOnly Cookie 会话。

---

## Phase D - Database migration / 阶段 D：数据库迁移

### EN
Collections to create:
- `articles`
- `projects`
- `papers`
- `admin_users`

Recommended indexes:
- `articles`: `status`, `createdAt`
- `projects`: `status`, `createdAt`
- `papers`: `status`, `createdAt`
- `admin_users`: unique index on `email`

Data migration method:
1. Export current Supabase data to JSON (articles/projects/papers).
2. Import JSON into CloudBase collection manager (Upsert mode).
3. Insert one admin record into `admin_users`.

### 中文
目标集合：
- `articles`
- `projects`
- `papers`
- `admin_users`

建议索引：
- `articles`: `status`, `createdAt`
- `projects`: `status`, `createdAt`
- `papers`: `status`, `createdAt`
- `admin_users`: `email` 唯一索引

数据迁移方式：
1. 从 Supabase 导出 `articles/projects/papers` 为 JSON。
2. 在 CloudBase 集合管理中按 Upsert 导入。
3. 手动写入 `admin_users` 单管理员记录。

---

## Phase E - Frontend deployment / 阶段 E：前端部署

### EN
Build config:
- Install: `npm install`
- Build: `npm run build`
- Output: `dist`

Deploy target:
- CloudBase Hosting (Git deployment or CLI deployment)

### 中文
构建配置：
- 安装命令：`npm install`
- 构建命令：`npm run build`
- 输出目录：`dist`

部署目标：
- CloudBase 静态托管（Git 部署或 CLI 部署）

---

## Phase F - Domain and compliance / 阶段 F：域名与合规

### EN
- For long-term public browser access in Mainland China: custom domain + ICP filing is required.
- Default/testing domains may show warning/interstitial and should not be used for public sharing.

### 中文
- 面向中国大陆长期公开访问：必须使用已备案自定义域名。
- 默认/测试域名可能出现警示中间页，不适合对外分享。

---

## 5) Execution Runbook for next session / 下次会话执行清单（按顺序）

### Step 1 / 第 1 步：Create CloudBase environment
- Console path / 控制台路径：CloudBase -> 环境 -> 新建环境
- Fill / 填写：
  - Environment name: `yishu-archive-prod`
  - Region: choose Mainland-friendly region

### Step 2 / 第 2 步：Create collections + indexes
- Path / 路径：CloudBase -> 文档型数据库 -> 集合管理
- Create / 创建：`articles`, `projects`, `papers`, `admin_users`
- Add indexes / 添加索引：按“Phase D”配置

### Step 3 / 第 3 步：Migrate backend code
- Action / 操作：
  - Replace Supabase calls in `node-functions/api/[[default]].js` with CloudBase DB operations
  - Keep API response schema unchanged
- Result / 结果：前端无需改动

### Step 4 / 第 4 步：Import content data
- Export from Supabase -> JSON
- Import into CloudBase collections (upsert)

### Step 5 / 第 5 步：Set one admin account
- Insert admin doc in `admin_users` with:
  - `email`
  - `passwordHash`
  - `createdAt`

### Step 6 / 第 6 步：Deploy frontend + function
- Build & deploy hosting
- Deploy cloud function and bind HTTP route `/api/*`

### Step 7 / 第 7 步：Acceptance test
- Public page opens
- Admin login works
- Publish/unpublish syncs to frontend
- Search/list visibility matches `status`

### Step 8 / 第 8 步：Domain cutover
- Bind filed custom domain
- Switch DNS after acceptance

---

## 6) Acceptance Criteria / 验收标准

### EN
- `GET /api/auth/session` returns `{"user":null}` before login.
- Admin can login with email/password and see backend.
- Draft content hidden on public pages.
- Publish/unpublish reflected on frontend within refresh cycle.
- Public domain opens without browser security interstitial.

### 中文
- 未登录时 `GET /api/auth/session` 返回 `{"user":null}`。
- 管理员可邮箱密码登录并进入后台。
- 草稿内容不会在前台公开。
- 上下架后，前台刷新即可看到同步结果。
- 对外域名无浏览器安全警示中间页。

---

## 7) Rollback Plan / 回滚方案

### EN
- If CloudBase release fails at any phase:
  1. Keep DNS/domain pointing to current stable channel.
  2. Continue serving from existing Vercel/Supabase stack.
  3. Fix in migration branch and retry.

### 中文
- 若 CloudBase 任一阶段失败：
  1. 域名/DNS 不切换，继续指向当前稳定链路；
  2. 继续使用现有 Vercel/Supabase 服务；
  3. 在迁移分支修复后再重试。

---

## 8) References / 参考文档

- CloudBase Hosting Overview: https://docs.cloudbase.net/hosting/introduce
- CloudBase Hosting Quick Start: https://docs.cloudbase.net/hosting/quick-start
- CloudBase Cloud Function Overview: https://docs.cloudbase.net/cloud-function/introduce
- CloudBase HTTP Access to Functions: https://docs.cloudbase.net/service/access-cloud-function
- CloudBase HTTP Service Overview (default domain limitations): https://docs.cloudbase.net/service/introduce
- CloudBase Custom Domain: https://docs.cloudbase.net/service/custom-domain
- CloudBase Database Overview: https://docs.cloudbase.net/database/doc-introduce
- CloudBase Database Import/Export: https://docs.cloudbase.net/database/manage
- CloudBase Auth Overview: https://docs.cloudbase.net/authentication-v2/auth/introduce
