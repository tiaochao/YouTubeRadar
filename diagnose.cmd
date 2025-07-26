@echo off
echo YouTube Radar 诊断工具
echo =====================
echo.

echo 1. 检查 Node.js 版本...
node --version
if %errorlevel% neq 0 (
    echo [错误] Node.js 未安装！
    pause
    exit /b 1
)

echo.
echo 2. 检查 npm 版本...
npm --version

echo.
echo 3. 检查项目文件...
if not exist package.json (
    echo [错误] package.json 不存在！
    echo 请确保在正确的项目目录中
    pause
    exit /b 1
)

echo.
echo 4. 检查依赖安装...
if not exist node_modules (
    echo [警告] node_modules 不存在，需要安装依赖
    echo.
    echo 运行最小安装...
    call npm install --legacy-peer-deps --only=production
)

echo.
echo 5. 检查环境配置...
if not exist .env.local (
    echo [信息] 创建 .env.local...
    (
        echo YOUTUBE_API_KEY=test_key
        echo DATABASE_URL="file:./dev.db"
        echo NODE_ENV=development
    ) > .env.local
)

echo.
echo 6. 检查端口占用...
netstat -ano | findstr :3000
if %errorlevel% equ 0 (
    echo [警告] 端口 3000 被占用
)

echo.
echo 7. 尝试直接运行 Next.js...
echo.
echo 如果看到错误信息，请记录下来
echo.
pause

:: 直接运行看错误
node_modules\.bin\next dev