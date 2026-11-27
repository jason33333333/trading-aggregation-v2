# AI 网站管家第一阶段：数据与质量建设方案

> 状态：设计基线（本文件不执行数据库变更）
> 目标：在不影响现有论坛、登录、管理员审核和线上数据的前提下，为后续资讯采集、学习资料管理和运营日报建立可审查的实施基础。
> 原则：免费优先；官方来源优先；可追溯；默认人工审核；不接入付费 AI/API；不在浏览器端暴露服务密钥。

## 1. 当前系统基线

现有项目采用 Next.js App Router、React、Supabase 和 Cloudflare Workers。已有邮箱认证、用户资料与角色、平台目录/详情、学习学院、论坛发帖和曝光内容人工审核。数据库已有平台证据与观察记录、论坛审核动作等基础结构。

本阶段不替换现有表，不重置数据库，不改动线上数据，不改变论坛现有审核规则。任何数据库迁移都必须作为单独 SQL 文件提交，并在 PR 中说明影响，待项目负责人审阅后由其在 Supabase SQL Editor 执行。

## 2. 分阶段交付顺序

### Phase 1A — 质量与安全基线
- 保持现有构建命令可用，先盘点现有脚本和 CI，不添加无法验证的工作流步骤。
- 后续增加测试时，优先覆盖纯函数、权限边界和内容审核状态转换。
- CI 至少逐步覆盖：依赖安装、TypeScript 检查、Lint、单元测试、生产构建。
- 所有新增工作在独立分支和 PR 中进行，不直接推送 main。

### Phase 1B — 来源登记与资讯采集底座
先建立来源目录，再实现采集器。第一批来源优先考虑监管机构官网、交易所公告和官方 RSS/Atom；具体来源须逐个核实其公开许可、访问条款、更新频率和可用性。

每个来源至少登记：
- 名称、机构/发布者、国家或地区、主题类别
- 官方主页与 feed/API URL（若有）
- 来源类型（监管公告、交易所公告、官方新闻稿、教育资源等）
- 语言、时区、检查频率建议
- 使用条款/许可链接、署名要求、抓取限制
- 启用状态、最后成功/失败时间、维护备注

采集策略：
1. 只读取公开、允许自动访问的来源；遵守 robots.txt、服务条款和速率限制。
2. 优先 RSS/Atom 或官方 API，不绕过登录、付费墙、验证码或访问控制。
3. 先保存元数据、摘要和原文链接；默认不复制整篇受版权保护的文章。
4. 以规范化 URL、来源 ID 和来源项目 GUID/发布时间组合去重；保留原始 URL。
5. 失败要记录错误类型、时间和重试次数；使用指数退避并设置每来源频率上限。
6. 新资讯初始状态为待审核；人工确认来源、事实和措辞后才公开。
7. 不把未经证实的社交媒体帖子作为监管事实或风险定论。

### Phase 1C — 学习资源可追溯
现有 academy_articles / academy_lessons 继续保留。未来增量字段/关联应支持：
- source_url、source_name、author_or_organization
- published_at、collected_at、last_verified_at
- license_name、license_url、attribution_text
- verification_status（unverified / reviewed / corroborated / disputed）
- difficulty_level、language、topic_tags
- editorial_status（draft / pending_review / published / archived）

学习内容应以原创讲解、合法引用和链接为主。外部视频/文章只提供标题、简短摘要、来源与链接；不下载或重新托管未经授权的内容。

### Phase 1D — 管家运营后台与日报
在现有 /admin 基础上逐步增加独立模块：
- 来源目录管理
- 采集运行记录、失败队列和重试状态
- 资讯审核队列
- 学习资料审核与来源检查
- 论坛举报、评论管理和用户处置记录
- 每日运营摘要（新增内容、待审核数、采集成功/失败、论坛举报、系统错误）

管理员操作必须记录操作者、动作、对象、时间和理由。涉及曝光、投诉、监管风险等高影响内容继续强制人工审核，不自动发布。

## 3. 建议的数据模型（仅供后续迁移设计）

以下是逻辑模型，不代表本 PR 已创建表或执行 SQL。实现时应先核对现有 schema，避免重复建模。

### source_registry
- id (uuid, primary key)
- name, publisher, jurisdiction, category
- homepage_url, feed_url, source_type, language
- terms_url, license_url, attribution_required
- poll_interval_minutes, is_enabled
- last_success_at, last_failure_at, created_at, updated_at

### ingestion_runs
- id (uuid, primary key)
- source_id (FK source_registry)
- started_at, finished_at, status
- items_seen, items_new, items_skipped
- error_code, error_message
- retry_count, created_at

### news_items
- id (uuid, primary key)
- source_id (FK source_registry)
- external_id, canonical_url, title
- summary, language, published_at, collected_at
- verification_status, editorial_status
- reviewed_by, reviewed_at, review_note
- content_hash, created_at, updated_at

建议唯一约束：优先按 (source_id, external_id) 去重；无 external_id 时用规范化 canonical_url。不要只依赖标题去重。

### academy_source_metadata（可选关联表）
- id (uuid, primary key)
- article_id 或 lesson_id（按现有主键类型建立 FK）
- source_url, source_name, author_or_organization
- published_at, collected_at, last_verified_at
- license_name, license_url, attribution_text
- verification_status, created_at, updated_at

是否采用独立关联表，还是给现有文章/课程表增加字段，需在读取完整 schema 和数据后决定；不在此文档中预设迁移方式。

## 4. 权限与数据安全

- 新表启用 RLS；默认匿名用户无写权限。
- 公开读取仅限 editorial_status = published 的内容。
- 采集器写入使用仅服务端可用的凭据；service_role key 绝不进入 NEXT_PUBLIC_*、客户端 bundle、GitHub issue 或代码仓库。
- 管理员审核必须服务端校验角色和账号状态，不能只依赖前端隐藏按钮。
- 保持 profiles 角色字段不可由普通用户自行提升。
- 日志不得记录密码、访问令牌、完整密钥或不必要的个人信息。
- 资讯审核、平台曝光审核和论坛举报处置都保留审计记录。

## 5. 免费优先的运行方式

- 先采用低频定时任务和官方 RSS/Atom；在确认 Cloudflare/Supabase 免费额度与实际使用量前，不承诺具体任务频率或容量。
- 优先使用 GitHub Actions 免费额度做非敏感的定期检查/构建；生产密钥只能放在受控 Secrets 中，且须评估是否真的需要。
- 不依赖 OpenAI API 或其他付费模型 API。第一阶段可用规则、关键词、来源白名单和人工审核。
- 若未来免费额度不足，先减少频率、批量处理或暂停非核心任务，不自动升级付费计划。
- 不在没有成本说明和负责人同意的情况下启用付费服务。

## 6. 验收标准

- 现有登录、论坛发帖、曝光人工审核、管理员审核功能不回归。
- 资讯记录可追溯到原始来源 URL、发布时间和采集时间。
- 重复资讯不会重复入库；采集失败可定位来源和错误原因。
- 未审核资讯不会出现在公开页面。
- 学习资源显示来源、许可/署名信息和核验状态。
- 管理员操作有审计记录。
- 所有数据库变更先通过独立 SQL migration PR 审查，明确 RLS、索引、外键和回滚方案。
- 不将任何密钥提交到仓库。

## 7. 本阶段明确不做

- 不执行 Supabase SQL。
- 不修改或删除现有生产数据。
- 不自动发布未经人工审核的曝光、投诉或风险指控。
- 不抓取受登录/付费墙保护的内容，不绕过反爬限制。
- 不接入付费 AI API，不开启付费 Cloudflare/Supabase 服务。
- 不把此设计文档误认为已上线功能。
