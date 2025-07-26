# 部署为 Web 应用指南

## 部署选项

### 1. Vercel 部署（推荐 - 免费）

#### 步骤：
1. 注册 Vercel 账号：https://vercel.com
2. 安装 Vercel CLI：
   ```bash
   npm i -g vercel
   ```
3. 部署：
   ```bash
   vercel
   ```
4. 按提示操作，自动分配域名如：`youtube-radar.vercel.app`

#### 优势：
- 自动 HTTPS
- 全球 CDN
- 自动部署（连接 GitHub）
- 免费域名

### 2. Netlify 部署（免费）

#### 步骤：
1. 构建静态文件：
   ```bash
   npm run build
   npm run export
   ```
2. 访问 https://app.netlify.com
3. 拖拽 `out` 文件夹到页面
4. 自动部署并分配域名

### 3. GitHub Pages（免费）

#### 步骤：
1. 在 `next.config.mjs` 添加：
   ```js
   const nextConfig = {
     output: 'export',
     basePath: '/youtube-radar',
     images: {
       unoptimized: true,
     },
   }
   ```
2. 构建并部署：
   ```bash
   npm run build
   npm run export
   git add out
   git commit -m "Deploy to GitHub Pages"
   git push
   ```
3. 在 GitHub 仓库设置中启用 Pages

### 4. 自定义域名

#### Vercel 自定义域名：
1. 在 Vercel 控制台添加域名
2. 在域名注册商添加 CNAME 记录：
   ```
   CNAME  www  cname.vercel-dns.com
   ```

#### Cloudflare Pages（推荐）：
1. 注册 Cloudflare
2. 连接 GitHub 仓库
3. 自动构建部署
4. 免费 SSL 和 CDN

## 离线使用配置

### 1. PWA 配置
安装 PWA 插件：
```bash
npm install next-pwa
```

配置 `next.config.mjs`：
```js
import withPWA from 'next-pwa'

const nextConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})({
  // 其他配置
})
```

### 2. Service Worker
创建 `public/sw.js`：
```js
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/styles/globals.css',
      ])
    })
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
    })
  )
})
```

### 3. 本地数据存储
使用 IndexedDB 替代服务器数据库：
```js
// lib/local-db.js
import Dexie from 'dexie'

const db = new Dexie('YouTubeRadar')
db.version(1).stores({
  channels: 'id, title, handle',
  videos: 'id, channelId, publishedAt',
  stats: 'id, date, channelId'
})

export default db
```

## 快速部署脚本

创建 `deploy.sh`：
```bash
#!/bin/bash
echo "选择部署平台："
echo "1. Vercel"
echo "2. Netlify"
echo "3. GitHub Pages"
read -p "选择 (1-3): " choice

case $choice in
  1)
    vercel --prod
    ;;
  2)
    npm run build
    npm run export
    echo "请手动上传 out 文件夹到 Netlify"
    ;;
  3)
    npm run build
    npm run export
    git add out
    git commit -m "Deploy to GitHub Pages"
    git push
    ;;
esac
```

## 环境变量配置

### Vercel 环境变量：
在 Vercel 控制台设置：
- `YOUTUBE_API_KEY`
- `DATABASE_URL`（可选，使用 Vercel KV）

### 客户端 API 密钥：
在 `.env.production` 中：
```env
NEXT_PUBLIC_YOUTUBE_API_KEY=你的API密钥
NEXT_PUBLIC_APP_URL=https://你的域名.vercel.app
```

## 一键部署按钮

在 README 中添加：
```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/youtube-radar)
```

## 推荐配置

1. **Vercel + 自定义域名**
   - 最简单快速
   - 自动 CI/CD
   - 免费 SSL

2. **PWA + IndexedDB**
   - 离线使用
   - 本地数据存储
   - 无需服务器

3. **CDN 加速**
   - 使用 Cloudflare
   - 全球加速
   - DDoS 防护