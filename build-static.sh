#!/bin/bash

echo "构建静态导出版本..."
echo "===================="

# 设置环境变量
export BUILD_STATIC=true
export NEXT_PUBLIC_YOUTUBE_API_KEY=AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4
export NEXT_PUBLIC_USE_LOCAL_STORAGE=true

# 清理旧的构建
rm -rf out .next

# 安装依赖
echo "1. 安装依赖..."
npm install --legacy-peer-deps

# 构建
echo "2. 构建应用..."
npm run build

# 检查输出
if [ -d "out" ]; then
    echo ""
    echo "✅ 静态导出成功！"
    echo ""
    echo "文件位于 'out' 目录"
    echo ""
    echo "部署到 Cloudflare Pages："
    echo "1. 在 Cloudflare Pages 设置中"
    echo "2. Build output directory 改为: out"
    echo "3. 重新部署"
else
    echo "❌ 静态导出失败！"
fi