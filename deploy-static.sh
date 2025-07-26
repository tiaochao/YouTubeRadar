#!/bin/bash

echo "构建静态网站..."
echo "=================="

# 设置环境变量
export NODE_ENV=production

# 构建
echo "1. 构建 Next.js..."
npm run build

# 检查输出目录
if [ -d "out" ]; then
    echo ""
    echo "✅ 构建成功！"
    echo ""
    echo "静态文件位于 'out' 目录"
    echo ""
    echo "部署选项："
    echo ""
    echo "1. GitHub Pages:"
    echo "   - 将 'out' 目录内容推送到 gh-pages 分支"
    echo "   - 或使用: npx gh-pages -d out"
    echo ""
    echo "2. Netlify:"
    echo "   - 访问 https://app.netlify.com/drop"
    echo "   - 拖拽 'out' 文件夹到页面"
    echo ""
    echo "3. 本地测试:"
    echo "   npx serve out -p 3000"
    echo ""
    echo "4. 使用 Python 简单服务器:"
    echo "   cd out && python3 -m http.server 3000"
else
    echo "❌ 构建失败！请检查错误信息"
fi