@echo off
echo 启动开发服务器
echo ==============
echo.

:: 检查是否有 node_modules
if not exist node_modules (
    echo 错误：未找到 node_modules！
    echo 请先运行 npm install
    pause
    exit /b 1
)

:: 检查端口 3000 是否被占用
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo 警告：端口 3000 已被占用
    echo 正在尝试关闭占用端口的进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 >nul
)

:: 启动开发服务器
echo 启动 Next.js 开发服务器...
echo.
echo 服务器启动后，在浏览器中访问：
echo http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo.

:: 设置端口并启动
set PORT=3000
npm run dev