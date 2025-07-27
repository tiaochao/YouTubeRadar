# Vercel 数据库配置指南

## 在 Vercel 中添加数据库环境变量

### 方法 1：使用 Vercel CLI（推荐）

```bash
# 1. 安装 Vercel CLI（如果还没有）
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 链接到项目
vercel link

# 4. 添加数据库环境变量
vercel env add DATABASE_URL production
# 当提示输入值时，粘贴以下内容：
# postgresql://postgres:54DG979491%21@db.ufcszgnfhiurfzrknofr.supabase.co:5432/postgres

# 5. 触发重新部署
vercel --prod
```

### 方法 2：通过 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `youtuberadar888`
3. 进入 **Settings** → **Environment Variables**
4. 点击 **Add New**
5. 添加以下环境变量：

| Key | Value | Environment |
|-----|-------|-------------|
| DATABASE_URL | `postgresql://postgres:54DG979491%21@db.ufcszgnfhiurfzrknofr.supabase.co:5432/postgres` | Production |

6. 点击 **Save**
7. 重新部署会自动触发

### 方法 3：使用一键配置脚本

创建并运行以下脚本：

```bash
# setup-vercel-db.sh
#!/bin/bash

echo "正在配置 Vercel 数据库环境变量..."

# 设置数据库 URL
vercel env add DATABASE_URL production << EOF
postgresql://postgres:54DG979491%21@db.ufcszgnfhiurfzrknofr.supabase.co:5432/postgres
EOF

echo "环境变量已添加，正在重新部署..."
vercel --prod

echo "配置完成！"
```

运行脚本：
```bash
chmod +x setup-vercel-db.sh
./setup-vercel-db.sh
```

## 验证配置

配置完成后，访问以下链接验证：

1. **健康检查**: https://youtuberadar888.vercel.app/api/health
   - 应该显示数据库连接状态

2. **每日活动页面**: https://youtuberadar888.vercel.app/daily-activity
   - 应该能够正常显示（而不是本地存储限制提示）

## 注意事项

1. **数据库已初始化**：您的 Supabase 数据库已经创建了所有必要的表
2. **连接字符串安全**：Vercel 会加密存储环境变量
3. **自动重新部署**：添加环境变量后会自动触发重新部署

## 故障排除

如果配置后仍有问题：

1. 检查 Vercel Functions 日志：
   ```bash
   vercel logs --prod
   ```

2. 确认环境变量已正确设置：
   ```bash
   vercel env ls production
   ```

3. 手动触发重新部署：
   ```bash
   vercel --prod --force
   ```

## 数据库信息

- **提供商**: Supabase
- **区域**: 美国东部
- **项目 ID**: ufcszgnfhiurfzrknofr
- **数据库名**: postgres
- **用户**: postgres
- **密码**: 54DG979491! (URL编码后: 54DG979491%21)