const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";

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

const EPICS = [
  {
    id: "game-of-thrones",
    title: "A Game of Thrones (رواية صراع العروش - كاملة 72 فصلاً)",
    author: "George R. R. Martin",
    cover: "https://upload.wikimedia.org/wikipedia/en/9/93/AGameOfThrones.jpg",
    description: "الملحمة الكبرى لصراع العروش والعائلات الحاكمة (ستارك، لانيستر، وتارغاريان) على العرش الحديدي وقوى الشتاء والموت القادمة خلف الجدار.\n\nالكتاب الأول من سلسلة أغنية الجليد والنار كامل بجميع فصول الشخصيات الـ 72.",
    url: "https://raw.githubusercontent.com/apoorva-sin/Game-Of-Thrones-Text-Generator/master/got.txt",
    type: "got"
  },
  {
    id: "the-witcher-last-wish",
    title: "The Witcher: The Last Wish (ذا ويتشر - الأمنية الأخيرة)",
    author: "Andrzej Sapkowski",
    cover: "https://upload.wikimedia.org/wikipedia/en/7/78/The_Last_Wish_cover.jpg",
    description: "البداية الأسطورية لمغامرات صائد الوحوش جيرالت أوف ريفيا؛ مواجهة اللعنات، الوحوش السحرية، والأقدار الغامضة وقصة لقائه الأول مع الساحرة ينيفِر.\n\nرواية الويتشر التأسيسية الأولى كاملة بجميع فصولها وقصصها.",
    url: "https://archive.org/download/witcher2swordofdestiny/%28Witcher%201%29The%20Last%20Wish_djvu.txt",
    type: "witcher"
  },
  {
    id: "dune-epic",
    title: "Dune (كثيب - ملحمة كوكب أراكيس وفضاء الرمال)",
    author: "Frank Herbert",
    cover: "https://upload.wikimedia.org/wikipedia/en/d/de/Dune-Frank_Herbert_%281965%29_First_edition.jpg",
    description: "أعظم رواية خيال علمي وفضاء ملحمي في التاريخ؛ صراع السلالات النبيلة (آل آتريدس وآل هاركونن) على كوكب أراكيس الصحراوي ومستقبل البشرية مع بول آتريدس (مؤدّب).\n\nالنص الكامل للملحمة الكبرى مقسم إلى فصول للقراءة المريحة على التلفزيون.",
    url: "https://raw.githubusercontent.com/eaxworthy/dune_nlp/master/data/prepared_texts/dune.txt",
    type: "dune"
  }
];

// In-memory cache for loaded texts
const cache = new Map();

async function getText(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await harbor.http(url, {
    method: "GET",
    responseType: "text",
    headers: {
      "User-Agent": UA,
      "Accept": "text/plain,text/html,*/*"
    },
    timeoutMs: 25000,
  });
  if (!res || !res.ok) throw new Error("HTTP error for " + url);
  const body = typeof res === "string" ? res : (res.body || "");
  cache.set(url, body);
  return body;
}

// TV Book Page Renderer (16:9 widescreen dark mode SVG pages)
function splitIntoPages(rawText) {
  const clean = stripHtml(rawText);
  const paragraphs = clean.split(/\n+/).map(p => p.trim()).filter(Boolean);
  const pages = [];
  let currentChunk = [];
  let currentWordCount = 0;

  for (const p of paragraphs) {
    const words = p.split(/\s+/).length;
    if (currentWordCount + words > 240 && currentChunk.length > 0) {
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
      <stop offset="0%" stop-color="#121824"/>
      <stop offset="100%" stop-color="#070a10"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="50" y="30" width="1180" height="660" rx="16" fill="#182030" stroke="#2a3854" stroke-width="1.5"/>
  
  <text x="640" y="78" font-family="'Segoe UI', Georgia, serif" font-size="22" font-weight="bold" fill="#f59e0b" text-anchor="middle">${safeTitle}</text>
  <line x1="90" y1="102" x2="1190" y2="102" stroke="#2a3854" stroke-width="1"/>

  <foreignObject x="90" y="125" width="1100" height="495">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #f1f5f9; font-family: 'Segoe UI', Georgia, serif; font-size: 24px; line-height: 1.85; direction: ltr; text-align: left; padding: 10px 15px;">
      ${formattedHtml}
    </div>
  </foreignObject>

  <line x1="90" y1="635" x2="1190" y2="635" stroke="#2a3854" stroke-width="1"/>
  <text x="640" y="663" font-family="Arial, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">Page ${pageNum} of ${totalPages} · 7M Epic Reader</text>
</svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

async function popular(offset) {
  return EPICS.map(b => ({
    id: b.id,
    title: b.title,
    cover: b.cover
  }));
}

async function search(query, offset) {
  const q = cleanText(query).toLowerCase();
  if (!q) return popular(offset);

  const matched = EPICS.filter(b =>
    b.title.toLowerCase().includes(q) ||
    b.author.toLowerCase().includes(q) ||
    b.description.toLowerCase().includes(q)
  );

  return (matched.length > 0 ? matched : EPICS).map(b => ({
    id: b.id,
    title: b.title,
    cover: b.cover
  }));
}

async function detail(id) {
  const b = EPICS.find(x => x.id === id) || EPICS[0];
  return {
    id: b.id,
    title: b.title,
    cover: b.cover,
    description: b.description,
    author: b.author,
    status: "completed"
  };
}

async function chapters(id) {
  const b = EPICS.find(x => x.id === id) || EPICS[0];
  const fullText = await getText(b.url);

  if (b.type === "got") {
    // Split Game of Thrones by character POV chapters
    const rawChaps = fullText.split(/\n(?=(?:PROLOGUE|BRAN|CATELYN|DAENERYS|EDDARD|JON|ARYA|TYRION|SANSA)\b)/);
    const list = [];
    for (let i = 1; i < rawChaps.length; i++) {
      const ch = rawChaps[i].trim();
      const firstLine = ch.split('\n')[0].trim();
      list.push({
        id: b.id + ":" + i,
        chapter: String(i),
        title: "Chapter " + i + ": " + firstLine,
        number: i
      });
    }
    return list;
  } else if (b.type === "witcher") {
    // Split The Witcher: The Last Wish by stories
    const storyTitles = [
      "THE VOICE OF REASON 1",
      "THE WITCHER",
      "THE VOICE OF REASON 2",
      "A GRAIN OF TRUTH",
      "THE VOICE OF REASON 3",
      "THE LESSER EVIL",
      "THE VOICE OF REASON 4",
      "A QUESTION OF PRICE",
      "THE VOICE OF REASON 5",
      "THE EDGE OF THE WORLD",
      "THE VOICE OF REASON 6",
      "THE LAST WISH"
    ];
    return storyTitles.map((t, idx) => ({
      id: b.id + ":" + (idx + 1),
      chapter: String(idx + 1),
      title: "Story " + (idx + 1) + ": " + t,
      number: idx + 1
    }));
  } else if (b.type === "dune") {
    // Split Dune into balanced chapter parts (~25,000 chars each)
    const totalChars = fullText.length;
    const chunkSize = 25000;
    const count = Math.ceil(totalChars / chunkSize);
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: b.id + ":" + (i + 1),
        chapter: String(i + 1),
        title: "Dune - Part " + (i + 1),
        number: i + 1
      });
    }
    return list;
  }

  return [];
}

async function pageUrls(chapterId) {
  const parts = chapterId.split(":");
  const bookId = parts[0];
  const chIdx = parseInt(parts[1], 10);

  const b = EPICS.find(x => x.id === bookId) || EPICS[0];
  const fullText = await getText(b.url);

  let chapterTitle = "Chapter " + chIdx;
  let chapterBody = "";

  if (b.type === "got") {
    const rawChaps = fullText.split(/\n(?=(?:PROLOGUE|BRAN|CATELYN|DAENERYS|EDDARD|JON|ARYA|TYRION|SANSA)\b)/);
    const raw = rawChaps[chIdx] || rawChaps[1];
    const lines = raw.trim().split("\n");
    chapterTitle = "A Game of Thrones · " + lines[0].trim();
    chapterBody = lines.slice(1).join("\n");
  } else if (b.type === "witcher") {
    const storyTitles = [
      "THE VOICE OF REASON 1",
      "THE WITCHER",
      "THE VOICE OF REASON 2",
      "A GRAIN OF TRUTH",
      "THE VOICE OF REASON 3",
      "THE LESSER EVIL",
      "THE VOICE OF REASON 4",
      "A QUESTION OF PRICE",
      "THE VOICE OF REASON 5",
      "THE EDGE OF THE WORLD",
      "THE VOICE OF REASON 6",
      "THE LAST WISH"
    ];
    const t = storyTitles[chIdx - 1] || storyTitles[0];
    chapterTitle = "The Witcher · " + t;

    const startPos = fullText.toUpperCase().indexOf(t);
    const nextT = storyTitles[chIdx];
    const endPos = nextT ? fullText.toUpperCase().indexOf(nextT) : fullText.length;
    chapterBody = fullText.substring(startPos, endPos > startPos ? endPos : (startPos + 40000));
  } else if (b.type === "dune") {
    chapterTitle = "Dune · Part " + chIdx;
    const chunkSize = 25000;
    const start = (chIdx - 1) * chunkSize;
    chapterBody = fullText.substring(start, start + chunkSize);
  }

  const textPages = splitIntoPages(chapterBody);
  return textPages.map((chunk, idx) => renderSvgPage(chapterTitle, chunk, idx + 1, textPages.length));
}

const plugin = {
  id: "epic-fantasy",
  name: "سجلات الفانتازيا والعرش (Game of Thrones & The Witcher & Dune)",
  popular,
  search,
  detail,
  chapters,
  pageUrls
};

return plugin;
