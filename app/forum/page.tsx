import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ForumPostForm } from "@/components/ForumPostForm";
export default async function Forum(){
 let posts:any[]=[];let signedIn=false;let verified=false;let ready=false;
 try{const db=await createClient();const {data:{user}}=await db.auth.getUser();signedIn=!!user;verified=!!user?.email_confirmed_at;const {data,error}=await db.from("forum_posts").select("id,title,body,post_type,created_at").eq("status","approved").order("created_at",{ascending:false}).limit(30);if(error)throw error;posts=data??[];ready=true;}catch{}
 return <main className="container"><h1>交易者论坛</h1><p className="muted">完成邮箱验证后方可发帖；平台曝光、投诉或风险指控必须经人工审核后发布。</p>
 <div className="grid"><article className="card"><h3>社区规则</h3><ul><li>禁止虚假信息、辱骂、人肉及泄露隐私。</li><li>曝光内容须提供可核查证据，并保护个人隐私。</li><li>曝光内容由管理员人工审核后发布。</li><li>不接受平台付费广告、付费排名或隐性推广。</li></ul></article><article className="card"><h3>账户状态</h3>{!signedIn&&<><p className="muted">登录并完成邮箱验证后可以提交帖子。</p><Link className="btn" href="/login">登录 / 注册</Link></>}{signedIn&&!verified&&<p className="muted">当前账户尚未完成邮箱验证，请先检查注册邮箱。</p>}{signedIn&&verified&&<p className="muted">邮箱已验证。提交内容后进入审核队列，审核通过才会公开。</p>}</article></div>
 {ready&&signedIn&&verified&&<ForumPostForm/>}{!ready&&<div className="notice">论坛数据库尚未连接或初始化。数据库准备完成后即可启用发帖与审核流程。</div>}
 <h2>最新已审核主题</h2>{ready&&posts.length===0&&<p className="muted">目前还没有公开主题。</p>}<section className="grid">{posts.map(p=><article className="card" key={p.id}><span className="tag">{p.post_type==="exposure"?"平台曝光":p.post_type==="question"?"问题求助":"普通讨论"}</span><h3>{p.title}</h3><p>{p.body}</p><small className="muted">{new Date(p.created_at).toLocaleString("zh-CN")}</small></article>)}</section></main>;
}