const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const BASE = "https://standardebooks.org";

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
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="50" y="30" width="1180" height="660" rx="16" fill="#27272a" stroke="#3f3f46" stroke-width="1.5"/>
  
  <text x="640" y="78" font-family="'Segoe UI', Georgia, serif" font-size="22" font-weight="bold" fill="#fbbf24" text-anchor="middle">${safeTitle}</text>
  <line x1="90" y1="102" x2="1190" y2="102" stroke="#3f3f46" stroke-width="1"/>

  <foreignObject x="90" y="125" width="1100" height="495">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #f4f4f5; font-family: 'Segoe UI', Georgia, serif; font-size: 24px; line-height: 1.8; direction: ltr; text-align: left; padding: 10px 15px;">
      ${formattedHtml}
    </div>
  </foreignObject>

  <line x1="90" y1="635" x2="1190" y2="635" stroke="#3f3f46" stroke-width="1"/>
  <text x="640" y="663" font-family="Arial, sans-serif" font-size="16" fill="#a1a1aa" text-anchor="middle">Page ${pageNum} of ${totalPages}</text>
</svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function parseBooksFromHtml(html) {
  const re = /<a[^>]+href=["'](\/ebooks\/([^/"'\s]+)\/([^/"'\s]+))["'][^>]*>([\s\S]*?)<\/a>/gi;
  const matches = Array.from(html.matchAll(re));
  const out = [];

  for (const m of matches) {
    const author = m[2];
    const slug = m[3];
    if (slug.startsWith("page") || slug === "downloads" || author === "tags" || author === "subjects") continue;

    const id = author + "/" + slug;
    const title = stripHtml(m[4]) || slug.replace(/-/g, " ");
    const cover = BASE + "/ebooks/" + author + "/" + slug + "/downloads/cover-thumbnail.jpg";

    out.push({
      id: id,
      title: title,
      cover: cover
    });
  }

  return uniq(out, x => x.id);
}

async function popular(offset) {
  const html = await text(BASE + "/ebooks");
  return parseBooksFromHtml(html);
}

async function search(query, offset) {
  const q = cleanText(query);
  if (!q) return popular(offset);

  const html = await text(BASE + "/ebooks?query=" + encodeURIComponent(q));
  return parseBooksFromHtml(html);
}

async function detail(id) {
  const parts = id.split("/");
  const author = parts[0];
  const slug = parts[1];

  const html = await text(BASE + "/ebooks/" + author + "/" + slug);

  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? stripHtml(titleMatch[1]) : slug.replace(/-/g, " ");

  const descMatch = html.match(/<section[^>]+id=["']description["'][^>]*>([\s\S]*?)<\/section>/i) ||
                    html.match(/<p[^>]+property=["']schema:description["'][^>]*>([\s\S]*?)<\/p>/i);
  const description = descMatch ? stripHtml(descMatch[1]) : "";

  const cover = BASE + "/ebooks/" + author + "/" + slug + "/downloads/cover-thumbnail.jpg";

  return {
    id: id,
    title: title,
    cover: cover,
    description: description,
    author: author.replace(/-/g, " "),
    status: "completed"
  };
}

async function chapters(id) {
  const parts = id.split("/");
  const author = parts[0];
  const slug = parts[1];

  const html = await text(BASE + "/ebooks/" + author + "/" + slug + "/text/single-page");

  const re = /<section[^>]+id=["']([^"']+)["'][^>]+epub:type=["'][^"']*chapter[^"']*["'][^>]*>([\s\S]*?)(?=<section|<\/article|<\/body|$)/gi;
  const matches = Array.from(html.matchAll(re));

  const list = [];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const sId = m[1];
    const body = m[2];

    const hMatch = body.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
    const title = hMatch ? stripHtml(hMatch[1]) : ("Chapter " + (i + 1));

    list.push({
      id: id + "#" + sId,
      chapter: String(i + 1),
      title: title || ("Chapter " + (i + 1)),
      number: i + 1
    });
  }

  return list;
}

async function pageUrls(chapterId) {
  // chapterId is formatted as "author/slug#sectionId"
  const hashIdx = chapterId.indexOf("#");
  if (hashIdx === -1) throw new Error("Invalid Standard Ebooks chapter ID format: " + chapterId);

  const bookId = chapterId.substring(0, hashIdx);
  const sId = chapterId.substring(hashIdx + 1);

  const html = await text(BASE + "/ebooks/" + bookId + "/text/single-page");

  const re = new RegExp('<section[^>]+id=["\']' + sId + '["\'][^>]*>([\\s\\S]*?)(?=<section|<\\/article|<\\/body|$)', 'i');
  const m = html.match(re);
  if (!m) throw new Error("Could not find section: " + sId);

  const body = m[1];
  const hMatch = body.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
  const chTitle = hMatch ? stripHtml(hMatch[1]) : "Chapter";

  const pMatches = Array.from(body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
  const rawText = pMatches.map(p => p[1]).join("\n\n");

  const textPages = splitIntoPages(rawText);
  return textPages.map((chunk, idx) => renderSvgPage(chTitle, chunk, idx + 1, textPages.length));
}

const plugin = {
  id: "standard-ebooks-en",
  name: "Standard Ebooks (Classic Literature)",
  version: "2.0.0",
  popular,
  search,
  detail,
  chapters,
  pageUrls
};

return plugin;
