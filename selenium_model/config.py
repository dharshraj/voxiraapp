"""Central configuration for the VoxiraApp Selenium test framework."""
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT_DIR.parent

BASE_URL = os.environ.get("VOXIRA_BASE_URL", "http://localhost:8081")

HEADLESS = os.environ.get("VOXIRA_HEADLESS", "1") != "0"
IMPLICIT_WAIT = 3
EXPLICIT_WAIT = 15
PAGE_LOAD_TIMEOUT = 45

REPORTS_DIR = ROOT_DIR / "reports"
SCREENSHOTS_DIR = REPORTS_DIR / "screenshots"
SCREENSHOTS_PASSED = SCREENSHOTS_DIR / "passed"
SCREENSHOTS_FAILED = SCREENSHOTS_DIR / "failed"
SCREENSHOTS_EXCEPTIONS = SCREENSHOTS_DIR / "exceptions"
HTML_REPORT_DIR = REPORTS_DIR / "html"
LOGS_DIR = REPORTS_DIR / "logs"
EVIDENCE_DIR = REPORTS_DIR / "evidence"
RESULTS_JSON = REPORTS_DIR / "test_results.json"

# Test account credentials (never real prod credentials — expected to fail
# gracefully / be skipped if no such account exists in the target Supabase
# project). Override via env vars for a real authorized test account.
TEST_USER_EMAIL = os.environ.get("VOXIRA_TEST_EMAIL", "qa.selenium.test@example.com")
TEST_USER_PASSWORD = os.environ.get("VOXIRA_TEST_PASSWORD", "QaTest123!Selenium")
INVALID_EMAIL = "not-a-real-user@example.com"
INVALID_PASSWORD = "wrongpassword"

for d in (SCREENSHOTS_PASSED, SCREENSHOTS_FAILED, SCREENSHOTS_EXCEPTIONS,
          HTML_REPORT_DIR, LOGS_DIR, EVIDENCE_DIR):
    d.mkdir(parents=True, exist_ok=True)
