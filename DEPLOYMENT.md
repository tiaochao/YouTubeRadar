# 部署指南

## 使用真实数据库部署到 Vercel

### 1. 准备数据库

首先需要一个 PostgreSQL 数据库。推荐使用：
- [Neon](https://neon.tech/)
- [Supabase](https://supabase.com/)
- [Railway](https://railway.app/)
- [Vercel Postgres](https://vercel.com/storage/postgres)

### 2. 设置环境变量

在 Vercel 项目设置中添加以下环境变量：

```
DATABASE_URL=postgresql://user:password@host:port/database
YOUTUBE_API_KEY=你的YouTube API密钥
NEXT_PUBLIC_YOUTUBE_API_KEY=你的YouTube API密钥
```

### 3. 初始化数据库

在本地运行以下命令生成数据库架构：

```bash
# 设置 DATABASE_URL 环境变量
export DATABASE_URL="你的数据库连接字符串"

# 生成 Prisma 客户端
npx prisma generate

# 推送架构到数据库
npx prisma db push
```

### 4. 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### 5. 验证部署

部署完成后，访问你的 Vercel URL，应该能看到：
- 应用正常运行
- 可以添加和管理频道
- 数据保存在真实数据库中

### 注意事项

1. **数据库连接**：确保 DATABASE_URL 格式正确，包含 SSL 参数（如果需要）
2. **API 密钥**：YouTube API 密钥需要在 Google Cloud Console 中启用 YouTube Data API v3
3. **构建命令**：vercel.json 中已配置 `npx prisma generate` 在构建前运行

### 故障排除

如果遇到数据库连接问题：
1. 检查 DATABASE_URL 是否正确
2. 确保数据库允许从 Vercel 的 IP 地址连接
3. 查看 Vercel 函数日志了解详细错误信息