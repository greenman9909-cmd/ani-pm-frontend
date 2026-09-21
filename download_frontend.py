import os
import re
import sys
from urllib.parse import urljoin, urlparse, unquote
import requests

TARGET_BASE = "https://ani.pm/"
OUTPUT_DIR = "ani.pm_frontend"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

EXTRA_ENDPOINTS = [
    "/favicon.ico",
    "/favicon.svg",
    "/apple-touch-icon.png",
    "/icon.png",
    "/icon-192.png",
    "/icon-512.png",
    "/manifest.webmanifest",
    "/latest.rss",
    "/sw.js",
]

ATTR_REGEX = re.compile(r"""(?:src|href)\s*=\s*["']([^"'#\s>]+)""", re.IGNORECASE)
CSS_URL_REGEX = re.compile(r"""url\(\s*['"]?([^'")]+)['"]?\s*\)""", re.IGNORECASE)
# Regex to detect Vite/webpack dynamic chunks, lazy modules, styles, and assets in JS files
JS_ASSET_REGEX = re.compile(r"""(?:["'`/]|(?:\b))(assets/[a-zA-Z0-9_\-\.]+\.(?:js|css|woff2?|png|webp|svg|ico))""", re.IGNORECASE)
JSON_SRC_REGEX = re.compile(r'''"(?:src|url|href)"\s*:\s*"([^"#\s>]+)"''', re.IGNORECASE)



def normalize_target_url(raw_url: str, base_url: str) -> str:
    """Resolve relative/protocol-relative URLs and drop query strings & fragments."""
    joined = urljoin(base_url, raw_url.strip())
    parsed = urlparse(joined)
    clean = parsed._replace(query="", fragment="").geturl()
    return clean


def url_to_local_path(target_url: str, output_root: str) -> str:
    """Convert URL path to a safe local filesystem path preserving directory structure."""
    parsed = urlparse(target_url)
    decoded_path = unquote(parsed.path).lstrip("/")

    if not decoded_path:
        decoded_path = "index.html"

    norm = os.path.normpath(decoded_path)
    if norm.startswith("..") or os.path.isabs(norm):
        norm = norm.replace("..", "").lstrip(os.sep)

    return os.path.join(output_root, norm)


def extract_html_assets(html_content: str, base_url: str) -> set:
    found = set()
    for match in ATTR_REGEX.findall(html_content):
        if match.startswith(("data:", "javascript:", "mailto:", "tel:")):
            continue
        full_url = normalize_target_url(match, base_url)
        found.add(full_url)
    return found


def extract_css_assets(css_content: str, css_url: str) -> set:
    found = set()
    for match in CSS_URL_REGEX.findall(css_content):
        match = match.strip()
        if match.startswith("data:"):
            continue
        full_url = normalize_target_url(match, css_url)
        found.add(full_url)
    return found


def extract_js_assets(js_content: str, js_url: str) -> set:
    found = set()
    for match in JS_ASSET_REGEX.findall(js_content):
        match = match.strip().lstrip("/")
        full_url = normalize_target_url("/" + match, TARGET_BASE)
        found.add(full_url)
    return found


def extract_json_assets(json_content: str, json_url: str) -> set:
    found = set()
    for match in JSON_SRC_REGEX.findall(json_content):
        match = match.strip()
        if match.startswith(("data:", "javascript:")):
            continue
        full_url = normalize_target_url(match, TARGET_BASE)
        found.add(full_url)
    return found




def main():
    target_parsed = urlparse(TARGET_BASE)
    target_netloc = target_parsed.netloc

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    queue = []
    queued_set = set()
    processed_count = 0
    total_bytes = 0
    failed_urls = []

    def enqueue(url: str):
        cleaned = normalize_target_url(url, TARGET_BASE)
        parsed = urlparse(cleaned)
        # Limit to the same domain as target
        if parsed.netloc == target_netloc and cleaned not in queued_set:
            queued_set.add(cleaned)
            queue.append(cleaned)

    # 1. Fetch root HTML shell
    print(f"Fetching root index: {TARGET_BASE}")
    try:
        resp = session.get(TARGET_BASE, timeout=15)
        resp.raise_for_status()
        root_html = resp.text

        index_path = os.path.join(OUTPUT_DIR, "index.html")
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(root_html)

        html_bytes = os.path.getsize(index_path)
        total_bytes += html_bytes
        processed_count += 1
        queued_set.add(normalize_target_url(TARGET_BASE, TARGET_BASE))
        print(f"Saved: {index_path} ({html_bytes:,} bytes)")

        # Enqueue assets discovered in the root HTML
        for asset_url in extract_html_assets(root_html, TARGET_BASE):
            enqueue(asset_url)

    except Exception as exc:
        print(f"Error fetching root index: {exc}", file=sys.stderr)
        return

    # 2. Enqueue explicitly required static assets
    for endpoint in EXTRA_ENDPOINTS:
        enqueue(urljoin(TARGET_BASE, endpoint))

    # 3. Process download queue
    queue_idx = 0
    while queue_idx < len(queue):
        current_url = queue[queue_idx]
        queue_idx += 1

        local_path = url_to_local_path(current_url, OUTPUT_DIR)
        
        # If the path is a directory (e.g. ends with / or has no extension and maps to dir), handle appropriately
        if local_path.endswith(os.sep) or not os.path.splitext(local_path)[1]:
            # If it's a page route like /about, skip or save as /about/index.html if we were mirroring pages
            # But here requirements say static assets. Let's still make sure directory exists.
            pass

        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        try:
            res = session.get(current_url, timeout=15)
            if res.status_code != 200:
                print(f"[SKIP {res.status_code}] {current_url}")
                failed_urls.append((current_url, f"HTTP {res.status_code}"))
                continue

            content = res.content
            with open(local_path, "wb") as f:
                f.write(content)

            file_size = len(content)
            total_bytes += file_size
            processed_count += 1
            print(f"[OK] {current_url} -> {local_path} ({file_size:,} bytes)")

            # Scan CSS for url(...) references
            if local_path.lower().endswith(".css") or "text/css" in res.headers.get("Content-Type", ""):
                css_text = content.decode("utf-8", errors="ignore")
                for css_asset in extract_css_assets(css_text, current_url):
                    enqueue(css_asset)

            # Scan JS for dynamically imported chunks and assets
            elif local_path.lower().endswith(".js") or "javascript" in res.headers.get("Content-Type", ""):
                js_text = content.decode("utf-8", errors="ignore")
                for js_asset in extract_js_assets(js_text, current_url):
                    enqueue(js_asset)

            # Scan manifest / JSON for icons and assets
            elif local_path.lower().endswith((".webmanifest", ".json")) or "json" in res.headers.get("Content-Type", ""):
                json_text = content.decode("utf-8", errors="ignore")
                for json_asset in extract_json_assets(json_text, current_url):
                    enqueue(json_asset)

        except Exception as exc:
            print(f"[FAIL] {current_url}: {exc}")
            failed_urls.append((current_url, str(exc)))

    # Summary report
    print("\n" + "=" * 50)
    print("Download Summary")
    print(f"Files saved successfully: {processed_count}")
    print(f"Total size downloaded:    {total_bytes / (1024 * 1024):.2f} MB ({total_bytes:,} bytes)")
    print(f"Failed / unreachable:     {len(failed_urls)}")
    print("=" * 50)

    print(f"\nTo serve locally, run: python3 -m http.server 8000 --directory {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
