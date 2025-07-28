# YouTube Analytics API 配置指南

本文档介绍如何为 YouTubeRadar 项目配置 YouTube Analytics API，实现真实数据统计而非估算数据。

## 📋 配置概述

YouTube Analytics API 使用 OAuth 2.0 进行身份验证，需要以下步骤：

1. **Google Cloud Console 设置** - 创建 OAuth 应用
2. **本地授权** - 获取刷新令牌 (一次性操作)
3. **环境变量配置** - 在生产环境中设置凭据
4. **API 集成测试** - 验证数据同步功能

## 🚀 第一步：Google Cloud Console 设置

### 1.1 创建项目
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 记下项目 ID

### 1.2 启用 API
1. 导航到 "API 和服务" > "库"
2. 搜索并启用以下 API：
   - **YouTube Data API v3**
   - **YouTube Analytics API**

### 1.3 创建 OAuth 凭据
1. 导航到 "API 和服务" > "凭据"
2. 点击 "创建凭据" > "OAuth 客户端 ID"
3. 应用类型选择 "Web 应用"
4. 设置名称：`YouTubeRadar Analytics`
5. 添加授权重定向 URI：
   ```
   http://localhost:3000/oauth/callback
   ```
6. 保存客户端 ID 和客户端密钥

## 🔑 第二步：获取刷新令牌

### 2.1 配置环境变量
设置 OAuth 客户端凭据：

```bash
# 方式一：环境变量（推荐用于远程授权）
export YOUTUBE_OAUTH_CLIENT_ID="你的客户端ID"
export YOUTUBE_OAUTH_CLIENT_SECRET="你的客户端密钥"

# 方式二：创建 .env.local 文件（本地授权）
YOUTUBE_OAUTH_CLIENT_ID=你的客户端ID
YOUTUBE_OAUTH_CLIENT_SECRET=你的客户端密钥
```

### 2.2 选择授权方式

#### 🌐 方案一：远程授权（推荐）
**适用场景**：在不同电脑上完成授权，无需本地服务器

```bash
# 运行远程 OAuth 设置助手
node scripts/remote-oauth-setup.js
```

**优势**：
- ✅ 可在任何设备的浏览器中完成授权
- ✅ 支持指纹浏览器、手机浏览器等
- ✅ 无需在服务器上运行浏览器
- ✅ 更安全，适合生产环境

#### 🖥️ 方案二：本地授权
**适用场景**：在当前电脑上直接完成授权

```bash
# 安装依赖
npm install

# 运行本地 OAuth 设置助手
node scripts/setup-youtube-oauth.js
```

### 2.3 授权流程详解

#### 🌐 支持任何浏览器环境
OAuth 授权流程可以在以下环境中完成：
- ✅ **指纹浏览器**（AdsPower、VMLogin、BitBrowser等）
- ✅ **无痕模式浏览器**
- ✅ **虚拟机浏览器** 
- ✅ **代理浏览器**
- ✅ **移动端浏览器**

#### 🌐 远程授权操作步骤：
1. **在服务器上启动脚本**：
   ```bash
   node scripts/remote-oauth-setup.js
   ```

2. **复制授权链接**：
   - 脚本会生成授权URL
   - 复制显示的完整链接

3. **在任何设备上打开授权链接**：
   - 可以在不同的电脑上打开
   - 可以在指纹浏览器中打开
   - 可以在手机浏览器中打开
   - 使用目标Google账户登录

4. **完成授权并获取授权码**：
   - 选择拥有YouTube频道的账户
   - 授权访问YouTube Analytics数据
   - **复制页面显示的授权码**（一长串字符）

5. **回到服务器输入授权码**：
   - 返回运行脚本的终端
   - 粘贴授权码并回车
   - 脚本会自动交换访问令牌

#### 🖥️ 本地授权操作步骤：
1. **启动本地设置脚本**：
   ```bash
   node scripts/setup-youtube-oauth.js
   ```

2. **浏览器自动打开**：
   - 脚本会自动打开默认浏览器
   - 如果失败，手动复制链接访问

3. **完成授权**：
   - 登录Google账户并授权
   - 浏览器会重定向到 `http://localhost:3000/oauth/callback`
   - 脚本自动获取刷新令牌

#### 🔄 如果自动打开失败：
```bash
# 脚本运行后会显示类似信息：
⚠️  无法自动打开浏览器，请手动访问以下URL:
https://accounts.google.com/o/oauth2/v2/auth?client_id=...

# 手动复制此URL到任何浏览器中访问即可
```

## 🌐 第三步：生产环境配置

### 3.1 更新 .env.production
将获得的凭据添加到 `.env.production` 文件：

```bash
# YouTube Analytics API OAuth配置
YOUTUBE_OAUTH_CLIENT_ID=你的客户端ID
YOUTUBE_OAUTH_CLIENT_SECRET=你的客户端密钥
YOUTUBE_REFRESH_TOKEN=你的刷新令牌
```

### 3.2 配置 Vercel 环境变量
在 Vercel Dashboard 中设置环境变量：

1. 访问项目设置 > Environment Variables
2. 添加以下变量：
   - `YOUTUBE_OAUTH_CLIENT_ID`
   - `YOUTUBE_OAUTH_CLIENT_SECRET`
   - `YOUTUBE_REFRESH_TOKEN`
3. 确保环境设置为 "Production"

## 🧪 第四步：测试 API 集成

### 4.1 测试单个频道同步
```bash
# 测试特定频道的数据同步
curl -X POST https://your-domain.vercel.app/api/sync-real-analytics \\
  -H "Content-Type: application/json" \\
  -d '{"channelId": "频道ID"}'
```

### 4.2 测试批量同步
```bash
# 测试所有频道的数据同步
curl https://your-domain.vercel.app/api/sync-real-analytics
```

### 4.3 验证数据
检查每日活动页面是否显示真实数据而非估算数据。

## 📊 API 功能说明

### 数据同步特性
- **真实数据源**：直接从 YouTube Analytics API 获取
- **频道时区支持**：按照频道本身时区计算，而非本地时间
- **自动令牌刷新**：无需手动维护访问令牌
- **批量处理**：支持所有频道的批量数据同步

### 同步的数据指标
- 观看次数 (views)
- 观看时长 (estimatedMinutesWatched)
- 订阅者增长 (subscribersGained)
- 订阅者流失 (subscribersLost)
- 展示次数估算 (impressions)
- 点击率 (impressionCtr)

## 🔧 故障排除

### 常见错误及解决方案

#### 1. "No refresh token available"
**原因**：环境变量中缺少刷新令牌
**解决**：重新运行 OAuth 设置脚本获取刷新令牌

#### 2. "Failed to refresh access token"
**原因**：刷新令牌已过期或无效
**解决**：重新完成授权流程获取新的刷新令牌

#### 3. "YouTube Analytics API quota exceeded"
**原因**：API 调用超出每日配额限制
**解决**：等待配额重置或申请增加配额

#### 4. "Channel not found"
**原因**：指定的频道 ID 不存在于数据库中
**解决**：确保频道已正确添加到系统中

### 调试建议
1. 检查 Vercel 函数日志
2. 验证环境变量是否正确设置
3. 确认 Google Cloud Console 中 API 已启用
4. 检查 OAuth 应用的重定向 URI 配置

## 🔒 安全注意事项

1. **凭据保护**：
   - 永远不要将 OAuth 凭据提交到版本控制
   - 使用环境变量存储敏感信息
   - 定期轮换客户端密钥

2. **权限最小化**：
   - 只请求必要的 OAuth 作用域
   - 定期审查 API 权限

3. **日志安全**：
   - 不要在日志中记录访问令牌
   - 对敏感数据进行脱敏处理

## 📈 性能优化

1. **缓存策略**：
   - 访问令牌自动缓存直至过期
   - 避免频繁的 API 调用

2. **批处理**：
   - 使用批量 API 接口减少请求数量
   - 在非高峰时段执行大批量同步

3. **错误处理**：
   - 实现指数退避重试机制
   - 优雅处理 API 限制和临时错误

## 📚 相关文档

- [YouTube Analytics API 官方文档](https://developers.google.com/youtube/analytics)
- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [YouTube Data API 配额管理](https://developers.google.com/youtube/v3/getting-started#quota)

---

如有问题，请查看项目日志或联系开发团队。