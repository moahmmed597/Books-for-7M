const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const SEARCH_BASE = "https://archive.org/advancedsearch.php";
const META_BASE = "https://archive.org/metadata";
const DEFAULT_COVER = "https://raw.githubusercontent.com/moahmmed597/Books-for-7M/main/covers/audiobook-default.svg";

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanTitle(val) {
  return cleanText(val)
    .replace(/,?\s+by\s+[^,]+$/i, "")
    .replace(/^LibriVox\s+recording\s+of\s+/i, "")
    .trim();
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
  const page = Math.floor(off / 25) + 1;
  const url = `${SEARCH_BASE}?q=collection:(librivoxaudio)+AND+mediatype:(audio)&fl[]=identifier,title,creator,description,downloads&sort[]=downloads+desc&rows=25&page=${page}&output=json`;
  const data = await jsonGet(url);
  const docs = (data && data.response && data.response.docs) || [];

  return docs.map(d => ({
    id: d.identifier,
    title: cleanTitle(d.title),
    cover: `https://archive.org/services/img/${d.identifier}` || DEFAULT_COVER
  }));
}

async function search(query, offset) {
  const q = cleanText(query);
  if (!q) return popular(offset);

  const off = parseInt(offset, 10) || 0;
  const page = Math.floor(off / 25) + 1;
  const cleanQ = encodeURIComponent(q.replace(/[^\w\s]/g, " "));
  const url = `${SEARCH_BASE}?q=collection:(librivoxaudio)+AND+(${cleanQ})&fl[]=identifier,title,creator,description,downloads&sort[]=downloads+desc&rows=25&page=${page}&output=json`;
  const data = await jsonGet(url);
  const docs = (data && data.response && data.response.docs) || [];

  return docs.map(d => ({
    id: d.identifier,
    title: cleanTitle(d.title),
    cover: `https://archive.org/services/img/${d.identifier}` || DEFAULT_COVER
  }));
}

async function detail(id) {
  const url = `${META_BASE}/${encodeURIComponent(id)}`;
  const data = await jsonGet(url);
  const meta = (data && data.metadata) || {};

  return {
    id: id,
    title: cleanTitle(meta.title) || id,
    cover: `https://archive.org/services/img/${id}` || DEFAULT_COVER,
    description: stripHtml(meta.description || "LibriVox volunteer recording of classic world literature."),
    author: cleanText(meta.creator || "LibriVox Volunteers"),
    status: "completed"
  };
}

async function chapters(id) {
  return [];
}

async function audioTracks(id) {
  const url = `${META_BASE}/${encodeURIComponent(id)}`;
  const data = await jsonGet(url);
  const files = (data && data.files) || [];

  const mp3s = files.filter(f => f.name && f.name.toLowerCase().endsWith(".mp3"));
  if (!mp3s.length) return [];

  const originals = mp3s.filter(f => f.source === "original");
  const chosen = originals.length > 0 ? originals : mp3s.filter(f => !f.name.toLowerCase().endsWith("_vbr.mp3"));
  const finalFiles = chosen.length > 0 ? chosen : mp3s;

  finalFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

  return finalFiles.map((f, idx) => {
    const rawTitle = f.title || f.name.replace(/\.[^/.]+$/, "");
    let dur = 0;
    if (f.length) {
      dur = Math.round(parseFloat(f.length));
    }
    return {
      id: `${id}-tr-${idx + 1}`,
      title: cleanText(rawTitle),
      url: `https://archive.org/download/${id}/${encodeURIComponent(f.name)}`,
      duration: dur,
      chapter: String(idx + 1)
    };
  });
}

const plugin = {
  id: "librivox-en",
  name: "LibriVox Audiobooks (18,000+ كتب صوتية عالمية)",
  popular,
  search,
  detail,
  chapters,
  audioTracks,
};

return plugin;
