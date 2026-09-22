/** data-hooks — God Tree Node 14 operational data contract.
 * The existing extracted hooks call same-origin endpoints. server.js supplies synthetic fixtures.
 */
export const dataHooks = {
  spotlight: "/api/anime/spotlight", browse: "/api/anime/browse", search: "/api/anime/search",
  title: "/api/anime/series/:id", schedule: "/api/anime/schedule", recommendations: "/api/recommend",
  watchlist: "/api/watchlist", progress: "/api/progress", collections: "/api/collections",
  profile: "/api/profile/:username", settings: "/api/settings", leaderboard: "/api/leaderboard",
  community: "/api/forum/*", auth: "/api/auth/me", player: "/mock-player.html"
} as const;
export const mediaSourceAdapter = { mode: "mock-only", externalNetwork: false, futureSourceRequirement: "licensed or user-provided" } as const;
