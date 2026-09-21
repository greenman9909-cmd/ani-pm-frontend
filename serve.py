"""
Local gateway server for ani.pm frontend powered directly by Yoru streaming.
Pure Python, zero external backend daemons (no ReAnime, no port 8000).
Includes built-in offline catalog engine for instant, bulletproof local browsing.
"""
import os
import sys
import re
import time
import json
import mimetypes
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
import requests

PORT = int(os.environ.get("PORT", 8080))
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ani.pm_frontend")
UPSTREAM = "https://ani.pm"
YORU_API = "https://anivexaapi-aniko2.hf.space"

SELECTION_MAP = {}
ROUTE_MAP = {}
ID_MAP = {}
STREAM_CACHE = {}  # key -> (timestamp, embed_url)
LAST_ANILIST_ID = "189046"

# Pre-populate known title mappings for immediate playback on hot spotlights
ROUTE_MAP["ee371b9c5c6fd8e65a51e6d8e324ad56~0fd02ff2a9699b3da984940365f67f8717e0de428bbcfdd5debba6cba336818f"] = "189046"
ID_MAP["8738"] = "189046"
ROUTE_MAP["927ca76fb45f200102b6a4c8b2cf9e48~6bc7957b99fe0bf455165dbc8a2566cdf81671c10590747ad1f39206a9b8d246"] = "116674"
ID_MAP["5799"] = "116674"
ROUTE_MAP["eecc0a0d4374add0a46ad496073b783a~4914097ec07815406c27da50c9df60da4480bc34b18686e90b2462a9242330a6"] = "16498"
ID_MAP["1631"] = "16498"


# =========================================================================
# LOCAL CATALOG & SPOTLIGHT DATA ENGINE
# =========================================================================

SPOTLIGHT_ITEMS = [
    {
        "id": 189046,
        "routeId": "ee371b9c5c6fd8e65a51e6d8e324ad56~0fd02ff2a9699b3da984940365f67f8717e0de428bbcfdd5debba6cba336818f",
        "anilistId": 189046,
        "malId": 54857,
        "title": "Re:ZERO -Starting Life in Another World- Season 3",
        "romaji": "Re:Zero kara Hajimeru Isekai Seikatsu 3rd Season",
        "native": "Re:ゼロから始める異世界生活 3rd season",
        "poster": "/banners/rezero-p.webp",
        "banner": "/banners/rezero.jpg",
        "year": 2024,
        "score": 85,
        "format": "TV",
        "type": "TV",
        "episodeCount": 16,
        "subCount": 16,
        "dubCount": 8,
        "hasSub": True,
        "hasDub": True,
        "sub": True,
        "dub": True,
        "genres": ["Action", "Adventure", "Drama", "Fantasy", "Psychological"],
        "studios": ["White Fox"],
        "synopsis": "A year has passed since Subaru's victory at the Sanctuary. He savors a life of fulfillment while Emilia's camp stands united for the royal selection—until a fateful letter arrives."
    },
    {
        "id": 135865,
        "routeId": "135865",
        "anilistId": 135865,
        "malId": 52299,
        "title": "Solo Leveling",
        "romaji": "Ore dake Level Up na Ken",
        "native": "俺だけレベルアップな件",
        "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-m1g5OpTaqRtl.png",
        "banner": "/banners/135865.jpg",
        "year": 2024,
        "score": 84,
        "format": "TV",
        "type": "TV",
        "episodeCount": 12,
        "subCount": 12,
        "dubCount": 12,
        "hasSub": True,
        "hasDub": True,
        "sub": True,
        "dub": True,
        "genres": ["Action", "Adventure", "Fantasy"],
        "studios": ["A-1 Pictures"],
        "synopsis": "They say whatever doesn't kill you makes you stronger, but that's not the case for Sung Jinwoo, the world's weakest hunter until a mysterious quest appears."
    },
    {
        "id": 178789,
        "routeId": "178789",
        "anilistId": 178789,
        "malId": 57334,
        "title": "DAN DA DAN",
        "romaji": "Dandadan",
        "native": "ダンダダン",
        "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-bT1fPqjGgqGg.jpg",
        "banner": "/banners/t/3AXLSxMuqyZt8HyrKKfrcJtkswD.webp",
        "year": 2024,
        "score": 86,
        "format": "TV",
        "type": "TV",
        "episodeCount": 12,
        "subCount": 12,
        "dubCount": 12,
        "hasSub": True,
        "hasDub": True,
        "sub": True,
        "dub": True,
        "genres": ["Action", "Comedy", "Supernatural", "Sci-Fi"],
        "studios": ["Science SARU"],
        "synopsis": "Momo, a high school girl from a family of spirit mediums, and Okarun, an occult fanatic classmate, wager a bet that leads to supernatural chaos."
    },
    {
        "id": 16498,
        "routeId": "eecc0a0d4374add0a46ad496073b783a~4914097ec07815406c27da50c9df60da4480bc34b18686e90b2462a9242330a6",
        "anilistId": 16498,
        "malId": 16498,
        "title": "Attack on Titan",
        "romaji": "Shingeki no Kyojin",
        "native": "進撃の巨人",
        "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-m5ZMNScKHuf1.png",
        "banner": "/banners/aot.jpg",
        "year": 2013,
        "score": 89,
        "format": "TV",
        "type": "TV",
        "episodeCount": 25,
        "subCount": 25,
        "dubCount": 25,
        "hasSub": True,
        "hasDub": True,
        "sub": True,
        "dub": True,
        "genres": ["Action", "Drama", "Fantasy", "Mystery"],
        "studios": ["WIT Studio"],
        "synopsis": "Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called Titans, forcing humans to hide behind enormous concentric walls."
    },
    {
        "id": 113415,
        "routeId": "113415",
        "anilistId": 113415,
        "malId": 51009,
        "title": "Jujutsu Kaisen Season 2",
        "romaji": "Jujutsu Kaisen 2nd Season",
        "native": "呪術廻戦 第2期",
        "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-aT0B8vP2U67T.jpg",
        "banner": "/banners/jjk.jpg",
        "year": 2023,
        "score": 88,
        "format": "TV",
        "type": "TV",
        "episodeCount": 23,
        "subCount": 23,
        "dubCount": 23,
        "hasSub": True,
        "hasDub": True,
        "sub": True,
        "dub": True,
        "genres": ["Action", "Fantasy", "Supernatural"],
        "studios": ["MAPPA"],
        "synopsis": "The past comes to light as Satoru Gojo and Suguru Geto's days as students at Tokyo Jujutsu High are revealed alongside the Shibuya Incident."
    },
    {
        "id": 187538,
        "routeId": "187538",
        "anilistId": 187538,
        "malId": 56784,
        "title": "Bleach: Thousand-Year Blood War - The Conflict",
        "romaji": "BLEACH: Sennen Kessen-hen - Soukoku-tan",
        "native": "BLEACH 千年血戦篇-相剋譚-",
        "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-bT1fPqjGgqGg.jpg",
        "banner": "/banners/187538.jpg",
        "year": 2024,
        "score": 87,
        "format": "TV",
        "type": "TV",
        "episodeCount": 13,
        "subCount": 13,
        "dubCount": 13,
        "hasSub": True,
        "hasDub": True,
        "sub": True,
        "dub": True,
        "genres": ["Action", "Adventure", "Supernatural"],
        "studios": ["Pierrot"],
        "synopsis": "The fierce battle between the Soul Reapers and the Quincies intensifies as Yhwach aims for the Soul King."
    },
    {
        "id": 196187,
        "routeId": "196187",
        "anilistId": 196187,
        "malId": 58852,
        "title": "Sakamoto Days",
        "romaji": "SAKAMOTO DAYS",
        "native": "サカモトデイズ",
        "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx177709-b7b51u21.jpg",
        "banner": "/banners/196187.jpg",
        "year": 2025,
        "score": 83,
        "format": "TV",
        "type": "TV",
        "episodeCount": 12,
        "subCount": 12,
        "dubCount": 12,
        "hasSub": True,
        "hasDub": True,
        "sub": True,
        "dub": True,
        "genres": ["Action", "Comedy"],
        "studios": ["TMS Entertainment"],
        "synopsis": "Taro Sakamoto was the ultimate assassin, feared by all villains and revered by all hitmen. But one day... he fell in love!"
    }
]

ALL_CATALOG_ITEMS = []
seen_catalog_ids = set()

for s in SPOTLIGHT_ITEMS:
    ALL_CATALOG_ITEMS.append(s)
    seen_catalog_ids.add(s["id"])
    seen_catalog_ids.add(str(s["id"]))
    if s.get("anilistId"):
        ROUTE_MAP[str(s["id"])] = str(s["anilistId"])
        ROUTE_MAP[s["routeId"]] = str(s["anilistId"])

# Try loading Yoru's local datasets
yoru_dist = r"C:\Users\green\yoru-anime-src\dist"
try:
    dump_path = os.path.join(yoru_dist, "anilist_dump.json")
    if os.path.exists(dump_path):
        with open(dump_path, "r", encoding="utf-8") as f:
            d_data = json.load(f)
            for it in d_data.get("trending", []) + d_data.get("newest", []):
                aid = it.get("id")
                if not aid or aid in seen_catalog_ids or str(aid) in seen_catalog_ids:
                    continue
                seen_catalog_ids.add(aid)
                seen_catalog_ids.add(str(aid))
                t_obj = it.get("title", {})
                t_str = (t_obj.get("english") if isinstance(t_obj, dict) else None) or (t_obj.get("romaji") if isinstance(t_obj, dict) else str(t_obj))
                r_str = (t_obj.get("romaji") if isinstance(t_obj, dict) else t_str)
                n_str = (t_obj.get("native") if isinstance(t_obj, dict) else None)
                cov = it.get("coverImage", {})
                pos = (cov.get("large") if isinstance(cov, dict) else None) or it.get("poster")
                ban = it.get("bannerImage") or it.get("banner") or pos
                score = it.get("averageScore") or int(float(it.get("score", 8)) * 10)
                eps = it.get("episodes") or 12
                fmt = (it.get("format") or it.get("type") or "TV").upper()
                obj = {
                    "id": aid,
                    "routeId": str(aid),
                    "anilistId": aid,
                    "malId": it.get("idMal"),
                    "title": t_str,
                    "romaji": r_str,
                    "native": n_str,
                    "poster": pos,
                    "banner": ban,
                    "year": it.get("seasonYear") or it.get("year") or 2024,
                    "score": score,
                    "format": fmt,
                    "type": fmt,
                    "episodeCount": eps,
                    "subCount": eps,
                    "dubCount": eps,
                    "hasSub": True,
                    "hasDub": True,
                    "sub": True,
                    "dub": True,
                    "genres": it.get("genres") or ["Action", "Fantasy"],
                    "studios": [s.get("name") for s in it.get("studios", {}).get("nodes", [])] if isinstance(it.get("studios"), dict) else [],
                    "synopsis": it.get("description") or ""
                }
                ALL_CATALOG_ITEMS.append(obj)
                ROUTE_MAP[str(aid)] = str(aid)
except Exception as e:
    sys.stderr.write(f"[Catalog Loader] Error loading dump: {e}\n")

try:
    exp_path = os.path.join(yoru_dist, "catalog-expanded.json")
    if os.path.exists(exp_path):
        with open(exp_path, "r", encoding="utf-8") as f:
            e_data = json.load(f)
            for idx, it in enumerate(e_data):
                cid = it.get("id")
                if not cid or cid in seen_catalog_ids:
                    continue
                seen_catalog_ids.add(cid)
                fmt = (it.get("type") or "TV").upper()
                eps = it.get("episodes") or 12
                sim_id = idx + 50000
                obj = {
                    "id": sim_id,
                    "routeId": str(cid),
                    "anilistId": None,
                    "title": it.get("title"),
                    "romaji": it.get("jp"),
                    "native": it.get("jp"),
                    "poster": it.get("poster"),
                    "banner": it.get("poster"),
                    "year": it.get("year") or 2024,
                    "score": int(float(it.get("score", 8)) * 10),
                    "format": fmt,
                    "type": fmt,
                    "episodeCount": eps,
                    "subCount": eps,
                    "dubCount": eps,
                    "hasSub": True,
                    "hasDub": True,
                    "sub": True,
                    "dub": True,
                    "genres": it.get("genres") or ["Action"],
                    "studios": [it.get("studio")] if it.get("studio") else [],
                    "synopsis": it.get("description") or ""
                }
                ALL_CATALOG_ITEMS.append(obj)
                ROUTE_MAP[str(cid)] = str(sim_id)
except Exception as e:
    sys.stderr.write(f"[Catalog Loader] Error loading expanded: {e}\n")

# Upcoming anime for the Schedule section
now_ts = int(time.time())
SCHEDULE_ITEMS = [
    {
        "id": 196187,
        "routeId": "196187",
        "anilistId": 196187,
        "title": "Sakamoto Days",
        "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx177709-b7b51u21.jpg",
        "banner": "/banners/196187.jpg",
        "airingAt": now_ts + 86400 * 2,
        "season": "WINTER",
        "year": 2025,
        "startDate": {"year": 2025, "month": 1, "day": 11}
    },
    {
        "id": 176496,
        "routeId": "176496",
        "anilistId": 176496,
        "title": "Solo Leveling Season 2 -Arise from the Shadow-",
        "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-m1g5OpTaqRtl.png",
        "banner": "/banners/135865.jpg",
        "airingAt": now_ts + 86400 * 4,
        "season": "WINTER",
        "year": 2025,
        "startDate": {"year": 2025, "month": 1, "day": 5}
    },
    {
        "id": 185660,
        "routeId": "185660",
        "anilistId": 185660,
        "title": "DAN DA DAN Season 2",
        "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-bT1fPqjGgqGg.jpg",
        "banner": "/banners/t/3AXLSxMuqyZt8HyrKKfrcJtkswD.webp",
        "airingAt": now_ts + 86400 * 12,
        "season": "SPRING",
        "year": 2025,
        "startDate": {"year": 2025, "month": 4, "day": 3}
    },
    {
        "id": 178025,
        "routeId": "178025",
        "anilistId": 178025,
        "title": "Gachiakuta",
        "poster": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx178025-cover.jpg",
        "banner": "/banners/t/aXO5vBpGEl2xUfhJtZyLWeLY5ZJ.webp",
        "airingAt": now_ts + 86400 * 20,
        "season": "SUMMER",
        "year": 2025,
        "startDate": {"year": 2025, "month": 7, "day": 1}
    }
]

COMMUNITY_COMMENTS = [
    {
        "id": "c1",
        "name": "Subaru Natsuki",
        "avatar": "/img/reactions/rezero/104924-thoughtfulrem.png",
        "body": "No matter how many times it takes, I will save everyone!",
        "createdAt": now_ts - 300,
        "likes": 42
    },
    {
        "id": "c2",
        "name": "Sung Jinwoo",
        "avatar": "/banners/135865.jpg",
        "body": "Arise.",
        "createdAt": now_ts - 1200,
        "likes": 156
    },
    {
        "id": "c3",
        "name": "Okarun",
        "avatar": "/logos/178789.png",
        "body": "Aliens and turbo grannies are real! Believe me!",
        "createdAt": now_ts - 2400,
        "likes": 89
    }
]


def find_catalog_item(ident):
    """Find anime item by id, routeId, or anilistId."""
    ident_str = str(ident).strip()
    # Check spotlight first
    for s in SPOTLIGHT_ITEMS:
        if str(s["id"]) == ident_str or str(s["routeId"]) == ident_str or str(s.get("anilistId")) == ident_str:
            return s
    for it in ALL_CATALOG_ITEMS:
        if str(it["id"]) == ident_str or str(it["routeId"]) == ident_str or str(it.get("anilistId")) == ident_str:
            return it
    # Fallback to first spotlight
    return SPOTLIGHT_ITEMS[0]


def build_series_details(item):
    """Generate complete series object with episodes for /api/anime/series/{id} or /api/anime/ani/{id}."""
    ep_count = item.get("episodeCount") or 12
    episodes = [
        {
            "id": i,
            "number": i,
            "title": f"Episode {i}",
            "aired": f"{item.get('year', 2024)}-01-01",
            "duration": 24 * 60,
            "sub": True,
            "dub": True,
            "hasSub": True,
            "hasDub": True
        }
        for i in range(1, ep_count + 1)
    ]
    return {
        "id": item["id"],
        "routeId": item["routeId"],
        "anilistId": item.get("anilistId"),
        "malId": item.get("malId"),
        "title": item["title"],
        "romaji": item.get("romaji"),
        "native": item.get("native"),
        "poster": item.get("poster"),
        "banner": item.get("banner"),
        "year": item.get("year"),
        "score": item.get("score"),
        "format": item.get("format", "TV"),
        "type": item.get("type", "TV"),
        "status": "Releasing" if item.get("year", 2024) >= 2024 else "Finished",
        "episodeCount": ep_count,
        "subCount": ep_count,
        "dubCount": ep_count,
        "sub": True,
        "dub": True,
        "hasSub": True,
        "hasDub": True,
        "genres": item.get("genres", []),
        "studios": item.get("studios", []),
        "synopsis": item.get("synopsis", ""),
        "episodes": episodes,
        "recommendations": ALL_CATALOG_ITEMS[:12]
    }


def update_cache_from_json(data):
    """Automatically record AniList IDs from any API responses passing through."""
    global LAST_ANILIST_ID
    if not isinstance(data, dict):
        return

    core = data.get("core") or {}
    ani_id = core.get("anilistId") or data.get("anilistId")
    sel = data.get("settlarSelection")
    rid = data.get("episodeRouteId") or data.get("routeId")
    raw_id = data.get("id")

    if ani_id:
        aid_str = str(ani_id)
        LAST_ANILIST_ID = aid_str
        if sel:
            SELECTION_MAP[sel] = aid_str
        if rid:
            ROUTE_MAP[str(rid)] = aid_str
        if raw_id:
            ID_MAP[str(raw_id)] = aid_str

    items = data.get("items") or []
    if isinstance(items, list):
        for it in items:
            if isinstance(it, dict):
                item_aid = it.get("anilistId")
                item_rid = it.get("routeId")
                item_id = it.get("id")
                if item_aid:
                    aid_str = str(item_aid)
                    if item_rid:
                        ROUTE_MAP[str(item_rid)] = aid_str
                    if item_id:
                        ID_MAP[str(item_id)] = aid_str


class AniPMProxyHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        if getattr(self, "path", "").startswith("/api/local/health"):
            return
        sys.stderr.write(f"[{self.log_date_time_string()}] {format % args}\n")

    def safe_write(self, data):
        try:
            self.wfile.write(data)
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def send_json(self, obj, status=200):
        data = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.safe_write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_POST(self):
        # 1. Settlar session handling via POST
        if self.path.startswith("/api/anime/settlar/session") or self.path.startswith("/api/anime/settlar/preview-session"):
            self.handle_settlar_session()
            return

        # 2. Local preference endpoints
        if self.path.startswith("/api/local/"):
            self.send_json({"ok": True, "backup": False})
            return

        # 3. Site visit tracking
        if self.path.startswith("/api/site/visit"):
            self.send_json({"ok": True})
            return

        self.send_json({"ok": True})

    def do_GET(self):
        parsed = urlparse(self.path)
        clean_path = parsed.path

        # 1. Settlar streaming session interception
        if clean_path.startswith("/api/anime/settlar/session") or clean_path.startswith("/api/anime/settlar/preview-session"):
            self.handle_settlar_session()
            return

        # 2. Playback bootstrap for hero video preview
        if clean_path.startswith("/api/anime/playback-bootstrap/"):
            self.handle_playback_bootstrap()
            return

        # 3. Embedded preview video proxy with postMessage bridge
        if clean_path == "/embed/preview":
            self.handle_embed_preview()
            return

        # 4. Local diagnostics & health check
        if clean_path == "/api/local/health":
            self.send_json({
                "ok": True,
                "player": "Yoru MegaPlay Stream Resolver",
                "catalogCount": len(ALL_CATALOG_ITEMS),
                "spotlightCount": len(SPOTLIGHT_ITEMS),
                "reanime": False,
                "cachedStreams": len(STREAM_CACHE),
            })
            return

        # 5. Local bridge script
        if clean_path == "/local-bridge.js":
            bridge_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "local-bridge.js")
            if os.path.exists(bridge_file):
                with open(bridge_file, "rb") as f:
                    data = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/javascript")
                self.send_header("Content-Length", str(len(data)))
                self.send_header("Cache-Control", "no-cache")
                self.end_headers()
                self.safe_write(data)
                return

        # =====================================================================
        # 6. LOCAL CATALOG API HANDLERS (Immune to ISP blocks)
        # =====================================================================

        # Spotlight Carousel: Curated high-res spotlights with local banners & logos
        if clean_path == "/api/anime/spotlight":
            self.send_json({"items": SPOTLIGHT_ITEMS})
            return

        # Browse / Trending / Home-Feed
        if clean_path in ("/api/anime/browse", "/api/anime/home-feed"):
            self.send_json({"items": ALL_CATALOG_ITEMS, "page": 1, "total": len(ALL_CATALOG_ITEMS), "hasMore": False})
            return

        # Top Watched (supports format=MOVIE filter)
        if clean_path == "/api/anime/top-watched":
            qs = parse_qs(parsed.query)
            fmt_filter = qs.get("format", [""])[0].upper()
            if fmt_filter == "MOVIE":
                items = [it for it in ALL_CATALOG_ITEMS if it.get("format") == "MOVIE" or it.get("type") == "MOVIE"]
                if not items:
                    items = ALL_CATALOG_ITEMS[:10]
            else:
                items = ALL_CATALOG_ITEMS[:20]
            self.send_json({"items": items})
            return

        # Latest Episodes shelf
        if clean_path == "/api/anime/latest-episodes":
            self.send_json({"items": ALL_CATALOG_ITEMS[:30]})
            return

        # General Catalog
        if clean_path == "/api/anime/catalog":
            self.send_json({"items": ALL_CATALOG_ITEMS, "page": 1, "total": len(ALL_CATALOG_ITEMS), "hasMore": False})
            return

        # Upcoming Premieres & Schedule
        if clean_path in ("/api/anime/upcoming", "/api/anime/schedule"):
            self.send_json({"items": SCHEDULE_ITEMS})
            return

        # Community comments
        if clean_path in ("/comments/recent", "/api/comments/recent"):
            self.send_json({"comments": COMMUNITY_COMMENTS})
            return

        # Site activity (Active users & chat pill)
        if clean_path == "/api/site/activity":
            self.send_json({
                "visitsLast15Minutes": 248,
                "visitsLast60Minutes": 1820,
                "latestMessage": {
                    "name": "Rem",
                    "body": "Starting life in another world from zero!"
                }
            })
            return

        # User profile mock
        if clean_path in ("/api/auth/me", "/api/site/visit", "/api/local/preferences"):
            self.send_json({"ok": True})
            return

        # Title details: /api/anime/series/{id} or /api/anime/ani/{id}
        if clean_path.startswith("/api/anime/series/") or clean_path.startswith("/api/anime/ani/"):
            parts = clean_path.strip("/").split("/")
            ident = parts[-1]
            matched_item = find_catalog_item(ident)
            details = build_series_details(matched_item)
            self.send_json(details)
            return

        # Cover image proxy / local fallback
        if clean_path == "/api/anime/cover":
            qs = parse_qs(parsed.query)
            aid = qs.get("anilistId", [""])[0]
            if aid == "178789":
                cover_local = os.path.join(DIRECTORY, "banners", "t", "3AXLSxMuqyZt8HyrKKfrcJtkswD.webp")
                if os.path.exists(cover_local):
                    self.serve_file(cover_local)
                    return
            # Fallback 1x1 transparent WebP or local poster
            self.send_response(302)
            self.send_header("Location", "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/default.jpg")
            self.end_headers()
            return

        # 7. Serve local static files
        req_path = self.translate_path(clean_path)
        if os.path.exists(req_path) and not os.path.isdir(req_path):
            return super().do_GET()

        # 8. Check extension aliases (.avif vs .webp vs .jpg vs .png)
        alt_path = self.find_extension_alias(req_path)
        if alt_path and os.path.exists(alt_path):
            self.serve_file(alt_path)
            return

        # 9. Missing static assets with extension
        ext = os.path.splitext(clean_path)[1].lower()
        if ext:
            self.fetch_and_cache(req_path)
            return

        # 10. SPA client-side routing fallback: serve index.html with local-bridge injected
        self.serve_spa_index()

    def find_extension_alias(self, file_path):
        base, ext = os.path.splitext(file_path)
        for candidate_ext in [".avif", ".webp", ".png", ".jpg", ".jpeg"]:
            cand = base + candidate_ext
            if os.path.exists(cand):
                return cand
        return None

    def serve_file(self, file_path):
        mime, _ = mimetypes.guess_type(file_path)
        try:
            with open(file_path, "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-Type", mime or "application/octet-stream")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "public, max-age=86400")
            self.end_headers()
            self.safe_write(data)
        except Exception:
            self.send_error(404, "File Not Found")

    def handle_settlar_session(self):
        """
        Intercept settlar/session and return Yoru's preferred clean MegaPlay stream.
        No ReAnime, zero third-party banners, pure clean Video.js stream.
        """
        global LAST_ANILIST_ID

        parsed_url = urlparse(self.path)
        parsed_qs = parse_qs(parsed_url.query)
        ep = parsed_qs.get("ep", ["1"])[0]
        sel = parsed_qs.get("selection", [""])[0]
        channel = parsed_qs.get("channel", ["sub"])[0].lower()
        if channel not in ("sub", "dub"):
            channel = "sub"

        if self.command == "POST":
            try:
                length = int(self.headers.get("Content-Length", 0))
                if length > 0:
                    body_json = json.loads(self.rfile.read(length))
                    if isinstance(body_json, dict):
                        ep = str(body_json.get("ep", ep))
                        sel = str(body_json.get("selection", sel))
                        channel = str(body_json.get("channel", channel)).lower()
            except Exception:
                pass

        is_preview = "preview" in sel or "/preview-session" in self.path

        # 1. Resolve AniList ID
        anilist_id = SELECTION_MAP.get(sel)

        if not anilist_id and sel.startswith("preview:"):
            parts = sel.split(":")
            if len(parts) >= 2:
                candidate = parts[1]
                anilist_id = ROUTE_MAP.get(candidate) or ID_MAP.get(candidate) or candidate

        if not anilist_id:
            referer = self.headers.get("Referer", "")
            if referer:
                ref_path = urlparse(referer).path
                ref_parts = [p for p in ref_path.split("/") if p]
                if len(ref_parts) >= 2 and ref_parts[0] in ("watch", "anime", "ani"):
                    if ref_parts[1] == "ani" and len(ref_parts) >= 3:
                        anilist_id = ref_parts[2]
                    else:
                        rid = ref_parts[1]
                        anilist_id = ROUTE_MAP.get(rid) or ID_MAP.get(rid) or rid

        if not anilist_id or not str(anilist_id).isdigit():
            anilist_id = LAST_ANILIST_ID or "189046"

        sys.stderr.write(f"[Yoru Resolver] Resolving stream for AniList ID {anilist_id}, Ep {ep}, Lang {channel} (preview={is_preview})\n")

        # 2. Check stream cache (10 min TTL)
        cache_key = f"{anilist_id}:{channel}:{ep}"
        now = time.time()
        chosen_stream_url = None
        if cache_key in STREAM_CACHE:
            ts, cached_url = STREAM_CACHE[cache_key]
            if now - ts < 600:
                chosen_stream_url = cached_url

        if not chosen_stream_url:
            try:
                target_yoru_url = f"{YORU_API}/api/watch/{anilist_id}/{channel}/{ep}"
                r = requests.get(target_yoru_url, timeout=6)
                if r.status_code == 200:
                    data = r.json()
                    all_streams = []
                    for grp_key in ("ssub", "sdub", "streams"):
                        grp_data = data.get(grp_key)
                        if isinstance(grp_data, dict) and "streams" in grp_data:
                            for s in grp_data["streams"]:
                                if isinstance(s, dict) and "url" in s and s["url"].startswith("https://"):
                                    all_streams.append(s["url"])

                    pref = [s for s in all_streams if "megaplay.buzz/videojs/stream/" in s]
                    secondary = [s for s in all_streams if "megaplay.buzz/stream/" in s]
                    if pref:
                        chosen_stream_url = pref[0]
                    elif secondary:
                        chosen_stream_url = secondary[0]
                    elif all_streams:
                        chosen_stream_url = all_streams[0]

                    if chosen_stream_url:
                        STREAM_CACHE[cache_key] = (now, chosen_stream_url)
                        sys.stderr.write(f"[Yoru Resolver] Successfully resolved stream from Yoru: {chosen_stream_url}\n")
            except Exception as e:
                sys.stderr.write(f"[Yoru Resolver] Yoru API query error: {e}\n")

        if not chosen_stream_url:
            chosen_stream_url = f"https://megaplay.buzz/videojs/stream/s-2/{ep}/{channel}"
            sys.stderr.write(f"[Yoru Resolver] Using fallback stream URL: {chosen_stream_url}\n")

        if is_preview:
            host = self.headers.get("Host", f"localhost:{PORT}")
            embed_url = f"http://{host}/embed/preview?target={requests.utils.quote(chosen_stream_url, safe='')}&ep={ep}&channel={channel}"
            self.send_json({
                "embedUrl": embed_url,
                "expiresAt": int(now) + 86400,
                "provider": "anipm",
            })
        else:
            self.send_json({
                "embedUrl": chosen_stream_url,
                "expiresAt": int(now) + 86400,
                "provider": "anipm",
            })

    def handle_playback_bootstrap(self):
        """Handle playback-bootstrap requests for AnimeDetails hero video."""
        parsed_url = urlparse(self.path)
        parsed_qs = parse_qs(parsed_url.query)
        ep = parsed_qs.get("ep", ["1"])[0]
        lang = parsed_qs.get("lang", ["sub"])[0].lower()
        if lang not in ("sub", "dub"):
            lang = "sub"

        parts = [p for p in parsed_url.path.split("/") if p]
        identifier = parts[4] if len(parts) > 4 else ""

        ani_id = ROUTE_MAP.get(identifier) or ID_MAP.get(identifier) or identifier
        selection_key = f"preview:{identifier}:{ep}:{lang}"
        if ani_id:
            SELECTION_MAP[selection_key] = str(ani_id)

        sys.stderr.write(f"[Playback Bootstrap] id={identifier} -> ani_id={ani_id}, ep={ep}, lang={lang}\n")

        self.send_json({
            "settlarSelection": selection_key,
            "effectiveLanguage": lang,
            "skip": None,
            "core": None
        })

    def handle_embed_preview(self):
        """
        Proxy MegaPlay stream player with a clean cinematic background wrapper
        and a bidirectional postMessage bridge for autoplay, pause on scroll, and audio toggle.
        """
        parsed_url = urlparse(self.path)
        parsed_qs = parse_qs(parsed_url.query)
        target = parsed_qs.get("target", [""])[0]

        if not target or not target.startswith("http"):
            self.send_error(400, "Missing target URL")
            return

        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://megaplay.buzz/",
            }
            resp = requests.get(target, headers=headers, timeout=8)
            if resp.status_code != 200:
                self.send_error(resp.status_code, "Target Stream Unavailable")
                return

            html = resp.text

            # Inject base tag for relative player assets
            base_tag = '<base href="https://megaplay.buzz/videojs/">'
            if "<head>" in html:
                html = html.replace("<head>", f"<head>\n{base_tag}", 1)

            # Clean background styles hiding player UI & branding
            clean_css = """
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
            """
            if "</head>" in html:
                html = html.replace("</head>", f"{clean_css}\n</head>", 1)

            # Inject bridge script
            bridge_script = """
            <script>
            (function() {
                let videoEl = null;
                let mountedSent = false;
                let isMuted = true;
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
                    videoEl.setAttribute("webkit-playsinline", "");

                    const playPromise = videoEl.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(function() {
                            videoEl.muted = true;
                            videoEl.play().catch(function() {});
                        });
                    }

                    if (!mountedSent) {
                        mountedSent = true;
                        sendParent({ type: "mounted" });
                    }

                    videoEl.addEventListener("timeupdate", notifyState);
                    videoEl.addEventListener("play", notifyState);
                    videoEl.addEventListener("pause", notifyState);
                    videoEl.addEventListener("ended", function() {
                        sendParent({ type: "ended" });
                    });

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

                if (typeof IntersectionObserver !== "undefined") {
                    const iobs = new IntersectionObserver(function(entries) {
                        entries.forEach(function(entry) {
                            if (!videoEl) return;
                            if (!entry.isIntersecting || entry.intersectionRatio < 0.2) {
                                if (!videoEl.paused) {
                                    videoEl.dataset.pausedByScroll = "1";
                                    videoEl.pause();
                                }
                            } else {
                                if (videoEl.dataset.pausedByScroll === "1") {
                                    delete videoEl.dataset.pausedByScroll;
                                    videoEl.play().catch(function() {});
                                }
                            }
                        });
                    }, { threshold: [0, 0.2, 0.5] });
                    iobs.observe(document.documentElement);
                }

                window.addEventListener("message", function(e) {
                    let data = e.data;
                    if (typeof data === "string") {
                        try { data = JSON.parse(data); } catch(err) { return; }
                    }
                    if (!data || typeof data !== "object") return;

                    if (data.type === "handshake") {
                        if (videoEl && !mountedSent) {
                            mountedSent = true;
                            sendParent({ type: "mounted" });
                        }
                        notifyState();
                    } else if (data.type === "play") {
                        if (videoEl && videoEl.paused) {
                            videoEl.play().catch(function() {});
                        }
                    } else if (data.type === "pause") {
                        if (videoEl && !videoEl.paused) {
                            videoEl.pause();
                        }
                    } else if (data.type === "sound") {
                        userUnmuted = !!data.on;
                        if (videoEl) {
                            videoEl.muted = !userUnmuted;
                        }
                    } else if (data.type === "seek" && typeof data.seconds === "number") {
                        if (videoEl && Number.isFinite(data.seconds)) {
                            videoEl.currentTime = data.seconds;
                        }
                    }
                });
            })();
            </script>
            """
            if "</body>" in html:
                html = html.replace("</body>", f"{bridge_script}\n</body>", 1)
            else:
                html += bridge_script

            encoded = html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.safe_write(encoded)
        except Exception as e:
            sys.stderr.write(f"Error serving embed preview: {e}\n")
            self.send_error(500, "Embed Preview Proxy Error")

    def serve_spa_index(self):
        index_file = os.path.join(DIRECTORY, "index.html")
        if not os.path.exists(index_file):
            self.send_error(404, "index.html not found")
            return
        try:
            with open(index_file, "r", encoding="utf-8") as f:
                html = f.read()
            html = re.sub(r'<script\b[^>]*\bsrc=[\"\'](?:https?:)?//d318g7p3azvr44\.cloudfront\.net/[^\"\']*[\"\'][^>]*>\s*</script>', '', html, flags=re.I)
            if "/local-bridge.js" not in html:
                html = html.replace("</body>", '<script src="/local-bridge.js" defer></script></body>')
            encoded = html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded)))
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.safe_write(encoded)
        except Exception:
            self.path = "/index.html"
            super().do_GET()

    def fetch_and_cache(self, local_save_path):
        """Fetch missing static asset from upstream ani.pm and cache locally on disk."""
        upstream_url = f"{UPSTREAM}{self.path}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://ani.pm/",
        }
        try:
            resp = requests.get(upstream_url, headers=headers, timeout=5, verify=False)
            if resp.status_code == 200:
                try:
                    os.makedirs(os.path.dirname(local_save_path), exist_ok=True)
                    with open(local_save_path, "wb") as f:
                        f.write(resp.content)
                except Exception:
                    pass
                content_type = resp.headers.get("Content-Type") or self.guess_type(local_save_path)
                self.send_response(200)
                self.send_header("Content-Type", content_type or "application/octet-stream")
                self.send_header("Content-Length", str(len(resp.content)))
                self.send_header("Cache-Control", "public, max-age=86400")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.safe_write(resp.content)
                return
            else:
                self.send_error(resp.status_code, "Upstream Not Found")
        except Exception:
            self.send_error(404, "File Not Found")


def main():
    server = ThreadingHTTPServer(("0.0.0.0", PORT), AniPMProxyHandler)
    print(f"[*] Serving ani.pm frontend at http://localhost:{PORT}")
    print(f"[*] Local Catalog: {len(ALL_CATALOG_ITEMS)} titles, {len(SPOTLIGHT_ITEMS)} spotlights")
    print(f"[*] Pure Yoru Streaming Resolver: {YORU_API}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        server.server_close()


if __name__ == "__main__":
    main()
