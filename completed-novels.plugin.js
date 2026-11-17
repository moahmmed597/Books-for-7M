const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const BASE = "https://kolnovel.com";
const API = "https://kolnovel.com/wp-json/app/v2";

function cleanInline(value) {
  return String(value || "").replace(/[ \t]+/g, " ").trim();
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanTitle(val) {
  if (!val) return "";
  return String(val)
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8230;/g, "...")
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/@(kol|Martial|Gamer|novel)\w*/gi, "")
    .replace(/@/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value) {
  return cleanTitle(cleanText(String(value || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")));
}

function cleanHtmlToParagraphs(html) {
  const text = String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ");

  const rawParas = text.split(/\n+/).map(p => cleanInline(p)).filter(Boolean);
  const paras = [];
  const MAX_WORDS = 170;

  for (const p of rawParas) {
    const words = p.split(/\s+/).filter(Boolean);
    if (words.length <= MAX_WORDS) {
      paras.push(p);
    } else {
      for (let i = 0; i < words.length; i += MAX_WORDS) {
        paras.push(words.slice(i, i + MAX_WORDS).join(" "));
      }
    }
  }
  return paras;
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
  const safeTitle = cleanXmlEntities(cleanTitle(title));
  const paragraphs = textChunk.split(/\n\n+/).filter(Boolean);
  const formattedHtml = paragraphs.map(p => {
    return `<p style="margin: 0 0 16px 0; text-indent: 1.5em; text-align: justify; line-height: 2.0;">${cleanXmlEntities(p)}</p>`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0e131f"/>
      <stop offset="100%" stop-color="#05080f"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="50" y="30" width="1180" height="660" rx="16" fill="#131b2e" stroke="#3b2f15" stroke-width="1.5"/>
  
  <text x="640" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Cairo', 'Noto Sans Arabic', 'Tajawal', Roboto, sans-serif" font-size="22" font-weight="bold" fill="#f59e0b" text-anchor="middle" direction="rtl">${safeTitle}</text>
  <line x1="90" y1="102" x2="1190" y2="102" stroke="#3b2f15" stroke-width="1"/>

  <foreignObject x="90" y="125" width="1100" height="495">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Cairo', 'Noto Sans Arabic', 'Tajawal', Roboto, sans-serif; font-size: 24px; line-height: 2.0; direction: rtl; text-align: justify; padding: 10px 15px;">
      ${formattedHtml}
    </div>
  </foreignObject>

  <line x1="90" y1="635" x2="1190" y2="635" stroke="#3b2f15" stroke-width="1"/>
  <text x="640" y="663" font-family="-apple-system, 'Segoe UI', Arial, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">صفحة ${pageNum} من ${totalPages}</text>
</svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

async function text(url, headers = {}) {
  const res = await harbor.http(url, {
    headers: { "User-Agent": UA, ...headers },
    responseType: "text"
  });
  if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
  return res.body;
}

async function jsonGet(url, headers = {}) {
  const res = await harbor.http(url, {
    headers: { "User-Agent": UA, "Accept": "application/json", ...headers },
    responseType: "json"
  });
  if (!res.ok) return null;
  return res.body;
}

function uniq(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const it of arr) {
    const k = keyFn(it);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(it);
    }
  }
  return out;
}

async function popular(offset) {
  const page = Math.floor((parseInt(offset, 10) || 0) / 25) + 1;
  const data = await jsonGet(API + "/discover?page=" + page);
  const items = (data && data.data) || [];
  const filtered = items.filter((n) => {
      const s = (n.status || '').toLowerCase();
      return /completed|مكتمل|منتهي/i.test(s);
    });
    const source = filtered.length > 0 ? filtered : items;
  return source.map(n => ({
    id: n.slug || String(n.id),
    title: cleanTitle(n.title),
    cover: n.cover_url || "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/audiobook-default.svg"
  }));
}

async function search(query, offset) {
  const q = cleanText(query);
  if (!q) return popular(offset);

  const searchUrl = BASE + "/?s=" + encodeURIComponent(q);
  try {
    const html = await text(searchUrl);
    const re = /href=["'](https:\/\/kolnovel\.com\/series\/[^"'#\s/]+)\/?["'][\s\S]*?<img[^>]+src=["']([^"'#\s]+)["'][\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/gi;
    const matches = Array.from(html.matchAll(re));

    const out = [];
    for (const m of matches) {
      const slug = m[1].split("/").filter(Boolean).pop();
      const cover = m[2];
      const title = stripHtml(m[3]);
      out.push({
        id: slug,
        title: cleanTitle(title || slug),
        cover: cover
      });
    }

    if (out.length > 0) return uniq(out, x => x.id);
  } catch(e) {}

  // Fallback search via discover
  const data = await jsonGet(API + "/discover");
  const items = (data && data.data) || [];
  const qLower = q.toLowerCase();
  return items
    .filter(n => (n.title && n.title.toLowerCase().includes(qLower)) || (n.slug && n.slug.toLowerCase().includes(qLower)))
    .map(n => ({
      id: n.slug || String(n.id),
      title: cleanTitle(n.title),
      cover: n.cover_url || "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/audiobook-default.svg"
    }));
}

async function detail(id) {
  const numericId = parseInt(id, 10);
  let title = "رواية " + id;
  let cover = undefined;
  let description = "رواية مترجمة";
  let author = "KolNovel";
  let status = "ongoing";

  if (!isNaN(numericId) && String(numericId) === String(id)) {
    try {
      const data = await jsonGet(API + "/titles/" + numericId);
      const n = (data && data.data) || {};
      if (n.title) {
        return {
          id: id,
          title: cleanTitle(n.title),
          cover: n.cover_url || undefined,
          description: stripHtml(n.description || n.synopsis || "رواية مترجمة"),
          author: cleanTitle(n.author || "KolNovel"),
          status: n.status || "ongoing"
        };
      }
    } catch(e) {}
  }

  try {
    const html = await text(BASE + "/series/" + id + "/");
    const titleMatch = html.match(/<h1[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
                       html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (titleMatch) title = stripHtml(titleMatch[1]);

    const descMatch = html.match(/<div[^>]*class=["'][^"']*entry-content_wrap[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                      html.match(/<div[^>]*class=["'][^"']*description[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if (descMatch) description = stripHtml(descMatch[1]);

    const coverMatch = html.match(/<div[^>]*class=["'][^"']*thumb[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
    if (coverMatch) cover = coverMatch[1];
  } catch(e) {}

  return {
    id: id,
    title: cleanTitle(title),
    cover: cover,
    description: description,
    author: author,
    status: status
  };
}

async function chapters(id) {
  let slug = id;
  const numericId = parseInt(id, 10);
  if (!isNaN(numericId) && String(numericId) === String(id)) {
    try {
      const tData = await jsonGet(API + "/titles/" + numericId);
      if (tData && tData.data && tData.data.slug) {
        slug = tData.data.slug;
      }
    } catch(e) {}
  }

  try {
    const html = await text(BASE + "/series/" + slug + "/");
    const re = /<li[^>]*class=["'][^"']*kol-series-chapter[^"']*["'][^>]*data-chapter-id=["'](\d+)["'][\s\S]*?<a[^>]*href=["']([^"']+)["'][\s\S]*?data-kol-chapter-number=["']([^"']*)["'][\s\S]*?<span[^>]*class=["'][^"']*kol-series-chapter__title-copy[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi;
    const matches = Array.from(html.matchAll(re));

    const list = [];
    for (const m of matches) {
      const chapId = m[1];
      const chapNum = m[3] || String(list.length + 1);
      const rawTitle = stripHtml(m[4]);
      const chapTitle = (rawTitle && rawTitle !== "—" && rawTitle !== "-") 
        ? ("فصل " + chapNum + ": " + rawTitle)
        : ("الفصل " + chapNum);
      list.push({
        id: chapId,
        chapter: chapNum,
        title: cleanTitle(chapTitle),
        number: parseFloat(chapNum) || (list.length + 1)
      });
    }

    if (list.length > 0) {
      return uniq(list, x => x.id);
    }

    // Fallback shortcuts
    const scRe = /data-kol-chapter-id=["'](\d+)["'][\s\S]*?<strong>([\s\S]*?)<\/strong>/gi;
    for (const m of Array.from(html.matchAll(scRe))) {
      list.push({
        id: m[1],
        chapter: String(list.length + 1),
        title: cleanTitle(stripHtml(m[2])),
        number: list.length + 1
      });
    }
    if (list.length > 0) return uniq(list, x => x.id);

    // Old slug-based fallback
    const oldRe = /href=["'](https:\/\/kolnovel\.com\/[^"'#\s]+)\/?["'][^>]*>([\s\S]*?)<\/a>/gi;
    for (const m of Array.from(html.matchAll(oldRe))) {
      if (m[1].includes('-chapter-') || m[1].includes('shaag24')) {
        const chapSlug = m[1].split("/").filter(Boolean).pop();
        list.push({
          id: chapSlug,
          chapter: chapSlug,
          title: cleanTitle(stripHtml(m[2]) || chapSlug),
          number: list.length + 1
        });
      }
    }
    return uniq(list, x => x.id);
  } catch(e) {
    return [];
  }
}

async function pageUrls(chapterId) {
  let content = "";
  let chapterTitle = "الفصل " + chapterId;
  const numericId = parseInt(chapterId, 10);

  if (!isNaN(numericId) && String(numericId) === String(chapterId)) {
    try {
      const data = await jsonGet(API + "/reader/" + numericId);
      const entry = (data && data.data && data.data.entry) || {};
      if (entry.content) {
        content = entry.content;
        chapterTitle = entry.title || chapterTitle;
      }
    } catch(e) {}
  }

  if (!content) {
    try {
      const url = chapterId.startsWith("http") ? chapterId : (BASE + "/" + chapterId + "/");
      const html = await text(url);
      const match = html.match(/<div[^>]*class=["'][^"']*epcontent[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                    html.match(/<div[^>]*class=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      if (match) {
        content = match[1];
      }
    } catch(e) {}
  }

  if (!content) {
    content = "<p>عذرًا، تعذر تحميل محتوى الفصل حاليًا.</p>";
  }

  const pages = splitIntoPages(content);
  return pages.map((chunk, idx) => renderSvgPage(chapterTitle, chunk, idx + 1, pages.length));
}

const plugin = {
  id: "completed-novels-ar",
  name: "الروايات المكتملة (Completed Novels)",
  version: "3.0.0",
  popular,
  search,
  detail,
  chapters,
  pageUrls
};

return plugin;
