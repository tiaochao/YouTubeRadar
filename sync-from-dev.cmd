@echo off
title YouTube Radar 代码同步工具
echo ====================================
echo     YouTube Radar 代码同步工具
echo ====================================
echo.

:: 配置开发机器信息（请修改为实际值）
set DEV_MACHINE=\\192.168.1.100\YouTubeRadar
set DEV_MACHINE_NAME=开发机器名
set GIT_REPO=https://github.com/yourusername/youtube-radar.git

:: 选择同步方式
echo 请选择同步方式：
echo 1. 从 Git 仓库同步（推荐）
echo 2. 从网络共享文件夹同步
echo 3. 从 USB/移动设备同步
echo.
set /p choice=请输入选项 (1-3): 

if "%choice%"=="1" goto git_sync
if "%choice%"=="2" goto network_sync
if "%choice%"=="3" goto usb_sync
goto :eof

:git_sync
echo.
echo 从 Git 仓库同步...
echo ==================

:: 检查是否已经是 Git 仓库
if exist .git (
    echo 更新现有仓库...
    git fetch origin
    git pull origin main
) else (
    echo 首次克隆仓库...
    cd ..
    git clone %GIT_REPO%
    cd youtube-radar
)

goto build

:network_sync
echo.
echo 从网络共享同步...
echo ==================

:: 检查网络连接
ping -n 1 %DEV_MACHINE_NAME% >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：无法连接到开发机器！
    echo 请确保：
    echo 1. 开发机器已开启
    echo 2. 文件夹已共享
    echo 3. 在同一网络中
    pause
    exit /b 1
)

:: 复制文件
echo 复制文件中...
xcopy "%DEV_MACHINE%\*.*" "." /E /Y /D /EXCLUDE:sync-exclude.txt

goto build

:usb_sync
echo.
echo 从 USB/移动设备同步...
echo ======================

:: 列出可用驱动器
echo 可用的驱动器：
wmic logicaldisk get size,freespace,caption

echo.
set /p usb_drive=请输入 USB 驱动器盘符（如 E:）: 

:: 检查驱动器
if not exist %usb_drive%\YouTubeRadar (
    echo 错误：在 %usb_drive% 中未找到 YouTubeRadar 文件夹！
    pause
    exit /b 1
)

:: 复制文件
echo 从 %usb_drive% 复制文件...
xcopy "%usb_drive%\YouTubeRadar\*.*" "." /E /Y /D /EXCLUDE:sync-exclude.txt

goto build

:build
echo.
echo 开始构建...
echo ===========

:: 安装/更新依赖
echo.
echo 安装依赖...
call npm install --legacy-peer-deps --no-optional

:: 构建应用
echo.
echo 构建 Windows 应用...
call npm run build:win

:: 完成
echo.
echo ====================================
echo     同步和构建完成！
echo ====================================
echo.
echo 可执行文件位置：
echo - dist-electron\YouTube Radar-Setup-*.exe
echo.
pause