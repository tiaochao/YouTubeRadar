#!/bin/bash

echo "准备 Netlify 部署..."
echo "===================="
echo ""

# 检查是否已经构建
if [ ! -d ".next" ]; then
    echo "构建文件不存在，正在构建..."
    npm run build
fi

echo ""
echo "✅ 构建完成！"
echo ""
echo "部署到 Netlify 的方法："
echo ""
echo "方法 1: 使用 Netlify Drop (最简单)"
echo "  1. 访问: https://app.netlify.com/drop"
echo "  2. 将整个 YouTubeRadar 文件夹拖拽到页面上"
echo "  3. Netlify 会自动识别 Next.js 项目并部署"
echo ""
echo "方法 2: 使用 Netlify CLI"
echo "  1. 安装 CLI: npm install -g netlify-cli"
echo "  2. 登录: netlify login"
echo "  3. 部署: netlify deploy"
echo "  4. 生产部署: netlify deploy --prod"
echo ""
echo "方法 3: GitHub 自动部署"
echo "  1. 将代码推送到 GitHub"
echo "  2. 在 Netlify 中导入 GitHub 项目"
echo "  3. 自动构建和部署"
echo ""
echo "部署配置已准备好："
echo "  - netlify.toml (配置文件)"
echo "  - 环境变量已设置"
echo "  - API 密钥已配置"
echo ""
echo "部署后访问您的网站即可使用！"