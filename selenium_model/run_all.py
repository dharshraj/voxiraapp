"""Convenience entry point: run the full Selenium suite, then build the
Excel + Markdown reports. Equivalent to running the two commands manually:

    pytest --html=reports/html/execution_report.html --self-contained-html
    python audit/generate_report.py
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main():
    pytest_cmd = [
        sys.executable, "-m", "pytest",
        "--html=reports/html/execution_report.html", "--self-contained-html",
    ]
    print("Running:", " ".join(pytest_cmd))
    subprocess.run(pytest_cmd, cwd=str(ROOT))  # exit code intentionally ignored — continue to report generation even on test failures

    report_cmd = [sys.executable, str(ROOT / "audit" / "generate_report.py")]
    print("Running:", " ".join(report_cmd))
    subprocess.run(report_cmd, cwd=str(ROOT), check=True)


if __name__ == "__main__":
    main()
