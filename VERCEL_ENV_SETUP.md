# Vercel 环境变量配置

## 需要在 Vercel 中设置的环境变量

```bash
DATABASE_URL="postgresql://postgres:54DG979491!@db.ufcszgnfhiurfzrknofr.supabase.co:5432/postgres"
YOUTUBE_API_KEY="AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4"
NEXT_PUBLIC_YOUTUBE_API_KEY="AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4"
```

## 方法 1：使用 Vercel CLI（推荐）

```bash
# 安装 Vercel CLI（如果还没有）
npm i -g vercel

# 登录
vercel login

# 添加环境变量
vercel env add DATABASE_URL production
# 粘贴: postgresql://postgres:54DG979491!@db.ufcszgnfhiurfzrknofr.supabase.co:5432/postgres

vercel env add YOUTUBE_API_KEY production
# 粘贴: AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4

vercel env add NEXT_PUBLIC_YOUTUBE_API_KEY production
# 粘贴: AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4

# 触发重新部署
vercel --prod
```

## 方法 2：通过 Vercel Dashboard

如果 Dashboard 可以访问：

1. 登录 [Vercel](https://vercel.com/)
2. 选择项目 `youtuberadar888`
3. 进入 **Settings** → **Environment Variables**
4. 添加以下三个变量：
   - `DATABASE_URL`
   - `YOUTUBE_API_KEY`
   - `NEXT_PUBLIC_YOUTUBE_API_KEY`
5. 保存后会自动重新部署

## 验证部署

部署完成后，访问：

1. `https://youtuberadar888.vercel.app/` - 主页
2. `https://youtuberadar888.vercel.app/test` - 测试页面
3. `https://youtuberadar888.vercel.app/api/health` - 健康检查

## 故障排除

如果还有问题：

1. 检查 Vercel Functions 日志
2. 确保所有环境变量都已正确设置
3. 访问 `/api/test` 查看环境变量状态

## 数据库管理

在 Supabase Dashboard 中：
- 使用 Table Editor 查看数据
- 使用 SQL Editor 运行查询
- 查看实时日志