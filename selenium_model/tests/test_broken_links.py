"""Broken-link validation.

This app has no multi-page URL routing (no `linking` config on
NavigationContainer — confirmed in source audit), so there is nothing to
crawl in the traditional "click every <a href>" sense. Instead this suite
validates every external http(s) URL referenced from application source
(API base URLs, OAuth redirect targets, doc/policy links) actually resolves."""
import re
from pathlib import Path

import pytest
import requests

import config

URL_RE = re.compile(r"https?://[^\s'\"\`)]+")
SKIP_SUBSTRINGS = ("localhost", "127.0.0.1", "schema.org", "example.com", "w3.org", "fonts.googleapis.com")


def _discover_source_urls():
    urls = set()
    src_dir = config.PROJECT_ROOT / "src"
    fn_dir = config.PROJECT_ROOT / "supabase" / "functions"
    for base in (src_dir, fn_dir):
        if not base.exists():
            continue
        for path in base.rglob("*.ts*"):
            try:
                text = path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            for m in URL_RE.findall(text):
                url = m.rstrip(").,;")
                if not any(s in url for s in SKIP_SUBSTRINGS):
                    urls.add(url)
    return sorted(urls)


DISCOVERED_URLS = _discover_source_urls()


@pytest.mark.parametrize("url", DISCOVERED_URLS or ["__none_found__"])
def test_external_source_url_resolves(url, meta):
    meta["module"] = "Broken Links"
    meta["scenario"] = f"External URL referenced in source resolves: {url}"
    meta["expected"] = "HTTP status < 500 (401/403/404 acceptable for auth-gated APIs; 5xx / connection error is not)"
    if url == "__none_found__":
        pytest.skip("No external URLs discovered in source beyond localhost/known-safe domains")
    try:
        resp = requests.head(url, timeout=10, allow_redirects=True)
        if resp.status_code == 405:  # some hosts reject HEAD
            resp = requests.get(url, timeout=10, allow_redirects=True)
        meta["actual"] = f"HTTP {resp.status_code}"
        assert resp.status_code < 500, f"{url} returned server error {resp.status_code}"
    except requests.RequestException as e:
        meta["actual"] = f"Request failed: {e}"
        pytest.fail(f"{url} is unreachable: {e}")
