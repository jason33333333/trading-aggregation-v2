import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function moderatePost(formData: FormData) {
  "use server";
  const postId = String(formData.get("post_id") || "");
  const decision = String(formData.get("decision") || "");
  const note = String(formData.get("note") || "").slice(0, 2000);
  if (!postId || !["approved", "rejected", "hidden"].includes(decision)) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role,account_status").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "moderator"].includes(profile.role) || profile.account_status !== "active") redirect("/forum");
  const { error } = await supabase.from("forum_posts").update({
    status: decision,
    moderator_note: note,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString()
  }).eq("id", postId).eq("status", "pending");
  if (error) throw new Error("审核操作失败：" + error.message);
  await supabase.from("moderation_actions").insert({moderator_id:user.id,target_type:"post",target_id:postId,action:decision==="approved"?"approve":decision==="rejected"?"reject":"hide",reason:note});
  revalidatePath("/admin");
  revalidatePath("/forum");
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role,account_status").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "moderator"].includes(profile.role) || profile.account_status !== "active") redirect("/forum");
  const { data: posts, error } = await supabase.from("forum_posts")
    .select("id,title,body,post_type,evidence_urls,created_at,author_id")
    .eq("status", "pending").order("created_at", {ascending:true}).limit(100);
  if (error) throw new Error("无法读取审核队列：" + error.message);
  return <main className="container"><h1>内容审核后台</h1><p className="muted">待审核帖子：{posts?.length ?? 0}。曝光类内容必须核对证据、隐私与措辞后再决定是否公开。</p>
    {!posts?.length && <div className="notice">当前没有待审核帖子。</div>}
    <section className="grid">{(posts??[]).map(post=><article className="card" key={post.id}>
      <span className="tag">{post.post_type==="exposure"?"平台曝光":post.post_type==="question"?"问题求助":"普通讨论"}</span>
      <h3>{post.title}</h3><p>{post.body}</p>
      {Array.isArray(post.evidence_urls)&&post.evidence_urls.length>0&&<><h4>提交的证据链接</h4><ul>{post.evidence_urls.map((url:string,i:number)=><li key={i}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>)}</ul></>}
      <small className="muted">提交时间：{new Date(post.created_at).toLocaleString("zh-CN")}</small>
      <form action={moderatePost} className="form">
        <input type="hidden" name="post_id" value={post.id}/>
        <label>审核备注<textarea name="note" rows={2} maxLength={2000}/></label>
        <div className="actions"><button className="btn" name="decision" value="approved">通过发布</button><button className="btn secondary" name="decision" value="rejected">驳回</button><button className="btn secondary" name="decision" value="hidden">隐藏</button></div>
      </form>
    </article>)}</section>
  </main>;
}
