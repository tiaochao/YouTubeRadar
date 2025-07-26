@echo off
echo 使用国内镜像安装
echo ================
echo.

:: 设置所有相关的镜像
echo 配置国内镜像源...
call npm config set registry https://registry.npmmirror.com
call npm config set electron_mirror https://npmmirror.com/mirrors/electron/
call npm config set electron_builder_binaries_mirror https://npmmirror.com/mirrors/electron-builder-binaries/
call npm config set node_sqlite3_binary_host_mirror https://npmmirror.com/mirrors
call npm config set sass_binary_site https://npmmirror.com/mirrors/node-sass
call npm config set sharp_binary_host https://npmmirror.com/mirrors/sharp
call npm config set sharp_libvips_binary_host https://npmmirror.com/mirrors/sharp-libvips

:: 设置 Electron 缓存目录
set ELECTRON_CACHE=%LOCALAPPDATA%\electron\Cache

echo.
echo 当前 npm 配置：
call npm config list

echo.
echo 开始安装...
call npm install --legacy-peer-deps --verbose

if %errorlevel% neq 0 (
    echo.
    echo 安装失败！尝试单独安装 Electron...
    call npm install electron@37.2.4 --save-dev --electron_mirror=https://npmmirror.com/mirrors/electron/
    
    if %errorlevel% neq 0 (
        echo.
        echo 仍然失败！可能的解决方案：
        echo 1. 检查网络连接
        echo 2. 使用 VPN 或代理
        echo 3. 手动下载 Electron
        echo.
        echo 手动下载地址：
        echo https://npmmirror.com/mirrors/electron/37.2.4/electron-v37.2.4-win32-x64.zip
        echo.
        echo 下载后放到：
        echo %ELECTRON_CACHE%
    )
)

echo.
pause