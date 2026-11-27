import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PlatformDetail({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;
 const supabase=await createClient();
 const {data:platform,error}=await supabase.from("platforms").select("id,name,name_en,slug,category,region,founded_info,founded_info_en,description_zh,description_en,website_url,legal_entities,regulators,instruments,fees,execution_notes,execution_notes_en,risk_records,verification_status,last_verified_at,source_urls").eq("slug",slug).eq("published",true).maybeSingle();
 if(error||!platform) notFound();
 const {data:evidence}=await supabase.from("platform_evidence").select("id,evidence_type,title,title_en,source_name,source_url,observed_at,summary_zh,summary_en,verification_status").eq("platform_id",platform.id).in("verification_status",["corroborated","verified"]).order("observed_at",{ascending:false});
 const {data:reviews}=await supabase.from("platform_reviews").select("id,rating,title,body,created_at").eq("platform_id",platform.id).eq("status","approved").order("created_at",{ascending:false}).limit(30);
 const display=(v:unknown)=>typeof v==="string"?v:JSON.stringify(v,null,2);
 return <main className="container"><p><a href="/platforms">← 返回平台目录</a></p><h1>{platform.name}</h1>{platform.name_en&&<p className="muted">{platform.name_en}</p>}
 <div className="notice">核验状态：{platform.verification_status}。资料仅供独立研究参考，不构成开户推荐。核验时间：{platform.last_verified_at?new Date(platform.last_verified_at).toLocaleString("zh-CN"):"尚未记录"}。</div>
 <section className="card"><h2>基本资料</h2><p>{platform.description_zh}</p><p>{platform.founded_info||"成立信息待核验"}</p><p>地区：{platform.region||"待补充"}</p>{platform.website_url&&<p><a href={platform.website_url} target="_blank" rel="noreferrer">官方网站 ↗</a></p>}</section>
 <section className="grid"><article className="card"><h2>法律实体</h2><pre>{display(platform.legal_entities)}</pre></article><article className="card"><h2>监管信息</h2><pre>{display(platform.regulators)}</pre></article><article className="card"><h2>交易品种</h2><pre>{display(platform.instruments)}</pre></article><article className="card"><h2>费用信息</h2><pre>{display(platform.fees)}</pre></article></section>
 <section className="card"><h2>执行与风险记录</h2><p>{platform.execution_notes||"暂无已核验的执行说明。"}</p><pre>{display(platform.risk_records)}</pre></section>
 <section className="card"><h2>资料来源与证据</h2>{(evidence??[]).length===0&&<p className="muted">尚无公开且完成核验的证据条目。</p>}<ul>{(evidence??[]).map(item=><li key={item.id}><strong>{item.title}</strong>（{item.evidence_type} · {item.verification_status}）— {item.summary_zh} <a href={item.source_url} target="_blank" rel="noreferrer">来源 ↗</a></li>)}</ul></section>
 <section className="card"><h2>用户评价</h2>{(reviews??[]).length===0&&<p className="muted">目前没有审核通过的用户评价。</p>}{(reviews??[]).map(r=><article key={r.id}><strong>{r.title} · {r.rating}/5</strong><p>{r.body}</p></article>)}</section>
 </main>;
}
