"""Master test orchestrator for VoxiraApp.

Execution order:
  1.  Unit tests          (pytest tests/test_unit.py)
  2.  API validation      (pytest tests/test_api_extended.py)
  3.  Selenium suite      (all remaining Selenium test files)
  4.  Vulnerability scan  (pytest tests/test_vulnerability.py)
  5.  Locust load test    (headless, configurable via env vars)
  6.  Appium tests        (pytest tests/test_appium.py — skipped if server down)
  7.  Excel report        (audit/generate_report.py)

All steps write their results to reports/ before the final report is built,
so the Excel always reflects the latest complete run.

Usage:
    # Full run (all types):
    python selenium_model/run_all.py

    # Skip load test (faster CI run):
    SKIP_LOAD=1 python selenium_model/run_all.py

    # Skip Appium (no device attached):
    SKIP_APPIUM=1 python selenium_model/run_all.py

    # Headed Selenium (watch the browser):
    VOXIRA_HEADLESS=0 python selenium_model/run_all.py
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import config

# ── colour helpers ─────────────────────────────────────────────────────────────
try:
    from colorama import Fore, Style, init as _cinit
    _cinit(autoreset=True)
    def _green(s): return Fore.GREEN + str(s) + Style.RESET_ALL
    def _red(s):   return Fore.RED   + str(s) + Style.RESET_ALL
    def _cyan(s):  return Fore.CYAN  + str(s) + Style.RESET_ALL
    def _yellow(s):return Fore.YELLOW+ str(s) + Style.RESET_ALL
except ImportError:
    def _green(s): return str(s)
    def _red(s):   return str(s)
    def _cyan(s):  return str(s)
    def _yellow(s):return str(s)

# ── step runner ────────────────────────────────────────────────────────────────

_steps: list[dict] = []

def _run(label: str, cmd: list[str], cwd: str | Path = ROOT,
         allow_fail: bool = True) -> int:
    print(f"\n{'─'*60}")
    print(_cyan(f"  ▶  {label}"))
    print(f"     {' '.join(str(c) for c in cmd)}")
    print(f"{'─'*60}")
    t0 = time.time()
    result = subprocess.run(
        [str(c) for c in cmd],
        cwd=str(cwd),
    )
    elapsed = round(time.time() - t0, 1)
    ok = result.returncode == 0
    status = _green("PASS") if ok else _red("FAIL")
    print(f"\n  {status}  {label}  ({elapsed}s, exit={result.returncode})")
    _steps.append({
        "step":       label,
        "command":    " ".join(str(c) for c in cmd),
        "exit_code":  result.returncode,
        "duration_s": elapsed,
        "status":     "Pass" if ok else "Fail",
    })
    if not ok and not allow_fail:
        print(_red(f"  FATAL: '{label}' failed and allow_fail=False — stopping."))
        _write_run_summary()
        sys.exit(result.returncode)
    return result.returncode

def _write_run_summary():
    path = config.REPORTS_DIR / "run_summary.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump({
            "run_at":   datetime.now().isoformat(),
            "steps":    _steps,
            "total":    len(_steps),
            "passed":   sum(1 for s in _steps if s["status"] == "Pass"),
        }, f, indent=2)
    print(f"\n[run_all] Run summary → {path}")

# ── pytest helpers ─────────────────────────────────────────────────────────────

PY   = sys.executable
HTML = str(ROOT / "reports" / "html" / "execution_report.html")

def _pytest(*test_files: str, extra_args: list[str] | None = None) -> list[str]:
    cmd = [
        PY, "-m", "pytest",
        "--tb=short", "-v",
        f"--html={HTML}", "--self-contained-html",
    ]
    cmd += list(test_files)
    if extra_args:
        cmd += extra_args
    return cmd

# ── main ───────────────────────────────────────────────────────────────────────

def main():
    skip_load   = os.environ.get("SKIP_LOAD",   "0") != "0"
    skip_appium = os.environ.get("SKIP_APPIUM", "0") != "0"

    print(_cyan(f"""
╔══════════════════════════════════════════════════════════════╗
║          VoxiraApp Master Test Suite                         ║
║          {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                            ║
╚══════════════════════════════════════════════════════════════╝
"""))

    # ── Step 1: Unit tests (fast, no browser) ─────────────────────────────────
    _run(
        "1/7  Unit Tests",
        _pytest("tests/test_unit.py"),
    )

    # Merge unit results into main JSON under the 'Unit' test_type
    # (conftest already handles this via the _results list + sessionfinish hook)

    # ── Step 2: API Validation tests ──────────────────────────────────────────
    _run(
        "2/7  API Validation Tests",
        _pytest("tests/test_api_extended.py"),
    )

    # ── Step 3: Selenium suite (all UI test files combined) ───────────────────
    selenium_files = [
        "tests/test_smoke.py",
        "tests/test_navigation_extended.py",
        "tests/test_auth_extended.py",
        "tests/test_validation.py",
        "tests/test_ui_extended.py",
        "tests/test_accessibility_and_ui.py",
        "tests/test_performance.py",
        "tests/test_broken_links.py",
        "tests/test_vulnerability.py",
        "tests/test_e2e_flows.py",
    ]
    _run(
        "3/7  Selenium UI + Validation + Performance + Vulnerability",
        _pytest(*selenium_files),
    )

    # ── Step 4: Load test (Locust headless) ───────────────────────────────────
    if skip_load:
        print(_yellow("\n  ⏭  SKIP_LOAD=1 — Locust load test skipped"))
        _steps.append({
            "step": "4/7  Locust Load Test",
            "command": "SKIPPED",
            "exit_code": 0,
            "duration_s": 0,
            "status": "Skipped",
        })
    else:
        locust_cmd = [
            PY, "-m", "locust",
            "-f", str(ROOT / "locust_load.py"),
            "--headless",
            f"--users={config.LOAD_USERS}",
            f"--spawn-rate={config.LOAD_SPAWN_RATE}",
            f"--run-time={config.LOAD_RUN_TIME}",
            f"--host={config.LOAD_TEST_HOST}",
            f"--html={config.LOAD_HEADLESS_REPORT}",
            f"--csv={config.LOAD_CSV_PREFIX}",
        ]
        _run("4/7  Locust Load Test (headless)", locust_cmd)

    # ── Step 5: E2E Flow tests (separate run to isolate auth-skip logic) ──────
    _run(
        "5/7  E2E Flow Tests",
        _pytest("tests/test_e2e_flows.py"),
    )

    # ── Step 6: Appium mobile tests ───────────────────────────────────────────
    if skip_appium:
        print(_yellow("\n  ⏭  SKIP_APPIUM=1 — Appium tests skipped"))
        _steps.append({
            "step": "6/7  Appium Mobile Tests",
            "command": "SKIPPED",
            "exit_code": 0,
            "duration_s": 0,
            "status": "Skipped",
        })
    else:
        _run(
            "6/7  Appium Mobile Tests",
            _pytest("tests/test_appium.py",
                    extra_args=["--timeout=120"]),
        )

    # ── Step 7: Generate Excel report ─────────────────────────────────────────
    _run(
        "7/7  Generate Master Excel Report",
        [PY, str(ROOT / "audit" / "generate_report.py")],
        allow_fail=False,
    )

    # ── Final summary ──────────────────────────────────────────────────────────
    _write_run_summary()
    passed_steps = sum(1 for s in _steps if s["status"] in ("Pass", "Skipped"))
    total_steps  = len(_steps)
    all_passed   = all(s["status"] in ("Pass", "Skipped") for s in _steps)

    print(_cyan(f"""
╔══════════════════════════════════════════════════════════════╗
║  RUN COMPLETE                                                ║
║  Steps: {passed_steps}/{total_steps} passed                                      ║
║  Report: {str(config.EXCEL_REPORT_PATH)[:55]}
╚══════════════════════════════════════════════════════════════╝
"""))

    for s in _steps:
        icon = _green("✓") if s["status"] in ("Pass","Skipped") else _red("✗")
        print(f"  {icon}  {s['step']:48s}  {s['status']} ({s['duration_s']}s)")

    # Count actual test results
    try:
        with open(config.RESULTS_JSON, encoding="utf-8") as f:
            results = json.load(f)
        total   = len(results)
        passed  = sum(1 for r in results if r.get("status") == "Passed")
        failed  = sum(1 for r in results if r.get("status") in ("Failed","Exception"))
        skipped = sum(1 for r in results if r.get("status") == "Skipped")
        rate    = round(100 * passed / total, 1) if total else 0
        print(f"\n  Tests  : {total} total | {_green(passed)} passed | "
              f"{_red(failed)} failed | {_yellow(skipped)} skipped | "
              f"{rate}% pass rate")
        print(f"  Report : {config.EXCEL_REPORT_PATH}")
        print(f"  Live WB: {ROOT / 'REALTIME_TEST_PROGRESS.xlsx'}\n")
    except Exception:
        pass

    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
