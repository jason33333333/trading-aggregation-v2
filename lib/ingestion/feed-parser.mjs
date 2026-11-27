const TRACKING_PARAMS = /^(utm_[a-z0-9_]+|fbclid|gclid|mc_cid|mc_eid)$/i;

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}
function textOnly(value = "") {
  return decodeXml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
}
function firstTag(xml, tag) {
  const escaped = tag.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  const pattern = "<(?:[\\w.-]+:)?" + escaped + "(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?" + escaped + "\\s*>";
  const match = xml.match(new RegExp(pattern, "i"));
  return match ? match[1].trim() : "";
}
function atomLink(xml) {
  const links = xml.match(/<link\b[^>]*>/gi) || [];
  for (const link of links) {
    const rel = (link.match(/\brel=["']([^"']+)["']/i) || [])[1];
    const href = (link.match(/\bhref=["']([^"']+)["']/i) || [])[1];
    if (href && (!rel || rel === "alternate")) return decodeXml(href);
  }
  return "";
}
export function canonicalizeUrl(input) {
  let url;
  try { url = new URL(input); } catch { return null; }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  return url.toString();
}
export function duplicateKey(item) {
  const canonical = canonicalizeUrl(item.url || "");
  if (canonical) return "url:" + canonical;
  const guid = String(item.guid || "").trim();
  return guid ? "guid:" + guid : null;
}
export function parseFeed(xml, { sourceId, sourceName, fetchedAt = new Date().toISOString(), maxItems = 100 } = {}) {
  if (typeof xml !== "string" || !xml.trim()) throw new Error("Feed body is empty");
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("DOCTYPE and custom entities are not supported");
  const isAtom = /<feed\b/i.test(xml);
  const blocks = isAtom ? [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)] :
    [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)];
  return blocks.slice(0, Math.max(0, Math.min(maxItems, 500))).map((match) => {
    const block = match[1];
    const title = textOnly(firstTag(block, "title"));
    const link = isAtom ? atomLink(block) : textOnly(firstTag(block, "link"));
    const guid = textOnly(firstTag(block, isAtom ? "id" : "guid"));
    const publishedAt = textOnly(firstTag(block, isAtom ? "published" : "pubDate")) || textOnly(firstTag(block, "updated"));
    const summary = textOnly(firstTag(block, isAtom ? "summary" : "description"));
    const item = {
      sourceId: sourceId || null, sourceName: sourceName || null,
      title: title.slice(0, 500), url: canonicalizeUrl(link),
      guid: guid.slice(0, 500) || null, publishedAt: publishedAt || null,
      summary: summary.slice(0, 500), fetchedAt,
    };
    return { ...item, duplicateKey: duplicateKey(item) };
  }).filter((item) => item.title && item.url && item.duplicateKey);
}
export async function fetchFeed(feedUrl, {
  allowedHosts, sourceId, sourceName, timeoutMs = 10000, maxBytes = 1024 * 1024, fetchImpl = fetch,
} = {}) {
  const url = canonicalizeUrl(feedUrl);
  if (!url) throw new Error("Feed URL must be a valid HTTP(S) URL");
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("Only HTTPS feeds are allowed");
  if (!Array.isArray(allowedHosts) || !allowedHosts.includes(parsed.hostname)) throw new Error("Feed host is not in the explicit allowlist");
  const response = await fetchImpl(url, {
    method: "GET", redirect: "manual",
    headers: {
      "Accept": "application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9",
      "User-Agent": "TradingAggregationResearchBot/0.1 (+https://github.com/jason33333333/trading-aggregation-v2)",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (response.status >= 300 && response.status < 400) throw new Error("Feed redirects are not followed");
  if (!response.ok) throw new Error("Feed request failed with HTTP " + response.status);
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (!/(xml|rss|atom)/.test(contentType)) throw new Error("Feed response is not an XML content type");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > maxBytes) throw new Error("Feed exceeds the configured size limit");
  const xml = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return parseFeed(xml, { sourceId, sourceName });
}
