# 官方金融监管与交易所资讯来源目录

> 版本：0.1.0  
> 核验日期：2026-11-27  
> 用途：为交易聚合的资讯采集器提供首批可信来源登记。  
> 当前状态：仅登记来源，不自动抓取、不转载全文、不自动发布。

## 使用规则

1. 官方机构页面是来源入口，不代表其全部内容都与交易平台风险相关。
2. 第一阶段只采集标题、原文链接、发布机构、发布时间、抓取时间和短摘要；完整正文保留在来源网站。
3. 每条记录必须保留原始 URL 和来源标识；同一 URL 需要去重。
4. 新内容先进入待审核队列。涉及平台违规、诈骗、制裁、客户资金或监管处罚的内容必须由管理员核验后发布。
5. 不将“被调查”“被投诉”“被警告”改写为“已违法”或“已诈骗”。必须准确区分监管公告中的事实、指控和最终裁决。
6. 不绕过登录、验证码、访问限制或付费墙；自动采集前逐站核查 robots.txt、服务条款、版权与速率限制。
7. 只有已核实可用且允许自动访问的 RSS/Atom/API 才能进入自动采集；其余先人工查看官方页面。
8. 目录本身不是对机构、平台或资讯内容的背书。

## 首批来源

| ID | 机构 | 地区 | 重点主题 | 官方入口 | 初始采集方式 | 状态 |
|---|---|---|---|---|---|---|
| SEC | U.S. Securities and Exchange Commission | 美国 | 证券执法、投资者警示、数字资产 | https://www.sec.gov/newsroom/press-releases | 官方新闻页；RSS 地址需在 SEC RSS 页面逐项核实 | 已核实入口 |
| CFTC | Commodity Futures Trading Commission | 美国 | 期货、外汇衍生品、执法与警示 | https://www.cftc.gov/PressRoom/PressReleases | 人工查看；RSS 暂停 | RSS 暂停，禁止配置自动抓取 |
| FCA | Financial Conduct Authority | 英国 | 授权状态、警告名单、执法与公告 | https://www.fca.org.uk/news | 官方新闻页；自动接口待核验 | 已核实入口 |
| ESMA | European Securities and Markets Authority | 欧盟 | 市场监管、投资者保护、加密资产监管 | https://www.esma.europa.eu/press-news/press-releases | 官方新闻页；自动接口待核验 | 已核实入口 |
| NFA | National Futures Association | 美国 | 期货行业会员、纪律处分、注册核查 | https://www.nfa.futures.org/newsnotices/index.aspx | 官方新闻与通知页；人工核验 | 已核实入口 |
| FINRA | Financial Industry Regulatory Authority | 美国 | 券商监管、投资者警示、纪律处分 | https://www.finra.org/media-center | 官方新闻入口；具体栏目待核验 | 待进一步核验 |
| SFC-HK | Securities and Futures Commission | 香港 | 持牌机构、虚拟资产平台、执法与警示 | https://www.sfc.hk/News-and-announcements | 官方新闻及监管更新页；人工核验 | 已核实入口 |
| MAS | Monetary Authority of Singapore | 新加坡 | 金融监管、投资者警示、政策公告 | https://www.mas.gov.sg/news | 官方新闻页；自动接口待核验 | 已核实入口 |
| FINMA | Swiss Financial Market Supervisory Authority | 瑞士 | 金融机构监管、执法、警示 | https://www.finma.ch/en/news/ | 官方新闻页；自动接口待核验 | 已核实入口 |
| NYSE-NOTICES | New York Stock Exchange | 美国 | 交易通知、停牌、市场规则 | https://www.nyse.com/markets/notices | 官方通知页；人工核验 | 已核实入口 |

## 特别说明

- CFTC 的 RSS 页面在 2026-11-27 显示相关 RSS feeds 暂时停用，因此不能将旧 feed URL 当作可用采集源。
- SEC 新闻稿页面展示 Press Releases RSS Feed；具体 feed URL 和使用要求应从 SEC 官方 RSS 说明页读取并记录，不在未经核验时猜测地址。
- 其余来源先登记官方入口，不推断存在 RSS/API。完成条款、robots 与格式核验后，才可将采集方式改为自动。
- NFA BASIC、FCA Warning List、SFC 持牌人/虚拟资产平台名录等查询工具属于独立核查入口，后续可单独登记为核验工具，不应当作新闻 feed。

## 后续登记字段（进入数据库前）

- source_id（稳定唯一标识）
- publisher_name / publisher_country
- source_category / covered_topics
- landing_page_url / feed_url / api_url
- access_method（rss、atom、api、manual）
- terms_url / robots_url / license_notes
- polling_interval_minutes（仅在允许自动采集后设置）
- enabled / verification_status / last_checked_at
- created_at / updated_at

## 参考核验入口

- SEC RSS 说明：https://www.sec.gov/about/secrss.shtml
- CFTC RSS 状态：https://www.cftc.gov/RSS/index.htm
- NYSE 市场通知：https://www.nyse.com/markets/notices
