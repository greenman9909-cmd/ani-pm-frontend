# AML — extracted ani.pm frontend remix

This branch uses the **actual SPA-Ripper-extracted ani.pm frontend** in `ani.pm_frontend/`.

It does not rebuild the UI from scratch.

## What changed

- Product name is presented as **AML** at runtime.
- The original captured Vite/React chunks and CSS remain the frontend.
- Search/catalogue/title/profile/community/library/settings/auth data is replaced with local synthetic fixtures in `server.js`.
- Live AniList lookup is disabled.
- Live Yoru/MegaPlay/Settlar playback is disabled.
- Watch/preview flows resolve to `ani.pm_frontend/mock-player.html`.
- `ani.pm_frontend/aml-brand.js` changes visible branding and blocks external `fetch()` requests.
- The original `main` branch capture is unchanged.

## Run

```bash
git checkout remix/aml-extracted-frontend
npm start
```

Open:

```text
http://localhost:8080
```

Useful test routes:

```text
/
 /search
 /anime
 /library
 /profile
 /settings
 /community
 /leaderboard
```

The original SPA router controls those pages.

## Mock fixtures

Example synthetic catalogue entries:

- Neon Archive
- Glass Horizon
- Moonframe
- Wild Signal
- Quiet Engine
- After Image
- Starfall Radio
- Mirror District

Synthetic users include AML Tester, Mira, Kian, Nova, Sora and Rin.

## Verification

GitHub Actions workflow: `aml-extracted-runtime`

It:

1. syntax-checks `server.js` and `aml-brand.js`;
2. fails if production AniList/Yoru/MegaPlay/Settlar URL markers reappear in `server.js`;
3. boots the real gateway;
4. verifies the extracted SPA shell and Home lazy chunk;
5. verifies AML search, title details, profile, auth, watchlist and settings responses;
6. verifies the local player and preview path.

The first runtime workflow completed successfully.
