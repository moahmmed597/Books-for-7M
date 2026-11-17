const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const SHAMELA_BASE = "https://shamela.ws";

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

// Curated Masterpieces of Arabic Philosophy, Logic, and Civilizational Thought
const CURATED_BOOKS = [
  {
    id: "12320",
    title: "مقدمة ابن خلدون (ديوان المبتدأ والخبر في تاريخ العرب والبربر)",
    author: "عبد الرحمن بن خلدون",
    description: "أعظم كتاب في فلسفة التاريخ وعلم الاجتماع البشري ونشأة الحضارات والدول وقوانين العمران البشري.",
    cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Ibn_Khaldun_monument%2C_Tunis.jpg/400px-Ibn_Khaldun_monument%2C_Tunis.jpg"
  },
  {
    id: "11055",
    title: "تهافت الفلاسفة",
    author: "أبو حامد الغزالي",
    description: "أشهر مؤلف فلسفي نقدي في تاريخ الفكر الإسلامي والعالمي، يناقش فيه الغزالي آراء أرسطو والفارابي وابن سينا في نشأة الكون والزمان وما وراء الطبيعة.",
    cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Al-Ghazali.jpg/400px-Al-Ghazali.jpg"
  },
  {
    id: "26537",
    title: "كليلة ودمنة (حكمة الفلسفة والأخلاق والسياسة)",
    author: "عبد الله بن المقفع",
    description: "من أخلد كتب الحكمة والفلسفة الأخلاقية والسياسية في التراث العالمي المترجم إلى العربية بأسلوب أدبي حكيم.",
    cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Kalila_wa_Dimna_manuscript.jpg/400px-Kalila_wa_Dimna_manuscript.jpg"
  },
  {
    id: "12834",
    title: "رسائل فلسفية (في المكان، الزمان، والمادة)",
    author: "أبو بكر محمد بن زكريا الرازي",
    description: "رسائل فلسفية تأسيسية في الفلسفة الطبيعية ونظرية المعرفة، وبحث في طبيعة الفضاء المطلق والزمان والمادة.",
    cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Rhazes.jpg/400px-Rhazes.jpg"
  },
  {
    id: "1112",
    title: "كتاب المغالطات المنطقية (فصول في التفكير النقدي)",
    author: "نخبة من أساتذة المنطق",
    description: "دليل تطبيقي شامل لكشف المغالطات الفكرية في الحوار، ودراسة قواعد المنطق الصوري والاستدلال السليم.",
    cover: "https://shamela.ws/favicon.ico"
  },
  {
    id: "26575",
    title: "معيار العلم في فن المنطق",
    author: "أبو حامد الغزالي",
    description: "كتاب يوضح موازين العقل ومسالك الأقيسة والبراهين ومبادئ التعريفات المنطقية وفلسفة المعرفة.",
    cover: "https://shamela.ws/favicon.ico"
  },
  {
    id: "26538",
    title: "محك النظر في المنطق والفلسفة",
    author: "أبو حامد الغزالي",
    description: "كتاب منهجي في قواعد النظر العقلي والحدود والبراهين ودحض الشبهات الفلسفية.",
    cover: "https://shamela.ws/favicon.ico"
  },
  {
    id: "7227",
    title: "كتاب السياسة",
    author: "ابن سينا (الشيخ الرئيس)",
    description: "رسالة فلسفية لابن سينا في تدبير الرجل نفسه وتدبير منزله وأخلاقه وعلاقاته في المجتمع والدولة.",
    cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Avicenna_Portrait.jpg/400px-Avicenna_Portrait.jpg"
  },
  {
    id: "37540",
    title: "الأدب الصغير والأدب الكبير",
    author: "عبد الله بن المقفع",
    description: "تحفة فلسفية تربوية في رياضة العقل، حفظ المروءة، وتدبير الحياة والتعامل مع النفس والسلطان والأصدقاء.",
    cover: "https://shamela.ws/favicon.ico"
  },
  {
    id: "11995",
    title: "تاريخ الخلفاء",
    author: "جلال الدين السيوطي",
    description: "أحد أشهر المراجع التاريخية التي تؤرخ لتحولات الفكر والسياسة عبر العصور الإسلامية المتعاقبة.",
    cover: "https://shamela.ws/favicon.ico"
  }
];

// TV Book Page Renderer (16:9 widescreen dark mode SVG pages)
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
      <stop offset="0%" stop-color="#15131b"/>
      <stop offset="100%" stop-color="#0a0810"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="50" y="30" width="1180" height="660" rx="16" fill="#1e1b26" stroke="#3b324d" stroke-width="1.5"/>
  
  <text x="640" y="78" font-family="'Segoe UI', Tahoma, Arial, sans-serif" font-size="22" font-weight="bold" fill="#a855f7" text-anchor="middle" direction="rtl">${safeTitle}</text>
  <line x1="90" y1="102" x2="1190" y2="102" stroke="#3b324d" stroke-width="1"/>

  <foreignObject x="90" y="125" width="1100" height="495">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 24px; line-height: 1.9; direction: rtl; text-align: justify; padding: 10px 15px;">
      ${formattedHtml}
    </div>
  </foreignObject>

  <line x1="90" y1="635" x2="1190" y2="635" stroke="#3b324d" stroke-width="1"/>
  <text x="640" y="663" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle">صفحة ${pageNum} من ${totalPages}</text>
</svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

async function popular(offset) {
  return CURATED_BOOKS.map(b => ({
    id: b.id,
    title: b.title,
    cover: b.cover
  }));
}

async function search(query, offset) {
  const q = cleanText(query).toLowerCase();
  if (!q) return popular(offset);

  const matched = CURATED_BOOKS.filter(b => 
    b.title.toLowerCase().includes(q) || 
    b.author.toLowerCase().includes(q) || 
    b.description.toLowerCase().includes(q)
  );

  return (matched.length > 0 ? matched : CURATED_BOOKS).map(b => ({
    id: b.id,
    title: b.title,
    cover: b.cover
  }));
}

async function detail(id) {
  const found = CURATED_BOOKS.find(b => b.id === String(id));
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

  // Fallback direct Shamela book lookup
  const html = await text(SHAMELA_BASE + "/book/" + id);
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? stripHtml(titleMatch[1]).replace(" - المكتبة الشاملة", "").trim() : ("كتاب " + id);

  return {
    id: String(id),
    title: title,
    cover: "https://shamela.ws/favicon.ico",
    description: "كتاب من أمهات الكتب الفكرية والتاريخية في المكتبة الشاملة.",
    author: "تراث فكري",
    status: "completed"
  };
}

async function chapters(id) {
  const html = await text(SHAMELA_BASE + "/book/" + id);

  const re = new RegExp('href=["\'](?:https://shamela\\.ws)?/book/' + id + '/(\\d+)["\'][^>]*>([\\s\\S]*?)</a>', 'gi');
  const matches = Array.from(html.matchAll(re));

  const list = [];
  for (const m of matches) {
    const pageId = m[1];
    const chTitle = stripHtml(m[2]);
    if (!pageId || !chTitle || chTitle === "[+]" || chTitle === "[-]") continue;
    list.push({
      id: id + "/" + pageId,
      chapter: pageId,
      title: chTitle,
      number: list.length + 1
    });
  }

  return uniq(list, x => x.id);
}

async function pageUrls(chapterId) {
  // chapterId is like "12320/1" or "11055/34"
  const url = SHAMELA_BASE + "/book/" + chapterId;
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
  return textPages.map((chunk, idx) => renderSvgPage(rawTitle, chunk, idx + 1, textPages.length));
}

const plugin = {
  id: "intellectual-books-ar",
  name: "روائع الفكر والفلسفة (Arabic Philosophy & Thought)",
  version: "2.0.0",
  popular,
  search,
  detail,
  chapters,
  pageUrls
};

return plugin;
