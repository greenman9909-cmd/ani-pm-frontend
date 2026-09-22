#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import json, re, sys

ROOT = Path(__file__).resolve().parent
INDEX = ROOT / "index.html"
ART = ROOT / ".artifacts"

required_functions = [
    "function home(", "function browse(", "function searchPage(",
    "function details(", "function watch(", "function library(",
    "function profile(", "function settings(", "function community(",
    "function leaderboard(", "function schedule(", "function watchTogether(",
    "function legal("
]
forbidden = [
    "fetch(", "XMLHttpRequest", "anivexaapi", "megaplay.buzz",
    "embed.settlar.io", "api/anime/playback"
]
required_artifacts = [
    "intent.json", "reference-source.json", "clone-manifest.json",
    "clone-components.json", "clone-motion.json", "routes.json"
]

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.has_app = False
    def handle_starttag(self, tag, attrs):
        if tag == "div" and dict(attrs).get("id") == "app":
            self.has_app = True

def fail(msg):
    print("FAIL:", msg)
    raise SystemExit(1)

if not INDEX.exists():
    fail("mock-app/index.html missing")
html = INDEX.read_text(encoding="utf-8")

p = Parser()
p.feed(html)
if not p.has_app:
    fail("#app mount missing")

for fn in required_functions:
    if fn not in html:
        fail(f"missing renderer: {fn}")

for marker in forbidden:
    if marker in html:
        fail(f"real network/stream marker found: {marker}")

if 'const BRAND="Yoru"' not in html or "MOCK DATA" not in html:
    fail("mock identity markers missing")

for name in required_artifacts:
    path = ART / name
    if not path.exists():
        fail(f"missing artifact: {name}")
    json.loads(path.read_text(encoding="utf-8"))

routes = json.loads((ART / "routes.json").read_text(encoding="utf-8"))
if len(routes.get("mock_routes", [])) < 15:
    fail("route surface unexpectedly small")

manifest = json.loads((ART / "clone-manifest.json").read_text(encoding="utf-8"))
if manifest.get("files_total") != 227 or manifest.get("chunks_count") != 120:
    fail("cached clone inventory changed unexpectedly")

print("PASS: mock surface, artifacts, network isolation and cached clone inventory")
