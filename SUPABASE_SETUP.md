# Supabase 单管理员部署指南（邮箱密码登录）

这份指南的目标是：后台只允许你一个人登录管理，登录方式为邮箱 + 密码。

## 1. 创建 Supabase 项目

1. 打开 [Supabase 控制台](https://supabase.com/)，新建一个 Project。
2. 记住项目的 `Project URL` 和 `anon public key`（后面会用）。

## 2. 创建数据库结构与权限

1. 打开 Supabase 左侧 `SQL Editor`。
2. 把本项目文件 `/Users/mahaoxuan/Desktop/黑曜石/奕枢/vibe coding/个人网站/yishu-archive---personal-portfolio 2/supabase/schema.sql` 全部复制进去执行。
3. 执行成功后会得到：
   - `articles`、`projects`、`papers` 内容表
   - `admin_users` 管理员表（强制最多 1 条记录）
   - RLS 权限（只有管理员能增删改）
   - 文章/项目/研究三类内容都支持 `status`（`draft` 草稿下架、`published` 发布上架）

> 如果你之前已经部署过一次，也可以直接重新执行最新 `schema.sql`，它包含兼容迁移语句（会自动为已有数据补齐新字段）。

## 3. 创建你的管理员账号（邮箱密码）

1. 进入 Supabase 左侧 `Authentication` -> `Users`。
2. 点击 `Add user`，创建你的邮箱和密码。
3. 回到 `SQL Editor`，执行下面 SQL，把你设置为唯一管理员：

```sql
-- 先清空管理员表，确保只有一个管理员
delete from public.admin_users;

-- 把你的账号写入管理员表（把邮箱改成你自己的）
insert into public.admin_users (id, email)
select id, email
from auth.users
where email = 'your-email@example.com'
limit 1;
```

4. 再执行一次检查：

```sql
select * from public.admin_users;
```

看到 1 行且邮箱是你自己的，就配置完成。

## 4. 关闭公开注册（防止别人注册）

1. 进入 `Authentication` -> `Providers` -> `Email`。
2. 关闭 `Enable email signups`（或同义开关）。
3. 保留 `Email + Password` 登录能力即可。

这样别人不能自行注册新账号，后台只有你的管理员账号可用。

## 5. 配置前端环境变量

1. 在本地项目根目录创建/编辑 `.env.local`。
2. 填入：

```env
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon公钥
```

如果 `.env.local` 里有其它变量（例如旧的 `GEMINI_API_KEY`），可以保留，不冲突。

## 6. 启动网站

在项目目录运行：

```bash
npm install
npm run dev
```

打开终端给出的本地地址后：
1. 点击「作者登录」
2. 用你的邮箱密码登录
3. 登录成功后进入「后台管理」，可新增/编辑/删除文章、项目、研究

## 7. 常见问题

### 1) 提示“该账号不是后台管理员”

说明这个邮箱虽然存在于 Supabase Auth，但不在 `admin_users` 表里。  
按第 3 步把该邮箱写入 `admin_users` 即可。

### 2) 登录后看不到以前的作品

这代表 Supabase 数据表还是空的。  
之前写在代码常量里的旧内容不会自动进数据库，需要在后台重新录入或后续做一次迁移。
