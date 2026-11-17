const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const ARCHIVE_BASE = "https://archive.org";

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

const FEATURED_ARABIC_AUDIO = [
  {
    id: "kalila-wa-dimna-audiobook",
    title: "كتاب كليلة ودمنة (كامل 20 باباً وفصلاً)",
    author: "عبد الله بن المقفع وبيدبا الفيلسوف",
    description: "أعظم كتب الحكمة والأمثال والسياسة والأخلاق في التراث الإنساني، تسجيل صوتي كامل يضم جميع أبواب الكتاب وقصص الفيلسوف بيدبا والملك دبشليم.",
    cover: "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/kalila-wa-dimna.jpg"
  },
  {
    id: "100nights",
    title: "ألف ليلة وليلة (40 ليلة مسموعة)",
    author: "تراث الأدب العربي والشرقي",
    description: "أشهر حكايات وأساطير التراث الشرقي والعالمي بصوت درامي فخم؛ استمع لحكايات شهرزاد للملك شهريار في 40 ليلة كاملة.",
    cover: "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/1001-nights.jpg"
  },
  {
    id: "mijobooks14",
    title: "كتاب الأيام (السيرة الذاتية - طه حسين)",
    author: "طه حسين (عميد الأدب العربي)",
    description: "التحفة الأدبية الخالدة التي تروي قصة صعود وتحدي طه حسين وتغلبه على كف البصر ليصبح من أعظم قامات الفكر العربي الحديث.",
    cover: "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/al-ayyam.jpg"
  },
  {
    id: "moharram1965_gmail_5_201712",
    title: "مقدمة ابن خلدون (المجالس الصوتية الكاملة)",
    author: "عبد الرحمن بن خلدون",
    description: "المجالس الصوتية الكاملة المتقنة لفصول مقدمة ابن خلدون ونظريات العمران البشري وطبائع الأمم ونشوء وسقوط الدول في 5 مجالس كبرى مطولة.",
    cover: "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/ibn-khaldun.jpg"
  },
  {
    id: "20220225_20220225_1824",
    title: "كتاب البخلاء (كامل مسموع - الجاحظ)",
    author: "أبو عثمان عمرو بن بحر الجاحظ",
    description: "أشهر كتب الأدب والفكاهة ودراسة النفس الإنسانية للجاحظ؛ تسجيل صوتي كامل ومتقن يمتد لأكثر من 9 ساعات متواصلة.",
    cover: "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/al-bukhalaa.jpg"
  },
  {
    id: "Hay_Ibn_Yaqzan",
    title: "حي بن يقظان (الرواية الفلسفية التأسيسية)",
    author: "ابن طفيل الأندلسي",
    description: "أعظم رواية فلسفية في تاريخ الأدب العربي والأندلسي عن نشأة العقل البشري وإدراك الوجود والحقيقة عبر التأمل الذاتي الخالص.",
    cover: "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/hayy-ibn-yaqzan.jpg"
  },
  {
    id: "taw9_alhamama",
    title: "طوق الحمامة في الألفة والألّاف",
    author: "ابن حزم الأندلسي",
    description: "أدق وأجمل ما كُتب في التراث الأندلسي عن فلسفة الحب وعلاماته وأسبابه وطبائع النفوس الإنسانية بأصالة أدبية نادرة.",
    cover: "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/tawq-al-hamama.jpg"
  },
  {
    id: "20190831_20190831_0834",
    title: "رواية نصف ميت دفن حيًا",
    author: "حسن الجندي (تسجيل صوتي كامل)",
    description: "رواية الرعب والتشويق الشهيرة للكاتب حسن الجندي، تأخذ المستمع في رحلة مرعبة وغامضة بين الواقع والمجهول.",
    cover: "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/nisf-mayyit.svg"
  },
  {
    id: "20210730_20210730_2122",
    title: "كتاب العادات السبع للناس الأكثر فاعلية",
    author: "ستيفن كوفي (مسموع)",
    description: "أشهر كتب تطوير الذات والقيادة الشخصية في العالم، يشرح فيه كوفي المبادئ السبعة للتحول من التبعية إلى الفاعلية والاستقلال والنجاح المشترك.",
    cover: "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/7-habits.jpg"
  },
  {
    id: "20200904_20200904_1156",
    title: "رواية أحلام ممنوعة",
    author: "نور عبد الحميد (رواية صوتية كاملة)",
    description: "رواية اجتماعية مشوقة تستكشف العلاقات الإنسانية والأحلام والآمال في الواقع المعاصر.",
    cover: "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/ahlam-mamnooa.svg"
  }
];

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

async function popular(offset) {
  return FEATURED_ARABIC_AUDIO.map(b => ({
    id: b.id,
    title: b.title,
    cover: b.cover
  }));
}

async function search(query, offset) {
  const q = cleanText(query).toLowerCase();
  if (!q) return popular(offset);

  const matched = FEATURED_ARABIC_AUDIO.filter(b =>
    b.title.toLowerCase().includes(q) ||
    b.author.toLowerCase().includes(q) ||
    b.description.toLowerCase().includes(q)
  );

  return (matched.length > 0 ? matched : FEATURED_ARABIC_AUDIO).map(b => ({
    id: b.id,
    title: b.title,
    cover: b.cover
  }));
}

async function detail(id) {
  const found = FEATURED_ARABIC_AUDIO.find(b => b.id === id);
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

  const data = await jsonGet(ARCHIVE_BASE + "/metadata/" + encodeURIComponent(id));
  const meta = (data && data.metadata) || {};

  return {
    id: String(id),
    title: cleanText(meta.title || id),
    cover: "https://archive.org/services/img/" + id,
    description: stripHtml(meta.description || "كتاب صوتي عربي بجودة عالية."),
    author: meta.creator || "تسجيل صوتي",
    status: "completed"
  };
}

// Audio-only: chapters() returns [] so 7M shows 🎧 Listen
async function chapters(id) {
  return [];
}

async function pageUrls(chapterId) {
  return [];
}

async function audioTracks(id) {
  const data = await jsonGet(ARCHIVE_BASE + "/metadata/" + encodeURIComponent(id));
  const files = (data && data.files) || [];

  // 1. Keep only files with source: original to avoid duplicate derivative MP3s
  let mp3s = files.filter(f => f.name && f.name.toLowerCase().endsWith(".mp3") && f.source === "original");
  if (!mp3s.length) {
    mp3s = files.filter(f => f.name && f.name.toLowerCase().endsWith(".mp3") && !f.name.endsWith("_vbr.mp3") && !f.name.includes("_64kb"));
  }

  // 2. Natural sort on file name so Part 1, Part 2, ... Part 10 are in correct chronological order
  mp3s.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

  return mp3s.map((f, idx) => {
    const rawName = f.name.replace(/\.mp3$/i, "").replace(/[-_+]/g, " ").trim();
    const trackTitle = cleanText(f.title || rawName || ("الجزء " + (idx + 1)));
    const duration = parseFloat(f.length) || 0;
    const streamUrl = ARCHIVE_BASE + "/download/" + encodeURIComponent(id) + "/" + encodeURIComponent(f.name);

    return {
      id: String(idx + 1),
      title: trackTitle,
      url: streamUrl,
      duration: Math.round(duration),
      chapter: String(idx + 1)
    };
  });
}

const plugin = {
  id: "arabic-audiobooks",
  name: "المكتبة الصوتية العربية التراثية والفكرية (Arabic Heritage Audiobooks)",
  version: "2.0.0",
  popular,
  search,
  detail,
  chapters,
  pageUrls,
  audioTracks
};

return plugin;
