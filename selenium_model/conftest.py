"""Pytest configuration: WebDriver fixture, screenshot capture, and JSON result
recording consumed later by audit/generate_report.py to build the Excel workbook."""
import json
import sys
import time
from pathlib import Path

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

sys.path.insert(0, str(Path(__file__).resolve().parent))

import config
from utils import screenshot as screenshot_util

_results = []


@pytest.fixture(scope="session")
def chromedriver_path():
    return ChromeDriverManager().install()


@pytest.fixture
def driver(chromedriver_path):
    opts = Options()
    if config.HEADLESS:
        opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1440,1024")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.set_capability("goog:loggingPrefs", {"browser": "ALL"})

    drv = webdriver.Chrome(service=Service(chromedriver_path), options=opts)
    drv.implicitly_wait(config.IMPLICIT_WAIT)
    drv.set_page_load_timeout(config.PAGE_LOAD_TIMEOUT)
    drv.get(config.BASE_URL)

    yield drv

    # Dump browser console logs for the test as evidence.
    try:
        logs = drv.get_log("browser")
        if logs:
            log_path = config.LOGS_DIR / f"console_{int(time.time() * 1000)}.log"
            with open(log_path, "w", encoding="utf-8") as f:
                for entry in logs:
                    f.write(f"{entry.get('level')} {entry.get('message')}\n")
    except Exception:
        pass

    drv.quit()


@pytest.fixture
def meta():
    """Tests populate this dict with reporting metadata consumed by the
    makereport hook below: module, scenario, expected, actual."""
    return {
        "module": "General",
        "scenario": "",
        "expected": "",
        "actual": "",
    }


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()

    if report.when != "call":
        return

    duration = report.duration
    meta_dict = item.funcargs.get("meta", {}) if hasattr(item, "funcargs") else {}
    drv = item.funcargs.get("driver") if hasattr(item, "funcargs") else None

    if report.passed:
        status = "Passed"
    elif report.failed:
        # Distinguish assertion failures (functional defects) from unexpected
        # exceptions (driver/element/environment errors).
        if call.excinfo is not None and call.excinfo.errisinstance(AssertionError):
            status = "Failed"
        else:
            status = "Exception"
    elif report.skipped:
        status = "Skipped"
    else:
        status = "Unknown"

    screenshot_path = ""
    if drv is not None and status in ("Passed", "Failed", "Exception"):
        bucket = {"Passed": "passed", "Failed": "failed", "Exception": "exceptions"}[status]
        screenshot_path = screenshot_util.capture(drv, item.name, bucket)

    _results.append({
        "test_id": item.nodeid,
        "name": item.name,
        "module": meta_dict.get("module", "General"),
        "scenario": meta_dict.get("scenario", item.name),
        "expected": meta_dict.get("expected", ""),
        "actual": meta_dict.get("actual", "") or (str(report.longrepr)[:500] if report.failed else "As expected"),
        "status": status,
        "duration_sec": round(duration, 2),
        "screenshot": screenshot_path,
    })


def pytest_sessionfinish(session, exitstatus):
    with open(config.RESULTS_JSON, "w", encoding="utf-8") as f:
        json.dump(_results, f, indent=2)
