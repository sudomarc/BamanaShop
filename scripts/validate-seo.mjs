import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const origin = "https://sudomarc.github.io/BamanaShop/";
const profile = "https://github.com/sudomarc";
const source = "https://github.com/sudomarc/BamanaShop";
const pages = [
  { file: "index.html", canonical: origin, title: "BamanaShop — Artisanat et cultures africaines" },
  { file: "politique.html", canonical: origin + "politique.html", title: "BamanaShop — Politique de confidentialité" },
  { file: "utilisation.html", canonical: origin + "utilisation.html", title: "BamanaShop — Conditions d'utilisation" },
];

for (const page of pages) {
  const html = readFileSync(page.file, "utf8");
  assert.match(html, /<html lang="fr"/i, page.file + ": language must be French");
  assert.ok(html.includes("<title>" + page.title + "</title>"), page.file + ": title mismatch");
  assert.match(html, /<meta name="description" content="[^"]+"/i, page.file + ": meta description missing");
  assert.ok(html.includes('<link rel="canonical" href="' + page.canonical + '">'), page.file + ": canonical mismatch");
  assert.ok(html.includes('href="' + profile + '"'), page.file + ": Sudomarc profile link missing");
  assert.ok(html.includes('href="' + source + '"'), page.file + ": repository link missing");
  assert.ok(html.includes("NovaCreations"), page.file + ": existing creator credit must be preserved");
}

const home = readFileSync("index.html", "utf8");
const schemaMatch = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert.ok(schemaMatch, "Homepage JSON-LD is missing");
const schema = JSON.parse(schemaMatch[1]);
const graph = schema["@graph"] || [];
assert.ok(graph.some(item => item["@type"] === "WebSite" && item.url === origin && item.name === "BamanaShop"), "Website schema does not match production identity");
assert.ok(graph.some(item => item["@type"] === "Organization" && item.name === "NovaCreations"), "Publisher identity was not preserved");

const robots = readFileSync("robots.txt", "utf8");
assert.match(robots, /User-agent:\s*\*/i, "robots.txt missing crawler policy");
assert.ok(robots.includes("Sitemap: " + origin + "sitemap.xml"), "robots.txt sitemap declaration is missing");
const sitemap = readFileSync("sitemap.xml", "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.deepEqual(urls, pages.map(page => page.canonical), "Sitemap does not match canonical public pages");
assert.equal(new Set(urls).size, urls.length, "Sitemap contains duplicate URLs");

console.log("SEO verification passed: page metadata, canonical URLs, identity credits, JSON-LD, robots.txt and sitemap.");
