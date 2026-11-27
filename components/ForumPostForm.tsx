"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForumPostForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState<"discussion" | "question" | "exposure">("discussion");
  const [evidence, setEvidence] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("请先登录后再发帖。");
      if (!user.email_confirmed_at) throw new Error("请先完成邮箱验证，再提交帖子。");
      const evidenceUrls = evidence.split("\n").map((item) => item.trim()).filter(Boolean);
      const { error } = await supabase.from("forum_posts").insert({
        author_id: user.id,
        title: title.trim(),
        body: body.trim(),
        post_type: postType,
        evidence_urls: evidenceUrls,
        status: "pending"
      });
      if (error) throw error;
      setTitle("");
      setBody("");
      setEvidence("");
      setMessage(postType === "exposure"
        ? "曝光内容已提交，必须经管理员人工审核后才会公开。"
        : "帖子已提交，审核通过后会显示在论坛。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }

  return <form className="form card" onSubmit={submit}>
    <h2>发布新主题</h2>
    <label>内容类型
      <select value={postType} onChange={(event) => setPostType(event.target.value as typeof postType)}>
        <option value="discussion">普通讨论</option>
        <option value="question">问题求助</option>
        <option value="exposure">平台曝光 / 风险报告（人工审核）</option>
      </select>
    </label>
    <label>标题
      <input required minLength={3} maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} />
    </label>
    <label>正文
      <textarea required rows={6} maxLength={30000} value={body} onChange={(event) => setBody(event.target.value)} />
    </label>
    {postType === "exposure" && <label>证据链接（每行一个，建议提供监管公告、官方文件或可核验报道）
      <textarea rows={3} value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="https://..." />
    </label>}
    <button className="btn" disabled={busy}>{busy ? "提交中…" : "提交审核"}</button>
    {message && <p role="status" className="muted">{message}</p>}
  </form>;
}
