@echo off
echo 修复 Windows 构建问题
echo ====================
echo.

:: 继续安装
echo 警告信息是正常的，继续安装...
echo.

:: 等待安装完成
echo 请等待 npm install 完成...
echo 这可能需要几分钟时间...
echo.

:: 创建必要的目录
if not exist build mkdir build
if not exist build\icons mkdir build\icons

:: 检查是否有图标
if not exist build\icon.png (
    echo.
    echo 创建临时图标...
    echo 请稍后替换为真正的图标文件
    :: 创建一个空文件作为占位符
    type nul > build\icon.ico
)

:: 准备构建
echo.
echo 准备构建文件...

:: 检查 .env.local
if not exist .env.local (
    echo.
    echo 创建 .env.local 文件...
    (
        echo YOUTUBE_API_KEY=your_api_key_here
        echo DATABASE_URL="file:./dev.db"
        echo NODE_ENV=production
    ) > .env.local
    echo.
    echo 请编辑 .env.local 并添加你的 YouTube API 密钥
)

echo.
echo 安装完成后，运行以下命令构建：
echo.
echo   npm run build:win
echo.
echo 或使用快速构建脚本：
echo.
echo   quick-build-win.cmd
echo.