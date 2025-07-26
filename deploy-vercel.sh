#!/bin/bash

echo "YouTube Radar - Vercel 部署脚本"
echo "=============================="
echo ""

# 检查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "安装 Vercel CLI..."
    npm i -g vercel
fi

# 检查环境变量
if [ ! -f .env.production ]; then
    echo "创建生产环境配置..."
    cat > .env.production << EOF
NEXT_PUBLIC_YOUTUBE_API_KEY=${YOUTUBE_API_KEY:-your_api_key_here}
NEXT_PUBLIC_APP_URL=https://youtube-radar.vercel.app
EOF
    echo "请编辑 .env.production 添加你的 API 密钥"
fi

# 部署选项
echo ""
echo "部署选项："
echo "1. 开发预览 (Preview)"
echo "2. 生产部署 (Production)"
echo ""
read -p "选择 (1-2): " choice

case $choice in
    1)
        echo "部署到预览环境..."
        vercel
        ;;
    2)
        echo "部署到生产环境..."
        vercel --prod
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac

echo ""
echo "部署完成！"
echo ""
echo "下一步："
echo "1. 访问 Vercel 控制台设置环境变量"
echo "2. 添加自定义域名（可选）"
echo "3. 配置 API 限制保护你的密钥"