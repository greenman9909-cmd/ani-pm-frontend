# AML — media-first anime interface prototype

AML preserves the SPA-Ripper-extracted React/Vite component, CSS, responsive and motion code path from the pinned ani.pm frontend reference while replacing branding, catalogue state and playback with local synthetic fixtures.

## Safety and provenance

- The UI architecture is derived from the pinned extracted reference for implementation/testing.
- AML catalogue entries, users, discussion data and playback state are synthetic.
- Browser-side external `fetch()` requests are blocked in mock mode.
- Playback resolves only to the local mock player. No unauthorized streaming provider is required.
- AML surfaces use original vector mock artwork under `ani.pm_frontend/mock-art/` rather than captured anime key art.
- Historical extracted assets remain in the repository as reference material, but the AML fixture layer does not select them for current mock titles.

## Run

```bash
npm start
```

Open `http://localhost:8080`.

## Main surfaces

Home, Browse, Search, Latest, Genres, Anime Details, Watch shell, Library, Profile, Settings, Community, Leaderboard, Release Schedule, Watch Together, Terms and Privacy are handled by the original extracted router/chunks.

## Verification

```bash
npm run check
```

GitHub Actions workflow `aml-extracted-runtime` boots the real gateway, verifies mock-only boundaries, validates the cinematic hero and core routes in a headless browser, checks mobile DOM rendering, confirms reduced-motion CSS, and probes the synthetic API state.

God Tree execution artifacts for this build are persisted under `god-tree-run/`.
