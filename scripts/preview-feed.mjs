#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseFeed } from "../lib/ingestion/feed-parser.mjs";
const filePath = process.argv[2];
if (!filePath) {
  process.stderr.write("Usage: node scripts/preview-feed.mjs <local-feed.xml>\n");
  process.exitCode = 2;
} else {
  try {
    const xml = await readFile(filePath, "utf8");
    const items = parseFeed(xml, { sourceId: "LOCAL_PREVIEW", sourceName: "Local preview" });
    const seen = new Set();
    const unique = items.filter((item) => {
      if (seen.has(item.duplicateKey)) return false;
      seen.add(item.duplicateKey);
      return true;
    });
    process.stdout.write(JSON.stringify(unique, null, 2) + "\n");
  } catch (error) {
    process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
    process.exitCode = 1;
  }
}
