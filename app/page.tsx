import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home(){
 let featured:any[]=[];let ready=false;
 try{const db=await createClient();const {data,error}=await db.from("platforms").select("id,name,category,region,description_zh,verification_status").eq("published",true).order("updated_at",{ascending:false}).limit(3);if(error)throw error;featured=data??[];ready=true;}catch{}
 const labels:Record<string,string>={forex:"外汇",gold:"黄金",stocks:"股票",futures:"期货",crypto:"加密货币",other:"其他"};
 return <main className="container"><section className="hero"><span className="tag">GLOBAL TRADING DIRECTORY</span><h1>让交易信息更透明，<br/>让选择建立在核验之上。</h1><p>汇集全球外汇、黄金、股票、期货及数字资产相关平台资料，提供交易知识学习与交易者交流空间。所有平台信息标注来源、核验状态与更新时间。</p><div className="actions"><Link className="btn" href="/platforms">浏览平台目录</Link><Link className="btn secondary" href="/academy">进入知识学院</Link></div></section>
 <h2 className="section-title">核心功能</h2><section className="grid"><article className="card"><h3>全球平台档案</h3><p className="muted">监管实体、交易品种、点差佣金、隔夜费、滑点执行及风险记录。</p><Link href="/platforms">查看目录 →</Link></article><article className="card"><h3>交易知识学院</h3><p className="muted">从交易基础到平台尽职调查的六阶段学习路径。</p><Link href="/academy">开始学习 →</Link></article><article className="card"><h3>交易者论坛</h3><p className="muted">注册用户交流经验；完成邮箱验证后可提交帖子，曝光类内容进入人工审核。</p><Link href="/forum">进入论坛 →</Link></article></section>
 <div className="notice">资料原则：不接受交易平台付费广告。未完成独立核验的信息将明确标注“待核验”，并展示来源与更新时间。</div>
 <h2 className="section-title">最新平台档案</h2>{!ready&&<p className="muted">平台数据库尚未连接或初始化。请完成数据库配置后查看正式档案。</p>}{ready&&featured.length===0&&<p className="muted">平台资料库已连接，等待管理员录入并发布首批真实平台档案。</p>}<section className="grid">{featured.map(p=><article className="card" key={p.id}><span className="tag">{labels[p.category]??p.category}</span><h3>{p.name}</h3><p className="muted">{p.description_zh||"平台介绍待补充。"}</p><small>核验状态：{p.verification_status}</small></article>)}</section>
 </main>;
}
