# Stack Fingerprint

The pinned reference is an extracted React 19 + Vite SPA with hashed lazy chunks and route-specific CSS. The implementation keeps that runtime instead of scaffolding a second framework. A zero-dependency Node.js HTTP gateway in `server.js` serves the bundle and same-origin synthetic JSON endpoints. This is the minimal architecture that preserves route composition, motion and responsive behavior while allowing the media/data layer to be replaced safely.

## Reference Profile

Primary code evidence: `greenman9909-cmd/ani-pm-frontend` at pinned commit `2f734e7334a9a9e2db6a43c876fe88613687827f`, path `ani.pm_frontend/`. Representative chunks include Home, HeroCarousel, AnimeTitle, AnimeDetails, Search, Library, Profile, Settings, Community, Leaderboard, ReleaseSchedule, WatchTogether and WatchRoom. The branch intentionally does not introduce Tailwind, a dashboard shell, Next.js, or a second component system.

Runtime adapter: same-origin Node fixture APIs and local mock-player route. Production media sources must implement the adapter contract later and require licensed/user-provided media; no unauthorized provider is part of this build.
