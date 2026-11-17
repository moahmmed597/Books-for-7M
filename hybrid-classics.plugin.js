const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const SE_BASE = "https://standardebooks.org";
const LIBRIVOX_API = "https://librivox.org/api/feed/audiobooks";

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

// Masterpieces that offer BOTH full-text TV reading AND matching audio narration
const HYBRID_BOOKS = [
  {
    id: "dracula",
    title: "Dracula (رواية دراكولا - اقرأ واستمع)",
    author: "Bram Stoker",
    sePath: "bram-stoker/dracula",
    librivoxId: "271",
    description: "التحفة القوطية الكلاسيكية الخالدة؛ عش تجربة مطاردة الكونت دراكولا عبر صفحات النص المقروء والتسجيل الصوتي الدرامي المتقن في آنٍ واحد.",
    cover: "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/dracula.jpg"
  },
  {
    id: "frankenstein",
    title: "Frankenstein; or, The Modern Prometheus",
    author: "Mary Wollstonecraft Shelley",
    sePath: "mary-shelley/frankenstein",
    librivoxId: "2030",
    description: "الرواية التأسيسية لأدب الخيال العلمي؛ قصة فيكتور فرانكنشتاين وطموحه لصناعة الحياة والصراع المأساوي مع مخلوقه.",
    cover: "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/frankenstein.jpg"
  },
  {
    id: "the-time-machine",
    title: "The Time Machine (آلة الزمن)",
    author: "H. G. Wells",
    sePath: "h-g-wells/the-time-machine",
    librivoxId: "5618",
    description: "رحلة ملحمية عبر الزمان إلى مستقبل البشرية السحيق؛ استكشف حضارة الإيلوي والمورلوك تحت الأرض نصاً وصوتاً.",
    cover: "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/time-machine.jpg"
  },
  {
    id: "a-study-in-scarlet",
    title: "A Study in Scarlet (دراسة في القرمزي - شارلوك هولمز)",
    author: "Arthur Conan Doyle",
    sePath: "arthur-conan-doyle/a-study-in-scarlet",
    librivoxId: "2452",
    description: "أول ظهور للأسطورة شارلوك هولمز والدكتور واطسون في 221B بيكر ستريت؛ أول لغز جريمة غامضة يبهر العالم بأسلوب الاستنتاج الباهر.",
    cover: "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/study-in-scarlet.jpg"
  },
  {
    id: "the-picture-of-dorian-gray",
    title: "The Picture of Dorian Gray (صورة دوريان غراي)",
    author: "Oscar Wilde",
    sePath: "oscar-wilde/the-picture-of-dorian-gray",
    librivoxId: "6124",
    description: "رواية أوسكار وايلد الفلسفية الشهيرة عن الفن والجمال الأبدي وثمن بيع الروح للشباب الدائم.",
    cover: "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/dorian-gray.jpg"
  }
];

async function text(url) {
  const res = await harbor.http(url, {
    method: "GET",
    responseType: "text",
    headers: {
      "User-Agent": UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    },
    timeoutMs: 25000,
  });
  if (!res || !res.ok) throw new Error("HTTP error for " + url);
  return typeof res === "string" ? res : (res.body || "");
}

async function jsonGet(url) {
  const res = await harbor.http(url, {
    method: "GET",
    responseType: "json",
    headers: {
      "User-Agent": UA,
      "Accept": "application/json"
    },
    timeoutMs: 25000,
  });
  if (!res) throw new Error("Null response from " + url);
  return typeof res === "object" && "body" in res && typeof res.body === "object" ? res.body : res;
}

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
    return `<p style="margin: 0 0 16px 0; text-indent: 1.5em; text-align: justify;">${cleanXmlEntities(p)}</p>`;
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
  <text x="640" y="663" font-family="-apple-system, Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle">Page ${pageNum} of ${totalPages} · 🎧 Listen Sync</text>
</svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

async function popular(offset) {
  return HYBRID_BOOKS.map(b => ({
    id: b.id,
    title: b.title,
    cover: b.cover
  }));
}

async function search(query, offset) {
  const q = cleanText(query).toLowerCase();
  if (!q) return popular(offset);

  const matched = HYBRID_BOOKS.filter(b =>
    b.title.toLowerCase().includes(q) ||
    b.author.toLowerCase().includes(q) ||
    b.description.toLowerCase().includes(q)
  );

  return (matched.length > 0 ? matched : HYBRID_BOOKS).map(b => ({
    id: b.id,
    title: b.title,
    cover: b.cover
  }));
}

async function detail(id) {
  const b = HYBRID_BOOKS.find(x => x.id === id) || HYBRID_BOOKS[0];
  return {
    id: b.id,
    title: b.title,
    cover: b.cover,
    description: b.description + "\n\n💡 يدعم هذا الكتاب خياري «قراءة 📖» و«استماع 🎧» بشكل متزامن وبنفس ترقيم الفصول.",
    author: b.author,
    status: "completed"
  };
}

// Reading chapters (returns chapters for 📖 Read)
async function chapters(id) {
  const b = HYBRID_BOOKS.find(x => x.id === id) || HYBRID_BOOKS[0];
  const html = await text(SE_BASE + "/ebooks/" + b.sePath + "/text/single-page");

  const re = /<section[^>]+id=["']([^"']+)["'][^>]+epub:type=["'][^"']*chapter[^"']*["'][^>]*>([\s\S]*?)(?=<section|<\/article|<\/body|$)/gi;
  const matches = Array.from(html.matchAll(re));

  const list = [];
  for (let i = 0; i < matches.length; i++) {
    const sId = matches[i][1];
    const body = matches[i][2];
    const hMatch = body.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
    const title = hMatch ? stripHtml(hMatch[1]) : ("Chapter " + (i + 1));

    list.push({
      id: b.id + "#" + sId,
      chapter: String(i + 1), // matches chapter in audioTracks()
      title: title || ("Chapter " + (i + 1)),
      number: i + 1
    });
  }

  return list;
}

// SVG Page rendering for 📖 Read
async function pageUrls(chapterId) {
  const hashIdx = chapterId.indexOf("#");
  if (hashIdx === -1) throw new Error("Invalid chapter ID: " + chapterId);

  const bookId = chapterId.substring(0, hashIdx);
  const sId = chapterId.substring(hashIdx + 1);
  const b = HYBRID_BOOKS.find(x => x.id === bookId) || HYBRID_BOOKS[0];

  const html = await text(SE_BASE + "/ebooks/" + b.sePath + "/text/single-page");
  const re = new RegExp('<section[^>]+id=["\']' + sId + '["\'][^>]*>([\\s\\S]*?)(?=<section|<\\/article|<\\/body|$)', 'i');
  const m = html.match(re);
  if (!m) throw new Error("Section not found: " + sId);

  const body = m[1];
  const hMatch = body.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
  const chTitle = hMatch ? stripHtml(hMatch[1]) : "Chapter";

  const pMatches = Array.from(body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
  const rawText = pMatches.map(p => p[1]).join("\n\n");

  const textPages = splitIntoPages(rawText);
  return textPages.map((chunk, idx) => renderSvgPage(chTitle, chunk, idx + 1, textPages.length));
}

// Audio tracks for 🎧 Listen
async function audioTracks(id) {
  const b = HYBRID_BOOKS.find(x => x.id === id) || HYBRID_BOOKS[0];
  const data = await jsonGet(LIBRIVOX_API + "/?id=" + b.librivoxId + "&format=json&extended=1");
  const books = (data && data.books) || [];
  if (!books.length) return [];

  const sections = books[0].sections || [];
  return sections.map((s, idx) => {
    // Determine chapter number to match reading
    let chNumber = String(idx + 1);
    if (b.id === "the-picture-of-dorian-gray") {
      // In 6124: section 0 is Preface, section 1 is Chapter 1, matching SE's 20 chapters
      chNumber = String(idx);
    } else {
      const match = (s.title || "").match(/chapter\s+(\d+)/i);
      if (match) {
        chNumber = String(parseInt(match[1], 10));
      }
    }

    return {
      id: String(s.id || idx + 1),
      title: cleanText(s.title || ("Chapter " + (idx + 1))),
      url: s.listen_url, // direct MP3 link
      duration: parseInt(s.playtime, 10) || 0,
      chapter: chNumber // links reading and listening
    };
  });
}

const plugin = {
  id: "hybrid-classics",
  name: "اقرأ واستمع معاً (Hybrid Classics - Read & Listen)",
  version: "2.0.0",
  popular,
  search,
  detail,
  chapters,
  pageUrls,
  audioTracks
};

return plugin;
