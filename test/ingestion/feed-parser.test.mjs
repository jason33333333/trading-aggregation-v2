import test from "node:test";
import assert from "node:assert/strict";
import { canonicalizeUrl, duplicateKey, parseFeed, fetchFeed } from "../../lib/ingestion/feed-parser.mjs";

test("parses RSS and normalizes tracking parameters", () => {
  const xml = "<?xml version=\"1.0\"?><rss><channel><item><title> Market notice </title><link>https://example.gov/news/1?utm_source=mail</link><guid>notice-1</guid><pubDate>Thu, 27 Nov 2026 08:00:00 GMT</pubDate><description><![CDATA[<p>Official <b>notice</b></p>]]></description></item></channel></rss>";
  const [item] = parseFeed(xml, { sourceId: "EXAMPLE", sourceName: "Example regulator" });
  assert.equal(item.title, "Market notice");
  assert.equal(item.url, "https://example.gov/news/1");
  assert.equal(item.duplicateKey, "url:https://example.gov/news/1");
  assert.equal(item.summary, "Official notice");
  assert.equal(item.sourceId, "EXAMPLE");
});
test("parses Atom alternate links", () => {
  const xml = "<feed xmlns=\"http://www.w3.org/2005/Atom\"><entry><title>Regulatory update</title><id>tag:example.gov,2026:42</id><link rel=\"alternate\" href=\"https://example.gov/update/42\"/><updated>2026-11-27T08:00:00Z</updated><summary>Short summary</summary></entry></feed>";
  const [item] = parseFeed(xml);
  assert.equal(item.title, "Regulatory update");
  assert.equal(item.url, "https://example.gov/update/42");
  assert.equal(item.guid, "tag:example.gov,2026:42");
});
test("canonical URL removes fragments and common tracking parameters", () => {
  assert.equal(canonicalizeUrl("https://example.gov/a?b=2&utm_campaign=x&a=1#section"), "https://example.gov/a?a=1&b=2");
});
test("rejects unsafe URL schemes and credentials", () => {
  assert.equal(canonicalizeUrl("javascript:alert(1)"), null);
  assert.equal(canonicalizeUrl("https://user:pass@example.gov/feed"), null);
});
test("rejects XML document type declarations", () => {
  assert.throws(() => parseFeed("<!DOCTYPE rss [<!ENTITY x 'boom'>]><rss/>"), /DOCTYPE/);
});
test("ignores malformed entries and respects item cap", () => {
  const xml = "<rss><channel><item><title>Valid</title><link>https://example.gov/1</link></item><item><title>No link</title></item><item><title>Second</title><link>https://example.gov/2</link></item></channel></rss>";
  assert.equal(parseFeed(xml, { maxItems: 1 }).length, 1);
});
test("dedupe falls back to GUID only when URL is unavailable", () => {
  assert.equal(duplicateKey({ guid: "stable-id" }), "guid:stable-id");
  assert.equal(duplicateKey({}), null);
});
test("fetchFeed requires HTTPS allowlist and refuses redirects", async () => {
  await assert.rejects(fetchFeed("https://example.gov/feed.xml", { allowedHosts: [] }), /allowlist/);
  await assert.rejects(fetchFeed("http://example.gov/feed.xml", { allowedHosts: ["example.gov"] }), /HTTPS/);
  const fakeFetch = async () => new Response("", { status: 302, headers: { location: "https://other.example/feed.xml", "content-type": "application/xml" } });
  await assert.rejects(fetchFeed("https://example.gov/feed.xml", { allowedHosts: ["example.gov"], fetchImpl: fakeFetch }), /redirects are not followed/);
});
