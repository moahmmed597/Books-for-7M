const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";

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

const EPICS = [
  {
    id: "game-of-thrones",
    title: "A Game of Thrones (صراع العروش - كاملة 72 فصلاً)",
    author: "George R. R. Martin",
    cover: "https://upload.wikimedia.org/wikipedia/en/9/93/AGameOfThrones.jpg",
    description: "الملحمة الكبرى لصراع العروش والعائلات الحاكمة (ستارك، لانيستر، وتارغاريان) على العرش الحديدي وقوى الشتاء والموت القادمة خلف الجدار.\n\nتدعم القراءة التلفزيونية لكامل الفصول الـ 72 مع الاستماع للكتاب الصوتي الكامل (33 ساعة).",
    url: "https://raw.githubusercontent.com/apoorva-sin/Game-Of-Thrones-Text-Generator/master/got.txt",
    type: "got"
  },
  {
    id: "the-witcher-last-wish",
    title: "The Witcher: The Last Wish (ذا ويتشر - الأمنية الأخيرة)",
    author: "Andrzej Sapkowski",
    cover: "https://upload.wikimedia.org/wikipedia/en/7/78/The_Last_Wish_cover.jpg",
    description: "البداية الأسطورية لمغامرات صائد الوحوش جيرالت أوف ريفيا؛ مواجهة اللعنات، الوحوش السحرية، والأقدار الغامضة وقصة لقائه الأول مع الساحرة ينيفِر.\n\nتدعم القراءة التلفزيونية لجميع قصص جيرالت مع الاستماع للكتاب الصوتي الكامل (10 ساعات).",
    url: "https://archive.org/download/witcher2swordofdestiny/%28Witcher%201%29The%20Last%20Wish_djvu.txt",
    type: "witcher"
  },
  {
    id: "dune-epic",
    title: "Dune (كثيب - ملحمة كوكب أراكيس وفضاء الرمال)",
    author: "Frank Herbert",
    cover: "https://upload.wikimedia.org/wikipedia/en/d/de/Dune-Frank_Herbert_%281965%29_First_edition.jpg",
    description: "أعظم رواية خيال علمي وفضاء ملحمي في التاريخ؛ صراع السلالات النبيلة (آل آتريدس وآل هاركونن) على كوكب أراكيس ومستقبل البشرية مع بول آتريدس (مؤدّب).\n\nتدعم القراءة التلفزيونية والاستماع المتزامن لـ 52 فصلاً صوتياً كاملاً.",
    url: "https://raw.githubusercontent.com/eaxworthy/dune_nlp/master/data/prepared_texts/dune.txt",
    type: "dune"
  },
  {
    id: "the-walking-dead",
    title: "The Walking Dead (الموتى السائرون - صعود الحاكم)",
    author: "Robert Kirkman & Jay Bonansinga",
    cover: "https://upload.wikimedia.org/wikipedia/en/9/9f/The_Walking_Dead_Issue_1.jpg",
    description: "ملحمة نهاية العالم وعالم الموتى السائرون (الزومبي) ونجاة ريك غرايمز والناجين، وتأسيس بلدة وودبري وصعود الحاكم (The Governor).\n\nتدعم القراءة التلفزيونية والاستماع الصوتي الكامل للرواية (أكثر من 10 ساعات).",
    url: "https://archive.org/download/the-walking-dead-days-gone-bye-f9b714/the-walking-dead-days-gone-bye-f9b714_djvu.txt",
    type: "walking-dead"
  }
];

const DUNE_AUDIO_TRACKS = [
  {
    "id": "dune-ch-1",
    "title": "Chapter 00 - Opening Credits",
    "url": "https://archive.org/download/dune-book-1/Chapter%2000%20-%20Opening%20Credits.mp3",
    "duration": 60,
    "chapter": "1"
  },
  {
    "id": "dune-ch-2",
    "title": "Chapter 01 - Book 1 Dune",
    "url": "https://archive.org/download/dune-book-1/Chapter%2001%20-%20Book%201%20Dune.mp3",
    "duration": 10,
    "chapter": "2"
  },
  {
    "id": "dune-ch-3",
    "title": "Chapter 02 - Book 1 Chapter 01",
    "url": "https://archive.org/download/dune-book-1/Chapter%2002%20-%20Book%201%20Chapter%2001.mp3",
    "duration": 1724,
    "chapter": "3"
  },
  {
    "id": "dune-ch-4",
    "title": "Chapter 03 - Book 1 Chapter 02",
    "url": "https://archive.org/download/dune-book-1/Chapter%2003%20-%20Book%201%20Chapter%2002.mp3",
    "duration": 1253,
    "chapter": "4"
  },
  {
    "id": "dune-ch-5",
    "title": "Chapter 04 - Book 1 Chapter 03",
    "url": "https://archive.org/download/dune-book-1/Chapter%2004%20-%20Book%201%20Chapter%2003.mp3",
    "duration": 996,
    "chapter": "5"
  },
  {
    "id": "dune-ch-6",
    "title": "Chapter 05 - Book 1 Chapter 04",
    "url": "https://archive.org/download/dune-book-1/Chapter%2005%20-%20Book%201%20Chapter%2004.mp3",
    "duration": 1385,
    "chapter": "6"
  },
  {
    "id": "dune-ch-7",
    "title": "Chapter 06 - Book 1 Chapter 05",
    "url": "https://archive.org/download/dune-book-1/Chapter%2006%20-%20Book%201%20Chapter%2005.mp3",
    "duration": 602,
    "chapter": "7"
  },
  {
    "id": "dune-ch-8",
    "title": "Chapter 07 - Book 1 Chapter 06",
    "url": "https://archive.org/download/dune-book-1/Chapter%2007%20-%20Book%201%20Chapter%2006.mp3",
    "duration": 937,
    "chapter": "8"
  },
  {
    "id": "dune-ch-9",
    "title": "Chapter 08 - Book 1 Chapter 07",
    "url": "https://archive.org/download/dune-book-1/Chapter%2008%20-%20Book%201%20Chapter%2007.mp3",
    "duration": 1616,
    "chapter": "9"
  },
  {
    "id": "dune-ch-10",
    "title": "Chapter 09 - Book 1 Chapter 08",
    "url": "https://archive.org/download/dune-book-1/Chapter%2009%20-%20Book%201%20Chapter%2008.mp3",
    "duration": 1305,
    "chapter": "10"
  },
  {
    "id": "dune-ch-11",
    "title": "Chapter 10 - Book 1 Chapter 09",
    "url": "https://archive.org/download/dune-book-1/Chapter%2010%20-%20Book%201%20Chapter%2009.mp3",
    "duration": 578,
    "chapter": "11"
  },
  {
    "id": "dune-ch-12",
    "title": "Chapter 11 - Book 1 Chapter 10",
    "url": "https://archive.org/download/dune-book-1/Chapter%2011%20-%20Book%201%20Chapter%2010.mp3",
    "duration": 1235,
    "chapter": "12"
  },
  {
    "id": "dune-ch-13",
    "title": "Chapter 12 - Book 1 Chapter 11",
    "url": "https://archive.org/download/dune-book-1/Chapter%2012%20-%20Book%201%20Chapter%2011.mp3",
    "duration": 763,
    "chapter": "13"
  },
  {
    "id": "dune-ch-14",
    "title": "Chapter 13 - Book 1 Chapter 12",
    "url": "https://archive.org/download/dune-book-1/Chapter%2013%20-%20Book%201%20Chapter%2012.mp3",
    "duration": 2322,
    "chapter": "14"
  },
  {
    "id": "dune-ch-15",
    "title": "Chapter 14 - Book 1 Chapter 13",
    "url": "https://archive.org/download/dune-book-1/Chapter%2014%20-%20Book%201%20Chapter%2013.mp3",
    "duration": 741,
    "chapter": "15"
  },
  {
    "id": "dune-ch-16",
    "title": "Chapter 15 - Book 1 Chapter 14",
    "url": "https://archive.org/download/dune-book-1/Chapter%2015%20-%20Book%201%20Chapter%2014.mp3",
    "duration": 496,
    "chapter": "16"
  },
  {
    "id": "dune-ch-17",
    "title": "Chapter 16 - Book 1 Chapter 15",
    "url": "https://archive.org/download/dune-book-1/Chapter%2016%20-%20Book%201%20Chapter%2015.mp3",
    "duration": 3158,
    "chapter": "17"
  },
  {
    "id": "dune-ch-18",
    "title": "Chapter 17 - Book 1 Chapter 16",
    "url": "https://archive.org/download/dune-book-1/Chapter%2017%20-%20Book%201%20Chapter%2016.mp3",
    "duration": 3245,
    "chapter": "18"
  },
  {
    "id": "dune-ch-19",
    "title": "Chapter 18 - Book 1 Chapter 17",
    "url": "https://archive.org/download/dune-book-1/Chapter%2018%20-%20Book%201%20Chapter%2017.mp3",
    "duration": 1848,
    "chapter": "19"
  },
  {
    "id": "dune-ch-20",
    "title": "Chapter 19 - Book 1 Chapter 18",
    "url": "https://archive.org/download/dune-book-1/Chapter%2019%20-%20Book%201%20Chapter%2018.mp3",
    "duration": 756,
    "chapter": "20"
  },
  {
    "id": "dune-ch-21",
    "title": "Chapter 20 - Book 1 Chapter 19",
    "url": "https://archive.org/download/dune-book-1/Chapter%2020%20-%20Book%201%20Chapter%2019.mp3",
    "duration": 1544,
    "chapter": "21"
  },
  {
    "id": "dune-ch-22",
    "title": "Chapter 21 - Book 1 Chapter 20",
    "url": "https://archive.org/download/dune-book-1/Chapter%2021%20-%20Book%201%20Chapter%2020.mp3",
    "duration": 394,
    "chapter": "22"
  },
  {
    "id": "dune-ch-23",
    "title": "Chapter 22 - Book 1 Chapter 21",
    "url": "https://archive.org/download/dune-book-1/Chapter%2022%20-%20Book%201%20Chapter%2021.mp3",
    "duration": 2011,
    "chapter": "23"
  },
  {
    "id": "dune-ch-24",
    "title": "Chapter 23 - Book 1 Chapter 22",
    "url": "https://archive.org/download/dune-book-1/Chapter%2023%20-%20Book%201%20Chapter%2022.mp3",
    "duration": 2202,
    "chapter": "24"
  },
  {
    "id": "dune-ch-25",
    "title": "Chapter 24 - Book 2 MUAD’DIB",
    "url": "https://archive.org/download/dune-book-1/Chapter%2024%20-%20Book%202%20MUAD%E2%80%99DIB.mp3",
    "duration": 4,
    "chapter": "25"
  },
  {
    "id": "dune-ch-26",
    "title": "Chapter 25 - Book 2 Chapter 23",
    "url": "https://archive.org/download/dune-book-1/Chapter%2025%20-%20Book%202%20Chapter%2023.mp3",
    "duration": 709,
    "chapter": "26"
  },
  {
    "id": "dune-ch-27",
    "title": "Chapter 26 - Book 2 Chapter 24",
    "url": "https://archive.org/download/dune-book-1/Chapter%2026%20-%20Book%202%20Chapter%2024.mp3",
    "duration": 1672,
    "chapter": "27"
  },
  {
    "id": "dune-ch-28",
    "title": "Chapter 27 - Book 2 Chapter 25",
    "url": "https://archive.org/download/dune-book-1/Chapter%2027%20-%20Book%202%20Chapter%2025.mp3",
    "duration": 1893,
    "chapter": "28"
  },
  {
    "id": "dune-ch-29",
    "title": "Chapter 28 - Book 2 Chapter 26",
    "url": "https://archive.org/download/dune-book-1/Chapter%2028%20-%20Book%202%20Chapter%2026.mp3",
    "duration": 1500,
    "chapter": "29"
  },
  {
    "id": "dune-ch-30",
    "title": "Chapter 29 - Book 2 Chapter 27",
    "url": "https://archive.org/download/dune-book-1/Chapter%2029%20-%20Book%202%20Chapter%2027.mp3",
    "duration": 2229,
    "chapter": "30"
  },
  {
    "id": "dune-ch-31",
    "title": "Chapter 30 - Book 2 Chapter 28",
    "url": "https://archive.org/download/dune-book-1/Chapter%2030%20-%20Book%202%20Chapter%2028.mp3",
    "duration": 915,
    "chapter": "31"
  },
  {
    "id": "dune-ch-32",
    "title": "Chapter 31 - Book 2 Chapter 29",
    "url": "https://archive.org/download/dune-book-1/Chapter%2031%20-%20Book%202%20Chapter%2029.mp3",
    "duration": 1460,
    "chapter": "32"
  },
  {
    "id": "dune-ch-33",
    "title": "Chapter 32 - Book 2 Chapter 30",
    "url": "https://archive.org/download/dune-book-1/Chapter%2032%20-%20Book%202%20Chapter%2030.mp3",
    "duration": 1209,
    "chapter": "33"
  },
  {
    "id": "dune-ch-34",
    "title": "Chapter 33 - Book 2 Chapter 31",
    "url": "https://archive.org/download/dune-book-1/Chapter%2033%20-%20Book%202%20Chapter%2031.mp3",
    "duration": 1732,
    "chapter": "34"
  },
  {
    "id": "dune-ch-35",
    "title": "Chapter 34 - Book 2 Chapter 32",
    "url": "https://archive.org/download/dune-book-1/Chapter%2034%20-%20Book%202%20Chapter%2032.mp3",
    "duration": 1340,
    "chapter": "35"
  },
  {
    "id": "dune-ch-36",
    "title": "Chapter 35 - Book 2 Chapter 33",
    "url": "https://archive.org/download/dune-book-1/Chapter%2035%20-%20Book%202%20Chapter%2033.mp3",
    "duration": 2044,
    "chapter": "36"
  },
  {
    "id": "dune-ch-37",
    "title": "Chapter 36 - Book 2 Chapter 34",
    "url": "https://archive.org/download/dune-book-1/Chapter%2036%20-%20Book%202%20Chapter%2034.mp3",
    "duration": 1984,
    "chapter": "37"
  },
  {
    "id": "dune-ch-38",
    "title": "Chapter 37 - Book 2 Chapter 35",
    "url": "https://archive.org/download/dune-book-1/Chapter%2037%20-%20Book%202%20Chapter%2035.mp3",
    "duration": 2836,
    "chapter": "38"
  },
  {
    "id": "dune-ch-39",
    "title": "Chapter 38 - Book 2 Chapter 36",
    "url": "https://archive.org/download/dune-book-1/Chapter%2038%20-%20Book%202%20Chapter%2036.mp3",
    "duration": 1393,
    "chapter": "39"
  },
  {
    "id": "dune-ch-40",
    "title": "Chapter 39 - Book 2 Chapter 37",
    "url": "https://archive.org/download/dune-book-1/Chapter%2039%20-%20Book%202%20Chapter%2037.mp3",
    "duration": 2317,
    "chapter": "40"
  },
  {
    "id": "dune-ch-41",
    "title": "Chapter 40 - Book 3 The Prophet",
    "url": "https://archive.org/download/dune-book-1/Chapter%2040%20-%20Book%203%20The%20Prophet.mp3",
    "duration": 6,
    "chapter": "41"
  },
  {
    "id": "dune-ch-42",
    "title": "Chapter 41 - Book 3 Chapter 38",
    "url": "https://archive.org/download/dune-book-1/Chapter%2041%20-%20Book%203%20Chapter%2038.mp3",
    "duration": 1223,
    "chapter": "42"
  },
  {
    "id": "dune-ch-43",
    "title": "Chapter 42 - Book 3 Chapter 39",
    "url": "https://archive.org/download/dune-book-1/Chapter%2042%20-%20Book%203%20Chapter%2039.mp3",
    "duration": 1049,
    "chapter": "43"
  },
  {
    "id": "dune-ch-44",
    "title": "Chapter 43 - Book 3 Chapter 40",
    "url": "https://archive.org/download/dune-book-1/Chapter%2043%20-%20Book%203%20Chapter%2040.mp3",
    "duration": 1898,
    "chapter": "44"
  },
  {
    "id": "dune-ch-45",
    "title": "Chapter 44 - Book 3 Chapter 41",
    "url": "https://archive.org/download/dune-book-1/Chapter%2044%20-%20Book%203%20Chapter%2041.mp3",
    "duration": 1530,
    "chapter": "45"
  },
  {
    "id": "dune-ch-46",
    "title": "Chapter 45 - Book 3 Chapter 42",
    "url": "https://archive.org/download/dune-book-1/Chapter%2045%20-%20Book%203%20Chapter%2042.mp3",
    "duration": 1071,
    "chapter": "46"
  },
  {
    "id": "dune-ch-47",
    "title": "Chapter 46 - Book 3 Chapter 43",
    "url": "https://archive.org/download/dune-book-1/Chapter%2046%20-%20Book%203%20Chapter%2043.mp3",
    "duration": 2437,
    "chapter": "47"
  },
  {
    "id": "dune-ch-48",
    "title": "Chapter 47 - Book 3 Chapter 44",
    "url": "https://archive.org/download/dune-book-1/Chapter%2047%20-%20Book%203%20Chapter%2044.mp3",
    "duration": 2017,
    "chapter": "48"
  },
  {
    "id": "dune-ch-49",
    "title": "Chapter 48 - Book 3 Chapter 45",
    "url": "https://archive.org/download/dune-book-1/Chapter%2048%20-%20Book%203%20Chapter%2045.mp3",
    "duration": 1605,
    "chapter": "49"
  },
  {
    "id": "dune-ch-50",
    "title": "Chapter 49 - Book 3 Chapter 46",
    "url": "https://archive.org/download/dune-book-1/Chapter%2049%20-%20Book%203%20Chapter%2046.mp3",
    "duration": 1280,
    "chapter": "50"
  },
  {
    "id": "dune-ch-51",
    "title": "Chapter 50 - Book 3 Chapter 47",
    "url": "https://archive.org/download/dune-book-1/Chapter%2050%20-%20Book%203%20Chapter%2047.mp3",
    "duration": 1577,
    "chapter": "51"
  },
  {
    "id": "dune-ch-52",
    "title": "Chapter 51 - Book 3 Chapter 48",
    "url": "https://archive.org/download/dune-book-1/Chapter%2051%20-%20Book%203%20Chapter%2048.mp3",
    "duration": 3576,
    "chapter": "52"
  }
];

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
    const count = 52;
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: b.id + ":" + (i + 1),
        chapter: String(i + 1),
        title: "Dune - Chapter " + (i + 1),
        number: i + 1
      });
    }
    return list;
  } else if (b.type === "walking-dead") {
    const issues = [
      "Issue 1: Days Gone Bye (اليوم الذي رحل)",
      "Issue 2: Atlanta & Survivors (أتلانتا والناجون)",
      "Issue 3: Camp Outside the City (المخيم خارج المدينة)",
      "Issue 4: The Gun Run (مهمة الأسلحة)",
      "Issue 5: Walker Attack (هجوم الموتى السائرين)",
      "Issue 6: Moving On (الرحيل والبحث عن مأوى)"
    ];
    return issues.map((title, idx) => ({
      id: b.id + ":" + (idx + 1),
      chapter: String(idx + 1),
      title: title,
      number: idx + 1
    }));
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
    chapterTitle = "Dune · Chapter " + chIdx;
    const count = 52;
    const chunkSize = Math.ceil(fullText.length / count);
    const start = (chIdx - 1) * chunkSize;
    chapterBody = fullText.substring(start, start + chunkSize);
  } else if (b.type === "walking-dead") {
    chapterTitle = "The Walking Dead · Issue " + chIdx;
    const count = 6;
    const chunkSize = Math.ceil(fullText.length / count);
    const start = (chIdx - 1) * chunkSize;
    chapterBody = fullText.substring(start, start + chunkSize);
  }

  const textPages = splitIntoPages(chapterBody);
  return textPages.map((chunk, idx) => renderSvgPage(chapterTitle, chunk, idx + 1, textPages.length));
}

async function audioTracks(bookId) {
  if (bookId === "game-of-thrones") {
    return [
      {
        id: "got-audio-full",
        title: "A Game of Thrones (الكتاب الصوتي الكامل - الرواية كاملة 33 ساعة)",
        url: "https://archive.org/download/ASongOfIceAndFire5ADanceWithDragons/A%20Song%20of%20Ice%20and%20Fire%201%20-%20A%20Game%20of%20Thrones.mp3",
        duration: 118918,
        chapter: "1"
      }
    ];
  } else if (bookId === "the-witcher-last-wish") {
    return [
      {
        id: "witcher-audio-full",
        title: "The Witcher: The Last Wish (الكتاب الصوتي الكامل - 10 ساعات و15 دقيقة)",
        url: "https://archive.org/download/witcher-the-last-wish-full-audiobook/Witcher%20the%20last%20wish%20full%20Audiobook.mp3",
        duration: 36912,
        chapter: "1"
      }
    ];
  } else if (bookId === "dune-epic") {
    return DUNE_AUDIO_TRACKS;
  } else if (bookId === "the-walking-dead") {
    return [
      {
        id: "twd-part1",
        title: "The Walking Dead: Rise of the Governor - Part 1 (القسم الأول - 5 ساعات)",
        url: "https://archive.org/download/rise-of-the-governor-part-1-and-2/The%20Walking%20Dead%20-%20rise%20of%20the%20governor%20Part1.mp3",
        duration: 18625,
        chapter: "1"
      },
      {
        id: "twd-part2",
        title: "The Walking Dead: Rise of the Governor - Part 2 (القسم الثاني - 5 ساعات ونصف)",
        url: "https://archive.org/download/rise-of-the-governor-part-1-and-2/The%20Walking%20Dead%20-%20rise%20of%20the%20governor%20Part2.mp3",
        duration: 20263,
        chapter: "2"
      }
    ];
  }
  return [];
}

const plugin = {
  id: "epic-fantasy",
  name: "سجلات الفانتازيا والعرش (Game of Thrones & The Witcher & Dune & The Walking Dead)",
  version: "2.0.0",
  popular,
  search,
  detail,
  chapters,
  pageUrls,
  audioTracks
};

return plugin;
