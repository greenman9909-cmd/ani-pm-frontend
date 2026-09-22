/** pages — God Tree Node 13 operational route map.
 * Exact routes are owned by the preserved extracted SPA router in index-DQbZxriH.js.
 * Watch mode is the existing /anime/:id or /ani/:id route with ?ep=<episode>.
 * Release Schedule is a dated Home surface with its View All path routed to
 * /anime?status=NOT_YET_RELEASED&sort=trending; there is no invented /schedule route.
 */
export const pages = [
  {
    "path": "/",
    "title": "Home",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/search",
    "title": "Search",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/anime",
    "title": "Browse",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/latest",
    "title": "Latest Episodes",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/anime/:id",
    "title": "Anime Details / Watch mode with ?ep=",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/ani/:id",
    "title": "AniList-backed title route / Watch mode with ?ep=",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/genres",
    "title": "Genres",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/leaderboard",
    "title": "Leaderboard",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/bluray",
    "title": "Blu-ray Voting",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/community",
    "title": "Community",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/community/t/:id",
    "title": "Community Thread",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/watch-together",
    "title": "Watch Together",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/watch-together/:code",
    "title": "Watch Room",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/downloads",
    "title": "Downloads",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/library",
    "title": "Library",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/user/:username",
    "title": "Profile",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/settings",
    "title": "Settings",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/about",
    "title": "About",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/terms",
    "title": "Terms",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/privacy",
    "title": "Privacy",
    "status": "implemented-extracted-route"
  }
] as const;

export const routePolicy = {
  source: "preserved extracted SPA router",
  fallback: "NotFound-CAg2l_3s.js",
  profile: "/user/:username",
  watchMode: "/anime/:id?ep=<episode> or /ani/:id?ep=<episode>",
  releaseSchedule: "Home ReleaseSchedule component + /anime?status=NOT_YET_RELEASED&sort=trending",
  mobile: "same routes, responsive CSS/navigation",
  player: "same-origin mock-player adapter for this build",
  rule: "Do not invent aliases or replace extracted lazy-route composition with a generic application shell."
} as const;
