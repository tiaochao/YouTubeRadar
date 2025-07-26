#!/bin/bash

echo "YouTube Radar EXE构建脚本"
echo "========================"

# 检查必要的依赖
echo "1. 检查依赖..."
if ! command -v electron-builder &> /dev/null; then
    echo "正在安装 electron-builder..."
    npm install --save-dev electron-builder
fi

# 清理旧的构建文件
echo "2. 清理旧文件..."
rm -rf dist-electron
rm -rf .next

# 构建Next.js应用
echo "3. 构建Next.js应用..."
npm run build

# 准备图标（如果没有，使用占位图标）
echo "4. 准备应用图标..."
if [ ! -f "build/icon.png" ]; then
    echo "提示：未找到图标文件，请准备以下文件："
    echo "  - build/icon.png (512x512 PNG图标)"
    echo "  - build/icon.ico (Windows图标)"
    echo "  - build/icon.icns (macOS图标)"
    echo ""
    echo "使用默认图标继续..."
    cp public/placeholder-logo.png build/icon.png 2>/dev/null || true
fi

# 选择构建平台
echo "5. 选择构建平台："
echo "   1) Windows (.exe)"
echo "   2) macOS (.dmg)"
echo "   3) Linux (.AppImage)"
echo "   4) 所有平台"
read -p "请选择 (1-4): " choice

case $choice in
    1)
        echo "构建Windows版本..."
        npm run build:win
        ;;
    2)
        echo "构建macOS版本..."
        npm run build:mac
        ;;
    3)
        echo "构建Linux版本..."
        npm run build:linux
        ;;
    4)
        echo "构建所有平台版本..."
        npm run dist
        ;;
    *)
        echo "无效选择，退出..."
        exit 1
        ;;
esac

echo ""
echo "构建完成！输出文件位于 dist-electron 目录"
echo ""
echo "注意事项："
echo "1. 首次使用前需要配置环境变量（.env文件）"
echo "2. 确保YouTube API密钥已配置"
echo "3. Windows用户可能需要管理员权限安装"