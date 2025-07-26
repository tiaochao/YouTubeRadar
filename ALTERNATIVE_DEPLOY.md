# 替代部署方案

由于 Vercel 暂时出现问题，以下是其他部署选项：

## 方案 1：Netlify（再试一次）

### 修复后的 Netlify 部署
1. 删除之前的 Netlify 站点
2. 访问 https://app.netlify.com/drop
3. 将 YouTubeRadar 文件夹拖入
4. 等待部署

## 方案 2：GitHub Pages（免费）

### 步骤：
1. 在项目根目录创建 `.github/workflows/deploy.yml`
2. 推送到 GitHub
3. 在仓库设置中启用 GitHub Pages

我来创建配置文件...

## 方案 3：Cloudflare Pages（推荐）

### 优势：
- 全球 CDN
- 免费额度充足
- 部署简单
- 性能优秀

### 部署步骤：
1. 访问 https://pages.cloudflare.com
2. 点击 "Create a project"
3. 连接 GitHub 账号
4. 选择 `tiaochao/YouTubeRadar`
5. 配置构建设置：
   - Framework preset: Next.js
   - Build command: `npm install --legacy-peer-deps && npm run build`
   - Build output directory: `.next`
6. 添加环境变量：
   ```
   NEXT_PUBLIC_YOUTUBE_API_KEY = AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4
   NEXT_PUBLIC_USE_LOCAL_STORAGE = true
   NODE_VERSION = 18
   ```
7. 点击 "Save and Deploy"

## 方案 4：Render.com

### 步骤：
1. 访问 https://render.com
2. 注册/登录
3. New → Static Site
4. 连接 GitHub 仓库
5. 配置：
   - Build Command: `npm install --legacy-peer-deps && npm run build`
   - Publish Directory: `.next`
6. 部署

## 方案 5：本地预览

如果想先在本地测试：
```bash
cd /Volumes/AI/YouTubeRadar
npm install --legacy-peer-deps
npm run build
npm run start
```

然后访问 http://localhost:3000

## 建议

推荐使用 **Cloudflare Pages**，因为：
- 比 Vercel 更稳定
- 免费额度更大
- 全球访问速度快
- 配置简单

需要我帮您配置哪个平台？