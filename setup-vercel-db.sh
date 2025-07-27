#!/bin/bash

echo "==================================="
echo "Vercel 数据库配置脚本"
echo "==================================="
echo ""

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装"
    echo "请先运行: npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLI 已安装"
echo ""

# 提示用户登录
echo "📝 请确保您已登录 Vercel"
echo "如果还没有登录，请运行: vercel login"
echo ""
read -p "按 Enter 继续..."

# 链接项目
echo ""
echo "🔗 链接到 Vercel 项目..."
vercel link

# 添加数据库环境变量
echo ""
echo "🔧 添加数据库环境变量..."
echo "DATABASE_URL=postgresql://postgres:54DG979491!@db.ufcszgnfhiurfzrknofr.supabase.co:5432/postgres"
echo ""

vercel env add DATABASE_URL production << EOF
postgresql://postgres:54DG979491!@db.ufcszgnfhiurfzrknofr.supabase.co:5432/postgres
EOF

# 显示当前环境变量
echo ""
echo "📋 当前生产环境变量："
vercel env ls production

# 触发重新部署
echo ""
echo "🚀 触发重新部署..."
vercel --prod

echo ""
echo "==================================="
echo "✅ 配置完成！"
echo "==================================="
echo ""
echo "请访问以下链接验证："
echo "1. 健康检查: https://youtuberadar888.vercel.app/api/health"
echo "2. 每日活动: https://youtuberadar888.vercel.app/daily-activity"
echo ""