"""Builds selenium_model/MASTER_TEST_AUDIT_REPORT.xlsx — the single master
workbook combining live Selenium execution results (reports/test_results.json,
produced by conftest.py during `pytest`) with the static source-code audit
(audit_data.py). Run after `pytest` so live results are present; if the JSON
file is missing this still produces a complete audit-only workbook and says
so in the Executive Summary.
"""
import json
import re
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config
import audit_data as ad

OUTPUT_PATH = config.ROOT_DIR / "MASTER_TEST_AUDIT_REPORT.xlsx"


def load_test_results():
    if config.RESULTS_JSON.exists():
        with open(config.RESULTS_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def count_project_files():
    exts = {".ts", ".tsx", ".js", ".jsx"}
    count = 0
    for p in (config.PROJECT_ROOT / "src").rglob("*"):
        if p.is_file() and p.suffix in exts:
            count += 1
    return count


def build_executive_summary(results, defect_count):
    total = len(results)
    passed = sum(1 for r in results if r["status"] == "Passed")
    failed = sum(1 for r in results if r["status"] == "Failed")
    exceptions = sum(1 for r in results if r["status"] == "Exception")
    skipped = sum(1 for r in results if r["status"] == "Skipped")
    coverage_pct = round(100 * passed / total, 1) if total else 0.0

    rows = [
        ("Project Name", ad.PROJECT_NAME),
        ("Project Type", ad.PROJECT_TYPE),
        ("Scan Date", datetime.now().strftime("%Y-%m-%d %H:%M")),
        ("Total Source Files (src/, .ts/.tsx/.js/.jsx)", count_project_files()),
        ("Total Pages / Screens Discovered", len(ad.FUNCTIONALITY_MAP)),
        ("Total Functionalities Mapped", len(ad.FUNCTIONALITY_MAP) + len(ad.AUTH_FEATURES)),
        ("Total Selenium/API Tests Executed", total),
        ("Passed", passed),
        ("Failed", failed),
        ("Exceptions", exceptions),
        ("Skipped", skipped),
        ("Test Pass Rate", f"{coverage_pct}%"),
        ("Total Bugs/Defects Found (see Defect Report sheet)", defect_count),
        ("Unused Files Identified", len(ad.UNUSED_FILES)),
        ("Dead Code Instances Identified", len(ad.DEAD_CODE)),
        ("Note", "This app is an Expo/React Native web build with no server-rendered "
                 "multi-page routing, payment flow, RBAC, or pagination — those requested "
                 "categories are marked Not Applicable in the Functional Coverage sheet "
                 "with the evidence for that determination, rather than being scored."),
    ]
    return pd.DataFrame(rows, columns=["Metric", "Value"])


def build_functional_test_results(results):
    rows = []
    for i, r in enumerate(results, start=1):
        rows.append({
            "Test ID": f"TC-{i:03d}",
            "Module": r["module"],
            "Scenario": r["scenario"],
            "Expected Result": r["expected"],
            "Actual Result": r["actual"],
            "Status": r["status"],
            "Execution Time (s)": r["duration_sec"],
            "Screenshot Path": r["screenshot"],
        })
    if not rows:
        rows.append({
            "Test ID": "N/A", "Module": "N/A", "Scenario": "No test run recorded — run `pytest` before generate_report.py",
            "Expected Result": "", "Actual Result": "", "Status": "N/A", "Execution Time (s)": "", "Screenshot Path": "",
        })
    return pd.DataFrame(rows)


COVERAGE_BY_MODULE = {
    "WelcomeScreen": "Fully Covered",
    "Feature1/2/3Screen": "Partially Covered",
    "LoginScreen": "Fully Covered",
    "RegisterScreen": "Fully Covered",
    "ForgotPasswordScreen": "Fully Covered",
}


def build_functional_coverage(results):
    tested_scenarios = " | ".join(r["scenario"] for r in results).lower()
    rows = []
    for page, functionality, src in ad.FUNCTIONALITY_MAP:
        key = page.split(" ")[0].split("/")[0]
        if key.lower().replace("screen", "") in tested_scenarios or page in COVERAGE_BY_MODULE:
            status = COVERAGE_BY_MODULE.get(page, "Partially Covered")
            remarks = "Exercised by Selenium navigation/auth/form-validation suites"
        else:
            status = "Not Covered"
            remarks = "Requires an authenticated test session (VOXIRA_TEST_EMAIL/PASSWORD) which was not provided — see test_auth.py scope note"
        rows.append({"Page": page, "Functionality": functionality, "Coverage Status": status, "Remarks": f"{remarks} ({src})"})
    for name, reason in ad.NOT_APPLICABLE:
        rows.append({"Page": "N/A", "Functionality": name, "Coverage Status": "Not Applicable", "Remarks": reason})
    return pd.DataFrame(rows)


# Live test names already folded into a hand-curated LIVE_CONFIRMED_DEFECTS entry above,
# with fuller root-cause detail than the raw test failure message — don't double-list them.
_CURATED_TEST_NAME_SUBSTRINGS = (
    "test_no_horizontal_overflow_on_welcome_screen",
    "test_supabase_edge_function_deployed",
)
# Historical: test_forgot_password_malformed_email_validation used to fail here 2 of 3 runs
# with a TimeoutException. Root-caused (not a flake): LoginScreen and ForgotPasswordScreen
# share the exact placeholder "you@email.com", React Navigation keeps the previous screen
# mounted-but-hidden (0x0) rather than unmounting it on push, and the old locator always
# resolved to the first DOM match regardless of visibility — i.e. the hidden Login input.
# Fixed in pages/base_page.py (input_by_placeholder/input_by_type now scan all matches for
# the first *visible* one) and reverified passing 3/3 in isolation. Kept as an empty dict
# (rather than deleted) so the mechanism is documented for the next genuinely flaky test.
_KNOWN_TEST_INFRA_FLAKES = {}


def build_defect_report(results):
    rows = []
    bug_n = 1
    for name, module, desc, sev in ad.LIVE_CONFIRMED_DEFECTS:
        rows.append({
            "Bug ID": f"BUG-{bug_n:03d}", "Module": module.split(",")[0].split("(")[0].strip(),
            "Description": name, "Steps to Reproduce": desc,
            "Severity": sev, "Evidence": "Live Selenium/API execution — see reports/logs and reports/screenshots", "Status": "Open",
        })
        bug_n += 1
    for r in results:
        if r["status"] not in ("Failed", "Exception"):
            continue
        if any(s in r["name"] for s in _CURATED_TEST_NAME_SUBSTRINGS):
            continue  # already captured above with more detail
        if r["name"] in _KNOWN_TEST_INFRA_FLAKES:
            rows.append({
                "Bug ID": f"BUG-{bug_n:03d}", "Module": "Test Infrastructure (selenium_model)",
                "Description": f"[Test flake, not a confirmed product defect] {r['scenario']}",
                "Steps to Reproduce": _KNOWN_TEST_INFRA_FLAKES[r["name"]],
                "Severity": "Low", "Evidence": r["screenshot"] or "See reports/logs", "Status": "Needs Investigation",
            })
            bug_n += 1
            continue
        rows.append({
            "Bug ID": f"BUG-{bug_n:03d}",
            "Module": r["module"],
            "Description": r["scenario"],
            "Steps to Reproduce": f"Run selenium_model/tests via pytest; see test node {r['test_id']}",
            "Severity": "High" if r["status"] == "Exception" else "Medium",
            "Evidence": r["screenshot"] or "See reports/logs",
            "Status": "Open",
        })
        bug_n += 1
    # Static defects from code audit (latent bugs, not live-test failures)
    static_defects = [
        ("Broken barrel export: SubscriptionScreen", "src/screens/settings/index", "Barrel file exports a component from a file that does not exist", "High"),
        ("Broken barrel export: LeaderboardScreen", "src/screens/profile/index", "Barrel file exports a component from a file that does not exist", "High"),
        ("Broken barrel export: AnalysisResultScreen", "src/screens/speech/index", "Barrel file exports a component from a file that does not exist", "High"),
        ("Unreachable navigation target", "src/screens/auth/SplashScreen.tsx:100", "navigation.replace('MainTabs') targets a screen name not registered in OnboardingStack — would throw if reached", "Medium"),
        ("HelpScreen unreachable", "src/screens/settings/HelpScreen.tsx", "Fully built screen never registered in RootNavigator.tsx", "Medium"),
    ]
    for desc, module, steps, sev in static_defects:
        rows.append({
            "Bug ID": f"BUG-{bug_n:03d}", "Module": module, "Description": desc,
            "Steps to Reproduce": steps, "Severity": sev, "Evidence": "Static source audit", "Status": "Open",
        })
        bug_n += 1
    if not rows:
        rows.append({"Bug ID": "N/A", "Module": "N/A", "Description": "No defects found", "Steps to Reproduce": "", "Severity": "", "Evidence": "", "Status": ""})
    return pd.DataFrame(rows)


def build_unused_files():
    return pd.DataFrame(ad.UNUSED_FILES, columns=["File Name", "Path", "Reason", "Severity"])


def build_dead_code():
    return pd.DataFrame(ad.DEAD_CODE, columns=["File", "Function or Class", "Line Number", "Recommendation"])


def build_broken_links(results):
    rows = []
    for r in results:
        if r["module"] == "Broken Links":
            m = re.search(r"HTTP (\d+)", r["actual"])
            status_code = m.group(1) if m else "ERROR"
            url = r["scenario"].split(": ", 1)[-1]
            rows.append({
                "URL": url, "Source Page": "Application source (API base URLs)",
                "Status Code": status_code, "Result": r["status"],
            })
    if not rows:
        rows.append({"URL": "N/A", "Source Page": "N/A", "Status Code": "N/A",
                      "Result": "No external URLs discovered outside localhost/known-safe domains in src/ or supabase/functions/"})
    return pd.DataFrame(rows)


def build_accessibility_findings(results):
    rows = []
    for r in results:
        if r["module"] == "Accessibility":
            rows.append({
                "Page": "WelcomeScreen (representative — same pattern app-wide)",
                "Issue": r["scenario"],
                "Severity": "Medium" if r["status"] != "Passed" else "Info",
                "Recommendation": r["actual"],
            })
    rows.append({
        "Page": "App-wide", "Issue": "Zero aria-* attributes, zero semantic <button>/<a> tags, zero data-testid hooks — every interactive element is a bare <div tabindex=\"0\"> (react-native-web Pressable/TouchableOpacity output)",
        "Severity": "High", "Recommendation": "Add accessibilityLabel/accessibilityRole props in RN source (they map to aria-* on web) and testID props (map to a stable automation hook) to every Pressable/TouchableOpacity/TextInput.",
    })
    return pd.DataFrame(rows)


def build_api_validation(results):
    rows = []
    for r in results:
        if r["module"] == "API Validation":
            m = re.match(r"(\w+) (\S+) -> HTTP (\d+)", r["actual"])
            method, endpoint, actual_status = (m.group(1), m.group(2), m.group(3)) if m else ("?", r["scenario"], "?")
            rows.append({
                "Endpoint": endpoint, "Method": method,
                "Expected Status": r["expected"], "Actual Status": actual_status, "Result": r["status"],
            })
    if not rows:
        rows.append({"Endpoint": "N/A", "Method": "N/A", "Expected Status": "N/A", "Actual Status": "N/A",
                      "Result": "No API validation tests executed (EXPO_PUBLIC_SUPABASE_URL missing or pytest not run)"})
    return pd.DataFrame(rows)


def build_ui_validation(results):
    rows = []
    for r in results:
        if r["module"] == "UI Validation":
            rows.append({"Page": "WelcomeScreen", "Issue": r["scenario"],
                          "Severity": "Low" if r["status"] == "Passed" else "Medium", "Evidence": r["actual"]})
    if not rows:
        rows.append({"Page": "N/A", "Issue": "No UI validation tests executed", "Severity": "N/A", "Evidence": "N/A"})
    return pd.DataFrame(rows)


def build_performance(results):
    rows = []
    for r in results:
        if r["module"] == "Performance":
            rows.append({"Page": "WelcomeScreen", "Load Time": f"{r['duration_sec']}s (test duration)",
                          "Observation": r["actual"],
                          "Recommendation": "Dev-mode Metro bundler is unminified/uncached; re-measure against a production `expo export --platform web` build for real user-facing numbers."})
    if not rows:
        rows.append({"Page": "N/A", "Load Time": "N/A", "Observation": "No performance tests executed", "Recommendation": "N/A"})
    return pd.DataFrame(rows)


def build_user_journeys(results):
    journeys = {
        "New user onboarding → Register (Skip path)": ["test_onboarding_get_started_reaches_feature_carousel", "test_onboarding_skip_reaches_register"],
        "Returning user → Login → invalid credentials handled": ["test_login_invalid_credentials_shows_error"],
        "User explores auth navigation (Welcome→Login→Register→ForgotPassword→back)": [
            "test_welcome_to_login_navigation", "test_login_to_register_navigation",
            "test_login_to_forgot_password_navigation", "test_forgot_password_return_to_login",
        ],
    }
    by_name = {r["name"]: r for r in results}
    rows = []
    for journey, steps in journeys.items():
        step_results = [by_name.get(s) for s in steps]
        if not any(step_results):
            continue
        overall = "Passed" if all(sr and sr["status"] == "Passed" for sr in step_results if sr) else "Partial/Failed"
        evidence = "; ".join(sr["screenshot"] for sr in step_results if sr and sr["screenshot"])
        rows.append({"Journey Name": journey, "Steps": " -> ".join(steps), "Result": overall, "Evidence": evidence or "See Functional Test Results sheet"})
    if not rows:
        rows.append({"Journey Name": "N/A", "Steps": "N/A", "Result": "No journeys executed — run pytest first", "Evidence": "N/A"})
    return pd.DataFrame(rows)


def build_security_observations():
    return pd.DataFrame(ad.SECURITY_OBSERVATIONS, columns=["Area", "Observation", "Severity", "Recommendation"])


def build_code_health_summary():
    rows = []
    for name, desc, sev in ad.DUPLICATE_OR_INCONSISTENT:
        rows.append({"Category": "Duplicate/Inconsistent Implementation", "Finding": f"{name}: {desc}", "Severity": sev, "Recommendation": "See Recommendations sheet"})
    rows.append({"Category": "Large File", "Finding": ad.LARGE_FILES_NOTE, "Severity": "Medium", "Recommendation": "Split RootNavigator.tsx into the already-scaffolded stack files, or delete the empty stubs."})
    rows.append({"Category": "Dead Code Volume", "Finding": f"{len(ad.DEAD_CODE)} confirmed dead-code instances across navigation, barrels, and TODO service stubs", "Severity": "Medium", "Recommendation": "See Dead Code sheet"})
    rows.append({"Category": "Unused Files Volume", "Finding": f"{len(ad.UNUSED_FILES)} unused/orphaned files, including 7 empty component stubs and 4 empty navigation stack stubs", "Severity": "Medium", "Recommendation": "See Unused Files sheet"})
    return pd.DataFrame(rows)


def build_recommendations():
    return pd.DataFrame(ad.RECOMMENDATIONS, columns=["Priority", "Recommendation", "Business Impact"])


def autosize(writer, sheet_name, df):
    ws = writer.sheets[sheet_name]
    for i, col in enumerate(df.columns):
        try:
            max_len = max(df[col].astype(str).map(len).max(), len(str(col))) + 2
        except ValueError:
            max_len = len(str(col)) + 2
        ws.set_column(i, i, min(max_len, 80))
    ws.freeze_panes(1, 0)


def main():
    results = load_test_results()
    defect_df = build_defect_report(results)

    sheets = {
        "Executive Summary": build_executive_summary(results, len(defect_df)),
        "Functional Test Results": build_functional_test_results(results),
        "Functional Coverage": build_functional_coverage(results),
        "Defect Report": defect_df,
        "Unused Files": build_unused_files(),
        "Dead Code": build_dead_code(),
        "Broken Links": build_broken_links(results),
        "Accessibility Findings": build_accessibility_findings(results),
        "API Validation Results": build_api_validation(results),
        "UI Validation Findings": build_ui_validation(results),
        "Performance Observations": build_performance(results),
        "User Journey Results": build_user_journeys(results),
        "Security Observations": build_security_observations(),
        "Code Health Summary": build_code_health_summary(),
        "Recommendations": build_recommendations(),
    }

    with pd.ExcelWriter(OUTPUT_PATH, engine="xlsxwriter") as writer:
        workbook = writer.book
        header_fmt = workbook.add_format({"bold": True, "bg_color": "#1F2937", "font_color": "white", "border": 1})
        for name, df in sheets.items():
            df.to_excel(writer, sheet_name=name[:31], index=False, startrow=0)
            ws = writer.sheets[name[:31]]
            for col_num, col_name in enumerate(df.columns):
                ws.write(0, col_num, col_name, header_fmt)
            autosize(writer, name[:31], df)

    print(f"Wrote {OUTPUT_PATH} with {len(sheets)} sheets, {len(results)} live test results.")


if __name__ == "__main__":
    main()
