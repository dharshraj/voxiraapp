# VoxiraApp Full Test Suite Runner  (Appium excluded — run separately)
# Usage: cd selenium_model ; .\run_tests.ps1

# QA credentials — set these in your shell or selenium_model/.env.test (gitignored),
# never hardcode real credentials here since this file is committed to git.
if (-not $env:VOXIRA_TEST_EMAIL)    { $env:VOXIRA_TEST_EMAIL    = "qa.selenium.test@example.com" }
if (-not $env:VOXIRA_TEST_PASSWORD) { $env:VOXIRA_TEST_PASSWORD = "QaTest123!Selenium" }

# Selenium config
$env:VOXIRA_BASE_URL      = "http://localhost:8081"
$env:VOXIRA_HEADLESS      = "0"
$env:VOXIRA_WINDOW_WIDTH  = "1440"
$env:VOXIRA_WINDOW_HEIGHT = "1024"
$env:VOXIRA_BROWSER       = "chrome"
$env:VOXIRA_IMPLICIT_WAIT = "3"
$env:VOXIRA_EXPLICIT_WAIT = "15"

# adb path (kept for reference; not used in this run)
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
if (Test-Path $adbPath) { $env:Path = "$env:Path;$adbPath" }

# LAN IP for Expo Go URL (informational only)
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -match "^172\.23\." } | Select-Object -First 1).IPAddress
if (-not $lanIp) { $lanIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "^127\.|^169\." } | Select-Object -First 1).IPAddress }
Write-Host "LAN IP detected: $lanIp  (used by Appium run — skipped here)" -ForegroundColor DarkGray

# Performance thresholds
$env:PERF_DOM_CONTENT_LOADED_MAX = "5000"
$env:PERF_LOAD_EVENT_MAX_MS      = "10000"
$env:PERF_FIRST_PAINT_MAX_MS     = "3000"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  STEP 1/2  Unit + API + Selenium tests" -ForegroundColor Cyan
Write-Host "  (test_appium.py excluded)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$step1Args = @(
    "-m", "pytest",
    "tests/",
    "--ignore=tests/test_appium.py",
    "-v", "--tb=short",
    "--html=reports/html/execution_report.html",
    "--self-contained-html",
    "-q"
)
& python $step1Args

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  STEP 2/2  Generating Excel report (no Appium)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

& python audit/generate_report.py

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  DONE" -ForegroundColor Green
Write-Host "  Real-time : REALTIME_TEST_PROGRESS.xlsx" -ForegroundColor Green
Write-Host "  Final     : MASTER_TEST_AUDIT_REPORT.xlsx" -ForegroundColor Green
Write-Host "  HTML      : reports/html/execution_report.html" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  To add Appium tests later:" -ForegroundColor Yellow
Write-Host "    python -m pytest tests/test_appium.py -m 'appium and not ios' -v" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Green
