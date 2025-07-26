# 部署到 Vercel（推荐）

由于 Netlify 配置复杂，建议使用 Vercel（Next.js 官方推荐）：

## 一键部署

1. **点击这个链接**：
   https://vercel.com/new/clone?repository-url=https://github.com/tiaochao/YouTubeRadar

2. **登录 Vercel**（使用 GitHub 账号）

3. **配置项目**：
   - 项目名称：保持默认或改为 `youtube-radar`
   - Framework：会自动检测为 Next.js
   - 环境变量：点击 "Add" 添加：
     ```
     NEXT_PUBLIC_YOUTUBE_API_KEY = AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4
     NEXT_PUBLIC_USE_LOCAL_STORAGE = true
     ```

4. **点击 "Deploy"**

5. **等待 1-2 分钟**

## 部署完成后

您会获得：
- 生产 URL：`https://your-project.vercel.app`
- 自动 HTTPS
- 全球 CDN
- 自动部署（GitHub 推送后）

## 为什么选择 Vercel？

- ✅ Next.js 官方合作伙伴
- ✅ 零配置部署
- ✅ 更好的性能优化
- ✅ 免费额度够用
- ✅ 部署更简单

## 或者继续修复 Netlify

如果您想继续使用 Netlify，我们需要：
1. 删除当前站点
2. 创建新站点
3. 使用不同的部署方式