const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const SHAMELA_BASE = "https://shamela.ws";
const SE_BASE = "https://standardebooks.org";

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripHtml(value) {
  return cleanText(String(value || "")
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
    .replace(/&mdash;/gi, "—"));
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

// Masterpieces of Space, Astronomy, Cosmos & Natural Sciences
const SPACE_SCIENCE_BOOKS = [
  {
    id: "shamela:452",
    title: "كتاب زيج الصابئ (علم الفلك وحركات الكواكب والنجوم)",
    author: "محمد بن جابر بن سنان البتاني (أشهر علماء الفلك)",
    description: "أعظم كتاب تراثي في علم الفلك وحساب حركات الكواكب ومواقع النجوم والكسوف والخسوف وأبعاد الأجرام السماوية.",
    cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Al-Battani.jpg/400px-Al-Battani.jpg",
    source: "shamela"
  },
  {
    id: "shamela:9093",
    title: "كتاب الأنواء في مواسم العرب وعلم الفلك والنجوم",
    author: "ابن قتيبة الدينوري",
    description: "مرجع كلاسيكي شامل في دراسة السماء، ومطالع النجوم، والأبراج، وحركة الفصول وتقلبات الطقس والكون.",
    cover: "https://shamela.ws/favicon.ico",
    source: "shamela"
  },
  {
    id: "shamela:12834",
    title: "رسائل فلسفية في المكان والزمان والفضاء الكوني",
    author: "أبو بكر محمد بن زكريا الرازي",
    description: "أبحاث فلسفية وعلمية عميقة تناقش الفضاء والزمان المطلق وطبيعة الفراغ الكوني والمادة والحركة.",
    cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Rhazes.jpg/400px-Rhazes.jpg",
    source: "shamela"
  },
  {
    id: "shamela:699",
    title: "الجماهر في معرفة الجواهر (علوم الطبيعة والمادة)",
    author: "أبو الريحان البيروني",
    description: "كتاب رائد في فيزياء وخصائص المادة الطبيعية والكثافة النوعية والمعادن وعلم الطبيعة التجريبي.",
    cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Abu_Rayhan_al-Biruni.jpg/400px-Abu_Rayhan_al-Biruni.jpg",
    source: "shamela"
  },
  {
    id: "se:charles-darwin/the-origin-of-species",
    title: "The Origin of Species (أصل الأنواع)",
    author: "Charles Darwin",
    description: "الكتاب العلمي الأكثر تأثيراً في تاريخ العلوم الحديثة وتطور الأحياء وتفسير تنوع الكائنات الحية على كوكب الأرض.",
    cover: "https://standardebooks.org/ebooks/charles-darwin/the-origin-of-species/downloads/cover-thumbnail.jpg",
    source: "standard-ebooks"
  },
  {
    id: "se:alfred-north-whitehead/science-and-the-modern-world",
    title: "Science and the Modern World (العلم والعالم الحديث)",
    author: "Alfred North Whitehead",
    description: "دراسة فلسفية وعلمية كبرى حول تطور الثورة العلمية ونشأة مفاهيم المكان والزمان والفيزياء الحديثة.",
    cover: "https://standardebooks.org/ebooks/alfred-north-whitehead/science-and-the-modern-world/downloads/cover-thumbnail.jpg",
    source: "standard-ebooks"
  },
  {
    id: "se:charles-darwin/the-voyage-of-the-beagle",
    title: "The Voyage of the Beagle (رحلة سفينة البيجل)",
    author: "Charles Darwin",
    description: "يوميات الرحلة الاستكشافية الكبرى حول العالم واستكشاف الطبيعة والجيولوجيا والمحيطات والجزر المجهولة.",
    cover: "https://standardebooks.org/ebooks/charles-darwin/the-voyage-of-the-beagle/downloads/cover-thumbnail.jpg",
    source: "standard-ebooks"
  },
  {
    id: "se:bertrand-russell/the-problems-of-philosophy",
    title: "The Problems of Philosophy (مشكلات الفلسفة والكون)",
    author: "Bertrand Russell",
    description: "مقدمة فلسفية تأسيسية تبحث في طبيعة المادة، ونظرية المعرفة، وإدراك الإنسان للكون والواقع الفيزيائي.",
    cover: "https://standardebooks.org/ebooks/bertrand-russell/the-problems-of-philosophy/downloads/cover-thumbnail.jpg",
    source: "standard-ebooks"
  },
  {
    id: "se:edgar-rice-burroughs/a-fighting-man-of-mars",
    title: "A Fighting Man of Mars (رحلة إلى كوكب المريخ)",
    author: "Edgar Rice Burroughs",
    description: "رواية علمية وخيالية تأخذ القارئ في مغامرة شيقة إلى أرجاء وتضاريس وفضاء كوكب المريخ.",
    cover: "https://standardebooks.org/ebooks/edgar-rice-burroughs/a-fighting-man-of-mars/downloads/cover-thumbnail.jpg",
    source: "standard-ebooks"
  }
];

// TV Book Page Renderer (16:9 widescreen dark mode SVG pages)
function splitIntoPages(rawText) {
  const clean = stripHtml(rawText);
  const paragraphs = clean.split(/\n+/).map(p => p.trim()).filter(Boolean);
  const pages = [];
  let currentChunk = [];
  let currentWordCount = 0;

  for (const p of paragraphs) {
    const words = p.split(/\s+/).length;
    if (currentWordCount + words > 220 && currentChunk.length > 0) {
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
  return pages.length ? pages : [clean];
}

function renderSvgPage(title, textChunk, pageNum, totalPages, isArabic) {
  const safeTitle = cleanText(title).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const formattedHtml = textChunk
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n\n/g, "<br/><br/>");

  const dir = isArabic ? "rtl" : "ltr";
  const align = isArabic ? "justify" : "left";
  const footerText = isArabic ? `صفحة ${pageNum} من ${totalPages}` : `Page ${pageNum} of ${totalPages}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1128"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="50" y="30" width="1180" height="660" rx="16" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
  
  <text x="640" y="78" font-family="'Segoe UI', Tahoma, Arial, sans-serif" font-size="22" font-weight="bold" fill="#38bdf8" text-anchor="middle" direction="${dir}">${safeTitle}</text>
  <line x1="90" y1="102" x2="1190" y2="102" stroke="#1e293b" stroke-width="1"/>

  <foreignObject x="90" y="125" width="1100" height="495">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #e2e8f0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 24px; line-height: 1.85; direction: ${dir}; text-align: ${align}; padding: 10px 15px;">
      ${formattedHtml}
    </div>
  </foreignObject>

  <line x1="90" y1="635" x2="1190" y2="635" stroke="#1e293b" stroke-width="1"/>
  <text x="640" y="663" font-family="Arial, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">${footerText}</text>
</svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

async function popular(offset) {
  return SPACE_SCIENCE_BOOKS.map(b => ({
    id: b.id,
    title: b.title,
    cover: b.cover
  }));
}

async function search(query, offset) {
  const q = cleanText(query).toLowerCase();
  if (!q) return popular(offset);

  const matched = SPACE_SCIENCE_BOOKS.filter(b => 
    b.title.toLowerCase().includes(q) || 
    b.author.toLowerCase().includes(q) || 
    b.description.toLowerCase().includes(q)
  );

  return (matched.length > 0 ? matched : SPACE_SCIENCE_BOOKS).map(b => ({
    id: b.id,
    title: b.title,
    cover: b.cover
  }));
}

async function detail(id) {
  const found = SPACE_SCIENCE_BOOKS.find(b => b.id === String(id));
  if (found) {
    return {
      id: found.id,
      title: found.title,
      cover: found.cover,
      description: found.description,
      author: found.author,
      status: "completed"
    };
  }
  return {
    id: String(id),
    title: "كتاب العلوم والفضاء",
    cover: "https://shamela.ws/favicon.ico",
    description: "مرجع علمي في الفضاء وعلوم الطبيعة والكون.",
    author: "علوم",
    status: "completed"
  };
}

async function chapters(id) {
  if (id.startsWith("shamela:")) {
    const shamelaId = id.replace("shamela:", "");
    const html = await text(SHAMELA_BASE + "/book/" + shamelaId);
    const re = new RegExp('href=["\'](?:https://shamela\\.ws)?/book/' + shamelaId + '/(\\d+)["\'][^>]*>([\\s\\S]*?)</a>', 'gi');
    const matches = Array.from(html.matchAll(re));

    const list = [];
    for (const m of matches) {
      const pageId = m[1];
      const chTitle = stripHtml(m[2]);
      if (!pageId || !chTitle || chTitle === "[+]" || chTitle === "[-]") continue;
      list.push({
        id: "shamela:" + shamelaId + "/" + pageId,
        chapter: pageId,
        title: chTitle,
        number: list.length + 1
      });
    }
    return uniq(list, x => x.id);
  } else if (id.startsWith("se:")) {
    const seId = id.replace("se:", "");
    const html = await text(SE_BASE + "/ebooks/" + seId + "/text/single-page");
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
        id: "se:" + seId + "#" + sId,
        chapter: String(i + 1),
        title: title || ("Chapter " + (i + 1)),
        number: i + 1
      });
    }
    return list;
  }
  return [];
}

async function pageUrls(chapterId) {
  if (chapterId.startsWith("shamela:")) {
    const target = chapterId.replace("shamela:", "");
    const url = SHAMELA_BASE + "/book/" + target;
    const html = await text(url);

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const rawTitle = titleMatch ? stripHtml(titleMatch[1]).replace(" - المكتبة الشاملة", "").trim() : "فصل";

    let body = "";
    const nassMatch = html.match(/<div[^>]+class=["'][^"']*nass[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if (nassMatch) {
      body = nassMatch[1];
    } else {
      const pMatches = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
      body = pMatches.map(m => m[1]).join("\n\n");
    }

    const textPages = splitIntoPages(body);
    return textPages.map((chunk, idx) => renderSvgPage(rawTitle, chunk, idx + 1, textPages.length, true));
  } else if (chapterId.startsWith("se:")) {
    const full = chapterId.replace("se:", "");
    const hashIdx = full.indexOf("#");
    const bookId = full.substring(0, hashIdx);
    const sId = full.substring(hashIdx + 1);

    const html = await text(SE_BASE + "/ebooks/" + bookId + "/text/single-page");
    const re = new RegExp('<section[^>]+id=["\']' + sId + '["\'][^>]*>([\\s\\S]*?)(?=<section|<\\/article|<\\/body|$)', 'i');
    const m = html.match(re);
    if (!m) throw new Error("Could not find section: " + sId);

    const body = m[1];
    const hMatch = body.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
    const chTitle = hMatch ? stripHtml(hMatch[1]) : "Chapter";

    const pMatches = Array.from(body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
    const rawText = pMatches.map(p => p[1]).join("\n\n");

    const textPages = splitIntoPages(rawText);
    return textPages.map((chunk, idx) => renderSvgPage(chTitle, chunk, idx + 1, textPages.length, false));
  }
  return [];
}

const plugin = {
  id: "space-and-science",
  name: "كتب الفضاء والعلوم الطبيعية (Space & Science)",
  popular,
  search,
  detail,
  chapters,
  pageUrls
};

return plugin;
