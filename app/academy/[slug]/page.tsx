import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export default async function AcademyArticle({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const db=await createClient();
 const {data:article,error}=await db.from("academy_articles").select("id,slug,title_zh,title_en,body_zh,body_en,stage,updated_at").eq("slug",slug).eq("published",true).maybeSingle();
 if(error||!article)notFound();
 const {data:lessons}=await db.from("academy_lessons").select("id,slug,title_zh,title_en,body_zh,body_en,sort_order").eq("article_id",article.id).eq("published",true).order("sort_order");
 return <main className="container"><p><a href="/academy">← 返回学习学院</a></p><span className="tag">阶段 {article.stage}</span><h1>{article.title_zh}</h1><p className="muted">{article.title_en}</p><article className="card"><div style={{whiteSpace:"pre-wrap"}}>{article.body_zh}</div></article>
 {(lessons??[]).map(lesson=><article className="card" key={lesson.id}><h2>{lesson.title_zh}</h2><p className="muted">{lesson.title_en}</p><div style={{whiteSpace:"pre-wrap"}}>{lesson.body_zh}</div></article>)}
 <p className="muted">最后更新：{new Date(article.updated_at).toLocaleDateString("zh-CN")}。内容仅供教育参考。</p></main>;
}
