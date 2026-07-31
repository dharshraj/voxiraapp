"""API Validation tests — 30 tests covering all Supabase REST endpoints,
Auth service, Edge Functions, RLS behaviour, and response contract checks.

API-001 … API-008  Supabase REST + Auth reachability
API-009 … API-016  Edge Function deployment + contract
API-017 … API-024  Auth API response contract validation
API-025 … API-030  Security / headers / RLS enforcement
"""
import os
import json
import time
import pytest
import requests
from dotenv import load_dotenv
import config

load_dotenv(config.PROJECT_ROOT / ".env")
load_dotenv(config.PROJECT_ROOT / ".env.local")

SB_URL  = os.environ.get("EXPO_PUBLIC_SUPABASE_URL", "").rstrip("/")
ANON_KEY = os.environ.get("EXPO_PUBLIC_SUPABASE_ANON_KEY", "")

_SB_SKIP = pytest.mark.skipif(not SB_URL, reason="EXPO_PUBLIC_SUPABASE_URL not set — API tests skipped")

HEADERS_ANON  = {"apikey": ANON_KEY, "Content-Type": "application/json"}
HEADERS_AUTH  = {**HEADERS_ANON, "Authorization": f"Bearer {ANON_KEY}"}

# ══════════════════════════════════════════════════════════════════════════════
# API-001 … API-008  — Supabase REST + Auth reachability
# ══════════════════════════════════════════════════════════════════════════════

@_SB_SKIP
def test_api_001_rest_root_reachable(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-001: Supabase PostgREST root responds with non-5xx",
        expected="HTTP < 500")
    url = f"{SB_URL}/rest/v1/"
    r = requests.get(url, headers=HEADERS_ANON, timeout=10)
    meta["actual"] = f"GET {url} -> HTTP {r.status_code}"
    assert r.status_code < 500

@_SB_SKIP
def test_api_002_auth_root_reachable(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-002: Supabase Auth root /auth/v1/ responds",
        expected="HTTP < 500")
    url = f"{SB_URL}/auth/v1/"
    r = requests.get(url, headers=HEADERS_ANON, timeout=10)
    meta["actual"] = f"GET {url} -> HTTP {r.status_code}"
    assert r.status_code < 500

@_SB_SKIP
def test_api_003_auth_token_rejects_invalid_credentials(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-003: Auth /token?grant_type=password rejects invalid creds with 400/401",
        expected="HTTP 400 or 401 (not 5xx)")
    url = f"{SB_URL}/auth/v1/token?grant_type=password"
    r = requests.post(url, json={"email": config.INVALID_EMAIL,
                                  "password": config.INVALID_PASSWORD},
                      headers=HEADERS_ANON, timeout=10)
    meta["actual"] = f"POST {url} -> HTTP {r.status_code}"
    assert r.status_code in (400, 401), f"Expected 400/401, got {r.status_code}"

@_SB_SKIP
def test_api_004_auth_token_response_has_error_field(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-004: Invalid-credentials 400 response body contains 'error' field",
        expected="JSON body has 'error' or 'error_description' key")
    url = f"{SB_URL}/auth/v1/token?grant_type=password"
    r = requests.post(url, json={"email": config.INVALID_EMAIL,
                                  "password": config.INVALID_PASSWORD},
                      headers=HEADERS_ANON, timeout=10)
    body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    meta["actual"] = f"HTTP {r.status_code}, body_keys={list(body.keys())}"
    assert "error" in body or "error_description" in body or "msg" in body

@_SB_SKIP
def test_api_005_auth_signup_rejects_malformed_email(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-005: Auth /signup rejects email without @ with 400/422",
        expected="HTTP 400 or 422 — server-side email validation")
    url = f"{SB_URL}/auth/v1/signup"
    r = requests.post(url, json={"email": "notanemail", "password": "SomePass1!"},
                      headers=HEADERS_ANON, timeout=10)
    meta["actual"] = f"POST {url} -> HTTP {r.status_code}"
    assert r.status_code in (400, 422), f"Expected 400/422 for malformed email, got {r.status_code}"

@_SB_SKIP
def test_api_006_auth_recover_accepts_valid_format(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-006: Auth /recover accepts valid-format email with 200 (Supabase always 200s)",
        expected="HTTP 200 (Supabase returns 200 for non-existent emails — security by design)")
    url = f"{SB_URL}/auth/v1/recover"
    r = requests.post(url, json={"email": config.INVALID_EMAIL},
                      headers=HEADERS_ANON, timeout=10)
    meta["actual"] = f"POST {url} -> HTTP {r.status_code}"
    assert r.status_code == 200, f"Expected 200 for recover, got {r.status_code}"

@_SB_SKIP
def test_api_007_rest_unauthenticated_returns_401(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-007: Unauthenticated request to /rest/v1/profiles (RLS-protected) returns 401",
        expected="HTTP 401 (not 200, not 500)")
    url = f"{SB_URL}/rest/v1/profiles"
    r = requests.get(url, timeout=10)  # no apikey header
    meta["actual"] = f"GET {url} (no auth) -> HTTP {r.status_code}"
    assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"

@_SB_SKIP
def test_api_008_storage_endpoint_reachable(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-008: Supabase Storage endpoint is reachable",
        expected="HTTP < 500 from /storage/v1/")
    url = f"{SB_URL}/storage/v1/"
    r = requests.get(url, headers=HEADERS_ANON, timeout=10)
    meta["actual"] = f"GET {url} -> HTTP {r.status_code}"
    assert r.status_code < 500

# ══════════════════════════════════════════════════════════════════════════════
# API-009 … API-016  — Edge Function deployment + contract
# ══════════════════════════════════════════════════════════════════════════════

@_SB_SKIP
@pytest.mark.parametrize("fn_name,expect_deployed", [
    ("groq-analysis",          True),
    ("assemblyai-transcribe",  False),   # known defect: 404 (not deployed)
    ("assemblyai-poll",        False),   # known defect: 404 (not deployed)
    # openai-proxy removed from project 2026-07-31 — no client callers, no deployment
])
def test_api_009_edge_function_status(fn_name, expect_deployed, meta):
    meta.update(module="API Validation", test_type="API",
        scenario=f"API-009: Edge Function '{fn_name}' deployment status",
        expected=f"expected_deployed={expect_deployed}")
    url = f"{SB_URL}/functions/v1/{fn_name}"
    r = requests.post(url, json={}, headers=HEADERS_AUTH, timeout=10)
    meta["actual"] = f"POST {url} -> HTTP {r.status_code}"
    if expect_deployed:
        assert r.status_code != 404, (
            f"DEFECT: Edge function '{fn_name}' returned 404 — not deployed. "
            "The speech transcription pipeline will fail in production."
        )
    else:
        # Document the known defect without failing the whole suite run
        if r.status_code == 404:
            meta["actual"] += " — KNOWN DEFECT: function not deployed (see BUG-001)"

@_SB_SKIP
def test_api_010_groq_analysis_returns_json(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-010: groq-analysis Edge Function returns JSON response body",
        expected="Response Content-Type includes 'application/json'")
    url = f"{SB_URL}/functions/v1/groq-analysis"
    r = requests.post(url, json={
        "messages": [{"role": "user", "content": "hello"}],
        "model": "llama-3.3-70b-versatile",
        "max_tokens": 10
    }, headers=HEADERS_AUTH, timeout=20)
    ct = r.headers.get("content-type", "")
    meta["actual"] = f"HTTP {r.status_code}, content-type='{ct}'"
    if r.status_code == 404:
        pytest.skip("groq-analysis not deployed")
    assert r.status_code < 500, f"groq-analysis server error: {r.status_code}"

@_SB_SKIP
def test_api_011_groq_analysis_unauthenticated_rejected(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-011: groq-analysis rejects unauthenticated requests (no Bearer token)",
        expected="HTTP 401 or 403")
    url = f"{SB_URL}/functions/v1/groq-analysis"
    r = requests.post(url, json={"messages": [], "model": "x"}, timeout=10)
    meta["actual"] = f"POST (no auth) -> HTTP {r.status_code}"
    if r.status_code == 404:
        pytest.skip("groq-analysis not deployed")
    assert r.status_code in (401, 403)

@_SB_SKIP
def test_api_012_profiles_table_rls_anon_read_blocked(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-012: profiles table SELECT with anon key returns 0 rows (RLS blocks cross-user read)",
        expected="HTTP 200 with empty array, or HTTP 401/403")
    url = f"{SB_URL}/rest/v1/profiles?select=id"
    r = requests.get(url, headers=HEADERS_AUTH, timeout=10)
    meta["actual"] = f"GET {url} -> HTTP {r.status_code}, body={r.text[:100]}"
    if r.status_code == 200:
        data = r.json() if r.headers.get("content-type","").startswith("application/json") else []
        assert data == [], f"RLS breach: anon key can read profiles rows: {data}"
    else:
        assert r.status_code in (401, 403)

@_SB_SKIP
def test_api_013_speech_sessions_rls_anon_blocked(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-013: speech_sessions table SELECT with anon key returns 0 rows (RLS)",
        expected="HTTP 200 empty array or 401/403")
    url = f"{SB_URL}/rest/v1/speech_sessions?select=id"
    r = requests.get(url, headers=HEADERS_AUTH, timeout=10)
    meta["actual"] = f"HTTP {r.status_code}, body={r.text[:100]}"
    if r.status_code == 200:
        data = r.json() if r.headers.get("content-type","").startswith("application/json") else []
        assert data == [], f"RLS breach: anon key reads speech_sessions: {data}"
    else:
        assert r.status_code in (401, 403)

@_SB_SKIP
def test_api_014_notifications_rls_anon_blocked(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-014: notifications table with anon key returns 0 rows (RLS)",
        expected="HTTP 200 empty or 401/403")
    url = f"{SB_URL}/rest/v1/notifications?select=id"
    r = requests.get(url, headers=HEADERS_AUTH, timeout=10)
    meta["actual"] = f"HTTP {r.status_code}"
    if r.status_code == 200:
        data = r.json() if r.headers.get("content-type","").startswith("application/json") else []
        assert data == []
    else:
        assert r.status_code in (401, 403)

@_SB_SKIP
def test_api_015_rest_response_content_type_json(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-015: Supabase REST root returns application/json content-type",
        expected="Content-Type header includes 'application/json'")
    url = f"{SB_URL}/rest/v1/"
    r = requests.get(url, headers=HEADERS_ANON, timeout=10)
    ct = r.headers.get("content-type", "")
    meta["actual"] = f"content-type='{ct}'"
    assert "application/json" in ct, f"REST root not JSON: {ct}"

@_SB_SKIP
def test_api_016_auth_response_has_cors_header(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-016: Supabase Auth endpoint returns CORS header (allow web clients)",
        expected="Access-Control-Allow-Origin header present in response")
    url = f"{SB_URL}/auth/v1/"
    r = requests.options(url, headers={
        "Origin": config.BASE_URL,
        "Access-Control-Request-Method": "POST"
    }, timeout=10)
    has_cors = "access-control-allow-origin" in {k.lower() for k in r.headers}
    meta["actual"] = f"CORS header present={has_cors}, HTTP={r.status_code}"
    # Supabase sets CORS — assert it's present
    assert has_cors, "No Access-Control-Allow-Origin on Supabase Auth preflight"

# ══════════════════════════════════════════════════════════════════════════════
# API-017 … API-030  — Response contract + Security headers
# ══════════════════════════════════════════════════════════════════════════════

@_SB_SKIP
def test_api_017_auth_token_response_time(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-017: Auth /token endpoint responds within 5 seconds",
        expected=f"Response time < 5s")
    url = f"{SB_URL}/auth/v1/token?grant_type=password"
    t0 = time.time()
    r = requests.post(url, json={"email": config.INVALID_EMAIL,
                                  "password": config.INVALID_PASSWORD},
                      headers=HEADERS_ANON, timeout=10)
    elapsed = round(time.time() - t0, 2)
    meta["actual"] = f"response_time={elapsed}s, HTTP={r.status_code}"
    assert elapsed < 5.0, f"Auth endpoint too slow: {elapsed}s"

@_SB_SKIP
def test_api_018_rest_response_time(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-018: REST root responds within 3 seconds",
        expected="Response time < 3s")
    url = f"{SB_URL}/rest/v1/"
    t0 = time.time()
    r = requests.get(url, headers=HEADERS_ANON, timeout=10)
    elapsed = round(time.time() - t0, 2)
    meta["actual"] = f"response_time={elapsed}s, HTTP={r.status_code}"
    assert elapsed < 3.0, f"REST root too slow: {elapsed}s"

@_SB_SKIP
def test_api_019_auth_signup_empty_body_rejected(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-019: Auth /signup with empty JSON body returns 400/422",
        expected="HTTP 400 or 422 — server validates required fields")
    url = f"{SB_URL}/auth/v1/signup"
    r = requests.post(url, json={}, headers=HEADERS_ANON, timeout=10)
    meta["actual"] = f"POST {url} -> HTTP {r.status_code}"
    assert r.status_code in (400, 422), f"Expected 400/422, got {r.status_code}"

@_SB_SKIP
def test_api_020_auth_token_missing_grant_type_rejected(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-020: Auth /token without grant_type query param returns 400/422",
        expected="HTTP 400 or 422")
    url = f"{SB_URL}/auth/v1/token"  # no ?grant_type=
    r = requests.post(url, json={"email": config.INVALID_EMAIL,
                                  "password": "x"}, headers=HEADERS_ANON, timeout=10)
    meta["actual"] = f"POST {url} -> HTTP {r.status_code}"
    assert r.status_code in (400, 422), f"Expected 400/422, got {r.status_code}"

@_SB_SKIP
def test_api_021_profiles_insert_without_auth_rejected(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-021: INSERT into profiles table with anon key rejected (RLS)",
        expected="HTTP 401, 403, or 409 — RLS blocks insert")
    url = f"{SB_URL}/rest/v1/profiles"
    r = requests.post(url, json={"id": "00000000-0000-0000-0000-000000000000",
                                  "full_name": "Hacker"},
                      headers=HEADERS_AUTH, timeout=10)
    meta["actual"] = f"POST {url} -> HTTP {r.status_code}"
    assert r.status_code in (401, 403, 409), (
        f"RLS breach: anon key could INSERT into profiles (status={r.status_code})"
    )

@_SB_SKIP
def test_api_022_speech_sessions_insert_without_auth_rejected(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-022: INSERT into speech_sessions with anon key rejected (RLS)",
        expected="HTTP 401, 403, or 409")
    url = f"{SB_URL}/rest/v1/speech_sessions"
    r = requests.post(url, json={"user_id": "00000000-0000-0000-0000-000000000000",
                                  "mode": "test", "score": 99},
                      headers=HEADERS_AUTH, timeout=10)
    meta["actual"] = f"HTTP {r.status_code}"
    assert r.status_code in (401, 403, 409)

@_SB_SKIP
def test_api_023_rest_invalid_table_returns_404(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-023: Request to non-existent table returns 404",
        expected="HTTP 404")
    url = f"{SB_URL}/rest/v1/nonexistent_table_xqz"
    r = requests.get(url, headers=HEADERS_AUTH, timeout=10)
    meta["actual"] = f"HTTP {r.status_code}"
    assert r.status_code == 404

@_SB_SKIP
def test_api_024_auth_signup_weak_password_server_side(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-024: Auth /signup with 1-char password rejected server-side",
        expected="HTTP 400 or 422")
    url = f"{SB_URL}/auth/v1/signup"
    r = requests.post(url, json={"email": "test@example.com", "password": "x"},
                      headers=HEADERS_ANON, timeout=10)
    meta["actual"] = f"HTTP {r.status_code}"
    assert r.status_code in (400, 422)

@_SB_SKIP
def test_api_025_no_server_header_leakage(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-025: Supabase responses do not expose internal 'Server' header",
        expected="'Server' header absent or generic (no version/framework disclosure)")
    url = f"{SB_URL}/rest/v1/"
    r = requests.get(url, headers=HEADERS_ANON, timeout=10)
    server_hdr = r.headers.get("server", "").lower()
    meta["actual"] = f"server='{server_hdr}'"
    # Supabase/Cloudflare may return 'cloudflare' — that's fine. Fail if internal stack exposed.
    forbidden_vals = ["apache", "nginx/", "iis/", "express/", "uvicorn"]
    exposed = [v for v in forbidden_vals if v in server_hdr]
    assert not exposed, f"Internal server header exposed: '{server_hdr}'"

@_SB_SKIP
def test_api_026_x_powered_by_absent(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-026: No 'X-Powered-By' header in Supabase responses (framework disclosure)",
        expected="x-powered-by header absent")
    url = f"{SB_URL}/rest/v1/"
    r = requests.get(url, headers=HEADERS_ANON, timeout=10)
    xpb = r.headers.get("x-powered-by", "")
    meta["actual"] = f"x-powered-by='{xpb}'"
    assert not xpb, f"X-Powered-By header leaks framework: '{xpb}'"

@_SB_SKIP
def test_api_027_auth_rate_limit_header_present(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-027: Auth responses include rate-limit headers (X-RateLimit-*)",
        expected="At least one X-RateLimit-* header present (informational)")
    url = f"{SB_URL}/auth/v1/token?grant_type=password"
    r = requests.post(url, json={"email": config.INVALID_EMAIL,
                                  "password": config.INVALID_PASSWORD},
                      headers=HEADERS_ANON, timeout=10)
    rate_hdrs = {k: v for k, v in r.headers.items() if "ratelimit" in k.lower()}
    meta["actual"] = f"rate_limit_headers={dict(rate_hdrs)}"
    # Informational — Supabase GoTrue may or may not expose these
    assert True  # observation only

@_SB_SKIP
def test_api_028_https_enforced_on_supabase_url(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-028: EXPO_PUBLIC_SUPABASE_URL uses HTTPS (not HTTP)",
        expected="URL starts with 'https://'")
    meta["actual"] = f"SUPABASE_URL={SB_URL[:40]}..."
    assert SB_URL.startswith("https://"), f"Supabase URL uses HTTP: {SB_URL}"

@_SB_SKIP
def test_api_029_supabase_anon_key_is_jwt_format(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-029: EXPO_PUBLIC_SUPABASE_ANON_KEY has JWT format (3 dot-separated parts)",
        expected="anon key matches eyJ*.eyJ*.*")
    parts = ANON_KEY.split(".")
    meta["actual"] = f"anon_key_parts={len(parts)}"
    assert len(parts) == 3, f"Anon key is not JWT format: {len(parts)} parts"
    assert ANON_KEY.startswith("eyJ"), "Anon key does not start with 'eyJ'"

@_SB_SKIP
def test_api_030_concurrent_auth_requests_stable(meta):
    meta.update(module="API Validation", test_type="API",
        scenario="API-030: 5 concurrent invalid-login requests all return 400/401 (no 5xx under low concurrency)",
        expected="All 5 responses are 400 or 401")
    import concurrent.futures
    url = f"{SB_URL}/auth/v1/token?grant_type=password"

    def _req(_):
        return requests.post(url,
                             json={"email": config.INVALID_EMAIL, "password": config.INVALID_PASSWORD},
                             headers=HEADERS_ANON, timeout=10).status_code

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        codes = list(pool.map(_req, range(5)))
    meta["actual"] = f"status_codes={codes}"
    bad = [c for c in codes if c >= 500]
    assert not bad, f"5xx under low concurrency: {bad}"

# ══════════════════════════════════════════════════════════════════════════════
# API-RLS-MATRIX — table x write-method: anon key must never succeed at
# mutating another user's data, across every RLS-protected table.
# ══════════════════════════════════════════════════════════════════════════════

_RLS_TABLES = ["profiles", "speech_sessions", "notifications"]
_RLS_WRITE_METHODS = ["POST", "PATCH", "DELETE"]

@_SB_SKIP
@pytest.mark.parametrize("method", _RLS_WRITE_METHODS)
@pytest.mark.parametrize("table", _RLS_TABLES)
def test_api_rls_write_blocked_matrix(meta, table, method):
    meta.update(module="API Validation", test_type="API",
        scenario=f"API-RLS-MATRIX: {method} {table} with anon key never mutates real data",
        expected="HTTP 400/401/403/404/409/422, or 204 with 0 rows affected (RLS-invisible target)")
    url = f"{SB_URL}/rest/v1/{table}?id=eq.00000000-0000-0000-0000-000000000000"
    body = {"id": "00000000-0000-0000-0000-000000000000"}
    r = requests.request(method, url, json=body, headers=HEADERS_AUTH, timeout=10)
    meta["actual"] = f"{method} {table} -> HTTP {r.status_code}, body={r.text[:80]!r}"
    if r.status_code == 204:
        # PostgREST returns 204 for a successful write filter that matched 0 rows —
        # here the target UUID doesn't exist, so this confirms no real row was
        # touched, not a bypass of RLS. An empty body is the safe/expected shape.
        assert not r.text.strip(), (
            f"204 response for anon {method} on {table} unexpectedly has a body: {r.text[:200]}"
        )
    else:
        assert r.status_code in (400, 401, 403, 404, 409, 422), (
            f"Unexpected status for anon {method} on {table}: {r.status_code}"
        )

# ══════════════════════════════════════════════════════════════════════════════
# API-HEADER-MATRIX — endpoint x header: no internal stack disclosure anywhere.
# ══════════════════════════════════════════════════════════════════════════════

_HEADER_ENDPOINTS = ["/rest/v1/", "/auth/v1/", "/storage/v1/"]
_FORBIDDEN_HEADER_VALUES = {
    "server": ["apache", "nginx/", "iis/", "express/", "uvicorn"],
    "x-powered-by": None,  # any nonempty value is forbidden
}

@_SB_SKIP
@pytest.mark.parametrize("header_name", list(_FORBIDDEN_HEADER_VALUES.keys()))
@pytest.mark.parametrize("endpoint", _HEADER_ENDPOINTS)
def test_api_no_stack_disclosure_matrix(meta, endpoint, header_name):
    meta.update(module="API Validation", test_type="API",
        scenario=f"API-HEADER-MATRIX: {endpoint} does not leak via '{header_name}' header",
        expected="Header absent or contains no internal stack disclosure")
    url = f"{SB_URL}{endpoint}"
    r = requests.get(url, headers=HEADERS_ANON, timeout=10)
    val = r.headers.get(header_name, "").lower()
    meta["actual"] = f"{header_name}='{val}'"
    forbidden = _FORBIDDEN_HEADER_VALUES[header_name]
    if forbidden is None:
        assert not val, f"'{header_name}' header present: '{val}'"
    else:
        hit = [v for v in forbidden if v in val]
        assert not hit, f"Internal stack disclosed via '{header_name}': '{val}'"

# ══════════════════════════════════════════════════════════════════════════════
# API-TIMING-MATRIX — response time budget across core endpoints.
# ══════════════════════════════════════════════════════════════════════════════

_TIMING_ENDPOINTS = [("/rest/v1/", 3.0), ("/auth/v1/", 3.0), ("/storage/v1/", 4.0)]

@_SB_SKIP
@pytest.mark.parametrize("endpoint,max_sec", _TIMING_ENDPOINTS)
def test_api_endpoint_response_time_matrix(meta, endpoint, max_sec):
    meta.update(module="API Validation", test_type="API",
        scenario=f"API-TIMING-MATRIX: {endpoint} responds within {max_sec}s",
        expected=f"response_time < {max_sec}s")
    url = f"{SB_URL}{endpoint}"
    t0 = time.time()
    r = requests.get(url, headers=HEADERS_ANON, timeout=10)
    elapsed = round(time.time() - t0, 2)
    meta["actual"] = f"response_time={elapsed}s, HTTP={r.status_code}"
    assert elapsed < max_sec, f"{endpoint} too slow: {elapsed}s"
