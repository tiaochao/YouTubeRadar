@echo off
echo 修复 Electron 下载问题
echo =====================
echo.

echo 设置 npm 镜像源...
call npm config set registry https://registry.npmmirror.com
call npm config set electron_mirror https://npmmirror.com/mirrors/electron/
call npm config set electron_builder_binaries_mirror https://npmmirror.com/mirrors/electron-builder-binaries/

echo.
echo 清理缓存...
call npm cache clean --force

echo.
echo 删除 node_modules...
if exist node_modules rmdir /s /q node_modules

echo.
echo 删除 package-lock.json...
if exist package-lock.json del package-lock.json

echo.
echo 重新安装依赖（使用国内镜像）...
call npm install --legacy-peer-deps

echo.
echo 如果还是失败，请尝试以下命令：
echo.
echo 1. 设置代理（如果使用代理）：
echo    npm config set proxy http://your-proxy:port
echo    npm config set https-proxy http://your-proxy:port
echo.
echo 2. 或者手动下载 Electron：
echo    npm install electron@37.2.4 --save-dev --electron_mirror=https://npmmirror.com/mirrors/electron/
echo.
pause