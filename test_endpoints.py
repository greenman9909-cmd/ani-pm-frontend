import requests

endpoints = [
    '/api/anime/spotlight',
    '/api/anime/browse',
    '/api/anime/top-watched',
    '/api/anime/latest-episodes',
    '/api/anime/upcoming',
    '/api/anime/schedule',
    '/api/anime/series/189046',
    '/api/anime/series/135865',
    '/api/anime/playback-bootstrap/189046?ep=1&lang=sub',
    '/api/chat?after=0',
    '/api/site/activity',
    '/api/auth/me',
    '/api/anime/poster?anilistId=189046&w=460&format=webp',
    '/api/anime/cover?u=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fcover%2Fmedium%2Fbx208044-Pm2UhvApQFUh.jpg',
]

for ep in endpoints:
    try:
        r = requests.get('http://localhost:8080' + ep, timeout=5, allow_redirects=False)
        ct = r.headers.get("content-type", "")[:35]
        loc = r.headers.get("location", "")
        print(f"{ep[:45]:<45} -> {r.status_code} [{ct}] loc={loc} len={len(r.content)}")
    except Exception as e:
        print(f"{ep[:45]:<45} -> ERROR: {e}")
