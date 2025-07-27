# Vercel 部署配置指南

## 步骤 1：在 Vercel 中设置环境变量

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到您的项目 `youtuberadar888`
3. 点击 **Settings** → **Environment Variables**
4. 添加以下环境变量：

### 必需的环境变量

```bash
# 数据库连接字符串（请使用您的完整连接字符串）
DATABASE_URL="您的完整PostgreSQL连接字符串"

# YouTube API 密钥
YOUTUBE_API_KEY="AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4"

# 公开的 YouTube API 密钥（客户端使用）
NEXT_PUBLIC_YOUTUBE_API_KEY="AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4"
```

## 步骤 2：获取正确的数据库连接字符串

### 从 Neon 控制台获取：

1. 登录 [Neon Console](https://console.neon.tech/)
2. 选择您的项目
3. 点击 **Connection Details**
4. 选择 **Pooled connection** （用于 Vercel）
5. 复制完整的连接字符串

连接字符串格式应该类似：
```
postgresql://用户名:密码@主机名/数据库名?sslmode=require
```

### 重要提示：
- 确保使用 **Pooled connection**（不是 Direct connection）
- 确保包含 `?sslmode=require` 参数
- 密码中如果有特殊字符，需要进行 URL 编码

## 步骤 3：测试配置

部署后，访问以下页面检查配置：

1. **测试页面**：`https://youtuberadar888.vercel.app/test`
2. **API 测试**：`https://youtuberadar888.vercel.app/api/test`
3. **健康检查**：`https://youtuberadar888.vercel.app/api/health`

## 步骤 4：初始化数据库（本地执行）

在您的本地环境中运行：

```bash
# 1. 设置环境变量
export DATABASE_URL="您的数据库连接字符串"

# 2. 推送数据库架构
npm run db:push

# 3. 运行种子数据（可选）
npm run db:seed
```

## 常见问题

### 1. "password authentication failed"
- 检查密码是否正确
- 确认使用的是 Pooled connection URL
- 检查密码中的特殊字符是否需要编码

### 2. "Error loading dashboard"
- 确保所有环境变量都已设置
- 检查数据库连接是否正常
- 查看 Vercel 函数日志

### 3. 数据库连接超时
- 确保使用 Pooled connection
- 检查 Neon 项目是否处于活动状态
- 确认 IP 地址没有被防火墙阻止

## 需要帮助？

1. 查看 Vercel 函数日志：项目页面 → Functions → 查看错误日志
2. 访问 `/api/test` 端点查看环境配置状态
3. 确保 Neon 数据库项目处于活动状态（免费版会在不活动时休眠）