@echo off
echo YouTube Radar EXE Build Script
echo ==============================
echo.

echo 1. Checking dependencies...
call npm list electron-builder >nul 2>&1
if errorlevel 1 (
    echo Installing electron-builder...
    call npm install --save-dev electron-builder
)

echo 2. Cleaning old files...
if exist dist-electron rmdir /s /q dist-electron
if exist .next rmdir /s /q .next

echo 3. Building Next.js app...
call npm run build

echo 4. Preparing icons...
if not exist build mkdir build
if not exist build\icon.ico (
    echo WARNING: Icon files not found!
    echo Please prepare:
    echo   - build\icon.png (512x512 PNG)
    echo   - build\icon.ico (Windows icon)
    echo.
)

echo 5. Building Windows executable...
call npm run build:win

echo.
echo Build complete! Check dist-electron folder for output files.
echo.
echo Notes:
echo - Configure .env file before first use
echo - Ensure YouTube API key is set
echo - May require administrator privileges to install
echo.
pause