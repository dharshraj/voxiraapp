"""Central configuration for the VoxiraApp test framework.

Covers Selenium (web), Appium (mobile), Load (Locust), Security/Vulnerability,
Unit tests, and Excel report generation. All settings are overridable via
environment variables so CI/CD pipelines never need to edit this file.
"""
import os
from pathlib import Path

# ── Directory roots ───────────────────────────────────────────────────────────
ROOT_DIR     = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT_DIR.parent

# ── Auto-load .env.test if VOXIRA_TEST_EMAIL not already set in environment ───
# This means running `python -m pytest` directly (without run_tests.ps1) still
# picks up the QA credentials automatically.
_env_test = ROOT_DIR / ".env.test"
if _env_test.exists() and os.environ.get("VOXIRA_TEST_EMAIL", "") == "":
    with open(_env_test, encoding="utf-8") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                _k, _v = _k.strip(), _v.strip()
                # Only set if not already in environment (env vars take priority)
                if _k and not os.environ.get(_k):
                    os.environ[_k] = _v

# ── Web target ────────────────────────────────────────────────────────────────
BASE_URL = os.environ.get("VOXIRA_BASE_URL", "http://localhost:8081")

# ── Selenium options ──────────────────────────────────────────────────────────
HEADLESS            = os.environ.get("VOXIRA_HEADLESS", "1") != "0"
IMPLICIT_WAIT       = int(os.environ.get("VOXIRA_IMPLICIT_WAIT", "3"))
EXPLICIT_WAIT       = int(os.environ.get("VOXIRA_EXPLICIT_WAIT", "15"))
PAGE_LOAD_TIMEOUT   = int(os.environ.get("VOXIRA_PAGE_LOAD_TIMEOUT", "45"))
BROWSER             = os.environ.get("VOXIRA_BROWSER", "chrome")   # chrome | firefox | edge
WINDOW_WIDTH        = int(os.environ.get("VOXIRA_WINDOW_WIDTH", "1440"))
WINDOW_HEIGHT       = int(os.environ.get("VOXIRA_WINDOW_HEIGHT", "1024"))

# Viewport presets used by responsive/UI tests
VIEWPORT_PRESETS = {
    "desktop_hd":  (1920, 1080),
    "desktop":     (1440, 1024),
    "laptop":      (1280, 800),
    "tablet_land": (1024, 768),
    "tablet_port": (768, 1024),
    "mobile_lg":   (414, 896),
    "mobile_sm":   (375, 667),
    "mobile_xs":   (320, 568),
}

# ── Appium (mobile) ───────────────────────────────────────────────────────────
APPIUM_SERVER_URL   = os.environ.get("APPIUM_SERVER_URL",   "http://localhost:4723")
ANDROID_APP_PATH    = os.environ.get("ANDROID_APP_PATH",    str(PROJECT_ROOT / "dist" / "voxira.apk"))
IOS_APP_PATH        = os.environ.get("IOS_APP_PATH",        str(PROJECT_ROOT / "dist" / "voxira.ipa"))
ANDROID_DEVICE_NAME = os.environ.get("ANDROID_DEVICE_NAME", "10BD6G2LZ0000FK")
IOS_DEVICE_NAME     = os.environ.get("IOS_DEVICE_NAME",     "iPhone 15 Simulator")
ANDROID_PLATFORM_VERSION = os.environ.get("ANDROID_PLATFORM_VERSION", "15")
IOS_PLATFORM_VERSION     = os.environ.get("IOS_PLATFORM_VERSION",     "17.0")
APPIUM_IMPLICIT_WAIT     = int(os.environ.get("APPIUM_IMPLICIT_WAIT", "5"))

# ── Expo Go deep-link for Appium ──────────────────────────────────────────────
# When ANDROID_USE_EXPO_GO=1, Appium launches Expo Go (host.exp.exponent) and
# deep-links it to the local dev server instead of installing the APK.
# This works around Android 15 16KB page-size incompatibility with native builds.
# Requires: npx expo start --android running so the Metro bundler is live.
_expo_go_mode = os.environ.get("ANDROID_USE_EXPO_GO", "1") == "1"
# Expo dev server LAN URL — replace with the IP shown by `npx expo start`
EXPO_LAN_URL = os.environ.get("EXPO_LAN_URL", "exp://172.23.50.100:8081")

ANDROID_DESIRED_CAPS = {
    "platformName":           "Android",
    "appium:deviceName":      ANDROID_DEVICE_NAME,
    "appium:platformVersion": ANDROID_PLATFORM_VERSION,
    "appium:automationName":  "UiAutomator2",
    "appium:noReset":         True,
    "appium:newCommandTimeout": 120,
    # Use Expo Go instead of native APK
    "appium:appPackage":      "host.exp.exponent",
    "appium:appActivity":     "host.exp.launcher.LauncherActivity",
    "appium:intentAction":    "android.intent.action.VIEW",
    "appium:intentCategory":  "android.intent.category.BROWSABLE",
    "appium:intentFlags":     "0x10000000",
    "appium:optionalIntentArguments": f"--es url {EXPO_LAN_URL} --esn newSession",
}

IOS_DESIRED_CAPS = {
    "platformName":         "iOS",
    "appium:deviceName":    IOS_DEVICE_NAME,
    "appium:platformVersion": IOS_PLATFORM_VERSION,
    "appium:app":           IOS_APP_PATH,
    "appium:automationName": "XCUITest",
    "appium:noReset":       False,
    "appium:newCommandTimeout": 120,
}

# ── Load / Performance (Locust) ───────────────────────────────────────────────
LOAD_TEST_HOST          = os.environ.get("LOAD_TEST_HOST",          BASE_URL)
LOAD_USERS              = int(os.environ.get("LOAD_USERS",              "50"))
LOAD_SPAWN_RATE         = int(os.environ.get("LOAD_SPAWN_RATE",         "5"))
LOAD_RUN_TIME           = os.environ.get("LOAD_RUN_TIME",               "60s")
LOAD_HEADLESS_REPORT    = os.environ.get("LOAD_HEADLESS_REPORT",         str(ROOT_DIR / "reports" / "locust_report.html"))
LOAD_CSV_PREFIX         = os.environ.get("LOAD_CSV_PREFIX",              str(ROOT_DIR / "reports" / "locust"))

# Thresholds used in performance assertion tests
PERF_WELCOME_LOAD_MAX_SEC   = float(os.environ.get("PERF_WELCOME_LOAD_MAX_SEC",  "8.0"))
PERF_LOGIN_LOAD_MAX_SEC     = float(os.environ.get("PERF_LOGIN_LOAD_MAX_SEC",    "6.0"))
PERF_DASHBOARD_LOAD_MAX_SEC = float(os.environ.get("PERF_DASHBOARD_LOAD_MAX_SEC","10.0"))
PERF_DOM_CONTENT_LOADED_MAX = int(os.environ.get("PERF_DOM_CONTENT_LOADED_MAX",  "5000"))  # ms
PERF_FIRST_PAINT_MAX_MS     = int(os.environ.get("PERF_FIRST_PAINT_MAX_MS",      "3000"))
PERF_LOAD_EVENT_MAX_MS      = int(os.environ.get("PERF_LOAD_EVENT_MAX_MS",       "10000"))
PERF_API_RESPONSE_MAX_SEC   = float(os.environ.get("PERF_API_RESPONSE_MAX_SEC",  "3.0"))
PERF_CONCURRENT_USERS       = int(os.environ.get("PERF_CONCURRENT_USERS",        "10"))

# ── Security / Vulnerability ──────────────────────────────────────────────────
# Common XSS payloads for injection tests
XSS_PAYLOADS = [
    "<script>alert('xss')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(1)",
    "'><script>alert(document.cookie)</script>",
    "<svg onload=alert(1)>",
    "\"onmouseover=\"alert(1)",
    "<SCRIPT>alert('XSS')</SCRIPT>",
    "&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;",
    "<iframe src=javascript:alert(1)>",
    "';alert(String.fromCharCode(88,83,83))//",
]

# SQL injection payloads
SQLI_PAYLOADS = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM auth.users --",
    "admin'--",
    "1' OR '1' = '1' /*",
    "' OR 1=1--",
    "') OR ('1'='1",
]

# Path traversal payloads
PATH_TRAVERSAL_PAYLOADS = [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "....//....//....//etc/passwd",
]

# Security headers that should be present
REQUIRED_SECURITY_HEADERS = [
    "x-content-type-options",
    "x-frame-options",
    "referrer-policy",
]

# Security headers that should NOT be present (information leakage)
FORBIDDEN_RESPONSE_HEADERS = [
    "x-powered-by",
    "server",
]

# Patterns that indicate secret exposure
SECRET_PATTERNS = [
    r"GROQ_API_KEY\s*=\s*['\"]?gsk_[A-Za-z0-9]+",
    r"supabase_service_role_key\s*=\s*['\"][A-Za-z0-9._-]{100,}",
    r"eyJ[A-Za-z0-9_-]{50,}\.[A-Za-z0-9_-]{50,}\.[A-Za-z0-9_-]{10,}",  # JWT
    r"sk-[A-Za-z0-9]{48}",    # OpenAI key
    r"password\s*[:=]\s*['\"][^'\"]{6,}['\"]",
]

# Supabase anon key starts with "eyJ" — whitelisted to avoid false positive
ANON_KEY_PREFIX = "eyJ"

# ── Test credentials ──────────────────────────────────────────────────────────
TEST_USER_EMAIL    = os.environ.get("VOXIRA_TEST_EMAIL",    "qa.selenium.test@example.com")
TEST_USER_PASSWORD = os.environ.get("VOXIRA_TEST_PASSWORD", "QaTest123!Selenium")
INVALID_EMAIL      = "not-a-real-user@example.com"
INVALID_PASSWORD   = "wrongpassword"

# Boundary-value inputs
SHORT_NAME         = "AB"                  # 2 chars — below min(3)
MIN_VALID_NAME     = "ABC"                 # 3 chars — exactly min
MAX_VALID_NAME     = "A" * 20             # 20 chars — exactly max
OVER_MAX_NAME      = "A" * 21             # 21 chars — above max
SHORT_PASSWORD     = "Ab1!"               # 4 chars — below min(8)
MIN_VALID_PASSWORD = "Abcde1!x"           # 8 chars — exactly min
MAX_VALID_PASSWORD = "Abcde1!x" + "x"*12  # 20 chars — exactly max
OVER_MAX_PASSWORD  = "Abcde1!x" + "x"*13  # 21 chars — above max
VALID_EMAIL        = "qa.boundary@example.com"
INVALID_EMAIL_NO_AT= "notanemail"
INVALID_EMAIL_NO_TLD = "user@nodot"
UNICODE_NAME       = "Ün1c ödé"           # unicode in name field
LONG_EMAIL         = "a" * 100 + "@example.com"
SQL_EMAIL          = "' OR '1'='1@example.com"
XSS_NAME           = "<script>alert(1)</script>"
EMOJI_NAME         = "😀 User 🎤"
WHITESPACE_ONLY    = "   "

# ── Report paths ──────────────────────────────────────────────────────────────
REPORTS_DIR           = ROOT_DIR / "reports"
SCREENSHOTS_DIR       = REPORTS_DIR / "screenshots"
SCREENSHOTS_PASSED    = SCREENSHOTS_DIR / "passed"
SCREENSHOTS_FAILED    = SCREENSHOTS_DIR / "failed"
SCREENSHOTS_EXCEPTIONS= SCREENSHOTS_DIR / "exceptions"
HTML_REPORT_DIR       = REPORTS_DIR / "html"
LOGS_DIR              = REPORTS_DIR / "logs"
EVIDENCE_DIR          = REPORTS_DIR / "evidence"
RESULTS_JSON          = REPORTS_DIR / "test_results.json"
APPIUM_RESULTS_JSON   = REPORTS_DIR / "appium_results.json"
UNIT_RESULTS_JSON     = REPORTS_DIR / "unit_results.json"
LOAD_RESULTS_JSON     = REPORTS_DIR / "load_results.json"
VULN_RESULTS_JSON     = REPORTS_DIR / "vulnerability_results.json"
EXCEL_REPORT_PATH     = ROOT_DIR / "MASTER_TEST_AUDIT_REPORT.xlsx"

# Create all report directories on import
for _d in (
    SCREENSHOTS_PASSED, SCREENSHOTS_FAILED, SCREENSHOTS_EXCEPTIONS,
    HTML_REPORT_DIR, LOGS_DIR, EVIDENCE_DIR,
):
    _d.mkdir(parents=True, exist_ok=True)
