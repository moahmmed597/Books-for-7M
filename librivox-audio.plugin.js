const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const API_BASE = "https://librivox.org/api/feed/audiobooks";

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

function extractCover(b) {
  const zip = b.url_zip_file || "";
  const m = zip.match(/archive\.org\/compress\/([^/]+)/);
  if (m && m[1]) {
    return "https://archive.org/services/img/" + m[1];
  }
  const libUrl = b.url_librivox || "";
  const m2 = libUrl.match(/librivox\.org\/([^/]+)/);
  if (m2 && m2[1]) {
    return "https://archive.org/services/img/" + m2[1];
  }
  return "https://librivox.org/images/librivox-logo.png";
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

async function popular(offset) {
  const off = parseInt(offset, 10) || 0;
  const url = API_BASE + "/?format=json&limit=25&offset=" + off;
  const data = await jsonGet(url);
  const books = (data && data.books) || [];

  return books.map(b => ({
    id: String(b.id),
    title: cleanText(b.title),
    cover: extractCover(b)
  }));
}

async function search(query, offset) {
  const q = cleanText(query);
  if (!q) return popular(offset);

  const off = parseInt(offset, 10) || 0;
  const url = API_BASE + "/?title=" + encodeURIComponent(q) + "&format=json&limit=25&offset=" + off;
  const data = await jsonGet(url);
  const books = (data && data.books) || [];

  return books.map(b => ({
    id: String(b.id),
    title: cleanText(b.title),
    cover: extractCover(b)
  }));
}

async function detail(id) {
  const url = API_BASE + "/?id=" + encodeURIComponent(id) + "&format=json&extended=1";
  const data = await jsonGet(url);
  const books = (data && data.books) || [];
  if (!books.length) throw new Error("Audiobook not found: " + id);

  const b = books[0];
  const authors = (b.authors || [])
    .map(a => `${a.first_name || ""} ${a.last_name || ""}`.trim())
    .filter(Boolean)
    .join(", ");

  return {
    id: String(b.id),
    title: cleanText(b.title),
    cover: extractCover(b),
    description: stripHtml(b.description),
    author: authors || "LibriVox Narrator",
    status: "completed"
  };
}

// Audio-only book: chapters() returns [] so 7M shows 🎧 Listen only
async function chapters(id) {
  return [];
}

async function pageUrls(chapterId) {
  return [];
}

// audioTracks returns the full list of MP3 chapter tracks with seeking enabled
async function audioTracks(id) {
  const url = API_BASE + "/?id=" + encodeURIComponent(id) + "&format=json&extended=1";
  const data = await jsonGet(url);
  const books = (data && data.books) || [];
  if (!books.length) return [];

  const b = books[0];
  const sections = b.sections || [];

  return sections.map((s, idx) => ({
    id: String(s.id || idx + 1),
    title: cleanText(s.title || ("Chapter " + (idx + 1))),
    url: s.listen_url, // direct MP3 streaming from Archive.org
    duration: parseInt(s.playtime, 10) || 0,
    chapter: String(idx + 1)
  }));
}

const plugin = {
  id: "librivox-en",
  name: "LibriVox Audiobooks (18,000+ كتب صوتية عالمية)",
  popular,
  search,
  detail,
  chapters,
  pageUrls,
  audioTracks
};

return plugin;
