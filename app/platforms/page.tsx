import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
const labels: Record<string,string> = {forex:"外汇",gold:"黄金",stocks:"股票",futures:"期货",crypto:"加密货币",other:"其他"};
export default async function Platforms() {
 let rows:any[]=[]; let ready=false;
 try { const db=await createClient(); const {data,error}=await db.from("platforms").select("id,name,name_en,slug,category,region,description_zh,verification_status,last_verified_at,website_url").eq("published",true).order("name"); if(error) throw error; rows=data??[]; ready=true; } catch {}
 return <main className="container"><h1>全球交易平台档案</h1><p className="muted">优先覆盖外汇、黄金、股票、期货及加密货币。资料按来源与核验状态展示，不接受付费排名或平台广告。</p>
 {!ready&&<div className="notice">数据库尚未连接或初始化。当前不会展示虚构平台资料；准备完成后将自动读取已发布档案。</div>}
 {ready&&rows.length===0&&<div className="notice">平台档案库已连接，目前尚无经管理员审核并发布的真实平台资料。</div>}
 <section className="grid">{rows.map(p=><article className="card" key={p.id}><span className="tag">{labels[p.category]??p.category} · {p.region??"地区待补充"}</span><h3>{p.name}</h3>{p.name_en&&<p className="muted">{p.name_en}</p>}<p>{p.description_zh||"平台介绍待补充。"}</p><small>核验状态：{p.verification_status==="verified"?"已核验":p.verification_status==="partially_verified"?"部分核验":p.verification_status==="under_review"?"审核中":"待核验"}</small>{p.last_verified_at&&<p className="muted">最近核验：{new Date(p.last_verified_at).toLocaleDateString("zh-CN")}</p>}{p.website_url&&<p><a href={p.website_url} target="_blank" rel="noreferrer">平台官网 ↗</a></p>}<Link href={`/platforms/${p.slug}`}>查看档案详情 →</Link></article>)}</section>
 <h2>档案核验标准</h2><div className="card">成立历史｜品牌与法律实体｜监管机构及登记编号｜可交易品种｜点差与佣金｜隔夜费｜入金出金｜订单执行与滑点｜用户评价｜有证据来源的风险记录｜来源链接｜适用条件｜最后更新时间。</div></main>;
}