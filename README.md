# YiShu Archive Personal Website

一个可公开展示内容、并可通过后台实时管理文章/项目/研究的个人网站。

## 本地运行

```bash
npm install
npm run dev
```

## 环境变量

参考 `/Users/mahaoxuan/Desktop/黑曜石/奕枢/vibe coding/个人网站/yishu-archive---personal-portfolio 2/.env.example`：

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

当前架构为：

- 前端只请求同域 `/api/*`
- Vercel API 再去访问 Supabase（前端不再直接连 Supabase）

未配置 Supabase 变量时，网站会以本地静态数据模式运行。

## 单管理员后台（邮箱密码）

完整操作文档见：

- `/Users/mahaoxuan/Desktop/黑曜石/奕枢/vibe coding/个人网站/yishu-archive---personal-portfolio 2/SUPABASE_SETUP.md`

该方案支持：

- 邮箱密码登录后台
- 仅一个管理员账号可管理（数据库层强限制）
- 文章/项目/研究统一支持上架(`published`)与下架(`draft`)
- 公开前台 + 管理后台分权
