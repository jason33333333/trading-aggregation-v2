# 交易聚合 V2（开发起始版）

基于 Next.js App Router + Supabase + Cloudflare Workers（通过 OpenNext）构建。

## 当前包含
- 中文首页、全球平台目录页面、交易知识学院六阶段页面、论坛规则页面。
- Supabase 邮箱注册/登录界面及邮箱回调。
- Supabase 初始数据库结构：用户资料、平台档案、论坛帖子/评论、学院文章。
- RLS 行级安全策略：公开内容只读；用户只能提交自己的待审核内容；版主/管理员审核。
- Cloudflare OpenNext 配置、环境变量示例和部署说明。

## 重要说明
这是可继续开发的 V2 首个工程版本，不是已经完成上线验收的生产网站。平台目录中的名称均为演示占位数据，绝不可作为真实平台推荐。论坛页面目前展示规则，帖子提交/审核管理界面尚待下一开发迭代完成。英文界面、完整搜索、资料来源采集、审核操作台、评论交互和反滥用机制也需继续实现。

## 本地开发
1. 安装 Node.js 20.9 或更高版本。
2. 复制 `.env.example` 为 `.env.local`，填写 Supabase URL 和 anon key。
3. `npm install`
4. `npm run dev`

## Supabase 初始化
1. 创建 Supabase 项目。
2. 在 SQL Editor 执行 `supabase/schema.sql`。
3. 在 Authentication > URL Configuration 设置站点 URL，并添加回调地址：`https://你的域名/auth/callback`（开发时可添加 `http://localhost:3000/auth/callback`）。
4. 在 Authentication > Providers 确认 Email 启用，并按需配置 SMTP。生产环境建议使用自定义 SMTP。
5. 注册管理员账户后，在 SQL Editor 执行 README 中的管理员角色更新语句，将邮箱替换为管理员邮箱。

## Cloudflare Workers 部署
1. 将仓库连接到 Cloudflare Workers Builds，或在本地通过 Wrangler 登录。
2. 在 Cloudflare 项目设置中配置 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
3. 安装依赖后执行 `npm run deploy`。首次部署前应先检查 Cloudflare/OpenNext 当前版本要求。
4. 配置自定义域名，并把该域名加入 Supabase Auth Redirect URLs。

## 安全要求
- 绝不把 Supabase service_role key、数据库密码或 Cloudflare API Token 提交到 GitHub。
- 浏览器端只使用 anon/publishable key，并依赖 RLS 控制数据访问。
- 不要仅凭用户自述设置管理员角色；管理员角色必须由可信项目管理员在 Supabase SQL Editor 中授予。
- 对“曝光”类帖子须建立证据审核、隐私保护、被指涉方回应与申诉流程后再开放公开发布。
- 平台资料必须记录来源、适用条件、核验状态和更新时间；未经核验标记为待核验。
- 不接受交易平台付费广告、付费排名或隐性推广。

## 后续开发清单
- 英文完整界面与语言切换。
- 平台搜索、筛选、详情页及资料编辑工作流。
- 论坛发帖/评论、邮箱验证强制校验、曝光内容人工审核队列。
- 管理后台：角色管理、帖子审核、平台档案审核、操作审计日志。
- 图片/附件存储、举报与申诉、速率限制、垃圾内容防护。
- 自动化测试、备份恢复、隐私政策、服务条款与正式上线验收。
