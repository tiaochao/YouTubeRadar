# YouTube Radar 部署指南

## 🌐 Web 部署选项

您的应用已配置为 Web 应用，支持以下部署方式：

### 1. Netlify (推荐 - 最简单)

**方法 A: Netlify Drop**
1. 访问 https://app.netlify.com/drop
2. 将整个 `YouTubeRadar` 文件夹拖拽到页面
3. 等待自动部署完成
4. 获得您的网站链接

**方法 B: Netlify CLI**
```bash
# 安装 CLI
npm install -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy --prod
```

### 2. Vercel

```bash
# 登录 Vercel
vercel login

# 部署
vercel --yes
```

### 3. GitHub Pages (静态导出)

```bash
# 构建静态版本
npm run build
npm run export

# 部署到 GitHub Pages
npm install -g gh-pages
gh-pages -d out
```

### 4. 任何静态托管服务

- Cloudflare Pages
- Surge.sh
- Render
- Railway
- Fly.io

## 🔧 功能特性

- ✅ 无需服务器
- ✅ 客户端 YouTube API 调用
- ✅ 本地存储数据
- ✅ 离线工作
- ✅ 响应式设计
- ✅ 中英文支持

## 📱 使用说明

1. 部署后访问您的网站
2. 添加 YouTube 频道
3. 数据会保存在浏览器本地存储中
4. 无需数据库或服务器

## ⚙️ 环境变量

应用使用以下公开的 API 密钥：
```
NEXT_PUBLIC_YOUTUBE_API_KEY=AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4
```

## 🚀 快速开始

最快的部署方式：
1. 访问 https://app.netlify.com/drop
2. 拖拽文件夹
3. 完成！

## 📝 注意事项

- 数据存储在浏览器本地
- 清除浏览器数据会丢失应用数据
- 建议定期导出数据备份
- API 配额每天 10,000 次请求