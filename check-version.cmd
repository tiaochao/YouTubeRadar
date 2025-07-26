@echo off
echo 检查 YouTube Radar 版本
echo ======================
echo.

:: 显示本地版本
echo 本地版本：
findstr "version" package.json | findstr /v "devDependencies"
echo.

:: 如果有 Git，检查远程版本
git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo 检查远程版本...
    git fetch origin --tags >nul 2>&1
    echo.
    echo 最新标签：
    git describe --tags --abbrev=0 2>nul || echo 无标签
    echo.
    echo 最新提交：
    git log -1 --oneline origin/main 2>nul
    echo.
    
    :: 检查是否需要更新
    git status -uno | findstr "behind" >nul
    if %errorlevel% equ 0 (
        echo [!] 发现新版本，建议运行 sync-from-dev.cmd 更新
    ) else (
        echo [√] 已是最新版本
    )
) else (
    echo 提示：安装 Git 后可以检查远程版本
)

echo.
pause