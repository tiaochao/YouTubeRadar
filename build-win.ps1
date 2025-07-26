# YouTube Radar Windows Build Script (PowerShell)
# Run with: powershell -ExecutionPolicy Bypass -File build-win.ps1

Write-Host "========================================"
Write-Host "   YouTube Radar Windows Build Script"
Write-Host "========================================"
Write-Host ""

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# 1. Check Node.js
Write-Host "[1/8] Checking Node.js installation..." -ForegroundColor Cyan
if (!(Test-Command "node")) {
    Write-Host "ERROR: Node.js not found! Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
node --version

# 2. Check npm
Write-Host ""
Write-Host "[2/8] Checking npm..." -ForegroundColor Cyan
if (!(Test-Command "npm")) {
    Write-Host "ERROR: npm not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
npm --version

# 3. Clean old build files
Write-Host ""
Write-Host "[3/8] Cleaning old build files..." -ForegroundColor Cyan
if (Test-Path "dist-electron") {
    Write-Host "Removing dist-electron..."
    Remove-Item -Path "dist-electron" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path ".next") {
    Write-Host "Removing .next..."
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
}

# 4. Install dependencies
Write-Host ""
Write-Host "[4/8] Installing dependencies..." -ForegroundColor Cyan
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# 5. Build Next.js
Write-Host ""
Write-Host "[5/8] Building Next.js application..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build Next.js!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# 6. Prepare standalone files
Write-Host ""
Write-Host "[6/8] Preparing standalone files..." -ForegroundColor Cyan

# Create directories
$dirs = @(
    ".next\standalone\.next",
    ".next\standalone\public",
    "build"
)
foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Copy static files
if (Test-Path ".next\static") {
    Write-Host "Copying static files..."
    Copy-Item -Path ".next\static" -Destination ".next\standalone\.next\" -Recurse -Force
}

# Copy public files
if (Test-Path "public") {
    Write-Host "Copying public files..."
    Copy-Item -Path "public\*" -Destination ".next\standalone\public\" -Recurse -Force
}

# Copy env file
if (Test-Path ".env.local") {
    Write-Host "Copying environment file..."
    Copy-Item -Path ".env.local" -Destination ".next\standalone\" -Force
}

# 7. Check icon file
Write-Host ""
Write-Host "[7/8] Checking icon file..." -ForegroundColor Cyan
if (!(Test-Path "build\icon.ico")) {
    Write-Host ""
    Write-Host "WARNING: icon.ico not found at build\icon.ico" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To create a Windows icon:"
    Write-Host "1. Use an online converter: https://convertio.co/png-ico/"
    Write-Host "2. Or use ImageMagick: magick convert icon.png icon.ico"
    Write-Host "3. Save the .ico file to: build\icon.ico"
    Write-Host ""
    
    # Try to copy PNG as ICO (temporary)
    if (Test-Path "build\icon.png") {
        Write-Host "Using PNG as temporary icon..."
        Copy-Item -Path "build\icon.png" -Destination "build\icon.ico" -Force
    }
}

# 8. Build Windows installer
Write-Host ""
Write-Host "[8/8] Building Windows installer..." -ForegroundColor Cyan
npm run build:win
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to build Windows installer!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- Missing Visual C++ Build Tools"
    Write-Host "- Missing Python"
    Write-Host "- Permission issues"
    Write-Host ""
    Write-Host "Try:" -ForegroundColor Cyan
    Write-Host "1. Run PowerShell as Administrator"
    Write-Host "2. Install Visual Studio Build Tools: https://visualstudio.microsoft.com/downloads/"
    Read-Host "Press Enter to exit"
    exit 1
}

# Success
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    BUILD COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output files in: dist-electron\" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected files:"
Write-Host "- YouTube Radar-Setup-0.1.0.exe (Installer)"
Write-Host "- YouTube Radar-Portable-0.1.0.exe (Portable)"
Write-Host ""

# List generated files
if (Test-Path "dist-electron") {
    Write-Host "Generated files:" -ForegroundColor Cyan
    Get-ChildItem -Path "dist-electron" -Filter "*.exe" | ForEach-Object { Write-Host $_.Name }
}

Write-Host ""
Read-Host "Press Enter to exit"