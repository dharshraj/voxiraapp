# ─────────────────────────────────────────────────────────────────────────────
# VoxiraApp — Full Test Suite Runner (PowerShell)
# Run from the selenium_model/ directory:
#   cd selenium_model
#   .\run_tests.ps1
#
# PREREQUISITES (complete all before running):
#   1. npx expo start         (separate terminal — starts web :8081 AND LAN Metro for Expo Go)
#   2. npx appium             (separate terminal — Appium server on :4723)
#   3. Android device connected via USB with USB debugging ON
#   4. Expo Go installed on phone + phone on same Wi-Fi as PC
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

# ── Android SDK / adb path ─────────────────────────────────────────────────────
# Add Android SDK platform-tools to PATH so adb is available in this session
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
if (Test-Path $adbPath) {
    $env:Path = "$env:Path;$adbPath"
    Write-Host "  adb: found at $adbPath" -ForegroundColor Green
} else {
    Write-Host "  adb: NOT found at $adbPath — Appium Android tests may skip" -ForegroundColor Yellow
}

# ── Appium / Android config ────────────────────────────────────────────────────
# After running: adb devices
# Copy the serial (e.g. R3CN90ABCDE or emulator-5554) into ANDROID_DEVICE_NAME
$env:APPIUM_SERVER_URL         = "http://localhost:4723"
$env:ANDROID_APP_PATH          = "$PSScriptRoot\..\dist\voxira.apk"
$env:ANDROID_DEVICE_NAME       = "10BD6G2LZ0000FK"
$env:ANDROID_PLATFORM_VERSION  = "15"
$env:ANDROID_USE_EXPO_GO       = "1"   # Use Expo Go instead of native APK (Android 15 workaround)

# Auto-detect LAN IP for Expo Go deep-link
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notmatch "^127\." -and $_.IPAddress -notmatch "^169\." } |
    Select-Object -First 1).IPAddress
if ($lanIp) {
    $env:EXPO_LAN_URL = "exp://${lanIp}:8081"
    Write-Host "  Expo Go URL: $($env:EXPO_LAN_URL)" -ForegroundColor Cyan
} else {
    $env:EXPO_LAN_URL = "exp://192.168.1.100:8081"
    Write-Host "  Could not auto-detect LAN IP — set EXPO_LAN_URL manually." -ForegroundColor Yellow
}

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
Write-Host "  (403 total: unit/api/selenium/extended — Appium in Step 2)" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

python -m pytest tests/ `
  --ignore=tests/test_appium.py `
  -v `
  --tb=short `
  --html=reports/html/execution_report.html `
  --self-contained-html `
  -q `
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
