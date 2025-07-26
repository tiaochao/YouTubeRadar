# Netlify 配置指南

## 1. 启用 AI 解决方案建议
✅ 建议启用 - 点击 "Enable" 或 "允许"

## 2. 项目配置
在 Netlify 部署设置中，确保以下配置：

### Build settings（构建设置）:
- **Base directory**: 留空或 `/`
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Functions directory**: `netlify/functions`（如果有）

### Environment variables（环境变量）:
点击 "Add variable" 添加：
```
NEXT_PUBLIC_YOUTUBE_API_KEY = AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4
NEXT_PUBLIC_USE_LOCAL_STORAGE = true
NEXT_PUBLIC_APP_URL = [您的 Netlify URL]
```

## 3. 部署触发器
- **Production branch**: `main`
- **Deploy on push**: ✅ 启用（GitHub 推送自动部署）
- **Deploy previews**: ✅ 启用（PR 预览）

## 4. 插件（可选）
推荐安装的 Netlify 插件：
- **Next.js Runtime** - 自动优化 Next.js
- **Lighthouse** - 性能监控

## 5. 自定义域名（可选）
1. Domain settings → Add custom domain
2. 输入您的域名
3. 按照 DNS 配置指引操作

## 部署流程
1. 连接 GitHub 仓库 ✓
2. 配置构建设置 ✓
3. 添加环境变量
4. 点击 "Deploy site"
5. 等待部署完成（2-3分钟）

## 部署后检查
- 访问生成的 URL 测试功能
- 检查所有页面是否正常加载
- 测试 YouTube API 调用
- 验证本地存储功能

## 常见问题
1. **构建失败**: 查看部署日志
2. **404 错误**: 检查路由配置
3. **API 不工作**: 确认环境变量设置
4. **样式丢失**: 检查 CSS 导入

## 获取部署 URL
部署成功后，您会获得：
- 临时 URL: `https://[random-name].netlify.app`
- 可以在 Site settings 中修改为自定义名称