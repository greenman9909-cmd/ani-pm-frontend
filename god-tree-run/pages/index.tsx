/** pages — God Tree Node 13 operational route map.
 * Routes are owned by the preserved extracted SPA router in index-DQbZxriH.js.
 * This file is evidence/mapping, not a replacement router.
 */
export const pages = [
  {
    "path": "/",
    "title": "Home",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/anime",
    "title": "Browse",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/search",
    "title": "Search",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/latest",
    "title": "Latest Episodes",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/genres",
    "title": "Genres",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/anime/:id",
    "title": "Anime Details",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/watch/:id",
    "title": "Watch",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/library",
    "title": "Library",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/profile/:username?",
    "title": "Profile",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/settings",
    "title": "Settings",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/community",
    "title": "Community",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/community/:thread",
    "title": "Community Thread",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/leaderboard",
    "title": "Leaderboard",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/schedule",
    "title": "Release Schedule",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/watch-together",
    "title": "Watch Together",
    "status": "implemented-extracted-route"
  },
  {
    "path": "/watch-together/:room",
    "title": "Watch Room",
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
  mobile: "same routes, responsive CSS/navigation",
  player: "same-origin mock-player adapter for this build",
  rule: "Do not replace extracted lazy-route composition with a generic application shell."
} as const;
