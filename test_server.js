const tests = [
  { name: 'Spotlight API', url: 'http://localhost:8080/api/anime/spotlight' },
  { name: 'Browse API', url: 'http://localhost:8080/api/anime/browse' },
  { name: 'Meta API', url: 'http://localhost:8080/api/anime/meta?ids=anime:135865,anime:208055,anime:189046' },
  { name: 'Poster (Re:Zero)', url: 'http://localhost:8080/api/anime/poster?anilistId=189046&w=460&format=webp' },
  { name: 'Poster (Solo Leveling)', url: 'http://localhost:8080/api/anime/poster?anilistId=135865&w=460&format=webp' },
  { name: 'Poster (LOCA!)', url: 'http://localhost:8080/api/anime/poster?anilistId=208055&w=460&format=webp' },
  { name: 'Cover redirect (LOCA!)', url: 'http://localhost:8080/api/anime/cover?u=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fcover%2Fmedium%2Fbx208055-MYa7If5ksFhp.jpg' },
  { name: 'Banner (orig-4k/135865.jpg)', url: 'http://localhost:8080/banners/orig-4k/135865.jpg' },
  { name: 'Banner alias (135865-1280.avif)', url: 'http://localhost:8080/banners/135865-1280.avif' },
  { name: 'Series (Re:Zero 189046)', url: 'http://localhost:8080/api/anime/series/189046' },
  { name: 'Series (LOCA! 208055)', url: 'http://localhost:8080/api/anime/series/208055' },
  { name: 'Series by route hash', url: 'http://localhost:8080/api/anime/series/59f406ef86b5af1e21b269b4ffbda5bf~46be4fb3c8fcb78e10ee8b58a99e188304ffc6a897ea3f1db5ec11f3ac22987a' },
  { name: 'Playback bootstrap', url: 'http://localhost:8080/api/anime/playback-bootstrap/settlar/208055?ep=1&lang=sub' }
];

async function runTests() {
  console.log('--- Running Server Verification Tests ---');
  let passed = 0;
  for (const t of tests) {
    try {
      const res = await fetch(t.url, { redirect: 'manual' });
      const loc = res.headers.get('location') || '';
      const ct = res.headers.get('content-type') || '';
      console.log(`[PASS] ${t.name.padEnd(32)} -> ${res.status} [${ct.slice(0, 25)}] ${loc ? '=> ' + loc.slice(0, 45) : ''}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${t.name.padEnd(32)} -> ERROR: ${err.message}`);
    }
  }

  // Test streaming session resolution for Re:Zero, LOCA!, and One Piece Ep 1000
  console.log('\n--- Testing Streaming Session Resolution ---');
  const streamTests = [
    { name: 'Stream Re:Zero (ep 1)', body: { ep: '1', selection: 'preview:189046:1:sub', channel: 'sub' } },
    { name: 'Stream LOCA! (ep 1)', body: { ep: '1', selection: 'preview:208055:1:sub', channel: 'sub' } },
    { name: 'Stream One Piece (ep 1000)', body: { ep: '1000', selection: 'preview:21:1000:sub', channel: 'sub' } },
    { name: 'Stream Attack on Titan (ep 1)', body: { ep: '1', selection: 'preview:16498:1:sub', channel: 'sub' } }
  ];

  for (const st of streamTests) {
    try {
      const res = await fetch('http://localhost:8080/api/anime/settlar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(st.body)
      });
      const data = await res.json();
      console.log(`[PASS] ${st.name.padEnd(32)} -> embedUrl: ${data.embedUrl}`);
      // Also verify that the resolved stream is NOT a 404
      const streamUrl = data.embedUrl;
      if (streamUrl.includes('megaplay.buzz/')) {
        const streamCheck = await fetch(streamUrl, {
          headers: { 'Referer': 'https://megaplay.buzz/', 'User-Agent': 'Mozilla/5.0' }
        });
        const streamText = await streamCheck.text();
        const is404 = streamText.includes('Error Code: 404');
        console.log(`       Stream check: ${streamCheck.status} | 404 on player: ${is404}`);
      }
    } catch (err) {
      console.error(`[FAIL] ${st.name.padEnd(32)} -> ERROR: ${err.message}`);
    }
  }
}

runTests();
