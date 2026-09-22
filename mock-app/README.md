# Yoru full-surface mock

A renamed, mock-data-only reconstruction of the major public ani.pm product surfaces for UI testing.

## Run

Open `mock-app/index.html` directly, or serve it:

```bash
python -m http.server 8080 -d mock-app
```

Then visit `http://localhost:8080/#/`.

## Included surfaces

Home, Browse, Search, Title Details, mock Watch player, Library, Profile, public user profile, Settings, Community, Leaderboard, Release Schedule, Watch Together, Genres, Latest, Recent, Collections, Downloads, About, Privacy and Terms.

All catalogue entries, users, comments, scores, schedules and player states are synthetic. The mock makes no ani.pm API calls and loads no external video.
