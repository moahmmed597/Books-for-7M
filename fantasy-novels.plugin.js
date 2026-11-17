const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const BASE = "https://kolnovel.com";
const API = "https://kolnovel.com/wp-json/app/v2";

function cleanInline(value) {
  return String(value || "").replace(/[ \t]+/g, " ").trim();
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripHtml(value) {
  return cleanText(String(value || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#8211;/gi, "-")
    .replace(/&#8230;/gi, "...")
    .replace(/&#39;/gi, "'"));
}

function cleanHtmlToParagraphs(html) {
  const text = String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#8211;/gi, "-")
    .replace(/&#8230;/gi, "...")
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&mdash;/gi, "—");

  const rawParas = text.split(/\n+/).map(p => cleanInline(p)).filter(Boolean);
  const paras = [];
  const MAX_WORDS = 170;

  for (const p of rawParas) {
    const words = p.split(/\s+/).filter(Boolean);
    if (words.length <= MAX_WORDS) {
      paras.push(words.join(" "));
    } else {
      for (let i = 0; i < words.length; i += MAX_WORDS) {
        paras.push(words.slice(i, i + MAX_WORDS).join(" "));
      }
    }
  }
  return paras;
}

function uniq(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items || []) {
    if (!item) continue;
    const key = keyFn ? keyFn(item) : item;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function jsonGet(url, opts) {
  const res = await harbor.http(url, Object.assign({
    responseType: "json",
    headers: { "User-Agent": UA, "Accept": "application/json" },
    timeoutMs: 25000,
  }, opts || {}));
  if (res === null || res === undefined) throw new Error("Invalid JSON from " + url);
  return typeof res === "object" && "body" in res && typeof res.body === "object" ? res.body : res;
}

async function text(url, opts) {
  const res = await harbor.http(url, Object.assign({
    responseType: "text",
    headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
    timeoutMs: 25000,
  }, opts || {}));
  if (!res || !res.ok) throw new Error("HTTP " + (res ? res.status : "?") + " for " + url);
  return typeof res === "string" ? res : (res.body || "");
}

function splitIntoPages(rawHtml) {
  const paras = cleanHtmlToParagraphs(rawHtml);
  const pages = [];
  let currentChunk = [];
  let currentWordCount = 0;
  const TARGET_WORDS = 170;

  for (const p of paras) {
    const words = p.split(/\s+/).filter(Boolean).length;
    if (currentWordCount + words > TARGET_WORDS && currentChunk.length > 0) {
      pages.push(currentChunk.join("\n\n"));
      currentChunk = [p];
      currentWordCount = words;
    } else {
      currentChunk.push(p);
      currentWordCount += words;
    }
  }
  if (currentChunk.length > 0) {
    pages.push(currentChunk.join("\n\n"));
  }
  return pages.length ? pages : [cleanInline(rawHtml)];
}

function renderSvgPage(title, textChunk, pageNum, totalPages) {
  const safeTitle = cleanText(title).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const formattedHtml = textChunk
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n\n/g, "<br/><br/>");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141118"/>
      <stop offset="100%" stop-color="#0b080f"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="50" y="30" width="1180" height="660" rx="16" fill="#1b1622" stroke="#3b2d4a" stroke-width="1.5"/>
  <text x="640" y="78" font-family="'Segoe UI', Tahoma, Arial, sans-serif" font-size="22" font-weight="bold" fill="#c084fc" text-anchor="middle" direction="rtl">${safeTitle}</text>
  <line x1="90" y1="102" x2="1190" y2="102" stroke="#3b2d4a" stroke-width="1"/>
  <foreignObject x="90" y="125" width="1100" height="495">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #e2e8f0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 25px; line-height: 1.9; direction: rtl; text-align: justify; padding: 10px 15px;">
      ${formattedHtml}
    </div>
  </foreignObject>
  <line x1="90" y1="635" x2="1190" y2="635" stroke="#3b2d4a" stroke-width="1"/>
  <text x="640" y="663" font-family="Arial, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">صفحة ${pageNum} من ${totalPages}</text>
</svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const FANTASY_GENRES = ["فانتازيا", "سحر", "غموض", "قوى خارقة", "خيال", "إيسيكاي", "مغامرة"];

async function popular(offset) {
  const data = await jsonGet(API + "/discover");
  const items = (data && data.data) || [];
  const filtered = items.filter(n => {
    const gNames = (n.genres || []).map(g => g.name);
    return gNames.some(g => FANTASY_GENRES.includes(g));
  });
  const list = filtered.length >= 10 ? filtered : items;
  return list.map(n => ({
    id: String(n.id),
    title: cleanText(n.title),
    cover: n.cover_url || undefined
  }));
}

async function search(query, offset) {
  const q = cleanText(query);
  if (!q) return popular(offset);

  const searchUrl = BASE + "/?s=" + encodeURIComponent(q);
  const html = await text(searchUrl);

  const re = /href=["'](https:\/\/kolnovel\.com\/series\/[^"'#\s/]+)\/?["'][\s\S]*?<img[^>]+src=["']([^"'#\s]+)["'][\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  const matches = Array.from(html.matchAll(re));

  const out = [];
  for (const m of matches) {
    const slug = m[1].split("/").filter(Boolean).pop();
    out.push({ id: slug, title: stripHtml(m[3]) || slug, cover: m[2] });
  }
  return uniq(out, x => x.id);
}

async function detail(id) {
  let numId = Number(id);
  if (isNaN(numId)) {
    const html = await text(BASE + "/series/" + id);
    const m = html.match(/"seriesId"\s*:\s*"(\d+)"/);
    if (m) numId = Number(m[1]);
  }
  if (!numId) throw new Error("Could not resolve series ID: " + id);

  const data = await jsonGet(API + "/titles/" + numId);
  const t = (data && data.data) || {};

  return {
    id: String(numId),
    title: cleanText(t.title || id),
    cover: t.cover_url || undefined,
    description: stripHtml(t.description),
    author: (t.authors || []).map(a => a.name).join(", ") || t.author || undefined,
    status: t.status === "completed" ? "completed" : "ongoing"
  };
}

async function chapters(id) {
  let numId = Number(id);
  if (isNaN(numId)) {
    const html = await text(BASE + "/series/" + id);
    const m = html.match(/"seriesId"\s*:\s*"(\d+)"/);
    if (m) numId = Number(m[1]);
  }

  const data = await jsonGet(API + "/titles/" + numId + "/reading-list");
  const list = (data && data.data) || [];

  return list.map(ch => ({
    id: String(ch.id),
    chapter: String(ch.number || ch.id),
    title: cleanText(ch.title),
    number: parseFloat(ch.number) || 0
  }));
}

async function pageUrls(chapterId) {
  const data = await jsonGet(API + "/reader/" + chapterId);
  const entry = (data && data.data && data.data.entry) || {};
  const rawHtml = entry.content || "";
  const chTitle = cleanText(entry.title || ("الفصل " + chapterId));

  const textPages = splitIntoPages(rawHtml);
  return textPages.map((chunk, idx) => renderSvgPage(chTitle, chunk, idx + 1, textPages.length));
}

const plugin = {
  version: "2.0.0",
  id: "fantasy-novels-ar",
  name: "روايات الفانتازيا والسحر والغموض (Fantasy & Mystery)",
  popular,
  search,
  detail,
  chapters,
  pageUrls
};

return plugin;
