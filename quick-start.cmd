@echo off
echo YouTube Radar 快速启动
echo =====================
echo.

:: 检查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：未安装 Node.js！
    echo 请从 https://nodejs.org/ 下载安装
    pause
    exit /b 1
)

:: 检查依赖
if not exist node_modules (
    echo 首次运行，安装基本依赖...
    echo 这可能需要几分钟...
    
    :: 只安装运行开发服务器所需的基本依赖
    call npm install --legacy-peer-deps --omit=optional
    
    if %errorlevel% neq 0 (
        echo.
        echo 安装失败！尝试使用镜像...
        call npm config set registry https://registry.npmmirror.com
        call npm install --legacy-peer-deps --omit=optional
    )
)

:: 检查 .env.local
if not exist .env.local (
    echo.
    echo 创建环境配置文件...
    (
        echo YOUTUBE_API_KEY=your_youtube_api_key_here
        echo DATABASE_URL="file:./dev.db"
        echo NEXT_PUBLIC_APP_URL=http://localhost:3000
    ) > .env.local
    
    echo.
    echo 注意：请编辑 .env.local 文件，添加你的 YouTube API 密钥
    echo.
)

:: 启动服务器
echo.
echo 启动开发服务器...
echo.
echo 服务器启动后：
echo - 浏览器访问：http://localhost:3000
echo - 按 Ctrl+C 停止服务器
echo.

set PORT=3000
call npm run dev