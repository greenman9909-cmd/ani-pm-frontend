<div align="center">

# ⚡ ani.pm — Local Production SPA ⚡

<p align="center">
  <b>Extracted ani.pm React/Vite frontend code, local gateway tooling, and an AML mock-data remix for testing the full streaming-app design.</b>
</p>

<p align="center">
  <a href="https://github.com/greenman9909-cmd/spa-ripper">
    <img src="https://img.shields.io/badge/Extracted%20By-SPA--Ripper-FF5722?style=for-the-badge&logo=github&logoColor=white" alt="Extracted by SPA-Ripper" />
  </a>
  <a href="https://github.com/greenman9909-cmd">
    <img src="https://img.shields.io/badge/Developer-Owais%20(%40greenman9909--cmd)-181717?style=for-the-badge&logo=github&logoColor=white" alt="Developer Owais" />
  </a>
  <img src="https://img.shields.io/badge/Status-Self--Contained%20%26%20Streaming-blueviolet?style=for-the-badge" alt="Status" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React%2019-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Python%203.11+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/License-MIT-success?style=flat-square" alt="License" />
</p>

---

</div>

## 🔗 Code & Previews

| Target | Link | What it is |
|---|---|---|
| **Extracted frontend code** | [`ani.pm_frontend/`](https://github.com/greenman9909-cmd/ani-pm-frontend/tree/main/ani.pm_frontend) | The actual SPA-Ripper-extracted React/Vite bundle: routes, lazy chunks, CSS, fonts, banners, logos, player assets and PWA files. |
| **AML remix code** | [`remix/aml-extracted-frontend`](https://github.com/greenman9909-cmd/ani-pm-frontend/tree/remix/aml-extracted-frontend) | The extracted frontend itself remixed to AML with synthetic catalogue, profile, community, library, settings and player data. |
| **AML pull request** | [PR #2](https://github.com/greenman9909-cmd/ani-pm-frontend/pull/2) | Review the AML remix diff and verification history. |
| **Current AML preview** | [Open live preview](https://receiver-wholesale-incidence-connector.trycloudflare.com) | Temporary HTTPS preview of the real extracted frontend running with AML mock data. The tunnel rotates/expires. |
| **Latest preview pointer** | [`.preview/aml-url.txt`](https://github.com/greenman9909-cmd/ani-pm-frontend/blob/remix/aml-extracted-frontend/.preview/aml-url.txt) | The preview workflow writes its newest temporary URL here. |
| **God Tree reference** | [Pinned extracted-code reference](https://github.com/greenman9909-cmd/vibe-code-genius/tree/main/references/extracted/ani-pm) | The God Tree's version-pinned streaming-design/code reference for future agents. |

### What to preview

The AML branch preserves the extracted ani.pm design/code path. Useful surfaces include **Home hero**, Browse/Search, Anime Details, Library, Profile, Settings, Community, Leaderboard, Release Schedule, Watch Together and the local mock player.

> The public preview is temporary. For a stable preview, run the branch locally with `npm start` and open `http://localhost:8080`.

---

## 🌌 Overview

This repository houses the fully captured, production-ready frontend bundle of **ani.pm** (React 19 + Vite), extracted in its entirety using our custom **[spa-ripper](https://github.com/greenman9909-cmd/spa-ripper)** tool. 

It pairs the ripped SPA with a standalone, zero-dependency streaming gateway that provides direct MegaPlay Video.js playback, an ISP-blocking immune local catalog, hero video previews, and real-time playback persistence.

---

## 🛠️ Extracted via SPA-Ripper

Modern single-page applications heavily rely on Vite dynamic code splitting and lazy route modules (`import("./assets/Route-*.js")`). Standard scrapers fail with `ChunkLoadError`.

Using **[SPA-Ripper](https://github.com/greenman9909-cmd/spa-ripper)**, we recursively resolved and captured:
- ✅ **100% of Lazy Chunks**: All route views, modals, settings, and player components
- ✅ **CSS & Fonts**: Web fonts (Geist, Inter) and deep `@font-face` styles
- ✅ **High-Res Visual Assets**: 4K spotlight banners, anime title logos, character reactions, and SVG icon sets
- ✅ **Client Routing & PWA**: Service workers (`sw.js`), web manifest, and fallback routing

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎬 **Direct MegaPlay Video.js** | Pure stream resolution via Yoru API without bulky third-party daemons or watermarks. |
| 🛡️ **ISP Blocking Immunity** | High-performance offline catalog engine pre-loaded with 300+ titles, spotlights, and schedules. |
| 🎞️ **Cinematic Hero Previews** | Live background video preview on anime details pages with reactive un-mute and scroll pause/resume. |
| ⏱️ **Watch Progress Resume** | Client-side bridge records timestamps to `localStorage` and provides native *"Continue watching"* prompts. |
| ⚡ **Zero Setup Overhead** | Pure Python 3 stdlib server (`serve.py`) or alternative Node.js runtime (`server.js`). |

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/greenman9909-cmd/ani-pm-frontend.git
cd ani-pm-frontend
```

### 2. Launch the Streaming Gateway
```powershell
python serve.py
```

### 3. Open in Browser
Visit **[http://localhost:8080](http://localhost:8080)** to start browsing and streaming.

Verify gateway health:
```bash
curl http://localhost:8080/api/local/health
```

---

## 📂 Project Structure

```text
ani-pm-frontend/
├── ani.pm_frontend/          # Production SPA bundle extracted with spa-ripper
│   ├── assets/               # JS chunks, CSS stylesheets, web fonts
│   ├── banners/              # High-res spotlight banners & 4K originals
│   ├── logos/                # Transparent anime title logos
│   ├── glassplayer/          # Player skins & stylesheets
│   ├── img/                  # Character reaction emojis and covers
│   └── index.html            # SPA entry point
├── ARCHITECTURE_AND_INTEGRATION_GUIDE.md  # Detailed technical specifications
├── download_frontend.py      # Crawler & extraction script
├── local-bridge.js           # Client-side video hooks & resume modal bridge
├── serve.py                  # Primary Python streaming gateway & catalog
├── server.js                 # Alternate Node.js gateway implementation
├── covers.json               # Local catalog cover cache
└── README.md                 # Project documentation
```

---

## 👑 Author & Credits

- **Frontend Extraction & Gateway Engineering**: **[Owais](https://github.com/greenman9909-cmd)** ([@greenman9909-cmd](https://github.com/greenman9909-cmd))
- **Extraction Toolkit**: **[spa-ripper](https://github.com/greenman9909-cmd/spa-ripper)**
- **Original Frontend Design**: **ani.pm** (React 19 / Vite)

---

<div align="center">
  <sub>Built with passion by <a href="https://github.com/greenman9909-cmd">Owais</a>. Released under the MIT License.</sub>
</div>
