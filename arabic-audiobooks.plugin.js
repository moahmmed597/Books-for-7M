const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const ARCHIVE_BASE = "https://archive.org";

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
    .replace(/&#39;/gi, "'"));
}

const FEATURED_ARABIC_AUDIO = [
  {
    id: "20191021_20191021_1524",
    title: "رواية جريمة في قطار الشرق السريع (أجاثا كريستي)",
    author: "أجاثا كريستي (ترجمة وصوت عربي)",
    description: "أشهر روايات التحقيق والغموض العالمية؛ لغز جريمة القتل الغامضة في قطار الشرق السريع والتحقيق الاستثنائي للمحقق هرقل بوارو.",
    cover: "https://archive.org/services/img/20191021_20191021_1524"
  },
  {
    id: "20200905_20200905_0907",
    title: "رواية الزوج الأبدي (فيودور ديستويفسكي)",
    author: "فيودور ديستويفسكي (كتاب صوتي كامل)",
    description: "رواية نفسية عميقة لديستويفسكي تستعرض الصراع النفسي بين الزوج الأبدي والعاشق والمشاعر الإنسانية المعقدة.",
    cover: "https://archive.org/services/img/20200905_20200905_0907"
  },
  {
    id: "20190831_20190831_0834",
    title: "رواية نصف ميت دفن حيًا",
    author: "حسن الجندي (تسجيل صوتي كامل)",
    description: "رواية الرعب والتشويق الشهيرة للكاتب حسن الجندي، تأخذ المستمع في رحلة مرعبة وغامضة بين الواقع والمجهول.",
    cover: "https://archive.org/services/img/20190831_20190831_0834"
  },
  {
    id: "20210730_20210730_2122",
    title: "كتاب العادات السبع للناس الأكثر فاعلية",
    author: "ستيفن كوفي (مسموع)",
    description: "أشهر كتب تطوير الذات والقيادة الشخصية في العالم، يشرح فيه كوفي المبادئ السبعة للتحول من التبعية إلى الفاعلية والاستقلال والنجاح المشترك.",
    cover: "https://archive.org/services/img/20210730_20210730_2122"
  },
  {
    id: "mijobooks14",
    title: "كتاب الأيام (السيرة الذاتية - طه حسين)",
    author: "طه حسين (عميد الأدب العربي)",
    description: "التحفة الأدبية الخالدة التي تروي قصة صعود وتحدي طه حسين وتغلبه على كف البصر ليصبح من أعظم قامات الفكر العربي الحديث.",
    cover: "https://archive.org/services/img/mijobooks14"
  },
  {
    id: "1_20191028_20191028_0941",
    title: "حكايات ألف ليلة وليلة المسموعة",
    author: "تراث الأدب العربي والعالمي",
    description: "أشهر الحكايات والأساطير الشرقية المسموعة من بغداد ودمشق والقاهرة، تحكيها شهرزاد للملك شهريار.",
    cover: "https://archive.org/services/img/1_20191028_20191028_0941"
  },
  {
    id: "diwan_20170911_2151",
    title: "مقدمة ابن خلدون (التسجيل الصوتي الكامل)",
    author: "عبد الرحمن بن خلدون",
    description: "استمع لقراءة صوتية واضحة ومتقنة لفصول مقدمة ابن خلدون ونظريات العمران البشري وطبائع الأمم ونشوء وسقوط الدول.",
    cover: "https://archive.org/services/img/diwan_20170911_2151"
  },
  {
    id: "20200904_20200904_1156",
    title: "رواية أحلام ممنوعة",
    author: "نور عبد الحميد (رواية صوتية كاملة)",
    description: "رواية اجتماعية مشوقة تستكشف العلاقات الإنسانية والأحلام والآمال في الواقع المعاصر.",
    cover: "https://archive.org/services/img/20200904_20200904_1156"
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

  // Search curated list first
  const matched = FEATURED_ARABIC_AUDIO.filter(b =>
    b.title.toLowerCase().includes(q) ||
    b.author.toLowerCase().includes(q) ||
    b.description.toLowerCase().includes(q)
  );

  if (matched.length > 0) {
    return matched.map(b => ({
      id: b.id,
      title: b.title,
      cover: b.cover
    }));
  }

  // Dynamic Archive.org Arabic Audio Search
  try {
    const archiveUrl = ARCHIVE_BASE + "/advancedsearch.php?q=" +
      encodeURIComponent('mediatype:audio AND language:ara AND (title:"' + q + '" OR description:"' + q + '")') +
      "&fl[]=identifier,title,creator,description&rows=15&output=json";
    const data = await jsonGet(archiveUrl);
    const docs = (data && data.response && data.response.docs) || [];
    if (docs.length > 0) {
      return docs.map(d => ({
        id: d.identifier,
        title: cleanText(d.title || d.identifier),
        cover: "https://archive.org/services/img/" + d.identifier
      }));
    }
  } catch (e) {
    // Ignore search network error fallback
  }

  return FEATURED_ARABIC_AUDIO.map(b => ({
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

  // Fallback Archive.org metadata lookup
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

  const mp3s = files.filter(f => f.name && f.name.toLowerCase().endsWith(".mp3"));

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
  name: "المكتبة الصوتية العربية (روايات وفكر وتطوير الذات)",
  popular,
  search,
  detail,
  chapters,
  pageUrls,
  audioTracks
};

return plugin;
