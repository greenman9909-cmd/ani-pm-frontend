import os
import re

panel_path = os.path.join("ani.pm_frontend", "assets", "WatchPlaylistPanel-DMsP9yOA.js")
with open(panel_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace Bn validator to accept any http/https URL
pattern = r"function Bn\(e\)\{const a=Zt\(\);if\(!a\)return!1;try\{.*?\}catch\{return!1\}\}"
new_fn = 'function Bn(e){return Boolean(e&&typeof e==="string"&&e.startsWith("http"));}'

new_content, count = re.subn(pattern, new_fn, content)
print(f"Patched Bn occurrences: {count}")

with open(panel_path, "w", encoding="utf-8") as f:
    f.write(new_content)
