import fs from 'fs';
import path from 'path';

// Mock harbor global environment for Node.js
globalThis.harbor = {
  http: async (url, opts = {}) => {
    const fetchOpts = {
      method: opts.method || 'GET',
      headers: opts.headers || {},
    };
    if (opts.body) {
      fetchOpts.body = typeof opts.body === 'object' ? JSON.stringify(opts.body) : opts.body;
    }
    const res = await fetch(url, fetchOpts);
    const ok = res.ok;
    const status = res.status;

    if (opts.responseType === 'json') {
      try {
        const body = await res.json();
        return { ok, status, body };
      } catch (e) {
        return { ok: false, status, body: null };
      }
    } else {
      const body = await res.text();
      return { ok, status, body };
    }
  },
  parseHtml: (html) => ({
    querySelector: () => null,
    querySelectorAll: () => []
  }),
  log: (...args) => console.log('  [HARBOR_LOG]', ...args)
};

const repoJson = JSON.parse(fs.readFileSync('repo.json', 'utf8'));
console.log(`\n======================================================`);
console.log(`=== Testing Repository: ${repoJson.name} (v${repoJson.version}) ===`);
console.log(`=== Total Plugins: ${repoJson.plugins.length} ===`);
console.log(`======================================================\n`);

async function testPlugin(pMeta) {
  const filename = pMeta.entry || path.basename(pMeta.scriptUrl);
  console.log(`------------------------------------------------------`);
  console.log(`[TESTING] ${pMeta.id} -> ${filename} (lang: ${pMeta.lang})`);
  
  if (!fs.existsSync(filename)) {
    throw new Error(`File not found: ${filename}`);
  }

  const code = fs.readFileSync(filename, 'utf8');
  const factory = new Function(code);
  const plugin = factory();

  if (!plugin || typeof plugin !== 'object') {
    throw new Error(`Plugin returned invalid object: ${typeof plugin}`);
  }
  console.log(`  -> Plugin initialized: "${plugin.name}" (id: ${plugin.id})`);

  // 1. Popular
  console.log(`  -> Testing popular(0)...`);
  const pop = await plugin.popular(0);
  if (!Array.isArray(pop) || pop.length === 0) {
    throw new Error(`popular() returned 0 items`);
  }
  console.log(`  [OK] popular() returned ${pop.length} items. Sample: "${pop[0].title}" (ID: ${pop[0].id})`);

  const targetItem = pop[0];

  // 2. Detail
  console.log(`  -> Testing detail("${targetItem.id}")...`);
  const det = await plugin.detail(targetItem.id);
  if (!det || !det.title) {
    throw new Error(`detail() returned invalid object`);
  }
  console.log(`  [OK] detail() title: "${det.title}", author: "${det.author || 'N/A'}"`);

  // 3. Chapters & pageUrls (if text reading is supported)
  console.log(`  -> Testing chapters("${targetItem.id}")...`);
  const chaps = await plugin.chapters(targetItem.id);
  if (Array.isArray(chaps) && chaps.length > 0) {
    console.log(`  [OK] chapters() returned ${chaps.length} text chapters. Sample: "${chaps[0].title}"`);
    const targetChap = chaps[0];
    console.log(`  -> Testing pageUrls("${targetChap.id}")...`);
    const pages = await plugin.pageUrls(targetChap.id);
    if (!Array.isArray(pages) || pages.length === 0) {
      throw new Error(`pageUrls() returned 0 pages`);
    }
    console.log(`  [OK] pageUrls() returned ${pages.length} pages. (Sample page length: ${pages[0].length})`);
  } else {
    console.log(`  [INFO] Audio-only plugin (chapters returned []) -> 🎧 Listen Mode Active`);
  }

  // 4. Audio tracks (if audio is supported)
  if (typeof plugin.audioTracks === 'function') {
    console.log(`  -> Testing audioTracks("${targetItem.id}")...`);
    const tracks = await plugin.audioTracks(targetItem.id);
    if (!Array.isArray(tracks) || tracks.length === 0) {
      throw new Error(`audioTracks() was defined but returned 0 tracks`);
    }
    const t0 = tracks[0];
    if (!t0.url || !t0.url.startsWith('http')) {
      throw new Error(`audioTrack[0] has invalid url: ${t0.url}`);
    }
    console.log(`  [OK] audioTracks() returned ${tracks.length} MP3 tracks. Sample: "${t0.title}" | Duration: ${t0.duration}s`);
    console.log(`       Stream URL: ${t0.url.substring(0, 60)}...`);
  }

  console.log(`  [SUCCESS] All checks passed for ${plugin.id}!\n`);
}

async function run() {
  let passed = 0;
  let failed = 0;
  for (const p of repoJson.plugins) {
    try {
      await testPlugin(p);
      passed++;
    } catch (err) {
      console.error(`  [FAILED] ${p.id}: ${err.message}\n`, err);
      failed++;
    }
  }

  console.log(`======================================================`);
  console.log(`=== Verification Summary: ${passed} PASSED, ${failed} FAILED ===`);
  console.log(`======================================================\n`);
  if (failed > 0) process.exit(1);
}

run();
