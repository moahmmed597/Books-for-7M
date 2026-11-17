const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const API_BASE = "https://www.wuxiaworld.com/api/novels";
const LITE_BASE = "https://lite.wuxiaworld.com";

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
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&mdash;/gi, "—"));
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
    headers: {
      "User-Agent": UA,
      "Accept": "application/json"
    },
    timeoutMs: 25000,
  }, opts || {}));
  if (res === null || res === undefined) throw new Error("Invalid JSON from " + url);
  return typeof res === "object" && "body" in res && typeof res.body === "object" ? res.body : res;
}

async function text(url, opts) {
  const res = await harbor.http(url, Object.assign({
    responseType: "text",
    headers: {
      "User-Agent": UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    },
    timeoutMs: 25000,
  }, opts || {}));
  if (!res || !res.ok) throw new Error("HTTP " + (res ? res.status : "?") + " for " + url);
  return typeof res === "string" ? res : (res.body || "");
}

// TV Book Page Renderer (16:9 widescreen dark mode SVG pages - English LTR)
function splitIntoPages(rawText) {
  const paras = cleanHtmlToParagraphs(rawText);
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
  return pages.length ? pages : [cleanInline(rawText)];
}

function cleanXmlEntities(str) {
  return String(str || "")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&#8211;/gi, "–")
    .replace(/&#8212;/gi, "—")
    .replace(/&mdash;/gi, "—")
    .replace(/&#8230;/gi, "...")
    .replace(/&hellip;/gi, "...")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderSvgPage(title, textChunk, pageNum, totalPages) {
  const safeTitle = cleanXmlEntities(cleanText(title));
  const paragraphs = textChunk.split(/\n\n+/).filter(Boolean);
  const formattedHtml = paragraphs.map(p => {
    return `<p style="margin: 0 0 16px 0; text-indent: 1.5em; text-align: left;">${cleanXmlEntities(p)}</p>`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1120"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="50" y="30" width="1180" height="660" rx="16" fill="#111827" stroke="#1f2937" stroke-width="1.5"/>
  
  <text x="640" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Georgia', Roboto, sans-serif" font-size="22" font-weight="bold" fill="#38bdf8" text-anchor="middle">${safeTitle}</text>
  <line x1="90" y1="102" x2="1190" y2="102" stroke="#1f2937" stroke-width="1"/>

  <foreignObject x="90" y="125" width="1100" height="495">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Georgia', Roboto, sans-serif; font-size: 24px; line-height: 1.85; direction: ltr; padding: 10px 15px;">
      ${formattedHtml}
    </div>
  </foreignObject>

  <line x1="90" y1="635" x2="1190" y2="635" stroke="#1f2937" stroke-width="1"/>
  <text x="640" y="663" font-family="-apple-system, Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle">Page ${pageNum} of ${totalPages} · WuxiaWorld</text>
</svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

async function popular(offset) {
  const data = await jsonGet(API_BASE);
  const items = (data && data.items) || [];
  return items.map(n => ({
    id: n.slug || String(n.id),
    title: cleanText(n.name),
    cover: n.coverUrl || undefined
  }));
}

async function search(query, offset) {
  const q = cleanText(query);
  if (!q) return popular(offset);

  const data = await jsonGet(API_BASE + "/search?query=" + encodeURIComponent(q));
  const items = (data && data.items) || [];
  return items.map(n => ({
    id: n.slug || String(n.id),
    title: cleanText(n.name),
    cover: n.coverUrl || undefined
  }));
}

async function detail(id) {
  const slug = cleanText(id);
  const html = await text(LITE_BASE + "/novel/" + slug);

  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? stripHtml(titleMatch[1]) : slug;

  const coverMatch = html.match(/<img[^>]+class=["'][^"']*cover[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
                     html.match(/<img[^>]+src=["'](https?:\/\/[^"']+(?:covers|images)[^"']+)["']/i);
  const cover = coverMatch ? coverMatch[1] : undefined;

  const synMatch = html.match(/<div[^>]+class=["'][^"']*(?:synopsis|description|syn)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  const description = synMatch ? stripHtml(synMatch[1]) : "";

  return {
    id: slug,
    title: title || slug,
    cover: cover,
    description: description || ("A popular fantasy and action web novel available on WuxiaWorld."),
    author: "WuxiaWorld",
    status: "ongoing"
  };
}

async function chapters(id) {
  const slug = cleanText(id);
  const html = await text(LITE_BASE + "/novel/" + slug);

  const re = new RegExp('<a[^>]+href=["\'](/novel/' + slug + '/([^"\'\\s>]+))["\'][^>]*>([\\s\\S]*?)</a>', 'gi');
  const matches = Array.from(html.matchAll(re));

  const list = [];
  for (const m of matches) {
    const chapSlug = m[2];
    const chapTitle = stripHtml(m[3]);
    if (!chapSlug || chapTitle.toLowerCase() === "start reading") continue;
    list.push({
      id: slug + "/" + chapSlug,
      chapter: chapSlug,
      title: chapTitle || chapSlug,
      number: list.length + 1
    });
  }

  return uniq(list, x => x.id);
}

async function pageUrls(chapterId) {
  // chapterId is like "dragon-poor/drp-chapter-1"
  const url = LITE_BASE + "/novel/" + chapterId;
  const html = await text(url);

  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const chTitle = titleMatch ? stripHtml(titleMatch[1]) : "Chapter";

  let body = "";
  const bodyMatch = html.match(/<div[^>]+class=["'][^"']*chapter-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (bodyMatch) {
    body = bodyMatch[1];
  } else {
    const pMatches = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
    body = pMatches.map(m => m[1]).join("\n\n");
  }

  const textPages = splitIntoPages(body);
  return textPages.map((chunk, idx) => renderSvgPage(chTitle, chunk, idx + 1, textPages.length));
}

const plugin = {
  id: "wuxiaworld-en",
  name: "WuxiaWorld (English Web Novels)",
  version: "2.0.0",
  popular,
  search,
  detail,
  chapters,
  pageUrls
};

return plugin;
