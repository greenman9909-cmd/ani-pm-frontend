# ani.pm Frontend + Streaming Gateway

> **Note**: This frontend was extracted using our custom **[spa-ripper](https://github.com/greenman9909-cmd/spa-ripper)** tool.

A 100% self-contained local instance of the **ani.pm** Single Page Application (Vite + React 19) extracted using our **[spa-ripper](https://github.com/greenman9909-cmd/spa-ripper)** tool, integrated with direct stream resolution and offline catalog resilience.

---

## ⚡ Extraction with SPA Ripper

This entire production bundle (all route components, Vite dynamic chunks, CSS stylesheets, web fonts, reaction emojis, covers, and high-resolution spotlight assets) was extracted using our **[spa-ripper](https://github.com/greenman9909-cmd/spa-ripper)** tool. The tool traversed JavaScript entrypoints and dynamic import statements to resolve and download all lazy-loaded dependencies offline.

---

## Features

- **Extracted Production SPA**: Complete Vite + React 19 frontend bundle (`index.html`, dynamic JS/CSS chunks, fonts, high-res banners, logos, and covers) extracted via **spa-ripper**.
- **Zero External Backend Daemons**: Self-contained streaming resolver without third-party heavy dependencies.
- **Direct Stream Resolution**: Resolves clean Video.js / MegaPlay streams with subtitle selection and quality toggles.
- **Built-in Offline Catalog Engine**: High-performance catalog fallback with 300+ titles, curated hero spotlight carousel, seasonal schedule, countdowns, and active discussions.
- **Video Persistence & Resume**: Integrated local bridge that tracks playback timestamps and renders native "Continue watching" modals.
- **Hero Video Previews**: Cinematic background video previews with reactive audio controls on anime details pages.

---

## Directory Structure

```
├── ani.pm_frontend/          # Production SPA bundle extracted using spa-ripper
│   ├── assets/               # JavaScript chunks, CSS, fonts
│   ├── banners/              # High-res spotlight banners
│   ├── logos/                # High-res title logos
│   ├── glassplayer/          # Player stylesheets
│   ├── img/                  # Covers and reaction assets
│   └── index.html            # Main SPA entry point
├── ARCHITECTURE_AND_INTEGRATION_GUIDE.md  # Deep dive architecture docs
├── download_frontend.py      # SPA extraction & crawler script
├── local-bridge.js           # Client-side video tracking & modal bridge
├── serve.py                  # Unified gateway server (Python 3.11+)
├── server.js                 # Alternate Node.js gateway server
└── covers.json               # Catalog cover mappings
```

---

## Quick Start

### Run with Python

```powershell
python serve.py
```

Access the application in your browser:
**[http://localhost:8080](http://localhost:8080)**

Health check:
```powershell
curl http://localhost:8080/api/local/health
```

---

## Architecture & Technical Details

For comprehensive details on stream extraction, iframe sandbox management, and API endpoints, see [ARCHITECTURE_AND_INTEGRATION_GUIDE.md](ARCHITECTURE_AND_INTEGRATION_GUIDE.md).
