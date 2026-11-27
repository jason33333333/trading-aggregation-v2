# 交易聚合 V2

基于 Next.js 15 App Router、Supabase 和 Cloudflare Workers（OpenNext）的双语交易信息与学习社区项目。

## 当前开发范围

- 首页、平台目录、平台档案详情、交易知识学院、课程详情。
- Supabase 邮箱注册/登录与邮箱验证回调。
- 平台档案、证据、费用/执行观察、用户评价等数据库结构。
- 论坛公开主题读取、邮箱验证后的发帖表单。
- 曝光类帖子统一进入待审核状态，不会直接公开。
- 管理审核页面：`/admin`，仅管理员/版主可访问。
- 审核操作记录与基础审计表。
- 中文界面基础版本；英文内容字段已预留，完整英文界面/语言切换仍在后续开发。

## 数据库初始化（重要）

本分支新增完整初始化脚本：`supabase/schema_v2.sql`。

**不要运行旧的 `supabase/schema.sql`。不要把两个脚本连续执行。**

`schema_v2.sql` 是面向空的 Supabase `public` schema 的初始化脚本。运行前请确认项目中没有需要保留的业务表。建议先对数据库做备份，并在 Supabase SQL Editor 中检查脚本内容后再执行。

执行后：
1. 在 Supabase Authentication 中启用 Email provider。
2. 配置 Site URL 和 Redirect URLs，至少加入网站域名下的 `/auth/callback`。
3. 使用网站注册管理员账户并完成邮箱验证。
4. 在 Supabase SQL Editor 中由项目所有者手动授予首个管理员角色（将邮箱替换为自己的登录邮箱）：

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users
  where email = 'YOUR_LOGIN_EMAIL'
);
```

普通用户不能通过网站客户端修改自己的角色。不要将 service_role key、数据库密码或 Cloudflare API Token 提交到仓库或发送到聊天中。

## 环境变量

Cloudflare Workers 环境中需要配置：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

浏览器端只使用 anon/publishable key；数据库权限由 RLS 控制。绝不将 service_role key 暴露给浏览器。

## 本地开发

1. Node.js 20.9 或更高版本。
2. 复制 `.env.example` 为 `.env.local` 并填写 Supabase URL 和 anon key。
3. `npm install`
4. `npm run dev`

## Cloudflare

项目原有 OpenNext/Wrangler 配置保留。此开发分支的代码尚未合并到 main；不要因为本分支提交就认为线上 Worker 已更新。合并前应完成构建测试和 Supabase 初始化，再按现有 Cloudflare Worker 的 Git 部署流程发布。

## 数据可信原则

- 平台资料必须记录来源、适用条件、核验状态和更新时间。
- 未核验资料不得标注为已核验，不得用示例资料冒充真实平台。
- 不接受交易平台付费广告、付费排名或隐性推广。
- 曝光类内容必须经过人工审核；应核对证据、保护个人隐私，并给被指涉方回应与申诉机会。
- 交易教育内容不构成个性化投资建议或收益保证。

## 当前尚未完成

- 英文完整界面及语言切换。
- 完整的平台资料管理后台、证据录入工作流与搜索筛选。
- 评论提交与审核、举报处理、申诉流程、用户封禁操作界面。
- 课程章节的学习进度交互。
- 自动化测试、构建验收、反滥用、邮件模板/生产 SMTP、备份恢复与上线合规页面。
