# ─────────────────────────────────────────────────────────────────────────────
# VoxiraApp — Full Test Suite Runner (PowerShell)
# Run from the selenium_model/ directory:
#   cd selenium_model
#   .\run_tests.ps1
#
# PREREQUISITES (complete all before running):
#   1. npx expo start --web   (running in a separate terminal at localhost:8081)
#   2. Appium Server running  (npx appium  OR  Appium Desktop)
#   3. Android device connected via USB with USB debugging ON
#   4. APK installed on device (see APK_PATH below — set after eas build)
#   5. pip install -r requirements.txt  (if not already done)
# ─────────────────────────────────────────────────────────────────────────────

# ── QA credentials ────────────────────────────────────────────────────────────
$env:VOXIRA_TEST_EMAIL    = "dharshiniraj641@gmail.com"
$env:VOXIRA_TEST_PASSWORD = "Dhasu@10"

# ── Selenium config ───────────────────────────────────────────────────────────
$env:VOXIRA_BASE_URL       = "http://localhost:8081"
$env:VOXIRA_HEADLESS       = "0"          # 0 = show browser, 1 = headless
$env:VOXIRA_WINDOW_WIDTH   = "1440"
$env:VOXIRA_WINDOW_HEIGHT  = "1024"
$env:VOXIRA_BROWSER        = "chrome"
$env:VOXIRA_IMPLICIT_WAIT  = "3"
$env:VOXIRA_EXPLICIT_WAIT  = "15"

# ── Appium / Android config ────────────────────────────────────────────────────
# After running: adb devices
# Copy the serial (e.g. R3CN90ABCDE or emulator-5554) into ANDROID_DEVICE_NAME
$env:APPIUM_SERVER_URL         = "http://localhost:4723"
$env:ANDROID_APP_PATH          = "$PSScriptRoot\..\dist\voxira.apk"
$env:ANDROID_DEVICE_NAME       = "REPLACE_WITH_ADB_SERIAL"   # <-- fill this in
$env:ANDROID_PLATFORM_VERSION  = "REPLACE_WITH_ANDROID_VERSION"  # e.g. "13" or "14"

# ── Performance thresholds ─────────────────────────────────────────────────────
$env:PERF_DOM_CONTENT_LOADED_MAX = "5000"
$env:PERF_LOAD_EVENT_MAX_MS      = "10000"
$env:PERF_FIRST_PAINT_MAX_MS     = "3000"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1: Selenium + Unit + Performance + Vulnerability + Validation tests
#         (all tests that run against the web browser)
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  STEP 1/3 — Selenium + Unit + Perf + Vuln + Validation tests" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

python -m pytest tests/ `
  --ignore=tests/test_appium.py `
  -v `
  --tb=short `
  --html=reports/html/execution_report.html `
  --self-contained-html `
  -n auto `
  2>&1

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2: Appium tests (Android — requires USB device + APK)
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  STEP 2/3 — Appium Android tests (USB device required)" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

# Check Appium server is reachable before bothering
try {
    $status = Invoke-RestMethod -Uri "http://localhost:4723/status" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  Appium server: ONLINE" -ForegroundColor Green
    $appiumAvailable = $true
} catch {
    Write-Host "  Appium server: OFFLINE — skipping Appium tests" -ForegroundColor Yellow
    Write-Host "  Start with: npx appium" -ForegroundColor Yellow
    $appiumAvailable = $false
}

if ($appiumAvailable) {
    python -m pytest tests/test_appium.py `
      -m "appium and not ios" `
      -v `
      --tb=short `
      2>&1
}

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3: Generate final Excel report
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  STEP 3/3 — Generating final Excel audit report" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

python audit/generate_report.py 2>&1

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  DONE — reports saved to:" -ForegroundColor Green
Write-Host "    Real-time:  selenium_model\REALTIME_TEST_PROGRESS.xlsx" -ForegroundColor Green
Write-Host "    Final:      selenium_model\MASTER_TEST_AUDIT_REPORT.xlsx" -ForegroundColor Green
Write-Host "    HTML:       selenium_model\reports\html\execution_report.html" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
