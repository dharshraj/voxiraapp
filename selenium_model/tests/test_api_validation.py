"""API validation: confirm the external services this app depends on
(Supabase project, Supabase Edge Functions) are reachable, without needing
valid secrets — an auth-rejection response (401/400/404) still proves the
endpoint is live and routed correctly. Endpoints identified via source audit
of src/lib/supabase.ts, src/lib/openai.ts, src/services/speechService.ts,
and supabase/functions/*."""
import os
import requests
import pytest
from dotenv import load_dotenv

import config

load_dotenv(config.PROJECT_ROOT / ".env")
load_dotenv(config.PROJECT_ROOT / ".env.local")

SUPABASE_URL = os.environ.get("EXPO_PUBLIC_SUPABASE_URL", "")


def _record(meta, module, scenario, expected, endpoint, method, expected_status_desc, resp=None, error=None):
    meta["module"] = module
    meta["scenario"] = scenario
    meta["expected"] = expected
    if error:
        meta["actual"] = f"Request error: {error}"
    else:
        meta["actual"] = f"{method} {endpoint} -> HTTP {resp.status_code}"


@pytest.mark.skipif(not SUPABASE_URL, reason="EXPO_PUBLIC_SUPABASE_URL not set in .env — cannot validate API reachability")
def test_supabase_rest_root_reachable(meta):
    meta["module"] = "API Validation"
    meta["scenario"] = "Supabase REST endpoint (PostgREST root) responds"
    meta["expected"] = "HTTP response received (any status) proving the project URL is live/DNS-resolvable"
    url = SUPABASE_URL.rstrip("/") + "/rest/v1/"
    try:
        resp = requests.get(url, timeout=10)
        meta["actual"] = f"GET {url} -> HTTP {resp.status_code}"
        assert resp.status_code < 500, f"Supabase REST endpoint returned server error {resp.status_code}"
    except requests.RequestException as e:
        meta["actual"] = f"Request failed: {e}"
        pytest.fail(f"Supabase REST endpoint unreachable: {e}")


@pytest.mark.skipif(not SUPABASE_URL, reason="EXPO_PUBLIC_SUPABASE_URL not set in .env")
def test_supabase_auth_endpoint_rejects_bad_credentials(meta):
    meta["module"] = "API Validation"
    meta["scenario"] = "Supabase Auth token endpoint rejects invalid grant with a structured 400 (not a 5xx/crash)"
    meta["expected"] = "HTTP 400 with an error body, proving the Auth service is live and validating input"
    url = SUPABASE_URL.rstrip("/") + "/auth/v1/token?grant_type=password"
    anon_key = os.environ.get("EXPO_PUBLIC_SUPABASE_ANON_KEY", "")
    try:
        resp = requests.post(
            url,
            json={"email": config.INVALID_EMAIL, "password": config.INVALID_PASSWORD},
            headers={"apikey": anon_key, "Content-Type": "application/json"},
            timeout=10,
        )
        meta["actual"] = f"POST {url} -> HTTP {resp.status_code}"
        assert resp.status_code in (400, 401), f"Expected 400/401 for invalid credentials, got {resp.status_code}"
    except requests.RequestException as e:
        meta["actual"] = f"Request failed: {e}"
        pytest.fail(f"Supabase Auth endpoint unreachable: {e}")


@pytest.mark.skipif(not SUPABASE_URL, reason="EXPO_PUBLIC_SUPABASE_URL not set in .env")
@pytest.mark.parametrize("fn_name", ["assemblyai-transcribe", "assemblyai-poll", "groq-analysis", "openai-proxy"])
def test_supabase_edge_function_deployed(fn_name, meta):
    meta["module"] = "API Validation"
    meta["scenario"] = f"Edge Function '{fn_name}' is deployed and routed (supabase/functions/{fn_name})"
    meta["expected"] = "Non-404 response (401/400/500 acceptable — proves the function exists); 404 means not deployed"
    url = SUPABASE_URL.rstrip("/") + f"/functions/v1/{fn_name}"
    try:
        resp = requests.post(url, json={}, timeout=10)
        meta["actual"] = f"POST {url} -> HTTP {resp.status_code}"
        if fn_name == "openai-proxy":
            # Known dead code per source audit: no client caller. Still report actual status, don't hard-fail the suite.
            pytest.skip(f"openai-proxy has no client-side caller (dead code, see Dead Code sheet) — status was {resp.status_code}")
        assert resp.status_code != 404, f"Edge Function '{fn_name}' returned 404 — not deployed or misrouted"
    except requests.RequestException as e:
        meta["actual"] = f"Request failed: {e}"
        pytest.fail(f"Edge Function '{fn_name}' unreachable: {e}")
