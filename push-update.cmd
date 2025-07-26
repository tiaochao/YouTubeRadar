@echo off
echo YouTube Radar 更新推送工具
echo =========================
echo.

:: 检查 Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：未安装 Git！
    pause
    exit /b 1
)

:: 显示当前版本
echo 当前版本：
findstr "version" package.json | findstr /v "devDependencies"
echo.

:: 询问版本号
set /p new_version=输入新版本号（如 0.1.1）或按回车跳过: 

:: 更新版本号
if not "%new_version%"=="" (
    echo 更新版本号到 %new_version%...
    powershell -Command "(Get-Content package.json) -replace '\"version\": \".*\"', '\"version\": \"%new_version%\"' | Set-Content package.json"
)

:: 显示更改
echo.
echo 更改的文件：
git status -s
echo.

:: 提交信息
set /p commit_msg=输入提交信息: 
if "%commit_msg%"=="" set commit_msg=Update

:: Git 操作
echo.
echo 执行 Git 操作...
git add .
git commit -m "%commit_msg%"
git push origin main

:: 创建标签
if not "%new_version%"=="" (
    echo.
    echo 创建标签 v%new_version%...
    git tag -a v%new_version% -m "Version %new_version%"
    git push origin v%new_version%
)

echo.
echo 更新推送完成！
echo.
echo 其他设备可以运行 sync-from-dev.cmd 获取更新
pause