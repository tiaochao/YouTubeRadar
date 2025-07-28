# Vercel 环境变量设置指南

请在 Vercel 项目设置中添加以下环境变量：

1. 访问 https://vercel.com/tiaochao/youtuberadar888/settings/environment-variables

2. 添加以下环境变量：

```
SUPABASE_URL
值: https://ufcszgnfhiurfzrknofr.supabase.co

SUPABASE_SERVICE_KEY
值: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmY3N6Z25maGl1cmZ6cmtub2ZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDc4MjQ0MSwiZXhwIjoyMDUwMzU4NDQxfQ.k9JXmU0hFh0xQ-oiVHtfO5Ag6uPJZD-mkmJ7ZZKNYxs
```

3. 确保以下变量也已设置（应该已经存在）：
```
DATABASE_URL
值: postgresql://postgres:54DG979491%21@db.ufcszgnfhiurfzrknofr.supabase.co:5432/postgres

YOUTUBE_API_KEY
值: AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4

NEXT_PUBLIC_YOUTUBE_API_KEY
值: AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4
```

4. 点击 'Save' 保存所有环境变量

5. 重新部署项目（Vercel 会自动触发重新部署）

注意：这些是敏感信息，请确保不要在公开场合分享这些密钥。
