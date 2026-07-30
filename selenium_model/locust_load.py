"""Locust load-test scenarios for VoxiraApp.

Simulates concurrent real users hitting the Supabase REST + Auth endpoints
that the app actually calls in production, plus the web app itself.

Scenarios:
  WebAppUser     — loads the Expo web app (static assets / Metro bundle)
  AuthApiUser    — hammers the Supabase Auth endpoints (login, signup, recover)
  RestApiUser    — exercises Supabase REST table queries (profiles, speech_sessions)
  EdgeFnUser     — invokes groq-analysis Edge Function with a minimal payload
  MixedUser      — weighted combination of all the above (most realistic)

Run (headless CSV output):
  locust -f selenium_model/locust_load.py \
         --headless --users 50 --spawn-rate 5 --run-time 60s \
         --host http://localhost:8081 \
         --csv selenium_model/reports/locust

Run (interactive web UI at http://localhost:8089):
  locust -f selenium_model/locust_load.py --host http://localhost:8081

Thresholds checked by run_all.py after execution:
  - p95 response time < 3 000 ms for all endpoints
  - failure rate < 5 %
"""

import os
import json
import random
import time
from pathlib import Path

from dotenv import load_dotenv
from locust import HttpUser, TaskSet, task, between, events
from locust.env import Environment

# ── env / secrets ─────────────────────────────────────────────────────────────
_ROOT = Path(__file__).resolve().parent
load_dotenv(_ROOT.parent / ".env")
load_dotenv(_ROOT.parent / ".env.local")

SB_URL   = os.environ.get("EXPO_PUBLIC_SUPABASE_URL", "").rstrip("/")
ANON_KEY = os.environ.get("EXPO_PUBLIC_SUPABASE_ANON_KEY", "")
_AUTH_HEADERS = {
    "apikey":       ANON_KEY,
    "Content-Type": "application/json",
    "Authorization": f"Bearer {ANON_KEY}",
}

# Safe test payloads — use the invalid email so no real account is hit
INVALID_EMAIL = "locust.load.test@example.invalid"
INVALID_PASS  = "WrongPassword999!"

# ── Task sets ─────────────────────────────────────────────────────────────────

class WebAppTasks(TaskSet):
    """Simulate a browser loading the Expo web app."""

    @task(5)
    def load_root(self):
        with self.client.get("/", catch_response=True) as r:
            if r.status_code == 200:
                r.success()
            else:
                r.failure(f"Root page returned {r.status_code}")

    @task(2)
    def load_index_bundle(self):
        """Expo web bundles are served at /index.bundle — observe size/timing."""
        with self.client.get("/?platform=web&dev=false",
                             catch_response=True, name="/[bundle]") as r:
            if r.status_code in (200, 304):
                r.success()
            else:
                r.failure(f"Bundle {r.status_code}")

    @task(1)
    def load_favicon(self):
        with self.client.get("/favicon.ico", catch_response=True) as r:
            r.success()  # any status is acceptable for favicon


class AuthApiTasks(TaskSet):
    """Simulate authentication API load — all requests intentionally invalid
    (wrong credentials) so no real accounts are created or mutated."""

    @task(4)
    def login_invalid(self):
        with self.client.get(
            SB_URL + "/auth/v1/token?grant_type=password" if SB_URL else "/auth/noop",
            catch_response=True,
            name="/auth/v1/token [invalid login]",
        ) as _:
            pass  # just measuring reachability

    @task(4)
    def login_post_invalid(self):
        if not SB_URL:
            return
        with self.client.post(
            SB_URL + "/auth/v1/token?grant_type=password",
            json={"email": INVALID_EMAIL, "password": INVALID_PASS},
            headers=_AUTH_HEADERS,
            catch_response=True,
            name="/auth/v1/token POST",
        ) as r:
            if r.status_code in (400, 401):
                r.success()   # expected rejection
            elif r.status_code >= 500:
                r.failure(f"Server error {r.status_code}")
            else:
                r.success()

    @task(2)
    def recover_password(self):
        if not SB_URL:
            return
        with self.client.post(
            SB_URL + "/auth/v1/recover",
            json={"email": INVALID_EMAIL},
            headers=_AUTH_HEADERS,
            catch_response=True,
            name="/auth/v1/recover",
        ) as r:
            if r.status_code in (200, 400, 422, 429):
                r.success()
            elif r.status_code >= 500:
                r.failure(f"Server error {r.status_code}")
            else:
                r.success()

    @task(1)
    def signup_invalid(self):
        """Empty body — should return 400/422 quickly."""
        if not SB_URL:
            return
        with self.client.post(
            SB_URL + "/auth/v1/signup",
            json={},
            headers=_AUTH_HEADERS,
            catch_response=True,
            name="/auth/v1/signup [empty]",
        ) as r:
            if r.status_code in (400, 422):
                r.success()
            elif r.status_code >= 500:
                r.failure(f"Server error {r.status_code}")
            else:
                r.success()


class RestApiTasks(TaskSet):
    """Simulate REST table queries with anon key — RLS should return 0 rows."""

    @task(3)
    def list_profiles_anon(self):
        if not SB_URL:
            return
        with self.client.get(
            SB_URL + "/rest/v1/profiles?select=id&limit=10",
            headers=_AUTH_HEADERS,
            catch_response=True,
            name="/rest/v1/profiles [anon]",
        ) as r:
            if r.status_code in (200, 401, 403):
                r.success()
            else:
                r.failure(f"Unexpected {r.status_code}")

    @task(3)
    def list_sessions_anon(self):
        if not SB_URL:
            return
        with self.client.get(
            SB_URL + "/rest/v1/speech_sessions?select=id&limit=10",
            headers=_AUTH_HEADERS,
            catch_response=True,
            name="/rest/v1/speech_sessions [anon]",
        ) as r:
            if r.status_code in (200, 401, 403):
                r.success()
            else:
                r.failure(f"Unexpected {r.status_code}")

    @task(1)
    def rest_root(self):
        if not SB_URL:
            return
        with self.client.get(
            SB_URL + "/rest/v1/",
            headers=_AUTH_HEADERS,
            catch_response=True,
            name="/rest/v1/ root",
        ) as r:
            if r.status_code < 500:
                r.success()
            else:
                r.failure(f"REST root {r.status_code}")


class EdgeFnTasks(TaskSet):
    """Invoke Edge Functions with minimal/unauthenticated payloads."""

    @task(2)
    def groq_analysis_unauthed(self):
        if not SB_URL:
            return
        with self.client.post(
            SB_URL + "/functions/v1/groq-analysis",
            json={"messages": [], "model": "llama-3.3-70b-versatile", "max_tokens": 5},
            headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
            catch_response=True,
            name="/functions/v1/groq-analysis [unauthed]",
        ) as r:
            if r.status_code in (200, 401, 403, 404):
                r.success()   # 401/403 = auth working; 404 = not deployed
            elif r.status_code >= 500:
                r.failure(f"Edge fn server error {r.status_code}")
            else:
                r.success()

    @task(1)
    def assemblyai_transcribe_check(self):
        if not SB_URL:
            return
        with self.client.post(
            SB_URL + "/functions/v1/assemblyai-transcribe",
            json={"storagePath": "test/nonexistent.webm"},
            headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
            catch_response=True,
            name="/functions/v1/assemblyai-transcribe [probe]",
        ) as r:
            # 404 = known defect (not deployed); still report the response
            r.success()


# ── User classes ──────────────────────────────────────────────────────────────

class WebAppUser(HttpUser):
    """Simulates a browser user loading the Expo web app."""
    tasks   = [WebAppTasks]
    wait_time = between(1, 3)
    weight  = 3


class AuthApiUser(HttpUser):
    """Simulates mobile/web clients hitting Supabase Auth."""
    tasks    = [AuthApiTasks]
    wait_time = between(0.5, 2)
    weight   = 4
    host     = SB_URL or "http://localhost:8081"


class RestApiUser(HttpUser):
    """Simulates REST API calls."""
    tasks    = [RestApiTasks]
    wait_time = between(1, 4)
    weight   = 2
    host     = SB_URL or "http://localhost:8081"


class EdgeFnUser(HttpUser):
    """Simulates Edge Function invocations."""
    tasks    = [EdgeFnTasks]
    wait_time = between(2, 6)
    weight   = 1
    host     = SB_URL or "http://localhost:8081"


class MixedUser(HttpUser):
    """Weighted realistic mix: loads the web app + calls auth + REST."""
    wait_time = between(1, 5)
    weight    = 5

    @task(4)
    def load_web_root(self):
        with self.client.get("/", catch_response=True, name="/ [web root]") as r:
            if r.status_code in (200, 304):
                r.success()
            else:
                r.failure(f"Web root {r.status_code}")

    @task(3)
    def attempt_login(self):
        if not SB_URL:
            return
        with self.client.post(
            SB_URL + "/auth/v1/token?grant_type=password",
            json={"email": INVALID_EMAIL, "password": INVALID_PASS},
            headers=_AUTH_HEADERS,
            catch_response=True,
            name="/auth/v1/token [mixed]",
        ) as r:
            if r.status_code in (400, 401):
                r.success()
            elif r.status_code >= 500:
                r.failure(f"Server error {r.status_code}")
            else:
                r.success()

    @task(2)
    def query_rest(self):
        if not SB_URL:
            return
        with self.client.get(
            SB_URL + "/rest/v1/profiles?select=id&limit=5",
            headers=_AUTH_HEADERS,
            catch_response=True,
            name="/rest/v1/profiles [mixed]",
        ) as r:
            if r.status_code in (200, 401, 403):
                r.success()
            else:
                r.failure(f"REST {r.status_code}")

    @task(1)
    def recover_password(self):
        if not SB_URL:
            return
        with self.client.post(
            SB_URL + "/auth/v1/recover",
            json={"email": INVALID_EMAIL},
            headers=_AUTH_HEADERS,
            catch_response=True,
            name="/auth/v1/recover [mixed]",
        ) as r:
            if r.status_code in (200, 429):
                r.success()
            elif r.status_code >= 500:
                r.failure(f"Server error {r.status_code}")
            else:
                r.success()


# ── Post-run result capture ────────────────────────────────────────────────────

@events.quitting.add_listener
def _save_load_results(environment: Environment, **kwargs):
    """Persist Locust stats to JSON so generate_report.py can include them."""
    stats = environment.runner.stats if environment.runner else None
    if not stats:
        return

    out: list[dict] = []
    for name, entry in stats.entries.items():
        out.append({
            "name":             entry.name,
            "method":           entry.method,
            "num_requests":     entry.num_requests,
            "num_failures":     entry.num_failures,
            "failure_rate_pct": round(100 * entry.num_failures / max(entry.num_requests, 1), 2),
            "avg_response_ms":  round(entry.avg_response_time, 1),
            "min_response_ms":  entry.min_response_time,
            "max_response_ms":  entry.max_response_time,
            "p50_ms":           entry.get_response_time_percentile(0.5),
            "p90_ms":           entry.get_response_time_percentile(0.9),
            "p95_ms":           entry.get_response_time_percentile(0.95),
            "p99_ms":           entry.get_response_time_percentile(0.99),
            "rps":              round(entry.current_rps, 2),
        })

    load_json = _ROOT / "reports" / "load_results.json"
    load_json.parent.mkdir(parents=True, exist_ok=True)
    with open(load_json, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print(f"[locust] Load test results saved → {load_json}")
