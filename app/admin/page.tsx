import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function moderatePost(formData: FormData) {
  "use server";

  const postId = String(formData.get("post_id") || "");
  const decision = String(formData.get("decision") || "");
  const note = String(formData.get("note") || "").slice(0, 2000);

  if (!postId || !["approved", "rejected", "hidden"].includes(decision)) {
    redirect("/admin?moderation=invalid");
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    !["admin", "moderator"].includes(profile.role) ||
    profile.account_status !== "active"
  ) {
    redirect("/forum");
  }

  let result = "error";

  try {
    // Request the updated row so we can distinguish a real update from
    // a successful request that matched zero pending rows.
    const { data: updatedPost, error: updateError } = await supabase
      .from("forum_posts")
      .update({
        status: decision,
        moderator_note: note,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("[admin moderation] forum_posts update failed", {
        postId,
        decision,
        message: updateError.message,
        code: updateError.code,
      });
      result = "update_error";
    } else if (!updatedPost) {
      result = "not_pending";
    } else {
      const { error: auditError } = await supabase
        .from("moderation_actions")
        .insert({
          moderator_id: user.id,
          target_type: "post",
          target_id: postId,
          action:
            decision === "approved"
              ? "approve"
              : decision === "rejected"
                ? "reject"
                : "hide",
          reason: note,
        });

      if (auditError) {
        // The moderation decision has already been saved. Report the audit
        // issue separately rather than showing a misleading server crash.
        console.error("[admin moderation] audit insert failed", {
          postId,
          message: auditError.message,
          code: auditError.code,
        });
        result = "audit_warning";
      } else {
        result = "success";
      }
    }
  } catch (error) {
    console.error("[admin moderation] unexpected failure", error);
    result = "error";
  }

  revalidatePath("/admin");
  revalidatePath("/forum");
  redirect(`/admin?moderation=${result}`);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ moderation?: string }>;
}) {
  const { moderation } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    !["admin", "moderator"].includes(profile.role) ||
    profile.account_status !== "active"
  ) {
    redirect("/forum");
  }

  const { data: posts, error } = await supabase
    .from("forum_posts")
    .select("id,title,body,post_type,evidence_urls,created_at,author_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("[admin moderation] queue read failed", error);
    throw new Error("无法读取审核队列，请稍后重试。");
  }

  let feedback: { text: string; className: string } | null = null;
  switch (moderation) {
    case "success":
      feedback = { text: "审核操作成功，帖子状态已更新。", className: "notice" };
      break;
    case "not_pending":
      feedback = { text: "该帖子已不在待审核状态，可能已被其他管理员处理；请刷新队列确认。", className: "notice" };
      break;
    case "audit_warning":
      feedback = { text: "帖子状态已更新，但审核日志写入失败。请检查管理员日志。", className: "notice" };
      break;
    case "update_error":
    case "error":
      feedback = { text: "审核操作未完成。请检查 Workers 日志中的 admin moderation 错误详情。", className: "notice" };
      break;
    case "invalid":
      feedback = { text: "审核请求无效，请重新操作。", className: "notice" };
      break;
  }

  return (
    <main className="container">
      <h1>内容审核后台</h1>
      {feedback && <div className={feedback.className} role="status">{feedback.text}</div>}
      <p className="muted">
        待审核帖子：{posts?.length ?? 0}。曝光类内容必须核对证据、隐私与措辞后再决定是否公开。
      </p>
      {!posts?.length && <div className="notice">当前没有待审核帖子。</div>}
      <section className="grid">
        {(posts ?? []).map((post) => (
          <article className="card" key={post.id}>
            <span className="tag">
              {post.post_type === "exposure"
                ? "平台曝光"
                : post.post_type === "question"
                  ? "问题求助"
                  : "普通讨论"}
            </span>
            <h3>{post.title}</h3>
            <p>{post.body}</p>
            {Array.isArray(post.evidence_urls) && post.evidence_urls.length > 0 && (
              <>
                <h4>提交的证据链接</h4>
                <ul>
                  {post.evidence_urls.map((url: string, i: number) => (
                    <li key={i}>
                      <a href={url} target="_blank" rel="noreferrer">{url}</a>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <small className="muted">
              提交时间：{new Date(post.created_at).toLocaleString("zh-CN")}
            </small>
            <form action={moderatePost} className="form">
              <input type="hidden" name="post_id" value={post.id} />
              <label>
                审核备注
                <textarea name="note" rows={2} maxLength={2000} />
              </label>
              <div className="actions">
                <button className="btn" name="decision" value="approved">通过发布</button>
                <button className="btn secondary" name="decision" value="rejected">驳回</button>
                <button className="btn secondary" name="decision" value="hidden">隐藏</button>
              </div>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
