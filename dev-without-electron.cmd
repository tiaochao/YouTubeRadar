@echo off
echo 启动开发环境（不含 Electron）
echo =============================
echo.

:: 临时移除 electron 相关依赖以加快安装
echo 准备快速开发环境...

:: 检查是否已安装基础依赖
if exist node_modules\next (
    echo 依赖已安装，直接启动...
    goto start_server
)

:: 创建临时 package.json（不含 electron）
echo 安装最小依赖集...
if exist package.json.backup del package.json.backup
copy package.json package.json.backup >nul

:: 使用 PowerShell 移除 electron 相关依赖
powershell -Command ^
    "$json = Get-Content package.json | ConvertFrom-Json; ^
    $json.devDependencies.PSObject.Properties.Remove('electron'); ^
    $json.devDependencies.PSObject.Properties.Remove('electron-builder'); ^
    $json | ConvertTo-Json -Depth 100 | Set-Content package.json"

:: 安装（不含 electron）
call npm install --legacy-peer-deps --omit=optional

:: 恢复原始 package.json
copy package.json.backup package.json >nul
del package.json.backup

:start_server
:: 检查端口
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo.
    echo 端口 3000 被占用，尝试使用端口 3001...
    set PORT=3001
) else (
    set PORT=3000
)

:: 启动
echo.
echo 启动服务器...
echo.
echo 访问地址：http://localhost:%PORT%
echo.
echo 提示：
echo - 这是开发模式，仅用于预览和测试
echo - 按 Ctrl+C 停止服务器
echo - 忽略 Electron 相关的警告
echo.

call npm run dev