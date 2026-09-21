# Ani.pm + Yoru Direct Streaming Architecture & Integration Guide

## 1. Executive Summary
This project runs a 100% self-contained local instance of the **ani.pm** frontend with **Yoru's clean MegaPlay streaming engine**.

- **No external backend daemons required**: Completely eliminated ReAnime (`reanime/app.py`, port 8000, and Render backend).
- **No unwanted banners or watermarks**: ReAnime's `ANIMEXOSOURCE_OWAIS` header banner is completely eliminated.
- **Pure Yoru stream resolution**: Direct integration with Yoru's stream resolution API (`https://anivexaapi-aniko2.hf.space`) serving clean MegaPlay Video.js streams (`https://megaplay.buzz/videojs/stream/s-2/...`).
- **Built-in Offline Catalog Engine**: Completely immune to regional/ISP domain blocking (such as Spanish ISP DNS/SNI blocking of `ani.pm`). Pre-loads 300+ anime titles, 7 curated spotlights with high-res banners and logos, upcoming schedule with live countdowns, community discussions, and live site activity.
- **Full Video Persistence & Resume**: Injected `local-bridge.js` records playback timestamps into `localStorage` and provides the exact native modal: *"Continue watching? Continue from MM:SS"* and *"Start from the beginning"*.
- **Cinematic Hero Background Preview with Audio**: When opening an anime details page (`/anime/:id` or `/ani/:id`), the spotlight banner starts playing the episode preview video in the background after ~3 seconds. It automatically pauses on scroll down and resumes on scroll up, with a reactive audio toggle button `[ 🔊 / 🔇 ]` at the bottom right.

---

## 2. Directory Structure & Key Files

| Path | Purpose |
|---|---|
| `serve.py` | Unified local HTTP Gateway (Python 3.11 stdlib + `requests`). Serves SPA, offline catalog (300+ titles, spotlights, schedule, comments), proxies metadata, intercepts playback session requests, provides mock bootstrap responses, and dynamically proxies preview streams with an injected postMessage bridge. |
| `local-bridge.js` | Client-side bridge script injected into `index.html`. Handles video hooks, progress tracking (`ani-local-position:{routeKey}`), and the resume modal. |
| `ani.pm_frontend/` | Captured production build of `ani.pm` (Vite + React 19). |
| `ani.pm_frontend/banners/` | Local high-resolution spotlight banners (Re:Zero, Solo Leveling, Dandadan, AoT, JJK, Bleach, Sakamoto Days). |
| `ani.pm_frontend/logos/` | Local transparent SVG/PNG title logos for the spotlight carousel. |
| `ani.pm_frontend/assets/AnimeDetails-Cbtev-sg.js` | Details page component (`vn` & `hn`). Contains the hero video spotlight player, sound controls, and viewport intersection observer. |
| `ani.pm_frontend/assets/AnimeDetails-CXCaqWzn.css` | Styles for the spotlight hero video (`.spot-video`, `.spot-video__frame`, `.is-shown`, `.is-live`, `.spot-sound`). |

---

## 3. End-to-End Playback Flow

```
[User Browser (localhost:8080)]
         │
         │ 1. Navigates to /watch/ani/{anilistId}/{ep}
         ▼
[serve.py (Local Gateway)]
         │
         │ 2. Proxies /api/anime/playback-bootstrap/... to ani.pm
         │    Caches mapping: SELECTION_MAP[settlarSelection] = anilistId
         ▼
[Browser receives Bootstrap Payload]
         │
         │ 3. Frontend requests /api/anime/settlar/session?selection={token}&ep={ep}&channel={sub|dub}
         ▼
[serve.py intercepts settlar/session]
         │
         │ 4. Resolves anilistId from token, ROUTE_MAP, or Referer header
         │ 5. Queries Yoru API: https://anivexaapi-aniko2.hf.space/api/watch/{anilistId}/{channel}/{ep}
         │ 6. Selects preferred Video.js stream: https://megaplay.buzz/videojs/stream/s-2/{id}/{channel}
         │ 7. Caches stream URL in STREAM_CACHE (10 min TTL)
         ▼
[Browser receives JSON { "embedUrl": "https://megaplay.buzz/videojs/stream/...", "provider": "anipm" }]
         │
         │ 8. ani.pm mounts iframe with clean MegaPlay Video.js player (No ads, no ReAnime banners)
         │ 9. local-bridge.js tracks playback position every 5s into localStorage
         │ 10. On reload/re-entry, displays: "Continue watching? Continue from MM:SS"
```

---

## 4. How Stream Resolution Works in `serve.py`

### Why `embed.settlar.io` could not be used directly
Upstream `ani.pm` returns an embed URL pointing to `https://embed.settlar.io/embed/v1?t=...`. However, Settlar serves:
```http
Content-Security-Policy: frame-ancestors https://ani.pm https://www.ani.nz https://ani.nz;
```
Browsers reject embedding `settlar.io` inside `http://localhost:8080`.

### Why ReAnime was rejected
Previous attempts proxied `/api/anime/settlar/session` to a local FastAPI server running ReAnime on port 8000 (`http://localhost:8000/embed/ani/...`). This introduced:
1. An extra server dependency (`uvicorn`, Python virtual environment).
2. An intrusive banner: `ANIMEXOSOURCE_OWAIS` above the video.
3. Audio/video sync and subtitle desync issues.

### The Yoru Solution
Yoru uses the upstream HuggingFace API:
```
GET https://anivexaapi-aniko2.hf.space/api/watch/{anilistId}/{sub|dub}/{episode}
```
Which returns:
```json
{
  "ssub": {
    "streams": [
      {
        "url": "https://megaplay.buzz/stream/s-2/114721/sub",
        "type": "embed",
        "server": "Aurora-embed",
        "priority": 2
      },
      {
        "url": "https://megaplay.buzz/videojs/stream/s-2/114721/sub",
        "type": "embed",
        "server": "Aurora-embed",
        "priority": 2
      }
    ],
    "subtitles": [ ... ],
    "intro": { "start": 0, "end": 0 },
    "outro": { "start": 1325, "end": 1414 }
  }
}
```
`serve.py` filters for `megaplay.buzz/videojs/stream/` (or `megaplay.buzz/stream/s-2/`) and returns it directly as `embedUrl`:
```json
{
  "embedUrl": "https://megaplay.buzz/videojs/stream/s-2/114721/sub",
  "expiresAt": 1790082346,
  "provider": "anipm"
}
```
`ani.pm` loads this URL inside its iframe. MegaPlay allows cross-origin framing (`Access-Control-Allow-Origin: *`, no restrictive `frame-ancestors`), rendering the clean Video.js stream player with full controls, quality selection, and subtitles.

### Iframe Sandbox Requirement
MegaPlay detects if an `<iframe>` has a `sandbox` attribute and blocks playback with:
`"Opss! Sandboxed our player is not allowed. Remove sandbox to use it."`

To prevent this:
1. The `sandbox` attribute was stripped from all video player components in `ani.pm_frontend/assets/` (`AnimeTitle-CbYWL0P7.js`, `AnimeDetails-Cbtev-sg.js`, and `WatchRoom-CG3SvFCv.js`).
2. `local-bridge.js` proactively strips `sandbox` via `HTMLIFrameElement.prototype.setAttribute` interception and a DOM scanner.

---

## 5. Hero Background Preview Video Pipeline & Audio Sync

When a user visits an anime details page (`/anime/:id` or `/ani/:id`), the spotlight banner features a dynamic background video preview with full audio support and scroll awareness:

### Architecture of the Hero Video

```
[AnimeDetails Component (hn)]
         │
         │ 1. GET /api/anime/playback-bootstrap/{source}/{id}?ep=1&lang=sub
         ▼
[serve.py handle_playback_bootstrap]
         │ (Returns settlarSelection: "preview:{id}:{ep}:{lang}")
         ▼
[AnimeDetails requests Settlar Preview Session]
         │ 2. POST /api/anime/settlar/preview-session?selection=preview:...
         ▼
[serve.py handle_settlar_session]
         │ Resolves Yoru clean MegaPlay stream
         │ Returns embedUrl: "http://localhost:8080/embed/preview?target=..."
         ▼
[AnimeDetails mounts iframe: /embed/preview?target=...]
         │
         ├───────────────────────────────────────────────┐
         │                                               │
  [Injected Bridge Script]                      [Browser & User Events]
         │                                               │
         │ Starts video muted (Autoplay Policy)          │
         │ Posts {source: "settlar-embed", type: "state"}│
         │                                               │
         ▼                                               ▼
  Parent hn receives state:                    After approx 2.9 - 3.0s:
  - If currentTime >= 2.4s:                    - .is-shown and .is-live applied
    calls D(id) -> shown: true                 - Video fades in smoothly (0.9s ease)
                                               - Sound button [ 🔇 ] appears at bottom right
                                                         │
                                                         ▼
                                               User clicks [ 🔇 ]:
                                               - Parent sends {type: "sound", on: true}
                                               - Bridge sets videoEl.muted = false
                                               - Instant un-muted audio plays!
                                                         │
                                                         ▼
                                               User scrolls down:
                                               - IntersectionObserver triggers wt=false
                                               - Parent sends {type: "pause"}
                                               - Video pauses!
                                                         │
                                                         ▼
                                               User scrolls back up:
                                               - IntersectionObserver triggers wt=true
                                               - Parent sends {type: "play"}
                                               - Video resumes immediately!
```

---

## 6. Local Catalog Engine (ISP Blocking Immunity)

In several regions (e.g. Spain), Internet Service Providers (Telefónica, Movistar, Orange, Vodafone) block requests to the domain `ani.pm` via DPI middleboxes returning HTTP 403 `Accés bloquejat`.

To guarantee 100% uptime and instant local browsing, `serve.py` serves an embedded high-performance catalog engine:
- **Spotlights**: Curated items for Re:Zero, Solo Leveling, Dandadan, Attack on Titan, Jujutsu Kaisen, Bleach, and Sakamoto Days using local banners and logos.
- **Browse & Shelves**: Pre-compiled from Yoru's 300+ anime dataset (`anilist_dump.json` and `catalog-expanded.json`).
- **Upcoming & Schedule**: Serves upcoming seasonal releases with calculated timestamps so the Schedule section displays active countdown chips ("In 2 days", "Coming Soon") instead of retry buttons.
- **Community & Activity**: Serves active visitor counts and anime discussion comments.
- **Series Details**: Dynamically constructs complete series metadata with full episode arrays for `/api/anime/series/{id}` and `/api/anime/ani/{id}`.

---

## 7. How to Start and Verify the Service

### Start Gateway
```powershell
cd C:\Users\green\.gemini\antigravity\scratch\ani_downloader
python serve.py
```
Outputs:
```
[*] Serving ani.pm frontend at http://localhost:8080
[*] Local Catalog: 303 titles, 7 spotlights
[*] Pure Yoru Streaming Resolver: https://anivexaapi-aniko2.hf.space
```

### Health Check
```powershell
curl http://localhost:8080/api/local/health
```
Response:
```json
{
  "ok": true,
  "player": "Yoru MegaPlay Stream Resolver",
  "catalogCount": 303,
  "spotlightCount": 7,
  "reanime": false,
  "cachedStreams": 0
}
```
