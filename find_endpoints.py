import os
import re

d = 'ani.pm_frontend/assets'
endpoints = set()
for f in os.listdir(d):
    if f.endswith('.js'):
        with open(os.path.join(d, f), 'r', encoding='utf-8', errors='ignore') as fp:
            txt = fp.read()
        for m in re.finditer(r'["\'](/api/[a-zA-Z0-9_\-\/]+)["\']', txt):
            endpoints.add(m.group(1))

print("Found API endpoints in frontend:")
for ep in sorted(endpoints):
    print("  ", ep)
