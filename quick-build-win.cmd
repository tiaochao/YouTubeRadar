@echo off
echo Quick Build for Windows
echo ======================
echo.

:: Clean node_modules if needed
if exist node_modules (
    echo Cleaning old dependencies...
    rmdir /s /q node_modules
)

:: Install dependencies without optional packages
echo Installing dependencies (without optional packages)...
call npm install --legacy-peer-deps --no-optional

if %errorlevel% neq 0 (
    echo.
    echo Failed to install dependencies!
    echo Try:
    echo 1. Install Visual Studio Build Tools
    echo 2. Run as Administrator
    pause
    exit /b 1
)

:: Build the application
echo.
echo Building application...
call npm run build:win

if %errorlevel% neq 0 (
    echo.
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Build complete! Check dist-electron folder.
pause