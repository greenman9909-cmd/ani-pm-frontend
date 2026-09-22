/**
 * AML mock-only gateway for the SPA-Ripper-extracted ani.pm frontend.
 * Preserves the extracted frontend and its API response shapes while serving
 * synthetic catalogue, profile, community, library, settings and playback data.
 * No production anime API or streaming service is contacted in MOCK_ONLY mode.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '8080', 10);
const DIRECTORY = path.join(__dirname, 'ani.pm_frontend');
const MOCK_ONLY = true;
const PRODUCT_NAME = 'AML';
const YORU_API = null; // production resolver disabled in AML mock-only mode

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm'
};

const STREAM_CACHE = new Map();
const SELECTION_MAP = new Map();
const ROUTE_TO_ID = new Map();
const ID_TO_ROUTE = new Map();
const COVER_KEYS = new Map();

function makeUser(id, username, name, avatarUrl = '/icon-192.png', avatarColor = '#6366f1', isAdmin = false, isVip = false) {
  const safeColor = (avatarColor && /^#?[0-9a-f]{6}$/i.test(avatarColor))
    ? (avatarColor.startsWith('#') ? avatarColor : '#' + avatarColor)
    : '#6366f1';
  return {
    id: String(id),
    username: String(username || id),
    name: String(name || username || id),
    displayName: String(name || username || id),
    avatarUrl: avatarUrl || '/icon-192.png',
    avatarColor: safeColor,
    isAdmin: !!isAdmin,
    isVip: !!isVip,
    level: isAdmin ? 99 : 10
  };
}

function getStillKeyUrl(rawUrl) {
  if (!rawUrl) return null;
  const hash = crypto.createHash('sha256').update(String(rawUrl)).digest('hex');
  COVER_KEYS.set(hash, String(rawUrl));
  return `/api/anime/cover?key=${hash}`;
}


let LAST_ANILIST_ID = '189046';

// Known Settlar route tokens
ROUTE_TO_ID.set('ee371b9c5c6fd8e65a51e6d8e324ad56~0fd02ff2a9699b3da984940365f67f8717e0de428bbcfdd5debba6cba336818f', '189046');
ROUTE_TO_ID.set('59f406ef86b5af1e21b269b4ffbda5bf~46be4fb3c8fcb78e10ee8b58a99e188304ffc6a897ea3f1db5ec11f3ac22987a', '208055');
ROUTE_TO_ID.set('927ca76fb45f200102b6a4c8b2cf9e48~6bc7957b99fe0bf455165dbc8a2566cdf81671c10590747ad1f39206a9b8d246', '116674');
ROUTE_TO_ID.set('eecc0a0d4374add0a46ad496073b783a~4914097ec07815406c27da50c9df60da4480bc34b18686e90b2462a9242330a6', '16498');

function getRouteToken(id) {
  const sId = String(id);
  for (const [token, aid] of ROUTE_TO_ID.entries()) {
    if (aid === sId && token.includes('~')) return token;
  }
  const md5 = crypto.createHash('md5').update('ani:' + sId).digest('hex');
  const sha256 = crypto.createHash('sha256').update('ani:' + sId).digest('hex');
  const token = `${md5}~${sha256}`;
  ROUTE_TO_ID.set(token, sId);
  ROUTE_TO_ID.set(sId, token);
  return token;
}

function resolveAniListId(ident) {
  if (!ident) return null;
  const s = String(ident).trim();
  if (/^[0-9]+$/.test(s)) return s;
  const mapped = ROUTE_TO_ID.get(s);
  if (mapped && /^[0-9]+$/.test(String(mapped))) return String(mapped);
  return null;
}

// Load freshly mapped covers
let COVERS_MAP = {};
try {
  const coversPath = path.join(__dirname, 'covers.json');
  if (fs.existsSync(coversPath)) {
    COVERS_MAP = JSON.parse(fs.readFileSync(coversPath, 'utf8'));
  }
} catch (e) {
  console.error('[Covers] Error reading covers.json:', e.message);
}

// 7 Curated Spotlight Titles with local high-res banners and logos
const SPOTLIGHT_ITEMS = [
  {
    id: 189046,
    routeId: getRouteToken(189046),
    anilistId: 189046,
    malId: 54857,
    title: 'Re:ZERO -Starting Life in Another World- Season 3',
    romaji: 'Re:Zero kara Hajimeru Isekai Seikatsu 3rd Season',
    native: 'Re:ゼロから始める異世界生活 3rd season',
    poster: '/banners/rezero-p.webp',
    banner: '/banners/rezero.jpg',
    year: 2024,
    score: 85,
    format: 'TV',
    type: 'TV',
    episodeCount: 16,
    subCount: 16,
    dubCount: 8,
    hasSub: true,
    hasDub: true,
    sub: true,
    dub: true,
    genres: ['Action', 'Adventure', 'Drama', 'Fantasy', 'Psychological'],
    studios: ['White Fox'],
    synopsis: 'A year has passed since Subaru\'s victory at the Sanctuary. He savors a life of fulfillment while Emilia\'s camp stands united for the royal selection—until a fateful letter arrives.'
  },
  {
    id: 135865,
    routeId: getRouteToken(135865),
    anilistId: 135865,
    malId: 52299,
    title: 'Solo Leveling',
    romaji: 'Ore dake Level Up na Ken',
    native: '俺だけレベルアップな件',
    poster: '/img/covers/135865.jpg',
    banner: '/banners/135865.jpg',
    year: 2024,
    score: 84,
    format: 'TV',
    type: 'TV',
    episodeCount: 12,
    subCount: 12,
    dubCount: 12,
    hasSub: true,
    hasDub: true,
    sub: true,
    dub: true,
    genres: ['Action', 'Adventure', 'Fantasy'],
    studios: ['A-1 Pictures'],
    synopsis: 'They say whatever doesn\'t kill you makes you stronger, but that\'s not the case for Sung Jinwoo, the world\'s weakest hunter until a mysterious quest appears.'
  },
  {
    id: 178789,
    routeId: getRouteToken(178789),
    anilistId: 178789,
    malId: 57334,
    title: 'DAN DA DAN',
    romaji: 'Dandadan',
    native: 'ダンダダン',
    poster: '/icon-192.png',
    banner: '/banners/t/3AXLSxMuqyZt8HyrKKfrcJtkswD.webp',
    year: 2024,
    score: 86,
    format: 'TV',
    type: 'TV',
    episodeCount: 12,
    subCount: 12,
    dubCount: 12,
    hasSub: true,
    hasDub: true,
    sub: true,
    dub: true,
    genres: ['Action', 'Comedy', 'Supernatural', 'Sci-Fi'],
    studios: ['Science SARU'],
    synopsis: 'Momo, a high school girl from a family of spirit mediums, and Okarun, an occult fanatic classmate, wager a bet that leads to supernatural chaos.'
  },
  {
    id: 16498,
    routeId: getRouteToken(16498),
    anilistId: 16498,
    malId: 16498,
    title: 'Attack on Titan',
    romaji: 'Shingeki no Kyojin',
    native: '進撃の巨人',
    poster: '/icon-192.png',
    banner: '/banners/aot.jpg',
    year: 2013,
    score: 89,
    format: 'TV',
    type: 'TV',
    episodeCount: 25,
    subCount: 25,
    dubCount: 25,
    hasSub: true,
    hasDub: true,
    sub: true,
    dub: true,
    genres: ['Action', 'Drama', 'Fantasy', 'Mystery'],
    studios: ['WIT Studio'],
    synopsis: 'Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called Titans, forcing humans to hide behind enormous concentric walls.'
  },
  {
    id: 113415,
    routeId: getRouteToken(113415),
    anilistId: 113415,
    malId: 51009,
    title: 'Jujutsu Kaisen Season 2',
    romaji: 'Jujutsu Kaisen 2nd Season',
    native: '呪術廻戦 第2期',
    poster: '/icon-192.png',
    banner: '/banners/jjk.jpg',
    year: 2023,
    score: 88,
    format: 'TV',
    type: 'TV',
    episodeCount: 23,
    subCount: 23,
    dubCount: 23,
    hasSub: true,
    hasDub: true,
    sub: true,
    dub: true,
    genres: ['Action', 'Fantasy', 'Supernatural'],
    studios: ['MAPPA'],
    synopsis: 'The past comes to light as Gojo Satoru and Geto Suguru take on a mission to protect the Star Plasma Vessel, leading to a tragic shift in fate.'
  },
  {
    id: 187538,
    routeId: getRouteToken(187538),
    anilistId: 187538,
    malId: 56784,
    title: 'Bleach: Thousand-Year Blood War - The Conflict',
    romaji: 'Bleach: Sennen Kessen-hen - Soukoku-tan',
    native: 'BLEACH 千年血戦篇-相剋譚-',
    poster: '/icon-192.png',
    banner: '/banners/187538.jpg',
    year: 2024,
    score: 87,
    format: 'TV',
    type: 'TV',
    episodeCount: 14,
    subCount: 14,
    dubCount: 14,
    hasSub: true,
    hasDub: true,
    sub: true,
    dub: true,
    genres: ['Action', 'Adventure', 'Supernatural'],
    studios: ['Pierrot Films'],
    synopsis: 'The fierce war between Soul Reapers and Quincies continues as Ichigo rushes to the Soul King Palace to confront Yhwach.'
  },
  {
    id: 196187,
    routeId: getRouteToken(196187),
    anilistId: 196187,
    malId: 58852,
    title: 'Sakamoto Days',
    romaji: 'Sakamoto Days',
    native: 'SAKAMOTO DAYS',
    poster: '/icon-192.png',
    banner: '/banners/196187.jpg',
    year: 2025,
    score: 83,
    format: 'TV',
    type: 'TV',
    episodeCount: 12,
    subCount: 12,
    dubCount: 12,
    hasSub: true,
    hasDub: true,
    sub: true,
    dub: true,
    genres: ['Action', 'Comedy'],
    studios: ['TMS Entertainment'],
    synopsis: 'Taro Sakamoto was once considered the greatest hitman of all time, until he fell in love, got married, had a child, and retired to run a neighborhood store.'
  }
];

// Catalog state
const ALL_CATALOG_ITEMS = [...SPOTLIGHT_ITEMS];
const CATALOG_MAP = new Map();
const SEEN_IDS = new Set();

for (const s of SPOTLIGHT_ITEMS) {
  SEEN_IDS.add(s.id);
  CATALOG_MAP.set(String(s.id), s);
  CATALOG_MAP.set(String(s.routeId), s);
  ROUTE_TO_ID.set(String(s.routeId), String(s.id));
}

// Load local dump datasets
const yoruDist = 'C:/Users/green/yoru-anime-src/dist';
try {
  const dumpPath = path.join(yoruDist, 'anilist_dump.json');
  if (fs.existsSync(dumpPath)) {
    const rawData = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
    const allEntries = (rawData.trending || []).concat(rawData.newest || []);
    for (const it of allEntries) {
      const aid = it.id;
      if (!aid || SEEN_IDS.has(aid) || SEEN_IDS.has(String(aid))) continue;
      SEEN_IDS.add(aid);
      SEEN_IDS.add(String(aid));

      const titleObj = it.title || {};
      const tStr = (typeof titleObj === 'object' ? (titleObj.english || titleObj.romaji || titleObj.native) : titleObj) || `Anime ${aid}`;
      const rStr = (typeof titleObj === 'object' ? titleObj.romaji : tStr) || tStr;
      const nStr = (typeof titleObj === 'object' ? titleObj.native : tStr) || tStr;
      const score = it.averageScore || Math.round(parseFloat(it.score || '8') * 10);
      const eps = it.episodes || 12;
      const fmt = (it.format || it.type || 'TV').toUpperCase();

      const poster = COVERS_MAP[String(aid)] || (it.coverImage?.large || it.coverImage?.medium || it.poster);
      const banner = it.bannerImage || it.banner || poster;

      const token = getRouteToken(aid);
      const obj = {
        id: aid,
        routeId: token,
        anilistId: aid,
        malId: it.idMal,
        title: tStr,
        romaji: rStr,
        native: nStr,
        poster,
        banner,
        year: it.seasonYear || it.year || 2024,
        score,
        format: fmt,
        type: fmt,
        episodeCount: eps,
        subCount: eps,
        dubCount: eps,
        hasSub: true,
        hasDub: true,
        sub: true,
        dub: true,
        genres: it.genres || ['Action', 'Fantasy'],
        studios: Array.isArray(it.studios?.nodes) ? it.studios.nodes.map(s => s.name) : [],
        synopsis: it.description || ''
      };
      ALL_CATALOG_ITEMS.push(obj);
      CATALOG_MAP.set(String(aid), obj);
      CATALOG_MAP.set(token, obj);
      ROUTE_TO_ID.set(token, String(aid));
      ROUTE_TO_ID.set(String(aid), token);
    }
  }
} catch (e) {
  console.error('[Catalog Loader] Error loading dump:', e.message);
}

try {
  const expPath = path.join(yoruDist, 'catalog-expanded.json');
  if (fs.existsSync(expPath)) {
    const expData = JSON.parse(fs.readFileSync(expPath, 'utf8'));
    expData.forEach((it, idx) => {
      const cid = it.id;
      if (!cid || SEEN_IDS.has(cid) || SEEN_IDS.has(String(cid))) return;
      SEEN_IDS.add(cid);
      SEEN_IDS.add(String(cid));

      const fmt = (it.type || 'TV').toUpperCase();
      const eps = it.episodes || 12;
      const simId = idx + 50000;
      const poster = COVERS_MAP[String(cid)] || it.poster;
      const token = getRouteToken(simId);

      const obj = {
        id: simId,
        routeId: token,
        anilistId: null,
        title: it.title,
        romaji: it.jp,
        native: it.jp,
        poster,
        banner: poster,
        year: it.year || 2024,
        score: Math.round(parseFloat(it.score || '8') * 10),
        format: fmt,
        type: fmt,
        episodeCount: eps,
        subCount: eps,
        dubCount: eps,
        hasSub: true,
        hasDub: true,
        sub: true,
        dub: true,
        genres: it.genres || ['Action'],
        studios: it.studio ? [it.studio] : [],
        synopsis: it.description || ''
      };
      ALL_CATALOG_ITEMS.push(obj);
      CATALOG_MAP.set(String(simId), obj);
      CATALOG_MAP.set(String(cid), obj);
      CATALOG_MAP.set(token, obj);
      ROUTE_TO_ID.set(token, String(simId));
      ROUTE_TO_ID.set(String(cid), String(simId));
      ROUTE_TO_ID.set(String(simId), token);
    });
  }
} catch (e) {
  console.error('[Catalog Loader] Error loading expanded:', e.message);
}

// Upcoming releases for Schedule
const nowTs = Math.floor(Date.now() / 1000);
const SCHEDULE_ITEMS = [
  {
    id: 196187,
    routeId: '196187',
    anilistId: 196187,
    title: 'Sakamoto Days',
    poster: '/icon-192.png',
    banner: '/banners/196187.jpg',
    airingAt: nowTs + 86400 * 2,
    season: 'WINTER',
    year: 2025,
    startDate: { year: 2025, month: 1, day: 11 }
  },
  {
    id: 176496,
    routeId: '176496',
    anilistId: 176496,
    title: 'Solo Leveling Season 2 -Arise from the Shadow-',
    poster: '/img/covers/135865.jpg',
    banner: '/banners/135865.jpg',
    airingAt: nowTs + 86400 * 4,
    season: 'WINTER',
    year: 2025,
    startDate: { year: 2025, month: 1, day: 5 }
  },
  {
    id: 185660,
    routeId: '185660',
    anilistId: 185660,
    title: 'DAN DA DAN Season 2',
    poster: '/icon-192.png',
    banner: '/banners/t/3AXLSxMuqyZt8HyrKKfrcJtkswD.webp',
    airingAt: nowTs + 86400 * 12,
    season: 'SPRING',
    year: 2025,
    startDate: { year: 2025, month: 4, day: 3 }
  },
  {
    id: 178025,
    routeId: '178025',
    anilistId: 178025,
    title: 'Gachiakuta',
    poster: '/icon-192.png',
    banner: '/banners/t/aXO5vBpGEl2xUfhJtZyLWeLY5ZJ.webp',
    airingAt: nowTs + 86400 * 20,
    season: 'SUMMER',
    year: 2025,
    startDate: { year: 2025, month: 7, day: 1 }
  }
];

const COMMUNITY_COMMENTS = [
  {
    id: 'c1',
    titleId: '189046',
    title: 'Re:ZERO -Starting Life in Another World- Season 3',
    body: 'No matter how many times it takes, I will save everyone!',
    createdAt: Date.now() - 3600000 * 5,
    likes: 42,
    likedByMe: false,
    dislikes: 0,
    dislikedByMe: false,
    mine: false,
    spoiler: false,
    reactions: [{ emoji: 'rz:629801-rem', count: 12, mine: false }],
    parentId: null,
    user: makeUser('subaru', 'subaru', 'Subaru Natsuki', '/banners/rezero-p.webp', '#f97316', false, true)
  },
  {
    id: 'c2',
    titleId: '135865',
    title: 'Solo Leveling',
    body: 'Arise.',
    createdAt: Date.now() - 3600000 * 2,
    likes: 156,
    likedByMe: false,
    dislikes: 0,
    dislikedByMe: false,
    mine: false,
    spoiler: false,
    reactions: [{ emoji: 'std:3257-zorolike', count: 24, mine: false }],
    parentId: null,
    user: makeUser('jinwoo', 'jinwoo', 'Sung Jinwoo', '/img/covers/135865.jpg', '#8b5cf6', false, false)
  },
  {
    id: 'c3',
    titleId: '178789',
    title: 'DAN DA DAN',
    body: 'Aliens and turbo grannies are real! Believe me!',
    createdAt: Date.now() - 3600000,
    likes: 89,
    likedByMe: false,
    dislikes: 0,
    dislikedByMe: false,
    mine: false,
    spoiler: false,
    reactions: [{ emoji: 'std:138370-xd', count: 18, mine: false }],
    parentId: null,
    user: makeUser('okarun', 'okarun', 'Okarun', '/icon-192.png', '#10b981', false, false)
  }
];

// =========================================================================
// COMMUNITY FORUM & CHAT DATA (Rich discussions & threads)
// =========================================================================
const FORUM_CATEGORIES = [
  { id: 'general', name: 'General', description: 'General anime discussions, off-topic chat, and introductions', threads: 3, posts: 14 },
  { id: 'anime', name: 'Anime', description: 'Seasonal recommendations, episode discussions, and reviews', threads: 5, posts: 28 },
  { id: 'bugs', name: 'Bugs', description: 'Report player issues, broken streams, or website glitches', threads: 2, posts: 6 },
  { id: 'suggestions', name: 'Suggestions', description: 'Share feature ideas and improvements for ani.pm', threads: 3, posts: 9 }
];

const USER_ADMIN = makeUser('admin', 'admin', 'Admin', '/icon-192.png', '#6366f1', true, true);
const USER_SUBARU = makeUser('subaru', 'subaru', 'Subaru', '/banners/rezero-p.webp', '#f97316', false, true);
const USER_REM = makeUser('rem', 'rem', 'Rem', '/img/reactions/rezero/629801-rem.png', '#3b82f6', false, false);
const USER_EMILIA = makeUser('emilia', 'emilia', 'Emilia', '/banners/rezero-p.webp', '#a855f7', false, false);
const USER_JINWOO = makeUser('jinwoo', 'jinwoo', 'Sung Jin-Woo', '/img/covers/135865.jpg', '#8b5cf6', false, false);
const USER_CHA = makeUser('cha', 'cha', 'Cha Hae-In', '/img/covers/135865.jpg', '#eab308', false, false);
const USER_MOMO = makeUser('momo', 'momo', 'Momo', '/icon-192.png', '#ec4899', false, false);
const USER_OKARUN = makeUser('okarun', 'okarun', 'Okarun', '/icon-192.png', '#10b981', false, false);
const USER_LUFFY = makeUser('luffy', 'luffy', 'Luffy', '/icon-192.png', '#ef4444', false, true);
const USER_ZORO = makeUser('zoro', 'zoro', 'Zoro', '/img/reactions/std/3257-zorolike.png', '#22c55e', false, false);
const USER_OTAKU = makeUser('guest', 'otaku99', 'Otaku99', '/icon-192.png', '#06b6d4', false, false);
const USER_NIGHTOWL = makeUser('nightowl', 'nightowl', 'NightOwl', '/icon-192.png', '#64748b', false, false);
const USER_PIXEL = makeUser('pixel', 'pixel', 'PixelFan', '/icon-192.png', '#14b8a6', false, false);

const FORUM_THREADS = [
  {
    id: 1,
    title: 'Welcome to the ani.pm Community!',
    category: 'general',
    excerpt: 'Welcome to ani.pm! Discuss your favorite anime, follow episode releases, and share feedback with the community.',
    pinned: true,
    locked: false,
    replies: 4,
    author: USER_ADMIN,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    lastPostAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastPoster: USER_REM
  },
  {
    id: 2,
    title: 'Fall 2026 Anime Season Discussion & Top Picks',
    category: 'anime',
    excerpt: 'What are your top picks for this season? Re:ZERO Season 3, DAN DA DAN, Bleach, or Solo Leveling?',
    pinned: true,
    locked: false,
    replies: 8,
    author: USER_SUBARU,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    lastPostAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastPoster: USER_JINWOO
  },
  {
    id: 3,
    title: 'Re:ZERO Season 3 - Episode Discussion Thread',
    category: 'anime',
    excerpt: 'Episode 1 discussion thread. Share your theories, best moments, and animation highlights!',
    pinned: false,
    locked: false,
    replies: 12,
    author: USER_EMILIA,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastPostAt: new Date(Date.now() - 1800000).toISOString(),
    lastPoster: USER_SUBARU
  },
  {
    id: 4,
    title: 'DAN DA DAN - Best Animation of the Year?',
    category: 'anime',
    excerpt: 'Science SARU absolutely outdid themselves with this premiere. The pacing and visuals are stunning.',
    pinned: false,
    locked: false,
    replies: 5,
    author: USER_MOMO,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    lastPostAt: new Date(Date.now() - 3600000).toISOString(),
    lastPoster: USER_OKARUN
  },
  {
    id: 5,
    title: 'One Piece Egghead Arc Episode 1000+ Highlights',
    category: 'anime',
    excerpt: 'The animation quality in this arc is on movie level. What was your favorite scene so far?',
    pinned: false,
    locked: false,
    replies: 7,
    author: USER_LUFFY,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    lastPostAt: new Date(Date.now() - 7200000).toISOString(),
    lastPoster: USER_ZORO
  },
  {
    id: 6,
    title: 'Solo Leveling Arise & S2 Expectations',
    category: 'anime',
    excerpt: 'The raid scenes were phenomenal. Can not wait for the next season to air.',
    pinned: false,
    locked: false,
    replies: 3,
    author: USER_JINWOO,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastPostAt: new Date(Date.now() - 14400000).toISOString(),
    lastPoster: USER_CHA
  },
  {
    id: 7,
    title: 'Video Player & Streaming Performance Feedback',
    category: 'bugs',
    excerpt: 'If you ever encounter buffering or playback errors, leave your browser and title details here.',
    pinned: false,
    locked: false,
    replies: 2,
    author: USER_ADMIN,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastPostAt: new Date(Date.now() - 28800000).toISOString(),
    lastPoster: USER_OTAKU
  },
  {
    id: 8,
    title: 'Feature Suggestion: Custom Subtitle Fonts & Styles',
    category: 'suggestions',
    excerpt: 'Would love the ability to change subtitle fonts, font size, and background opacity in the player.',
    pinned: false,
    locked: false,
    replies: 4,
    author: USER_NIGHTOWL,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    lastPostAt: new Date(Date.now() - 10800000).toISOString(),
    lastPoster: USER_ADMIN
  },
  {
    id: 9,
    title: 'Feature Suggestion: Darker AMOLED Theme & Glass Mode',
    category: 'suggestions',
    excerpt: 'The glass aesthetics look great! An option for true black AMOLED background would be awesome on OLED screens.',
    pinned: false,
    locked: false,
    replies: 3,
    author: USER_PIXEL,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastPostAt: new Date(Date.now() - 21600000).toISOString(),
    lastPoster: USER_ADMIN
  }
];

const FORUM_POSTS = new Map([
  [1, [
    { id: 1, body: "Welcome to ani.pm! Feel free to browse, watch your favorite shows, and hang out in the community.", author: USER_ADMIN, createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), canDelete: false },
    { id: 2, body: "Thanks for setting this up! The playback is super fast.", author: USER_REM, createdAt: new Date(Date.now() - 86400000 * 6).toISOString(), canDelete: false }
  ]],
  [2, [
    { id: 1, body: "What is everyone watching this season? The lineup is absolutely stacked!", author: USER_SUBARU, createdAt: new Date(Date.now() - 86400000 * 4).toISOString(), canDelete: false },
    { id: 2, body: "Re:ZERO Season 3 and DAN DA DAN have been peak fiction so far.", author: USER_JINWOO, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), canDelete: false }
  ]],
  [3, [
    { id: 1, body: "Re:ZERO Season 3 has started with a 90-minute special! Let's talk about the episodes.", author: USER_EMILIA, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), canDelete: false },
    { id: 2, body: "The animation in Priestella was top tier. White Fox delivered completely.", author: USER_SUBARU, createdAt: new Date(Date.now() - 1800000).toISOString(), canDelete: false }
  ]],
  [4, [
    { id: 1, body: "Science SARU absolutely outdid themselves with this premiere. The pacing and visuals are stunning.", author: USER_MOMO, createdAt: new Date(Date.now() - 86400000).toISOString(), canDelete: false },
    { id: 2, body: "The soundtrack is legendary too. Best comedy and supernatural mix of 2026.", author: USER_OKARUN, createdAt: new Date(Date.now() - 3600000).toISOString(), canDelete: false }
  ]],
  [5, [
    { id: 1, body: "The animation quality in this arc is on movie level. What was your favorite scene so far?", author: USER_LUFFY, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), canDelete: false },
    { id: 2, body: "Gear 5 and Galaxy Impact were animated so cleanly!", author: USER_ZORO, createdAt: new Date(Date.now() - 7200000).toISOString(), canDelete: false }
  ]],
  [6, [
    { id: 1, body: "The raid scenes were phenomenal. Can not wait for the next season to air.", author: USER_JINWOO, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), canDelete: false }
  ]],
  [7, [
    { id: 1, body: "If you ever encounter buffering or playback errors, leave your browser and title details here.", author: USER_ADMIN, createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), canDelete: false }
  ]],
  [8, [
    { id: 1, body: "Would love the ability to change subtitle fonts, font size, and background opacity in the player.", author: USER_NIGHTOWL, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), canDelete: false }
  ]],
  [9, [
    { id: 1, body: "The glass aesthetics look great! An option for true black AMOLED background would be awesome on OLED screens.", author: USER_PIXEL, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), canDelete: false }
  ]]
]);

const CHAT_MESSAGES = [
  { id: 1, body: "Welcome to ani.pm live chat! 🎉", user: USER_ADMIN, createdAt: new Date(Date.now() - 3600000 * 4).toISOString() },
  { id: 2, body: "Anyone watching Re:ZERO Season 3 right now?", user: USER_SUBARU, createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 3, body: "Episode 1 was insane, the 90-minute premiere flew by so fast!", user: USER_REM, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 4, body: "DAN DA DAN episode 1 animation is out of this world too!", user: USER_OKARUN, createdAt: new Date(Date.now() - 1800000).toISOString() }
];

// Helper: Query AniList GraphQL in real-time for any anime
async function fetchAniListAnime(_ident) {
  // Deliberately disabled: AML branch is synthetic-data-only.
  return null;
}

// Find item in catalog or fetch dynamically
async function findCatalogItem(ident) {
  if (!ident) return SPOTLIGHT_ITEMS[0];
  const identStr = String(ident).trim();

  // Check known route alias
  const resolved = resolveAniListId(identStr);
  if (resolved && CATALOG_MAP.has(resolved)) return CATALOG_MAP.get(resolved);
  if (CATALOG_MAP.has(identStr)) return CATALOG_MAP.get(identStr);

  // Search by ID or title
  for (const it of ALL_CATALOG_ITEMS) {
    if (String(it.id) === identStr || String(it.anilistId) === identStr || it.routeId === identStr || (resolved && String(it.id) === resolved)) {
      return it;
    }
  }

  // AML mock mode never queries AniList or any other external metadata service.
  if (!MOCK_ONLY) {
    const live = await fetchAniListAnime(resolved || identStr);
    if (live) return live;
  }

  return SPOTLIGHT_ITEMS[0];
}

// Generate complete series details object with all episodes
function buildSeriesDetails(item) {
  const epCount = item.episodeCount || 12;
  const episodes = [];
  for (let i = 1; i <= epCount; i++) {
    episodes.push({
      id: i,
      number: i,
      title: `Episode ${i}`,
      aired: `${item.year || 2024}-01-01`,
      duration: 24 * 60,
      sub: true,
      dub: true,
      hasSub: true,
      hasDub: true
    });
  }
  const token = (item.routeId && item.routeId.includes('~')) ? item.routeId : getRouteToken(item.id || item.anilistId);
  return {
    id: item.id,
    routeId: token,
    anilistId: item.anilistId || item.id,
    malId: item.malId,
    title: item.title,
    romaji: item.romaji,
    native: item.native,
    poster: item.poster,
    banner: item.banner,
    year: item.year,
    score: item.score,
    format: item.format || 'TV',
    type: item.type || 'TV',
    status: (item.year || 2024) >= 2024 ? 'Releasing' : 'Finished',
    episodeCount: epCount,
    subCount: epCount,
    dubCount: epCount,
    sub: true,
    dub: true,
    hasSub: true,
    hasDub: true,
    genres: item.genres || [],
    studios: item.studios || [],
    synopsis: item.synopsis || '',
    episodes,
    recommendations: ALL_CATALOG_ITEMS.slice(0, 12)
  };
}

// Generate rich, clickable latest episodes feed with valid still images & episode numbers
function getLatestEpisodes(page = 1, limit = 60) {
  const items = [];
  const titles = ALL_CATALOG_ITEMS.slice(0, 80);
  for (let idx = 0; idx < titles.length; idx++) {
    const it = titles[idx];
    const epNum = (it.episodeCount && it.episodeCount > 1) ? Math.min(it.episodeCount, (idx % 12) + 1) : 1;
    const token = (it.routeId && it.routeId.includes('~')) ? it.routeId : getRouteToken(it.id || it.anilistId);

    let still = it.banner;
    if (!still || still.includes('empty')) still = it.poster;
    if (String(it.id) === '135865') still = '/banners/orig-4k/135865.jpg';
    if (String(it.id) === '189046') still = '/banners/orig-4k/189046.jpg';
    if (!still) still = it.poster;

    const stillKeyUrl = getStillKeyUrl(still);

    items.push({
      id: Number(it.id),
      source: 'settlar',
      anilistId: Number(it.anilistId || it.id),
      routeId: token,
      episodeRouteId: String(epNum),
      title: it.title,
      epNumber: epNum,
      epTitle: `Episode ${epNum}`,
      still: stillKeyUrl,
      poster: it.poster,
      banner: it.banner || still,
      sub: true,
      dub: true,
      aired: new Date(Date.now() - (idx * 3600000 * 1.5)).toISOString(),
      duration: 24,
      runtimeSeconds: 24 * 60,
      provider: 'anipm'
    });
  }

  const start = (page - 1) * limit;
  const paginated = items.slice(start, start + limit);
  return {
    items: paginated,
    page,
    limit,
    total: items.length,
    hasNextPage: start + limit < items.length
  };
}

// Filter, search, and sort catalog items with full availability schema
function filterCatalog(params) {
  const q = (params.get('q') || '').trim().toLowerCase();
  const sort = (params.get('sort') || 'popular').toLowerCase();
  const genre = (params.get('genre') || '').toLowerCase();
  const year = params.get('year') || '';
  const format = (params.get('format') || '').toUpperCase();
  const status = (params.get('status') || '').toUpperCase();
  const page = parseInt(params.get('page') || '1', 10);
  const limit = parseInt(params.get('limit') || '30', 10);

  let results = ALL_CATALOG_ITEMS.slice();

  if (q) {
    results = results.filter(it => 
      it.title?.toLowerCase().includes(q) ||
      it.romaji?.toLowerCase().includes(q) ||
      it.native?.toLowerCase().includes(q) ||
      String(it.id) === q ||
      String(it.anilistId) === q
    );
  }

  if (genre) {
    results = results.filter(it => 
      (it.genres || []).some(g => g.toLowerCase() === genre)
    );
  }

  if (year) {
    results = results.filter(it => String(it.year) === year);
  }

  if (format) {
    results = results.filter(it => (it.format || it.type || '').toUpperCase() === format);
  }

  if (status) {
    results = results.filter(it => (it.status || '').toUpperCase() === status);
  }

  if (sort === 'score') {
    results.sort((a, b) => (b.score || 0) - (a.score || 0));
  } else if (sort === 'newest') {
    results.sort((a, b) => (b.year || 0) - (a.year || 0));
  } else if (sort === 'title') {
    results.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  const start = (page - 1) * limit;
  const paginated = results.slice(start, start + limit).map(it => ({
    ...it,
    source: 'settlar'
  }));

  return {
    items: paginated,
    page,
    limit,
    total: results.length,
    hasNextPage: start + limit < results.length,
    hasMore: start + limit < results.length,
    availability: {
      rows: results.length,
      sourced: results.length,
      unavailable: 0,
      "no-known-source": 0,
      music: 0,
      unreleased: 0,
      "no-episodes": 0
    }
  };
}

// Compute dynamic filter tags and studios for Browse facets
function getFacets() {
  const genreCount = {};
  const studioCount = {};
  for (const it of ALL_CATALOG_ITEMS) {
    for (const g of (it.genres || [])) {
      genreCount[g] = (genreCount[g] || 0) + 1;
    }
    for (const s of (it.studios || [])) {
      studioCount[s] = (studioCount[s] || 0) + 1;
    }
  }

  const defaultStudios = ['ufotable', 'MAPPA', 'A-1 Pictures', 'Madhouse', 'Bones', 'Toei Animation', 'White Fox', 'CloverWorks', 'Wit Studio', 'Kyoto Animation'];
  for (const s of defaultStudios) {
    if (!studioCount[s]) studioCount[s] = 8;
  }

  const tags = Object.entries(genreCount).map(([name, count]) => ({ name, count }));
  const studios = Object.entries(studioCount).map(([name, count]) => ({ name, count }));
  let genres = Object.entries(genreCount).map(([name, count]) => ({ name, count }));
  if (genres.length === 0) {
    const defaultGenres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"];
    genres = defaultGenres.map(g => ({ name: g, count: 12 }));
  }

  return { tags, studios, genres };
}

// Smart banner and logo asset resolution
function resolveLocalAsset(pathname) {
  if (pathname.startsWith('/banners/')) {
    const direct = path.join(DIRECTORY, pathname);
    if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;

    // Check extension variations
    const baseDir = path.dirname(direct);
    const parsed = path.parse(direct);
    for (const ext of ['.avif', '.webp', '.jpg', '.jpeg', '.png']) {
      const cand = path.join(baseDir, parsed.name + ext);
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
    }

    // Strip orig-4k/ and resolution suffixes (-1280, -1600)
    const cleanStem = parsed.name.replace(/-(?:1280|1600|4k|orig|\d+)$/i, '');
    const searchDirs = [
      path.join(DIRECTORY, 'banners'),
      path.join(DIRECTORY, 'banners', 'orig-4k'),
      path.join(DIRECTORY, 'banners', 't')
    ];
    for (const sDir of searchDirs) {
      if (!fs.existsSync(sDir)) continue;
      for (const ext of ['.jpg', '.webp', '.png', '.avif']) {
        const testFile = path.join(sDir, cleanStem + ext);
        if (fs.existsSync(testFile) && fs.statSync(testFile).isFile()) return testFile;
      }
    }
  }

  if (pathname.startsWith('/logos/')) {
    const direct = path.join(DIRECTORY, pathname);
    if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
    const baseDir = path.dirname(direct);
    const parsed = path.parse(direct);
    for (const ext of ['.png', '.avif', '.webp', '.svg']) {
      const cand = path.join(baseDir, parsed.name + ext);
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
    }
    const cleanStem = parsed.name.replace(/-(?:600|1280|\d+)$/i, '');
    const logosDir = path.join(DIRECTORY, 'logos');
    for (const ext of ['.png', '.avif', '.webp', '.svg']) {
      const testFile = path.join(logosDir, cleanStem + ext);
      if (fs.existsSync(testFile) && fs.statSync(testFile).isFile()) return testFile;
    }
  }

  if (pathname.startsWith('/img/covers/')) {
    const direct = path.join(DIRECTORY, pathname);
    if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  }

  return null;
}


/* =========================================================================
 * AML MOCK-ONLY FIXTURES
 * The SPA-Ripper-extracted frontend remains unchanged; only its data layer is
 * swapped to synthetic fixtures for safe UI testing.
 * ========================================================================= */
const AML_ITEMS = [
  { id:91001, routeId:getRouteToken(91001), anilistId:189046, malId:null, title:"Neon Archive", romaji:"Neon Archive", native:"ネオン・アーカイブ", poster:'/mock-art/neon-archive-poster.svg', banner:'/mock-art/neon-archive-wide.svg', year:2026, score:87, format:"TV", type:"TV", episodeCount:12, subCount:12, dubCount:6, hasSub:true, hasDub:true, sub:true, dub:true, genres:["Sci-Fi","Mystery"], studios:["AML Studio"], synopsis:"A signal archivist uncovers memories encoded inside a citywide broadcast network." },
  { id:91002, routeId:getRouteToken(91002), anilistId:135865, malId:null, title:"Glass Horizon", romaji:"Glass Horizon", native:"グラス・ホライズン", poster:'/mock-art/glass-horizon-poster.svg', banner:'/mock-art/glass-horizon-wide.svg', year:2026, score:84, format:"TV", type:"TV", episodeCount:10, subCount:10, dubCount:10, hasSub:true, hasDub:true, sub:true, dub:true, genres:["Drama","Fantasy"], studios:["Northline"], synopsis:"Sky couriers cross a crystalline frontier where each horizon reveals a different history." },
  { id:91003, routeId:getRouteToken(91003), anilistId:16498, malId:null, title:"Moonframe", romaji:"Moonframe", native:"ムーンフレーム", poster:'/mock-art/moonframe-poster.svg', banner:'/mock-art/moonframe-wide.svg', year:2025, score:89, format:"MOVIE", type:"MOVIE", episodeCount:1, subCount:1, dubCount:1, hasSub:true, hasDub:true, sub:true, dub:true, genres:["Romance","Sci-Fi"], studios:["Frame Lab"], synopsis:"Two lunar photographers discover that their film can capture events one night before they happen." },
  { id:91004, routeId:getRouteToken(91004), anilistId:113415, malId:null, title:"Wild Signal", romaji:"Wild Signal", native:"ワイルド・シグナル", poster:'/mock-art/wild-signal-poster.svg', banner:'/mock-art/wild-signal-wide.svg', year:2026, score:81, format:"TV", type:"TV", episodeCount:24, subCount:18, dubCount:12, hasSub:true, hasDub:true, sub:true, dub:true, genres:["Action","Comedy"], studios:["Signal Works"], synopsis:"A courier crew hunts rogue radio creatures across a neon wilderness." },
  { id:91005, routeId:getRouteToken(91005), anilistId:187538, malId:null, title:"Quiet Engine", romaji:"Quiet Engine", native:"クワイエット・エンジン", poster:'/mock-art/quiet-engine-poster.svg', banner:'/mock-art/quiet-engine-wide.svg', year:2024, score:79, format:"TV", type:"TV", episodeCount:12, subCount:12, dubCount:12, hasSub:true, hasDub:true, sub:true, dub:true, genres:["Drama","Slice of Life"], studios:["Daybreak"], synopsis:"A retired mech engineer rebuilds a neighborhood workshop and the friendships around it." },
  { id:91006, routeId:getRouteToken(91006), anilistId:196187, malId:null, title:"After Image", romaji:"After Image", native:"アフター・イメージ", poster:'/mock-art/after-image-poster.svg', banner:'/mock-art/after-image-wide.svg', year:2026, score:83, format:"ONA", type:"ONA", episodeCount:8, subCount:3, dubCount:0, hasSub:true, hasDub:false, sub:true, dub:false, genres:["Thriller","Mystery"], studios:["AML Studio"], synopsis:"Investigators chase crimes that appear first as photographs from the future." },
  { id:91007, routeId:getRouteToken(91007), anilistId:178789, malId:null, title:"Starfall Radio", romaji:"Starfall Radio", native:"スターフォール・ラジオ", poster:'/mock-art/starfall-radio-poster.svg', banner:'/mock-art/starfall-radio-wide.svg', year:2025, score:80, format:"TV", type:"TV", episodeCount:13, subCount:13, dubCount:13, hasSub:true, hasDub:true, sub:true, dub:true, genres:["Music","Drama"], studios:["Radio House"], synopsis:"A midnight radio band performs songs that guide stranded travelers home." },
  { id:91008, routeId:getRouteToken(91008), anilistId:185874, malId:null, title:"Mirror District", romaji:"Mirror District", native:"ミラー・ディストリクト", poster:'/mock-art/mirror-district-poster.svg', banner:'/mock-art/mirror-district-wide.svg', year:2026, score:85, format:"TV", type:"TV", episodeCount:12, subCount:7, dubCount:4, hasSub:true, hasDub:true, sub:true, dub:true, genres:["Mystery","Supernatural"], studios:["Glassworks"], synopsis:"Residents of a mirrored city investigate reflections that begin living independent lives." },
  { id:91009, routeId:getRouteToken(91009), anilistId:91009, malId:null, title:"Paper Comet", romaji:"Paper Comet", native:"ペーパー・コメット", poster:'/mock-art/paper-comet-poster.svg', banner:'/mock-art/paper-comet-wide.svg', year:2023, score:76, format:"MOVIE", type:"MOVIE", episodeCount:1, subCount:1, dubCount:0, hasSub:true, hasDub:false, sub:true, dub:false, genres:["Adventure","Family"], studios:["Folded Sky"], synopsis:"A handmade paper spacecraft carries two siblings across illustrated constellations." },
  { id:91010, routeId:getRouteToken(91010), anilistId:91010, malId:null, title:"Soft Static", romaji:"Soft Static", native:"ソフト・スタティック", poster:'/mock-art/soft-static-poster.svg', banner:'/mock-art/soft-static-wide.svg', year:2026, score:82, format:"TV", type:"TV", episodeCount:12, subCount:9, dubCount:3, hasSub:true, hasDub:true, sub:true, dub:true, genres:["Romance","Music"], studios:["Low Tide"], synopsis:"College radio hosts fall in love while tracing a mysterious listener who never speaks." },
  { id:91011, routeId:getRouteToken(91011), anilistId:91011, malId:null, title:"Verdant Zero", romaji:"Verdant Zero", native:"ヴァーダント・ゼロ", poster:'/mock-art/verdant-zero-poster.svg', banner:'/mock-art/verdant-zero-wide.svg', year:2025, score:86, format:"TV", type:"TV", episodeCount:24, subCount:24, dubCount:18, hasSub:true, hasDub:true, sub:true, dub:true, genres:["Action","Sci-Fi"], studios:["Greenline"], synopsis:"Terraforming pilots defend the first orbital forest from a self-replicating machine swarm." },
  { id:91012, routeId:getRouteToken(91012), anilistId:91012, malId:null, title:"Night Bus 77", romaji:"Night Bus 77", native:"ナイトバス77", poster:'/mock-art/night-bus-77-poster.svg', banner:'/mock-art/night-bus-77-wide.svg', year:2024, score:78, format:"TV", type:"TV", episodeCount:11, subCount:11, dubCount:11, hasSub:true, hasDub:true, sub:true, dub:true, genres:["Comedy","Supernatural"], studios:["Last Stop"], synopsis:"A night-shift driver discovers every passenger is traveling to a place that no longer exists." },
  { id:91013, routeId:getRouteToken(91013), anilistId:91013, malId:null, title:"Atlas of Rain", romaji:"Atlas of Rain", native:"雨のアトラス", poster:'/mock-art/atlas-of-rain-poster.svg', banner:'/mock-art/atlas-of-rain-wide.svg', year:2026, score:88, format:"TV", type:"TV", episodeCount:12, subCount:5, dubCount:0, hasSub:true, hasDub:false, sub:true, dub:false, genres:["Fantasy","Drama"], studios:["Blue Hour"], synopsis:"Mapmakers chart storms that reshape borders, memories and the people caught between them." },
  { id:91014, routeId:getRouteToken(91014), anilistId:91014, malId:null, title:"Copper Bloom", romaji:"Copper Bloom", native:"カッパー・ブルーム", poster:'/mock-art/copper-bloom-poster.svg', banner:'/mock-art/copper-bloom-wide.svg', year:2022, score:74, format:"TV", type:"TV", episodeCount:13, subCount:13, dubCount:13, hasSub:true, hasDub:true, sub:true, dub:true, genres:["Slice of Life","Comedy"], studios:["Workshop 9"], synopsis:"A robotics club builds tiny gardeners that slowly transform an abandoned rooftop." },
  { id:91015, routeId:getRouteToken(91015), anilistId:91015, malId:null, title:"Orbit Canteen", romaji:"Orbit Canteen", native:"オービット食堂", poster:'/mock-art/orbit-canteen-poster.svg', banner:'/mock-art/orbit-canteen-wide.svg', year:2026, score:77, format:"ONA", type:"ONA", episodeCount:10, subCount:6, dubCount:2, hasSub:true, hasDub:true, sub:true, dub:true, genres:["Comedy","Sci-Fi"], studios:["Panorama"], synopsis:"A tiny diner on a freight station serves aliens, pilots and impossible late-night orders." },
  { id:91016, routeId:getRouteToken(91016), anilistId:91016, malId:null, title:"Winter Protocol", romaji:"Winter Protocol", native:"ウィンター・プロトコル", poster:'/mock-art/winter-protocol-poster.svg', banner:'/mock-art/winter-protocol-wide.svg', year:2025, score:90, format:"TV", type:"TV", episodeCount:12, subCount:12, dubCount:8, hasSub:true, hasDub:true, sub:true, dub:true, genres:["Thriller","Action"], studios:["Northgate"], synopsis:"A rescue team races through an automated polar city after its safety system turns hostile." }
];

SPOTLIGHT_ITEMS.splice(0, SPOTLIGHT_ITEMS.length, ...AML_ITEMS.slice(0,6));
ALL_CATALOG_ITEMS.splice(0, ALL_CATALOG_ITEMS.length, ...AML_ITEMS);
CATALOG_MAP.clear();
SEEN_IDS.clear();
ROUTE_TO_ID.clear();
for (const item of AML_ITEMS) {
  SEEN_IDS.add(item.id); SEEN_IDS.add(String(item.id));
  CATALOG_MAP.set(String(item.id), item);
  CATALOG_MAP.set(String(item.routeId), item);
  ROUTE_TO_ID.set(String(item.routeId), String(item.id));
  ROUTE_TO_ID.set(String(item.id), String(item.id));
}

SCHEDULE_ITEMS.splice(0, SCHEDULE_ITEMS.length, ...AML_ITEMS.slice(0,7).map((item,i)=>({
  id:item.id, routeId:item.routeId, anilistId:item.anilistId, title:item.title,
  poster:item.poster, banner:item.banner,
  airingAt:Math.floor(Date.now()/1000)+(i+1)*86400,
  season:'FALL', year:2026, startDate:{year:2026,month:9,day:23+i}
})));

Object.assign(USER_ADMIN,{id:910001,username:'aml_tester',name:'AML Tester',displayName:'AML Tester',avatarUrl:'/icon-192.png',avatarColor:'#ff3b5c',isAdmin:false,isVip:true,level:18});
Object.assign(USER_SUBARU,{id:910002,username:'mira',name:'Mira',displayName:'Mira',avatarUrl:'/icon-192.png',avatarColor:'#8b5cf6',isAdmin:false,isVip:false,level:22});
Object.assign(USER_REM,{id:910003,username:'kian',name:'Kian',displayName:'Kian',avatarUrl:'/icon-192.png',avatarColor:'#3b82f6',isAdmin:false,isVip:false,level:17});
Object.assign(USER_EMILIA,{id:910004,username:'nova',name:'Nova',displayName:'Nova',avatarUrl:'/icon-192.png',avatarColor:'#ec4899',isAdmin:false,isVip:false,level:15});
Object.assign(USER_JINWOO,{id:910005,username:'sora',name:'Sora',displayName:'Sora',avatarUrl:'/icon-192.png',avatarColor:'#10b981',isAdmin:false,isVip:false,level:14});
Object.assign(USER_CHA,{id:910006,username:'rin',name:'Rin',displayName:'Rin',avatarUrl:'/icon-192.png',avatarColor:'#eab308',isAdmin:false,isVip:false,level:13});

COMMUNITY_COMMENTS.splice(0, COMMUNITY_COMMENTS.length,
  {id:'aml-c1',titleId:'91001',title:'Neon Archive',body:'Testing the discussion layout on the extracted frontend.',createdAt:Date.now()-3600000,likes:12,likedByMe:false,dislikes:0,dislikedByMe:false,mine:false,spoiler:false,reactions:[],parentId:null,user:USER_SUBARU},
  {id:'aml-c2',titleId:'91002',title:'Glass Horizon',body:'The mock profile and search states are working here.',createdAt:Date.now()-7200000,likes:8,likedByMe:false,dislikes:0,dislikedByMe:false,mine:false,spoiler:false,reactions:[],parentId:null,user:USER_REM}
);
FORUM_CATEGORIES.splice(0,FORUM_CATEGORIES.length,
  {id:'general',name:'General',description:'AML mock community discussion',threads:2,posts:6},
  {id:'anime',name:'Anime',description:'Synthetic title and episode discussion',threads:2,posts:8},
  {id:'bugs',name:'Testing',description:'UI and state testing notes',threads:1,posts:2},
  {id:'suggestions',name:'Ideas',description:'Mock product feedback',threads:1,posts:3}
);
FORUM_THREADS.splice(0,FORUM_THREADS.length,
  {id:1,title:'Welcome to the AML mock community',category:'general',excerpt:'This thread is synthetic and exists to test the extracted forum UI.',pinned:true,locked:false,replies:4,author:USER_ADMIN,createdAt:new Date(Date.now()-86400000*3).toISOString(),lastPostAt:new Date(Date.now()-3600000).toISOString(),lastPoster:USER_SUBARU},
  {id:2,title:'Neon Archive — episode discussion',category:'anime',excerpt:'Mock episode discussion content.',pinned:true,locked:false,replies:8,author:USER_SUBARU,createdAt:new Date(Date.now()-86400000*2).toISOString(),lastPostAt:new Date(Date.now()-1800000).toISOString(),lastPoster:USER_REM},
  {id:3,title:'Search and profile test cases',category:'bugs',excerpt:'Use this thread to exercise search/profile/community states.',pinned:false,locked:false,replies:3,author:USER_EMILIA,createdAt:new Date(Date.now()-86400000).toISOString(),lastPostAt:new Date().toISOString(),lastPoster:USER_ADMIN}
);
FORUM_POSTS.clear();
FORUM_POSTS.set(1,[{id:1,body:'Welcome to AML. This is local mock data rendered by the original extracted frontend.',author:USER_ADMIN,createdAt:new Date(Date.now()-86400000*3).toISOString(),canDelete:false},{id:2,body:'Testing replies and profile navigation.',author:USER_SUBARU,createdAt:new Date(Date.now()-7200000).toISOString(),canDelete:false}]);
FORUM_POSTS.set(2,[{id:1,body:'Episode one fixture discussion.',author:USER_SUBARU,createdAt:new Date(Date.now()-3600000).toISOString(),canDelete:false}]);
CHAT_MESSAGES.splice(0,CHAT_MESSAGES.length,
  {id:1,body:'Welcome to AML mock chat.',user:USER_ADMIN,createdAt:new Date(Date.now()-3600000*3).toISOString()},
  {id:2,body:'Testing the original community component with fake users.',user:USER_SUBARU,createdAt:new Date(Date.now()-3600000).toISOString()},
  {id:3,body:'Search, library and profiles are all local fixtures.',user:USER_REM,createdAt:new Date(Date.now()-1200000).toISOString()}
);
console.log('[AML] mock-only fixture mode enabled:',ALL_CATALOG_ITEMS.length,'titles');

// AML local mock player resolver
async function resolveStream(anilistId, ep = '1', channel = 'sub') {
  const safeEp = encodeURIComponent(String(ep || '1'));
  const safeChannel = encodeURIComponent(channel === 'dub' ? 'dub' : 'sub');
  const safeTitle = encodeURIComponent(String(anilistId || 'mock'));
  return `/mock-player.html?title=${safeTitle}&ep=${safeEp}&channel=${safeChannel}`;
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:8080'}`);
  const cleanPath = parsedUrl.pathname;

  if (!cleanPath.startsWith('/banners/') && !cleanPath.startsWith('/logos/') && !cleanPath.endsWith('.js') && !cleanPath.endsWith('.css') && !cleanPath.endsWith('.png') && !cleanPath.endsWith('.jpg') && !cleanPath.endsWith('.webp')) {
    console.log(`[HTTP ${req.method}] ${cleanPath}${parsedUrl.search}`);
  }

  // Global CORS & standard headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }



  if (req.method === 'DELETE') {
    if (cleanPath.startsWith('/api/chat/') || cleanPath.startsWith('/chat/')) {
      const parts = cleanPath.split('/').filter(Boolean);
      const msgId = parseInt(parts[parts.length - 1], 10);
      const idx = CHAT_MESSAGES.findIndex(m => m.id === msgId);
      if (idx !== -1) CHAT_MESSAGES.splice(idx, 1);
    }
    if (cleanPath.startsWith('/api/comments/') || cleanPath.startsWith('/comments/')) {
      const parts = cleanPath.split('/').filter(Boolean);
      const cId = parts[parts.length - 1];
      const idx = COMMUNITY_COMMENTS.findIndex(c => c.id === cId);
      if (idx !== -1) COMMUNITY_COMMENTS.splice(idx, 1);
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    let bodyText = '';
    req.on('data', chunk => { bodyText += chunk; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, likes: 1, mine: true }));
    });
    return;
  }

  const sendJson = (data, status = 200) => {
    const payload = Buffer.from(JSON.stringify(data), 'utf8');
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': payload.length,
      'Cache-Control': 'no-cache'
    });
    res.end(payload);
  };

  const sendRedirect = (location) => {
    res.writeHead(302, {
      'Location': location,
      'Cache-Control': 'public, max-age=86400'
    });
    res.end();
  };

  const sendFile = (filePath) => {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      const data = fs.readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': data.length,
        'Cache-Control': 'public, max-age=86400'
      });
      res.end(data);
    } catch (e) {
      res.writeHead(404);
      res.end('Not Found');
    }
  };

  // AML high-priority mock state. These routes intentionally shadow the old gateway fallbacks.
  if (MOCK_ONLY && cleanPath === '/api/auth/me') {
    sendJson({ ok:true, authenticated:true, user:USER_ADMIN });
    return;
  }
  if (MOCK_ONLY && cleanPath === '/api/watchlist') {
    const states = ['watching','watching','completed','plan','on_hold','dropped','completed','plan'];
    sendJson({ items: AML_ITEMS.slice(0, 8).map((item, i) => {
      const titleId = `anime:${item.id}`;
      return {
        ...item,
        id: titleId,
        titleId,
        recordId: item.id,
        anilistId: item.anilistId,
        cover: item.poster,
        status: states[i],
        progress: [4,2,item.episodeCount,0,5,2,item.episodeCount,0][i] ?? 0,
        favorite: i === 0 || i === 2 || i === 6,
        addedAt: Date.now() - i * 86400000,
        collectionIds: i < 4 ? ['late-night'] : i < 7 ? ['weekend'] : ['rewatch']
      };
    }) });
    return;
  }
  if (MOCK_ONLY && cleanPath === '/api/progress') {
    sendJson({ items: AML_ITEMS.slice(0, 4).map((item, i) => ({ titleId:`anime:${item.id}`, anilistId:item.anilistId, episode:i+1, progressSeconds:420+(i*180), durationSeconds:1440, updatedAt:new Date(Date.now()-i*3600000).toISOString(), title:{...item,id:`anime:${item.id}`,cover:item.poster} })) });
    return;
  }
  if (MOCK_ONLY && cleanPath === '/api/progress/snapshot') {
    sendJson({ snapshot: AML_ITEMS.slice(0, 4).map((item, i) => ({ titleId:`anime:${item.id}`, episode:i+1, progress:0.25+(i*0.12) })) });
    return;
  }
  if (MOCK_ONLY && cleanPath === '/api/settings') {
    sendJson({ settings:{ theme:'dark', glass:true, autoplayNext:true, autoSkipIntro:false, preferredAudio:'sub', captions:{ size:100, background:65 }, notifications:{ episodes:true, replies:true, product:false } } });
    return;
  }
  if (MOCK_ONLY && cleanPath === '/api/collections') {
    const collection = (id,name,indexes) => ({ id,name,count:indexes.length,items:indexes.map(i=>{ const item=AML_ITEMS[i]; return { id:`anime:${item.id}`,title:item.title,cover:item.poster,anilistId:item.anilistId,addedAt:Date.now()-i*86400000 }; }) });
    sendJson({ collections:[
      collection('late-night','Late Night',[0,1,2,3]),
      collection('weekend','Weekend',[4,5,6]),
      collection('rewatch','Rewatch',[2]),
      collection('comfort','Comfort Queue',[1,4,7,9])
    ] });
    return;
  }
  if (MOCK_ONLY && cleanPath === '/api/recent') {
    sendJson({ recent: AML_ITEMS.slice(0, 7).map((item,i)=>({ ...item, id:`anime:${item.id}`, titleId:`anime:${item.id}`, cover:item.poster, anilistId:item.anilistId, episode:Math.min(item.episodeCount,i+1), progress:0.18+(i*0.09), watchedAt:new Date(Date.now()-i*5400000).toISOString() })) });
    return;
  }
  if (MOCK_ONLY && cleanPath === '/api/title-likes/mine') {
    sendJson({ items: AML_ITEMS.slice(1,4).map((item,i)=>({ titleId:`anime:${item.id}`, title:item.title, native:item.native, cover:item.poster, anilistId:item.anilistId, createdAt:Date.now()-(i+1)*7200000 })), total:3 });
    return;
  }
  if (MOCK_ONLY && cleanPath === '/embed/preview') {
    sendFile(path.join(DIRECTORY, 'mock-player.html'));
    return;
  }

  const handleSettlarSession = async (bodyJson = {}) => {
    let ep = parsedUrl.searchParams.get('ep') || bodyJson.ep || '1';
    let sel = parsedUrl.searchParams.get('selection') || bodyJson.selection || '';
    let channel = (parsedUrl.searchParams.get('channel') || bodyJson.channel || 'sub').toLowerCase();
    if (channel !== 'dub') channel = 'sub';

    const isPreview = sel.includes('preview') || cleanPath.includes('preview-session');

    // Resolve AniList ID
    let anilistId = SELECTION_MAP.get(sel);
    if (!anilistId && sel.includes(':')) {
      const parts = sel.split(':');
      if (parts.length >= 2) {
        const cand = parts[1];
        anilistId = resolveAniListId(cand) || cand;
      }
    }
    if (!anilistId) {
      const ref = req.headers.referer || '';
      if (ref) {
        try {
          const refPath = new URL(ref).pathname;
          const segs = refPath.split('/').filter(Boolean);
          if (segs.length >= 2 && (segs[0] === 'watch' || segs[0] === 'anime' || segs[0] === 'ani')) {
            const cand = segs[1] === 'ani' && segs[2] ? segs[2] : segs[1];
            anilistId = resolveAniListId(cand) || cand;
          }
        } catch (e) {}
      }
    }
    anilistId = resolveAniListId(anilistId) || LAST_ANILIST_ID || '189046';

    LAST_ANILIST_ID = String(anilistId);
    console.log(`[Stream Resolver] AniList ID: ${anilistId}, Ep: ${ep}, Lang: ${channel}, Preview: ${isPreview}`);

    const chosenStream = await resolveStream(anilistId, ep, channel);
    const host = req.headers.host || `localhost:${PORT}`;

    if (isPreview) {
      const embedUrl = `http://${host}/embed/preview?target=${encodeURIComponent(chosenStream)}&ep=${ep}&channel=${channel}`;
      sendJson({
        embedUrl,
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
        provider: 'anipm'
      });
    } else {
      sendJson({
        embedUrl: chosenStream,
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
        provider: 'anipm'
      });
    }
  };

  // =========================================================================
  // POST ENDPOINTS
  // =========================================================================
  if (req.method === 'POST') {
    let bodyText = '';
    req.on('data', chunk => { bodyText += chunk; });
    req.on('end', async () => {
      let bodyJson = {};
      try { if (bodyText) bodyJson = JSON.parse(bodyText); } catch (e) {}

      // Settlar streaming session (POST)
      if (cleanPath.startsWith('/api/anime/settlar/session') || cleanPath.startsWith('/api/anime/settlar/preview-session')) {
        await handleSettlarSession(bodyJson);
        return;
      }

      // Client Error Telemetry from React ErrorBoundary
      if (cleanPath === '/api/client-error' || cleanPath === '/client-error') {
        console.error(`🚨 [Client Error on ${bodyJson.url || '/'}] ${bodyJson.message || ''}`);
        if (bodyJson.stack) console.error(bodyJson.stack);
        sendJson({ ok: true });
        return;
      }

      if (cleanPath.startsWith('/api/local/')) {
        sendJson({ ok: true, backup: false });
        return;
      }

      // Add comment to anime or global feed
      if (cleanPath === '/api/comments' || cleanPath === '/comments') {
        const titleId = String(bodyJson.titleId || '');
        const newComment = {
          id: 'c_' + Date.now(),
          titleId: titleId,
          title: bodyJson.title || '',
          body: (bodyJson.body || '').trim(),
          createdAt: Date.now(),
          likes: 0,
          likedByMe: false,
          dislikes: 0,
          dislikedByMe: false,
          mine: true,
          spoiler: !!bodyJson.spoiler,
          imageUrl: bodyJson.imageUrl || null,
          reactions: [],
          parentId: bodyJson.parentId || null,
          user: makeUser('current-user', 'you', 'You', '/icon-192.png', '#3b82f6', false, false)
        };
        COMMUNITY_COMMENTS.unshift(newComment);
        sendJson(newComment, 201);
        return;
      }

      // Comment reactions / likes / pins
      if (cleanPath.startsWith('/api/comments/') || cleanPath.startsWith('/comments/')) {
        if (cleanPath.endsWith('/like') || cleanPath.endsWith('/dislike')) {
          sendJson({ ok: true, likes: 1 });
          return;
        }
        if (cleanPath.endsWith('/react')) {
          const emoji = bodyJson.emoji || 'std:138370-xd';
          sendJson({ reactions: [{ emoji, count: 1, mine: true }] });
          return;
        }
        if (cleanPath.endsWith('/pin')) {
          sendJson({ ok: true });
          return;
        }
      }

      // Episode votes & likes
      if (cleanPath.startsWith('/api/episode-likes') || cleanPath.startsWith('/episode-likes') ||
          cleanPath.startsWith('/api/title-likes') || cleanPath.startsWith('/title-likes') ||
          cleanPath.startsWith('/api/episode-votes') || cleanPath.startsWith('/episode-votes')) {
        sendJson({ ok: true, likes: 1, mine: true });
        return;
      }

      // Forum new thread
      if (cleanPath === '/api/forum/threads' || cleanPath === '/forum/threads') {
        const title = (bodyJson.title || '').trim();
        const category = bodyJson.category || 'general';
        const body = (bodyJson.body || '').trim();
        const newId = FORUM_THREADS.length + 1;
        const newThread = {
          id: newId,
          title: title || 'New Discussion',
          category: category,
          excerpt: body.slice(0, 140),
          pinned: false,
          locked: false,
          replies: 0,
          author: makeUser('guest', 'guest', 'Anonymous', '/icon-192.png', '#6366f1', false, false),
          createdAt: new Date().toISOString(),
          lastPostAt: new Date().toISOString(),
          lastPoster: null
        };
        FORUM_THREADS.unshift(newThread);
        FORUM_POSTS.set(newId, [
          { id: 1, body: body || title, author: newThread.author, createdAt: newThread.createdAt, canDelete: true }
        ]);
        sendJson({ thread: newThread }, 201);
        return;
      }

      // Forum thread reply, pin, lock
      if (cleanPath.startsWith('/api/forum/threads/') || cleanPath.startsWith('/forum/threads/')) {
        const parts = cleanPath.split('/').filter(Boolean);
        const thrIdIdx = parts.indexOf('threads') + 1;
        const threadId = parseInt(parts[thrIdIdx], 10);
        if (cleanPath.endsWith('/posts')) {
          const body = (bodyJson.body || '').trim();
          const posts = FORUM_POSTS.get(threadId) || [];
          const newPost = {
            id: posts.length + 1,
            body: body || 'Reply',
            author: makeUser('guest', 'guest', 'Anonymous', '/icon-192.png', '#6366f1', false, false),
            createdAt: new Date().toISOString(),
            canDelete: true
          };
          posts.push(newPost);
          FORUM_POSTS.set(threadId, posts);
          const thr = FORUM_THREADS.find(t => t.id === threadId);
          if (thr) {
            thr.replies = posts.length;
            thr.lastPostAt = newPost.createdAt;
            thr.lastPoster = newPost.author;
          }
          sendJson(newPost, 201);
          return;
        }
        if (cleanPath.endsWith('/pin')) {
          const thr = FORUM_THREADS.find(t => t.id === threadId);
          if (thr) thr.pinned = !!bodyJson.pinned;
          sendJson({ ok: true });
          return;
        }
        if (cleanPath.endsWith('/lock')) {
          const thr = FORUM_THREADS.find(t => t.id === threadId);
          if (thr) thr.locked = !!bodyJson.locked;
          sendJson({ ok: true });
          return;
        }
      }

      // Live chat new message
      if (cleanPath === '/api/chat' || cleanPath === '/chat') {
        const body = (bodyJson.body || '').trim();
        const newMsg = {
          id: CHAT_MESSAGES.length + 1,
          body: body || 'Hello!',
          user: makeUser('you', 'you', 'You', '/icon-192.png', '#3b82f6', false, false),
          createdAt: new Date().toISOString()
        };
        CHAT_MESSAGES.push(newMsg);
        sendJson({ message: newMsg });
        return;
      }

      sendJson({ ok: true });
    });
    return;
  }


  // =========================================================================
  // GET ENDPOINTS
  // =========================================================================

  // 1. Playback bootstrap for hero video preview
  if (cleanPath.startsWith('/api/anime/playback-bootstrap/')) {
    const ep = parsedUrl.searchParams.get('ep') || '1';
    const lang = (parsedUrl.searchParams.get('lang') || 'sub').toLowerCase();
    const parts = cleanPath.split('/').filter(Boolean);
    const identifier = parts[parts.length - 1] || '';

    const aid = resolveAniListId(identifier) || identifier;
    const selKey = `preview:${identifier}:${ep}:${lang}`;
    if (aid && /^[0-9]+$/.test(String(aid))) {
      SELECTION_MAP.set(selKey, String(aid));
      SELECTION_MAP.set(`preview:${aid}:${ep}:${lang}`, String(aid));
      LAST_ANILIST_ID = String(aid);
    }
    console.log(`[Playback Bootstrap] id=${identifier} -> aniId=${aid}, ep=${ep}, lang=${lang}`);

    sendJson({
      settlarSelection: selKey,
      effectiveLanguage: lang,
      skip: null,
      core: null
    });
    return;
  }

  // 2. Embedded preview video proxy with postMessage bridge & scroll-pause
  if (!MOCK_ONLY && cleanPath === '/embed/preview') {
    const target = parsedUrl.searchParams.get('target');
    if (!target || !target.startsWith('http')) {
      res.writeHead(400);
      res.end('Missing target URL');
      return;
    }

    try {
      const response = await fetch(target, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://disabled.invalid/'
        },
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        res.writeHead(response.status);
        res.end('Target Stream Unavailable');
        return;
      }

      let html = await response.text();

      // Inject base tag
      const baseTag = '<base href="https://disabled.invalid/videojs/">';
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>\n${baseTag}`);
      }

      // Clean styles
      const cleanCss = `
        <style>
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
          background: transparent !important;
        }
        video, #megaplay-player video, .mg-video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          pointer-events: none !important;
        }
        .vjs-control-bar, .vjs-big-play-button, .vjs-loading-spinner,
        .mg-controls, .controls-overlay, .error-content, .mg-title-bar,
        .vjs-modal-dialog, [data-vjs-player] .vjs-poster {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        </style>
      `;
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${cleanCss}\n</head>`);
      }

      // Inject bridge script
      const bridgeScript = `
        <script>
        (function() {
          let videoEl = null;
          let mountedSent = false;
          let userUnmuted = false;

          function sendParent(msg) {
            try {
              if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                  source: "settlar-embed",
                  version: 1,
                  ...msg
                }, "*");
              }
            } catch(e) {}
          }

          function notifyState() {
            if (!videoEl) return;
            sendParent({
              type: "state",
              currentTime: videoEl.currentTime || 0,
              paused: !!videoEl.paused,
              duration: videoEl.duration || 0
            });
          }

          function bindVideo(v) {
            if (!v || videoEl === v) return;
            videoEl = v;
            videoEl.muted = !userUnmuted;
            videoEl.playsInline = true;
            videoEl.setAttribute("playsinline", "");

            const playPromise = videoEl.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {
                videoEl.muted = true;
                videoEl.play().catch(() => {});
              });
            }

            if (!mountedSent) {
              mountedSent = true;
              sendParent({ type: "mounted" });
            }

            videoEl.addEventListener("timeupdate", notifyState);
            videoEl.addEventListener("play", notifyState);
            videoEl.addEventListener("pause", notifyState);
            videoEl.addEventListener("ended", () => sendParent({ type: "ended" }));
            setInterval(notifyState, 800);
          }

          function scanVideo() {
            const v = document.querySelector("video");
            if (v) bindVideo(v);
          }

          const obs = new MutationObserver(scanVideo);
          obs.observe(document.documentElement, { childList: true, subtree: true });
          scanVideo();
          setInterval(scanVideo, 400);

          window.addEventListener("message", function(e) {
            let data = e.data;
            if (typeof data === "string") {
              try { data = JSON.parse(data); } catch(err) { return; }
            }
            if (!data || typeof data !== "object") return;

            if (data.type === "play") {
              if (videoEl && videoEl.paused) videoEl.play().catch(() => {});
            } else if (data.type === "pause") {
              if (videoEl && !videoEl.paused) videoEl.pause();
            } else if (data.type === "sound") {
              userUnmuted = !!data.on;
              if (videoEl) videoEl.muted = !userUnmuted;
            } else if (data.type === "seek" && typeof data.seconds === "number") {
              if (videoEl && Number.isFinite(data.seconds)) videoEl.currentTime = data.seconds;
            }
          });
        })();
        </script>
      `;
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${bridgeScript}\n</body>`);
      } else {
        html += bridgeScript;
      }

      const payload = Buffer.from(html, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': payload.length,
        'Cache-Control': 'no-cache'
      });
      res.end(payload);
    } catch (e) {
      res.writeHead(500);
      res.end('Embed Preview Error');
    }
    return;
  }

  // 3. Local bridge helper script
  if (cleanPath === '/local-bridge.js') {
    const bridgeFile = path.join(__dirname, 'local-bridge.js');
    if (fs.existsSync(bridgeFile)) {
      sendFile(bridgeFile);
      return;
    }
  }

  // 4. Local Health Check
  if (cleanPath === '/api/local/health') {
    sendJson({
      ok: true,
      runtime: 'Node.js v' + process.versions.node,
      catalogCount: ALL_CATALOG_ITEMS.length,
      spotlightCount: SPOTLIGHT_ITEMS.length,
      reanime: false,
      cachedStreams: STREAM_CACHE.size
    });
    return;
  }

  // Settlar streaming session (GET)
  if (cleanPath.startsWith('/api/anime/settlar/session') || cleanPath.startsWith('/api/anime/settlar/preview-session')) {
    await handleSettlarSession({});
    return;
  }

  // anipm server packages / inventory
  if (cleanPath.startsWith('/api/anime/anipm-server/_packages') || cleanPath.startsWith('/anime/anipm-server/_packages')) {
    const settled = {};
    for (let ep = 1; ep <= 36; ep++) {
      settled[ep] = { sub: true, dub: true };
    }
    sendJson({ packages: {}, settled });
    return;
  }

  // 5. Catalog APIs (Offline & Safe)
  if (cleanPath === '/api/anime/spotlight') {
    sendJson({ items: SPOTLIGHT_ITEMS });
    return;
  }

  // Browse, Catalog, Home Feed, and Recommendations
  if (
    cleanPath === '/api/anime/browse' ||
    cleanPath === '/api/anime/home-feed' ||
    cleanPath === '/api/anime/catalog' ||
    cleanPath === '/api/recommend/browse' ||
    cleanPath === '/recommend/browse' ||
    cleanPath === '/api/anime/recommend/browse' ||
    cleanPath === '/anime/browse' ||
    cleanPath === '/anime/catalog'
  ) {
    sendJson(filterCatalog(parsedUrl.searchParams));
    return;
  }

  if (cleanPath === '/api/recommend' || cleanPath === '/recommend') {
    const limit = parseInt(parsedUrl.searchParams.get('limit') || '30', 10);
    sendJson({ items: ALL_CATALOG_ITEMS.slice(0, limit) });
    return;
  }

  // Browse Facets (Tags, Studios, Genres)
  if (cleanPath === '/api/anime/facets') {
    sendJson(getFacets());
    return;
  }

  // Search Auto-complete & Query
  if (cleanPath === '/api/anime/search') {
    const q = (parsedUrl.searchParams.get('q') || '').trim().toLowerCase();
    let matches = [];
    if (q) {
      matches = ALL_CATALOG_ITEMS.filter(it => 
        it.title?.toLowerCase().includes(q) ||
        it.romaji?.toLowerCase().includes(q) ||
        it.native?.toLowerCase().includes(q) ||
        String(it.id) === q ||
        String(it.anilistId) === q
      ).slice(0, 30);
    }
    sendJson({ items: matches });
    return;
  }

  // Top Watched
  if (cleanPath === '/api/anime/top-watched') {
    const fmt = (parsedUrl.searchParams.get('format') || '').toUpperCase();
    let items = ALL_CATALOG_ITEMS;
    if (fmt === 'MOVIE') {
      items = ALL_CATALOG_ITEMS.filter(it => it.format === 'MOVIE' || it.type === 'MOVIE');
      if (items.length === 0) items = ALL_CATALOG_ITEMS.slice(0, 10);
    } else {
      items = ALL_CATALOG_ITEMS.slice(0, 20);
    }
    sendJson({ items });
    return;
  }

  // Latest Episodes Feed (Rich episode cards with stills and episode numbers)
  if (cleanPath === '/api/anime/latest-episodes') {
    const page = parseInt(parsedUrl.searchParams.get('page') || '1', 10);
    const limit = parseInt(parsedUrl.searchParams.get('limit') || '60', 10);
    sendJson(getLatestEpisodes(page, limit));
    return;
  }

  // Episode Stills fallback
  if (cleanPath === '/api/anime/episode-stills') {
    sendJson({ stills: {} });
    return;
  }

  // Descriptions map
  if (cleanPath === '/api/anime/descriptions') {
    const desc = {};
    for (const it of ALL_CATALOG_ITEMS.slice(0, 60)) {
      if (it.synopsis) desc[it.anilistId || it.id] = it.synopsis;
    }
    sendJson({ descriptions: desc });
    return;
  }

  // Community Forum: Categories
  if (cleanPath === '/api/forum/categories' || cleanPath === '/forum/categories') {
    sendJson({ categories: FORUM_CATEGORIES });
    return;
  }

  // Community Forum: Threads List
  if (cleanPath === '/api/forum/threads' || cleanPath === '/forum/threads') {
    const category = parsedUrl.searchParams.get('category') || '';
    const sort = parsedUrl.searchParams.get('sort') || 'active';
    const page = parseInt(parsedUrl.searchParams.get('page') || '1', 10);
    const limit = 20;

    let items = FORUM_THREADS.slice();
    if (category && category !== 'all') {
      items = items.filter(t => t.category === category);
    }
    if (sort === 'new') {
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      items.sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
        return new Date(b.lastPostAt || b.createdAt) - new Date(a.lastPostAt || a.createdAt);
      });
    }

    const start = (page - 1) * limit;
    const paginated = items.slice(start, start + limit);
    sendJson({
      items: paginated,
      page,
      total: items.length,
      hasNextPage: start + limit < items.length
    });
    return;
  }

  // Community Forum: Single Thread View
  if ((cleanPath.startsWith('/api/forum/threads/') || cleanPath.startsWith('/forum/threads/')) && !cleanPath.endsWith('/posts')) {
    const parts = cleanPath.split('/').filter(Boolean);
    const id = parseInt(parts[parts.length - 1], 10);
    const thr = FORUM_THREADS.find(t => t.id === id);
    if (!thr) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Thread not found' }));
      return;
    }
    const posts = FORUM_POSTS.get(id) || [
      { id: 1, body: thr.excerpt || thr.title, author: thr.author, createdAt: thr.createdAt, canDelete: false }
    ];
    sendJson({
      thread: thr,
      posts,
      page: 1,
      hasNextPage: false
    });
    return;
  }

  // Live Chat Messages
  if (cleanPath === '/api/chat' || cleanPath === '/chat') {
    sendJson({ messages: CHAT_MESSAGES, hasMore: false });
    return;
  }

  if (cleanPath === '/api/anime/upcoming' || cleanPath === '/api/anime/schedule') {
    sendJson({ items: SCHEDULE_ITEMS });
    return;
  }

  if (cleanPath === '/comments/recent' || cleanPath === '/api/comments/recent') {
    sendJson({ comments: COMMUNITY_COMMENTS });
    return;
  }

  // Anime / Title Comments with rich discussion
  if (cleanPath === '/comments' || cleanPath === '/api/comments') {
    const tid = parsedUrl.searchParams.get('titleId');
    let comments = COMMUNITY_COMMENTS;
    if (tid) {
      comments = COMMUNITY_COMMENTS.filter(c => String(c.titleId) === String(tid) || String(c.titleId) === String(resolveAniListId(tid)));
      if (comments.length === 0) {
        const anime = await findCatalogItem(tid);
        const titleName = anime?.title || 'this anime';
        comments = [
          {
            id: `c_${tid}_1`,
            titleId: String(tid),
            title: titleName,
            body: `Really enjoying ${titleName}! The animation and music are top tier.`,
            createdAt: Date.now() - 3600000 * 3,
            likes: 14,
            likedByMe: false,
            dislikes: 0,
            dislikedByMe: false,
            mine: false,
            spoiler: false,
            reactions: [{ emoji: 'std:3257-zorolike', count: 6, mine: false }],
            parentId: null,
            pinned: false,
            user: USER_SUBARU
          },
          {
            id: `c_${tid}_2`,
            titleId: String(tid),
            title: titleName,
            body: `The production quality in this series is outstanding. Definitely a favorite!`,
            createdAt: Date.now() - 3600000 * 8,
            likes: 9,
            likedByMe: false,
            dislikes: 0,
            dislikedByMe: false,
            mine: false,
            spoiler: false,
            reactions: [{ emoji: 'rz:629801-rem', count: 4, mine: false }],
            parentId: null,
            pinned: false,
            user: USER_REM
          }
        ];
      }
    }
    sendJson({ comments });
    return;
  }

  // User Profile & Profile Chat
  if (cleanPath.startsWith('/api/profile/') || cleanPath.startsWith('/profile/')) {
    const parts = cleanPath.split('/').filter(Boolean);
    const isChat = cleanPath.endsWith('/chat');
    const uName = isChat ? parts[parts.length - 2] : parts[parts.length - 1];

    if (isChat) {
      sendJson({
        messages: CHAT_MESSAGES.filter(m => m.user?.username?.toLowerCase() === (uName || '').toLowerCase())
      });
      return;
    }

    const matchedUser = [
      USER_ADMIN, USER_SUBARU, USER_REM, USER_EMILIA, USER_JINWOO, USER_CHA, USER_MOMO, USER_OKARUN, USER_LUFFY, USER_ZORO
    ].find(u => u.username.toLowerCase() === (uName || '').toLowerCase()) || makeUser(uName, uName, uName, '/icon-192.png', '#6366f1', false, false);

    sendJson({
      user: {
        ...matchedUser,
        bio: 'AML mock profile for interface testing.',
        createdAt: new Date(Date.now() - 86400000 * 90).toISOString()
      },
      stats: {
        episodesWatched: 142,
        daysWatched: 4.8,
        meanScore: 8.4,
        standardDeviation: 1.1,
        totalAnime: 28,
        completed: 18,
        watching: 6,
        planToWatch: 4
      },
      isPublic: true,
      isMe: false,
      isFollowing: false,
      canSeeComments: true,
      recentComments: COMMUNITY_COMMENTS.filter(c => c.user?.username?.toLowerCase() === (uName || '').toLowerCase())
    });
    return;
  }

  if (cleanPath === '/api/site/activity') {
    sendJson({
      visitsLast15Minutes: 248,
      visitsLast60Minutes: 1820,
      latestMessage: { name: 'Rem', body: 'Starting life in another world from zero!' }
    });
    return;
  }

  if (cleanPath === '/api/anime/episode-clip/status') {
    sendJson({ status: 'ready', ready: true });
    return;
  }

  if (cleanPath === '/api/anime/skip') {
    sendJson({ found: false, results: [] });
    return;
  }

  // Views counters
  if (cleanPath.startsWith('/api/anime/episode-views/') || cleanPath.startsWith('/anime/episode-views/')) {
    sendJson({ views: 2410 });
    return;
  }
  if (cleanPath.startsWith('/api/anime/title-views/') || cleanPath.startsWith('/anime/title-views/')) {
    sendJson({ views: 48900 });
    return;
  }

  // Episode Likes (Format required by AnimeCardMenu: { titleId, episodes: {} })
  if (cleanPath === '/api/episode-likes' || cleanPath === '/episode-likes') {
    const tid = parsedUrl.searchParams.get('titleId') || '';
    sendJson({ titleId: String(tid), episodes: {} });
    return;
  }

  // Title Likes
  if (cleanPath === '/api/title-likes' || cleanPath === '/title-likes') {
    const tid = parsedUrl.searchParams.get('titleId') || '';
    sendJson({ titleId: String(tid), likes: 24, mine: false, dislikes: 0, disliked: false });
    return;
  }
  if (cleanPath === '/api/title-likes/mine' || cleanPath === '/title-likes/mine') {
    sendJson({ items: [], total: 0 });
    return;
  }

  // Collections, Settings, Snapshot, Filler, Sizes
  if (cleanPath === '/api/collections' || cleanPath === '/collections') {
    sendJson({ collections: [] });
    return;
  }
  if (cleanPath === '/api/settings' || cleanPath === '/settings') {
    sendJson({ settings: {} });
    return;
  }
  if (cleanPath === '/api/progress/snapshot' || cleanPath === '/progress/snapshot') {
    sendJson({ snapshot: [] });
    return;
  }
  if (cleanPath === '/api/recent' || cleanPath === '/recent') {
    sendJson({ recent: [] });
    return;
  }
  if (cleanPath === '/api/ratings' || cleanPath === '/ratings') {
    sendJson({ ratings: {} });
    return;
  }
  if (cleanPath === '/api/anime/filler' || cleanPath === '/anime/filler') {
    sendJson({ filler: [] });
    return;
  }
  if (cleanPath === '/api/anime/src/download/sizes' || cleanPath === '/anime/src/download/sizes') {
    sendJson({ sizes: {} });
    return;
  }
  if (cleanPath.startsWith('/api/watchlist/') || cleanPath.startsWith('/watchlist/')) {
    sendJson({ inWatchlist: false });
    return;
  }

  // User Stats & Leaderboard
  if (cleanPath === '/api/user/stats' || cleanPath === '/user/stats') {
    sendJson({ minutesWatched: 0, episodesWatched: 0, animeCompleted: 0 });
    return;
  }
  if (cleanPath === '/api/leaderboard' || cleanPath === '/leaderboard') {
    const entries = [
      { rank: 1, user: USER_ADMIN, level: 99, xp: 99990 },
      { rank: 2, user: USER_SUBARU, level: 45, xp: 45200 },
      { rank: 3, user: USER_JINWOO, level: 42, xp: 42100 },
      { rank: 4, user: USER_REM, level: 38, xp: 38500 }
    ];
    sendJson({ entries, users: entries });
    return;
  }
  if (cleanPath === '/api/notifications' || cleanPath === '/notifications') {
    sendJson({ notifications: [] });
    return;
  }
  if (cleanPath === '/api/notifications/count' || cleanPath === '/notifications/count') {
    sendJson({ count: 0 });
    return;
  }
  if (cleanPath === '/api/bluray-votes/top' || cleanPath === '/api/bluray-votes/mine') {
    sendJson({ items: [], votes: [] });
    return;
  }
  if (cleanPath === '/api/watchlist' || cleanPath === '/watchlist') {
    sendJson({ items: [] });
    return;
  }
  if (cleanPath === '/api/progress' || cleanPath === '/progress') {
    sendJson({ items: [] });
    return;
  }

  if (cleanPath === '/api/auth/me' || cleanPath === '/api/site/visit' || cleanPath === '/api/local/preferences') {
    sendJson({ ok: true });
    return;
  }

  // 6. Deterministic Anime Meta Map (CRITICAL FIX FOR ALL ANIME ROUTES)
  if (cleanPath === '/api/anime/meta') {
    const rawIds = parsedUrl.searchParams.get('ids') || '';
    const ids = rawIds.split(',').map(s => s.trim()).filter(Boolean);
    const meta = {};
    for (const idStr of ids) {
      const match = idStr.match(/^(?:anime|ani):([0-9]+)$/);
      if (match) {
        const numId = match[1];
        const token = getRouteToken(numId);
        meta[idStr] = {
          routeId: token,
          routeNamespace: 'anime'
        };
        ROUTE_TO_ID.set(token, numId);
        ROUTE_TO_ID.set(numId, token);
      }
    }
    sendJson({ meta });
    return;
  }

  // 7. Title Series Details (/api/anime/series/:id or /api/anime/ani/:id)
  if (cleanPath.startsWith('/api/anime/series/') || cleanPath.startsWith('/api/anime/ani/')) {
    const parts = cleanPath.split('/').filter(Boolean);
    const ident = parts[parts.length - 1];
    const matched = await findCatalogItem(ident);
    const details = buildSeriesDetails(matched);
    sendJson(details);
    return;
  }

  // 8. Anime Art (Backdrop and Logo)
  if (cleanPath === '/api/anime/art') {
    const title = (parsedUrl.searchParams.get('title') || '').trim().toLowerCase();
    let matched = null;
    if (title) {
      matched = ALL_CATALOG_ITEMS.find(it => it.title?.toLowerCase() === title || it.romaji?.toLowerCase() === title);
    }
    if (!matched) matched = SPOTLIGHT_ITEMS[0];

    const backdrop = matched.banner || matched.poster;
    sendJson({ backdrop, logo:null });
    return;
  }

  // 9. Poster & Cover Images (ZERO BROKEN IMAGES)
  if (cleanPath === '/api/anime/poster') {
    const aid = parsedUrl.searchParams.get('anilistId') || '';
    const mid = parsedUrl.searchParams.get('malId') || '';

    // Solo Leveling local cover
    if (String(aid) === '135865') {
      const slCover = path.join(DIRECTORY, 'img', 'covers', '135865.jpg');
      if (fs.existsSync(slCover)) {
        sendFile(slCover);
        return;
      }
    }

    const matched = await findCatalogItem(aid || mid);
    const posterUrl = matched?.poster;
    if (posterUrl) {
      if (posterUrl.startsWith('/')) {
        const localP = path.join(DIRECTORY, posterUrl);
        if (fs.existsSync(localP)) {
          sendFile(localP);
          return;
        }
      } else if (posterUrl.startsWith('http')) {
        sendRedirect(posterUrl);
        return;
      }
    }

    // Fallback to active AniList cover
    const fallback = COVERS_MAP[String(aid)] || '/icon-192.png';
    sendRedirect(fallback);
    return;
  }

  if (cleanPath === '/api/anime/cover') {
    const key = parsedUrl.searchParams.get('key') || '';
    if (key && COVER_KEYS.has(key)) {
      const mapped = COVER_KEYS.get(key);
      if (mapped.startsWith('/')) {
        const localP = path.join(DIRECTORY, mapped);
        if (fs.existsSync(localP)) {
          sendFile(localP);
          return;
        }
      } else if (mapped.startsWith('http')) {
        sendRedirect(mapped);
        return;
      }
    }

    let targetU = parsedUrl.searchParams.get('u') || '';
    const aid = parsedUrl.searchParams.get('anilistId') || '';

    if (targetU && targetU.startsWith('http')) {
      if (targetU.includes('bx151807-m1g5OpTaqRtl')) {
        targetU = '/icon-192.png';
      }
      sendRedirect(targetU);
      return;
    }

    if (aid) {
      if (String(aid) === '135865') {
        const slCover = path.join(DIRECTORY, 'img', 'covers', '135865.jpg');
        if (fs.existsSync(slCover)) {
          sendFile(slCover);
          return;
        }
      }
      const matched = await findCatalogItem(aid);
      if (matched?.poster) {
        if (matched.poster.startsWith('/')) {
          const localP = path.join(DIRECTORY, matched.poster);
          if (fs.existsSync(localP)) {
            sendFile(localP);
            return;
          }
        } else {
          sendRedirect(matched.poster);
          return;
        }
      }
    }

    sendRedirect('/icon-192.png');
    return;
  }

  // 10. Smart Asset Resolution (Banners, Logos, Covers)
  const resolvedAsset = resolveLocalAsset(cleanPath);
  if (resolvedAsset) {
    sendFile(resolvedAsset);
    return;
  }

  // 11. Static files in frontend directory
  const reqFilePath = path.join(DIRECTORY, cleanPath);
  if (fs.existsSync(reqFilePath) && fs.statSync(reqFilePath).isFile()) {
    sendFile(reqFilePath);
    return;
  }

  // Missing files with extension
  const ext = path.extname(cleanPath);
  if (ext) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  // 12. SPA Client-Side Routing Fallback (Inject local-bridge.js)
  const indexHtmlPath = path.join(DIRECTORY, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    indexHtml = indexHtml.replace(/<script\b[^>]*\bsrc=["'](?:https?:)?\/\/d318g7p3azvr44\.cloudfront\.net\/[^"']*["'][^>]*>\s*<\/script>/gi, '');
    if (!indexHtml.includes('/local-bridge.js')) {
      indexHtml = indexHtml.replace('</body>', '<script src="/local-bridge.js" defer></script></body>');
    }
    const payload = Buffer.from(indexHtml, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': payload.length,
      'Cache-Control': 'no-cache'
    });
    res.end(payload);
    return;
  }

  res.writeHead(404);
  res.end('index.html not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[🚀] Node.js ani.pm Gateway Server running at http://localhost:${PORT}`);
  console.log(`[*] Loaded Catalog: ${ALL_CATALOG_ITEMS.length} titles, ${SPOTLIGHT_ITEMS.length} spotlights`);
  console.log(`[*] Active AniList Covers: ${Object.keys(COVERS_MAP).length} mapped`);
  console.log(`[*] Pure Yoru Streaming Resolver: ${YORU_API}`);
});
