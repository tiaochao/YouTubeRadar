@echo off
echo 最小化启动测试
echo ==============
echo.

:: 检查关键文件
if not exist package.json (
    echo 错误：不在项目目录中！
    echo 当前目录：%CD%
    pause
    exit /b 1
)

:: 创建最小 .env.local
if not exist .env.local (
    echo 创建环境配置...
    echo YOUTUBE_API_KEY=dummy_key_for_testing> .env.local
    echo DATABASE_URL="file:./dev.db">> .env.local
)

:: 检查 Next.js 是否安装
if not exist node_modules\next (
    echo.
    echo Next.js 未安装，安装核心依赖...
    echo.
    
    :: 只安装 Next.js 核心依赖
    call npm install next react react-dom --legacy-peer-deps
    
    if %errorlevel% neq 0 (
        echo.
        echo 安装失败！尝试使用淘宝镜像...
        call npm install next react react-dom --registry https://registry.npmmirror.com
    )
)

:: 检查 app 目录
if not exist app (
    echo.
    echo 错误：未找到 app 目录！
    echo 项目结构可能不完整
    dir /b
    pause
    exit /b 1
)

:: 直接启动
echo.
echo 启动服务器...
echo.

:: 设置环境变量
set NODE_ENV=development
set PORT=3000

:: 使用 npx 确保运行
echo 执行命令：npx next dev
echo.
npx next dev

:: 如果失败，显示更多信息
if %errorlevel% neq 0 (
    echo.
    echo 启动失败！可能的原因：
    echo 1. 依赖不完整
    echo 2. 代码有语法错误
    echo 3. 端口被占用
    echo.
    echo 尝试查看 package.json 中的依赖...
    type package.json | findstr dependencies
    pause
)