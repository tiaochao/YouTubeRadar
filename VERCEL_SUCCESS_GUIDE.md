# Vercel 成功部署指南

## 方法 1：通过 Vercel 网站（推荐）

### 步骤 1：导入项目
1. 访问 [Vercel Import](https://vercel.com/import)
2. 点击 "Import Git Repository"
3. 粘贴：`https://github.com/tiaochao/YouTubeRadar`
4. 点击 "Import"

### 步骤 2：配置项目
保持默认设置，Vercel 会自动识别：
- **Framework Preset**: Next.js
- **Root Directory**: ./
- **Build Command**: 自动使用 vercel.json 中的配置
- **Install Command**: 自动使用 vercel.json 中的配置

### 步骤 3：环境变量
环境变量已在 vercel.json 中配置，无需手动添加。

### 步骤 4：部署
点击 "Deploy" 并等待 2-3 分钟。

## 方法 2：如果遇到错误

### 清除并重新部署
1. 在 Vercel Dashboard 删除当前项目
2. 重新导入，但这次：
   - 在 "Environment Variables" 部分手动添加：
     ```
     NEXT_PUBLIC_YOUTUBE_API_KEY = AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4
     NEXT_PUBLIC_USE_LOCAL_STORAGE = true
     ```
   - Override Build Command：
     ```
     npm install --legacy-peer-deps && npm run build
     ```

### 检查部署日志
如果仍有错误：
1. 查看 "Functions" 标签页的错误
2. 查看 "Build Logs" 的详细信息
3. 确保所有依赖都已正确安装

## 验证部署成功

部署成功后，测试以下功能：
1. 访问首页 - 应该显示 YouTube Radar 界面
2. 点击 "频道管理" - 应该能正常跳转
3. 添加一个 YouTube 频道测试
4. 语言切换功能

## 常见问题解决

### 1. "Error loading dashboard"
- 清除浏览器缓存
- 等待几秒钟让页面完全加载
- 检查控制台是否有错误

### 2. 404 错误
- 确保访问的是根域名，不是子路径
- 刷新页面

### 3. API 调用失败
- 应用使用客户端直接调用 YouTube API
- 确保没有广告拦截器阻止 API 请求

## 部署成功后

1. **自定义域名**（可选）
   - Settings → Domains → Add

2. **监控**
   - Analytics 查看访问情况
   - Logs 查看运行日志

3. **更新**
   - 推送到 GitHub 自动部署
   - 或手动 Redeploy

## 技术说明

此应用已配置为：
- ✅ 纯客户端渲染
- ✅ 使用浏览器本地存储
- ✅ 直接调用 YouTube API
- ✅ 无需后端服务器
- ✅ 支持离线使用

## 需要帮助？

如果遇到问题，请提供：
1. 具体的错误信息
2. 部署日志截图
3. 浏览器控制台错误