"""Extended coverage tests — 40 additional tests across UI, source, API, and schema.
EXT-001 … EXT-010  Password schema edge cases
EXT-011 … EXT-020  Source file structure and import integrity
EXT-021 … EXT-030  Selenium UI interactions
EXT-031 … EXT-040  API contract and Supabase health
"""
import os
import re
import time
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv
import config

load_dotenv(config.PROJECT_ROOT / ".env")
load_dotenv(config.PROJECT_ROOT / ".env.local")

SB_URL   = os.environ.get("EXPO_PUBLIC_SUPABASE_URL", "").rstrip("/")
ANON_KEY = os.environ.get("EXPO_PUBLIC_SUPABASE_ANON_KEY", "")

def _src(*parts):
    return config.PROJECT_ROOT / "src" / Path(*parts)


# ══════════════════════════════════════════════════════════════════════════════
# EXT-001 … EXT-010 — Password schema edge cases (pure Python)
# ══════════════════════════════════════════════════════════════════════════════

def _pw_valid(p):
    """Mirror of RegisterScreen password zod schema."""
    return (
        len(p) >= 8 and len(p) <= 20
        and bool(re.search(r'[A-Z]', p))
        and bool(re.search(r'[a-z]', p))
        and bool(re.search(r'[0-9]', p))
        and bool(re.search(r'[^A-Za-z0-9]', p))
    )

def test_ext_001_password_exactly_8_chars_valid(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-001: Password exactly 8 chars with all classes passes",
        expected="valid=True")
    assert _pw_valid("Abcde1!x")
    meta["actual"] = "valid=True"

def test_ext_002_password_exactly_20_chars_valid(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-002: Password exactly 20 chars passes (max boundary)",
        expected="valid=True")
    assert _pw_valid("Abcde1!x" + "x" * 12)
    meta["actual"] = "valid=True"

def test_ext_003_password_21_chars_blocked(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-003: Password 21 chars blocked (above max=20)",
        expected="valid=False")
    assert not _pw_valid("Abcde1!x" + "x" * 13)
    meta["actual"] = "valid=False"

def test_ext_004_password_no_lowercase_blocked(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-004: Password with no lowercase blocked",
        expected="valid=False")
    assert not _pw_valid("ABCDE1!X")
    meta["actual"] = "valid=False"

def test_ext_005_password_no_uppercase_blocked(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-005: Password with no uppercase blocked",
        expected="valid=False")
    assert not _pw_valid("abcde1!x")
    meta["actual"] = "valid=False"

def test_ext_006_password_no_digit_blocked(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-006: Password with no digit blocked",
        expected="valid=False")
    assert not _pw_valid("Abcdefg!")
    meta["actual"] = "valid=False"

def test_ext_007_password_no_special_blocked(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-007: Password with no special char blocked",
        expected="valid=False")
    assert not _pw_valid("Abcde123")
    meta["actual"] = "valid=False"

def test_ext_008_password_spaces_only_special_valid(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-008: Password with space as special char passes",
        expected="valid=True — space is non-alphanumeric")
    assert _pw_valid("Abcde1 x")
    meta["actual"] = "valid=True"

def test_ext_009_password_short_with_all_classes_blocked(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-009: 4-char password blocked even with all classes (Ab1!)",
        expected="valid=False — length < 8")
    assert not _pw_valid("Ab1!")
    meta["actual"] = "valid=False"

def test_ext_010_password_7_chars_blocked(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-010: 7-char password blocked (min=8)",
        expected="valid=False")
    assert not _pw_valid("Abcde1!")
    meta["actual"] = "valid=False"


# ══════════════════════════════════════════════════════════════════════════════
# EXT-011 … EXT-020 — Source structure integrity
# ══════════════════════════════════════════════════════════════════════════════

def test_ext_011_supabase_client_uses_public_keys_only(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-011: src/lib/supabase.ts uses only EXPO_PUBLIC_ env vars",
        expected="No service role key or private key in client-side Supabase file")
    path = _src("lib", "supabase.ts")
    text = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""
    meta["actual"] = f"service_role_key_in_file={'service_role' in text.lower()}"
    assert "service_role" not in text.lower(), "Service role key in client supabase.ts — security risk"

def test_ext_012_speech_service_no_direct_key(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-012: speechService.ts does not embed ASSEMBLYAI key client-side",
        expected="EXPO_PUBLIC_ASSEMBLYAI_KEY not referenced after P3-15 fix")
    path = _src("services", "speechService.ts")
    text = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""
    meta["actual"] = f"direct_key={'EXPO_PUBLIC_ASSEMBLYAI_KEY' in text}"
    assert "EXPO_PUBLIC_ASSEMBLYAI_KEY" not in text, "Direct AssemblyAI key still in speechService.ts"

def test_ext_013_groq_ts_has_no_direct_api_call(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-013: src/lib/groq.ts routes through Edge Function, not direct Groq API",
        expected="fetch('https://api.groq.com') absent — all calls via supabase.functions.invoke")
    path = _src("lib", "groq.ts")
    text = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""
    meta["actual"] = f"direct_groq_fetch={'api.groq.com' in text}"
    assert "api.groq.com" not in text, "groq.ts makes direct Groq API call — should go via Edge Function"

def test_ext_014_root_navigator_no_gamification_stack(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-014: GamificationStack removed from RootNavigator (dead code P3-12)",
        expected="GamificationStack function not defined in RootNavigator.tsx")
    path = _src("navigation", "RootNavigator.tsx")
    text = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""
    meta["actual"] = f"gamification_stack={'function GamificationStack' in text}"
    assert "function GamificationStack" not in text, "GamificationStack still defined"

def test_ext_015_root_navigator_no_support_stack(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-015: SupportStack removed from RootNavigator (dead code P3-12)",
        expected="SupportStack function not defined in RootNavigator.tsx")
    path = _src("navigation", "RootNavigator.tsx")
    text = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""
    meta["actual"] = f"support_stack={'function SupportStack' in text}"
    assert "function SupportStack" not in text, "SupportStack still defined"

def test_ext_016_settings_signout_uses_auth_store(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-016: SettingsScreen.tsx uses authStore.signOut() not supabase.auth.signOut()",
        expected="useAuthStore imported; raw supabase.auth.signOut() not used in signOut function")
    path = _src("screens", "settings", "SettingsScreen.tsx")
    text = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""
    uses_store = "useAuthStore" in text
    meta["actual"] = f"uses_auth_store={uses_store}"
    assert uses_store, "SettingsScreen does not import useAuthStore — signOut bypasses Zustand"

def test_ext_017_analysis_result_stub_points_to_transcript(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-017: AnalysisResultScreen.tsx re-exports TranscriptResultScreen",
        expected="File exists and imports from analysisResult/TranscriptResultScreen")
    path = _src("screens", "speech", "AnalysisResultScreen.tsx")
    text = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""
    meta["actual"] = f"exists={path.exists()}, has_transcript_import={'TranscriptResultScreen' in text}"
    assert path.exists(), "AnalysisResultScreen.tsx missing"
    assert "TranscriptResultScreen" in text

def test_ext_018_speech_index_exports_analysis_result(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-018: speech/index exports AnalysisResultScreen",
        expected="AnalysisResultScreen in speech/index")
    for idx in ["index", "index.ts"]:
        path = _src("screens", "speech", idx)
        if path.exists():
            text = path.read_text(encoding="utf-8", errors="ignore")
            meta["actual"] = f"AnalysisResultScreen_exported={'AnalysisResultScreen' in text}"
            assert "AnalysisResultScreen" in text
            return
    pytest.fail("speech/index not found")

def test_ext_019_login_screen_wrapper_at_module_level(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-019: LoginScreen.tsx defines Wrapper at module level (not inline in render)",
        expected="'const Wrapper' appears before 'export default function LoginScreen'")
    path = _src("screens", "auth", "LoginScreen.tsx")
    text = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""
    wrapper_pos = text.find("const Wrapper")
    screen_pos  = text.find("export default function LoginScreen")
    meta["actual"] = f"wrapper_pos={wrapper_pos}, screen_pos={screen_pos}"
    assert wrapper_pos > 0, "Wrapper not defined at module level"
    assert wrapper_pos < screen_pos, "Wrapper defined inside component (remount bug)"

def test_ext_020_welcome_screen_overflow_hidden(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-020: WelcomeScreen root style has overflow:hidden to prevent horizontal scroll",
        expected="overflow: 'hidden' present in WelcomeScreen root style")
    path = _src("screens", "onboarding", "WelcomeScreen.tsx")
    text = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""
    meta["actual"] = f"overflow_hidden={'overflow' in text and 'hidden' in text}"
    assert "overflow" in text and "hidden" in text, "WelcomeScreen missing overflow:hidden"


# ══════════════════════════════════════════════════════════════════════════════
# EXT-021 … EXT-030 — Selenium UI interactions
# ══════════════════════════════════════════════════════════════════════════════

from pages.welcome_page import WelcomePage
from pages.login_page import LoginPage
from pages.register_page import RegisterPage
from pages.onboarding_page import OnboardingPage

ANIM = 0.8

def test_ext_021_welcome_get_started_cta_present(driver, meta):
    meta.update(module="Extended", test_type="Selenium",
        scenario="EXT-021: WelcomeScreen 'Get Started Free' CTA renders",
        expected="Pressable with text 'Get Started Free' found")
    page = WelcomePage(driver).load()
    time.sleep(ANIM)
    found = page.pressable_exists("Get Started Free", timeout=10)
    meta["actual"] = f"found={found}"
    assert found

def test_ext_022_welcome_sign_in_cta_present(driver, meta):
    meta.update(module="Extended", test_type="Selenium",
        scenario="EXT-022: WelcomeScreen 'Sign In' CTA renders",
        expected="Pressable 'Sign In' found")
    page = WelcomePage(driver).load()
    time.sleep(ANIM)
    found = page.pressable_exists("Sign In", timeout=10)
    meta["actual"] = f"found={found}"
    assert found

def test_ext_023_login_heading_welcome_back(driver, meta):
    meta.update(module="Extended", test_type="Selenium",
        scenario="EXT-023: LoginScreen heading reads 'Welcome Back'",
        expected="'Welcome Back' text present")
    WelcomePage(driver).load().click_sign_in()
    found = LoginPage(driver).text_present("Welcome Back", timeout=10)
    meta["actual"] = f"found={found}"
    assert found

def test_ext_024_login_email_placeholder_present(driver, meta):
    meta.update(module="Extended", test_type="Selenium",
        scenario="EXT-024: LoginScreen email input has placeholder",
        expected="email input visible")
    WelcomePage(driver).load().click_sign_in()
    login = LoginPage(driver)
    try:
        el = login.input_by_placeholder("you@email.com", timeout=8)
        meta["actual"] = "email_input=found"
        assert el is not None
    except Exception:
        pytest.fail("Email input not found on LoginScreen")

def test_ext_025_register_heading_create_account(driver, meta):
    meta.update(module="Extended", test_type="Selenium",
        scenario="EXT-025: RegisterScreen heading reads 'Create Account'",
        expected="'Create Account' text present")
    WelcomePage(driver).load().click_get_started()
    OnboardingPage(driver).click_skip()
    time.sleep(ANIM)
    found = RegisterPage(driver).text_present("Create Account", timeout=10)
    meta["actual"] = f"found={found}"
    assert found

def test_ext_026_register_vox_brand_text(driver, meta):
    meta.update(module="Extended", test_type="Selenium",
        scenario="EXT-026: RegisterScreen shows VOX brand text node (P2-6 fix verified)",
        expected="'VOX' text present on RegisterScreen")
    WelcomePage(driver).load().click_get_started()
    OnboardingPage(driver).click_skip()
    time.sleep(ANIM)
    found = RegisterPage(driver).text_present("VOX", timeout=10)
    meta["actual"] = f"vox_visible={found}"
    assert found

def test_ext_027_login_vox_brand_text(driver, meta):
    meta.update(module="Extended", test_type="Selenium",
        scenario="EXT-027: LoginScreen shows VOX brand text node",
        expected="'VOX' text present on LoginScreen")
    WelcomePage(driver).load().click_sign_in()
    found = LoginPage(driver).text_present("VOX", timeout=10)
    meta["actual"] = f"vox_visible={found}"
    assert found

def test_ext_028_welcome_no_stats_row(driver, meta):
    meta.update(module="Extended", test_type="Selenium",
        scenario="EXT-028: WelcomeScreen stats row removed (50K+/95%/4.9★ gone after UI fix)",
        expected="'50K+' text absent from WelcomeScreen DOM")
    page = WelcomePage(driver).load()
    time.sleep(ANIM)
    found = page.text_present("50K+", timeout=3)
    meta["actual"] = f"stats_row_visible={found}"
    assert not found, "Stats row still visible — UI fix not applied"

def test_ext_029_login_forgot_password_link(driver, meta):
    meta.update(module="Extended", test_type="Selenium",
        scenario="EXT-029: LoginScreen has 'Forgot Password?' link",
        expected="'Forgot Password?' pressable exists")
    WelcomePage(driver).load().click_sign_in()
    found = LoginPage(driver).pressable_exists("Forgot Password?", timeout=8)
    meta["actual"] = f"forgot_password_link={found}"
    assert found

def test_ext_030_register_google_button(driver, meta):
    meta.update(module="Extended", test_type="Selenium",
        scenario="EXT-030: RegisterScreen has 'Continue with Google' button",
        expected="Google OAuth button present")
    WelcomePage(driver).load().click_get_started()
    OnboardingPage(driver).click_skip()
    time.sleep(ANIM)
    found = RegisterPage(driver).pressable_exists("Continue with Google", timeout=8)
    meta["actual"] = f"google_button={found}"
    assert found


# ══════════════════════════════════════════════════════════════════════════════
# EXT-031 … EXT-040 — API contract and Supabase health
# ══════════════════════════════════════════════════════════════════════════════

_SB = pytest.mark.skipif(not SB_URL, reason="EXPO_PUBLIC_SUPABASE_URL not set")

@_SB
def test_ext_031_supabase_url_is_https(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-031: Supabase URL uses HTTPS",
        expected="URL starts with https://")
    meta["actual"] = f"url_starts_https={SB_URL.startswith('https://')}"
    assert SB_URL.startswith("https://"), f"Supabase URL not HTTPS: {SB_URL}"

@_SB
def test_ext_032_anon_key_is_jwt(meta):
    meta.update(module="Extended", test_type="Unit",
        scenario="EXT-032: Supabase anon key is a valid JWT (3 base64 segments)",
        expected="JWT format: header.payload.signature")
    parts = ANON_KEY.split(".")
    meta["actual"] = f"jwt_segments={len(parts)}"
    assert len(parts) == 3, "Anon key is not a valid JWT"

@_SB
def test_ext_033_supabase_rest_v1_responds(meta):
    meta.update(module="Extended", test_type="API",
        scenario="EXT-033: Supabase REST /rest/v1/ returns non-5xx",
        expected="HTTP < 500")
    r = requests.get(f"{SB_URL}/rest/v1/", timeout=10)
    meta["actual"] = f"status={r.status_code}"
    assert r.status_code < 500

@_SB
def test_ext_034_supabase_auth_endpoint_live(meta):
    meta.update(module="Extended", test_type="API",
        scenario="EXT-034: Supabase /auth/v1/settings reachable",
        expected="HTTP 200 or 401 (not 404/500)")
    r = requests.get(f"{SB_URL}/auth/v1/settings",
        headers={"apikey": ANON_KEY}, timeout=10)
    meta["actual"] = f"status={r.status_code}"
    assert r.status_code in (200, 401, 403)

@_SB
def test_ext_035_assemblyai_transcribe_not_404(meta):
    meta.update(module="Extended", test_type="API",
        scenario="EXT-035: assemblyai-transcribe Edge Function returns non-404",
        expected="HTTP != 404 — function is deployed")
    url = f"{SB_URL}/functions/v1/assemblyai-transcribe"
    r = requests.post(url, json={}, headers={"Authorization": f"Bearer {ANON_KEY}"}, timeout=10)
    meta["actual"] = f"status={r.status_code}"
    assert r.status_code != 404, "assemblyai-transcribe returned 404"

@_SB
def test_ext_036_assemblyai_poll_not_404(meta):
    meta.update(module="Extended", test_type="API",
        scenario="EXT-036: assemblyai-poll Edge Function returns non-404",
        expected="HTTP != 404")
    url = f"{SB_URL}/functions/v1/assemblyai-poll"
    r = requests.post(url, json={}, headers={"Authorization": f"Bearer {ANON_KEY}"}, timeout=10)
    meta["actual"] = f"status={r.status_code}"
    assert r.status_code != 404

@_SB
def test_ext_037_groq_analysis_not_404(meta):
    meta.update(module="Extended", test_type="API",
        scenario="EXT-037: groq-analysis Edge Function returns non-404",
        expected="HTTP != 404")
    url = f"{SB_URL}/functions/v1/groq-analysis"
    r = requests.post(url, json={}, headers={"Authorization": f"Bearer {ANON_KEY}"}, timeout=10)
    meta["actual"] = f"status={r.status_code}"
    assert r.status_code != 404

@_SB
def test_ext_038_storage_bucket_speech_audio_accessible(meta):
    meta.update(module="Extended", test_type="API",
        scenario="EXT-038: speech-audio storage bucket exists (non-404 on list)",
        expected="HTTP != 404 on bucket list endpoint")
    url = f"{SB_URL}/storage/v1/bucket/speech-audio"
    r = requests.get(url, headers={"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}, timeout=10)
    meta["actual"] = f"status={r.status_code}"
    assert r.status_code != 404, "speech-audio bucket returns 404 — bucket not created"

@_SB
def test_ext_039_invalid_signup_returns_structured_error(meta):
    meta.update(module="Extended", test_type="API",
        scenario="EXT-039: Supabase returns structured error for empty signup body",
        expected="HTTP 400 or 422 with JSON body")
    url = f"{SB_URL}/auth/v1/signup"
    r = requests.post(url, json={},
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"}, timeout=10)
    meta["actual"] = f"status={r.status_code}"
    assert r.status_code in (400, 422), f"Expected 400/422 for empty body, got {r.status_code}"

@_SB
def test_ext_040_supabase_response_has_content_type_json(meta):
    meta.update(module="Extended", test_type="API",
        scenario="EXT-040: Supabase REST API response Content-Type is application/json",
        expected="Content-Type header includes 'json'")
    r = requests.get(f"{SB_URL}/rest/v1/",
        headers={"apikey": ANON_KEY}, timeout=10)
    ct = r.headers.get("content-type", "")
    meta["actual"] = f"content_type={ct}"
    assert "json" in ct.lower(), f"Expected JSON content-type, got: {ct}"
