# 本地资讯 Feed 预览

该工具只读取本地 XML 文件，不发起网络请求、不连接 Supabase、不写入数据库，也不会发布资讯。

运行：

\`\`\`bash
node scripts/preview-feed.mjs ./sample-feed.xml
\`\`\`

采集器核心位于 \`lib/ingestion/feed-parser.mjs\`：
- 支持 RSS 2.0 与 Atom entry 基础字段。
- 统一 URL 并剔除常见追踪参数，生成去重键。
- 网络采集函数要求调用方显式提供 HTTPS 主机 allowlist。
- 不跟随重定向；限制响应体大小和超时；拒绝非 XML 内容类型。
- 仅提取标题、链接、日期和 500 字符以内摘要，不保留全文。

本阶段没有启用任何在线 feed。正式启用前须逐个核对来源授权、robots.txt、服务条款、请求频率，并由管理员确认来源配置。
