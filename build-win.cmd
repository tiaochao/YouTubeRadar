@echo off
setlocal enabledelayedexpansion

echo ========================================
echo     YouTube Radar Windows Build Script
echo ========================================
echo.

:: Check Node.js
echo [1/8] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found! Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
node --version

:: Check npm
echo.
echo [2/8] Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found!
    pause
    exit /b 1
)
npm --version

:: Clean old build files
echo.
echo [3/8] Cleaning old build files...
if exist "dist-electron" (
    echo Removing dist-electron...
    rmdir /s /q "dist-electron" 2>nul
)
if exist ".next" (
    echo Removing .next...
    rmdir /s /q ".next" 2>nul
)

:: Install dependencies
echo.
echo [4/8] Installing dependencies...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

:: Build Next.js
echo.
echo [5/8] Building Next.js application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build Next.js!
    pause
    exit /b 1
)

:: Prepare standalone files
echo.
echo [6/8] Preparing standalone files...

:: Create directories if they don't exist
if not exist ".next\standalone\.next" mkdir ".next\standalone\.next"
if not exist ".next\standalone\public" mkdir ".next\standalone\public"

:: Copy static files
echo Copying static files...
if exist ".next\static" (
    xcopy /E /I /Y /Q ".next\static" ".next\standalone\.next\static" >nul 2>&1
)

:: Copy public files
echo Copying public files...
if exist "public" (
    xcopy /E /I /Y /Q "public" ".next\standalone\public" >nul 2>&1
)

:: Copy env file
if exist ".env.local" (
    echo Copying environment file...
    copy /Y ".env.local" ".next\standalone\" >nul 2>&1
)

:: Check for icon file
echo.
echo [7/8] Checking icon file...
if not exist "build\icon.ico" (
    echo.
    echo WARNING: icon.ico not found at build\icon.ico
    echo.
    echo To create a Windows icon:
    echo 1. Use an online converter: https://convertio.co/png-ico/
    echo 2. Or use ImageMagick: magick convert icon.png icon.ico
    echo 3. Save the .ico file to: build\icon.ico
    echo.
    
    :: Create build directory if it doesn't exist
    if not exist "build" mkdir "build"
    
    :: Try to copy PNG as ICO (temporary solution)
    if exist "build\icon.png" (
        echo Using PNG as temporary icon...
        copy /Y "build\icon.png" "build\icon.ico" >nul 2>&1
    )
)

:: Build Windows installer
echo.
echo [8/8] Building Windows installer...
call npm run build:win
if %errorlevel% neq 0 (
    echo ERROR: Failed to build Windows installer!
    echo.
    echo Common issues:
    echo - Missing Visual C++ Build Tools
    echo - Missing Python 2.7
    echo - Permission issues
    echo.
    echo Try running as Administrator or install Visual Studio Build Tools:
    echo https://visualstudio.microsoft.com/downloads/
    pause
    exit /b 1
)

:: Success
echo.
echo ========================================
echo     BUILD COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Output files in: dist-electron\
echo.
echo Expected files:
echo - YouTube Radar-Setup-0.1.0.exe (Installer)
echo - YouTube Radar-Portable-0.1.0.exe (Portable)
echo.

:: List generated files
if exist "dist-electron" (
    echo Generated files:
    dir /b "dist-electron\*.exe" 2>nul
)

echo.
pause