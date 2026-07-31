# VoxiraApp Full Test Suite Runner
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

# adb path
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
if (Test-Path $adbPath) { $env:Path = "$env:Path;$adbPath" }

# Appium config
$env:APPIUM_SERVER_URL        = "http://localhost:4723"
$env:ANDROID_APP_PATH         = "$PSScriptRoot\..\dist\voxira.apk"
$env:ANDROID_DEVICE_NAME      = "10BD6G2LZ0000FK"
$env:ANDROID_PLATFORM_VERSION = "15"
$env:ANDROID_USE_EXPO_GO      = "1"

# LAN IP for Expo Go
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -match "^172\.23\." } | Select-Object -First 1).IPAddress
if (-not $lanIp) { $lanIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "^127\.|^169\." } | Select-Object -First 1).IPAddress }
$env:EXPO_LAN_URL = "exp://${lanIp}:8081"
Write-Host "Expo Go URL: $($env:EXPO_LAN_URL)" -ForegroundColor Cyan

# Performance thresholds
$env:PERF_DOM_CONTENT_LOADED_MAX = "5000"
$env:PERF_LOAD_EVENT_MAX_MS      = "10000"
$env:PERF_FIRST_PAINT_MAX_MS     = "3000"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  STEP 1/3  Unit + API + Selenium (373 tests)" -ForegroundColor Cyan
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
Write-Host "  STEP 2/3  Appium Android (30 tests)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$appiumUp = $false
try { Invoke-RestMethod -Uri "http://localhost:4723/status" -TimeoutSec 3 | Out-Null; $appiumUp = $true } catch {}

if ($appiumUp) {
    Write-Host "  Appium server: ONLINE" -ForegroundColor Green
    $step2Args = @(
        "-m", "pytest",
        "tests/test_appium.py",
        "-m", "appium and not ios",
        "-v", "--tb=short"
    )
    & python $step2Args
} else {
    Write-Host "  Appium server: OFFLINE - skipping (start with: npx appium)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  STEP 3/3  Generating Excel report" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

& python audit/generate_report.py

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  DONE" -ForegroundColor Green
Write-Host "  Real-time : REALTIME_TEST_PROGRESS.xlsx" -ForegroundColor Green
Write-Host "  Final     : MASTER_TEST_AUDIT_REPORT.xlsx" -ForegroundColor Green
Write-Host "  HTML      : reports/html/execution_report.html" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
