# ─────────────────────────────────────────────────────────────────────────────
# Voxira — Whisper Server Startup Script (Windows PowerShell)
# ─────────────────────────────────────────────────────────────────────────────
# Run from the whisper_server folder:
#   cd whisper_server
#   .\start.ps1
# ─────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Voxira — Local Whisper Transcription Server  " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ── Check Python ──────────────────────────────────────────────────────────────
try {
    $pyVersion = python --version 2>&1
    Write-Host "[OK] Python found: $pyVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python not found. Install Python 3.9+ from https://python.org" -ForegroundColor Red
    exit 1
}

# ── Check / create virtual environment ───────────────────────────────────────
if (-not (Test-Path "venv")) {
    Write-Host "[...] Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "[OK] Virtual environment created." -ForegroundColor Green
} else {
    Write-Host "[OK] Virtual environment found." -ForegroundColor Green
}

# ── Activate venv ─────────────────────────────────────────────────────────────
Write-Host "[...] Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# ── Upgrade pip + setuptools FIRST (fixes pkg_resources on Python 3.14) ──────
Write-Host "[...] Upgrading pip and setuptools..." -ForegroundColor Yellow
python -m pip install --quiet --upgrade pip setuptools wheel
Write-Host "[OK] pip and setuptools upgraded." -ForegroundColor Green

# ── Install dependencies ──────────────────────────────────────────────────────
Write-Host "[...] Installing dependencies..." -ForegroundColor Yellow
Write-Host "      (first run downloads the Whisper model weights ~74 MB)" -ForegroundColor Gray
pip install --quiet -r requirements.txt
Write-Host "[OK] Dependencies installed." -ForegroundColor Green
Write-Host ""

# ── ffmpeg check ──────────────────────────────────────────────────────────────
$ffmpegOk = $false
try {
    $null = ffmpeg -version 2>&1
    $ffmpegOk = $true
    Write-Host "[OK] ffmpeg found." -ForegroundColor Green
} catch {
    Write-Host "[WARN] ffmpeg not found in PATH." -ForegroundColor Yellow
    Write-Host "       Whisper needs ffmpeg to decode .m4a / .webm audio." -ForegroundColor Yellow
    Write-Host "       Install it now by running (in a NEW terminal):" -ForegroundColor Yellow
    Write-Host "         winget install ffmpeg" -ForegroundColor White
    Write-Host "       Then restart this script." -ForegroundColor Yellow
    Write-Host ""
}

# ── Start server ──────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Starting server on http://localhost:8000 ..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

$env:WHISPER_MODEL = "base"
python main.py
