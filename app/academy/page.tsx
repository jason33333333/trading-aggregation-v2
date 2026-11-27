import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
const stages:Record<number,string>={1:"交易基础",2:"产品与市场",3:"平台与监管识别",4:"成本与执行",5:"风险管理",6:"尽职调查"};
export default async function Academy(){
 let rows:any[]=[];let ready=false;
 try{const db=await createClient();const {data,error}=await db.from("academy_articles").select("id,slug,title_zh,title_en,stage,body_zh,updated_at").eq("published",true).order("stage").order("sort_order");if(error)throw error;rows=data??[];ready=true;}catch{}
 return <main className="container"><h1>交易知识学院</h1><p className="muted">六阶段学习路径，从基础概念逐步进入平台核验、交易成本和风险管理。</p>
 {!ready&&<div className="notice">课程数据库尚未连接或初始化。六阶段学习框架已保留，课程正文将在数据库准备后加载。</div>}
 {ready&&rows.length===0&&<div className="notice">学院数据库已连接，管理员发布课程后将在这里显示。</div>}
 <section className="grid">{rows.map(a=><article className="card" key={a.id}><span className="tag">阶段 {a.stage} · {stages[a.stage]??"进阶学习"}</span><h3>{a.title_zh}</h3><p className="muted">{a.body_zh?.slice(0,180)||"课程内容即将更新。"}</p><Link href={`/academy/${a.slug}`}>开始学习 →</Link></article>)}
 {!ready&&Object.entries(stages).map(([n,name])=><article className="card" key={n}><span className="tag">阶段 {n}</span><h3>{name}</h3><p className="muted">课程内容将在数据库初始化后发布。</p></article>)}</section>
 <div className="notice">学院内容用于教育与信息参考，不提供个性化投资建议或收益保证。</div></main>;
}