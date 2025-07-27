# Supabase 数据库设置指南

## 步骤 1：创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com/)
2. 点击 **Start your project** 注册/登录
3. 点击 **New project**
4. 填写项目信息：
   - **Name**: YouTubeRadar
   - **Database Password**: 设置一个强密码（保存好！）
   - **Region**: 选择离您最近的区域
   - **Pricing Plan**: Free（免费版足够使用）

5. 点击 **Create new project**（创建需要几分钟）

## 步骤 2：获取数据库连接信息

项目创建完成后：

1. 进入项目仪表板
2. 点击左侧 **Settings** → **Database**
3. 找到 **Connection string** 部分
4. 选择 **URI** 标签
5. 复制连接字符串（类似如下格式）：

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
```

**重要**：将 `[YOUR-PASSWORD]` 替换为您在创建项目时设置的密码

## 步骤 3：更新本地配置

1. 编辑 `.env` 文件：
```bash
DATABASE_URL="postgresql://postgres:您的密码@db.xxxxxxxxxxxx.supabase.co:5432/postgres"
```

2. 编辑 `.env.local` 文件（同样的内容）：
```bash
DATABASE_URL="postgresql://postgres:您的密码@db.xxxxxxxxxxxx.supabase.co:5432/postgres"
```

## 步骤 4：初始化数据库

在本地运行：

```bash
# 推送数据库架构
npm run db:push

# 运行种子数据（可选）
npm run db:seed
```

## 步骤 5：在 Vercel 中配置

使用 Vercel CLI：
```bash
vercel env add DATABASE_URL production
# 粘贴 Supabase 连接字符串

vercel env add YOUTUBE_API_KEY production
# 输入: AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4

vercel env add NEXT_PUBLIC_YOUTUBE_API_KEY production
# 输入: AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4
```

或在 Vercel Dashboard 中手动添加。

## Supabase 的优势

1. **免费额度充足**：
   - 500 MB 数据库空间
   - 无限 API 请求
   - 2GB 带宽

2. **内置功能**：
   - 实时数据同步
   - 自动备份
   - SQL 编辑器

3. **更好的连接性**：
   - 不会像 Neon 那样休眠
   - 更稳定的连接

## 常见问题

### 连接失败？
1. 检查密码是否正确（区分大小写）
2. 确保项目已完成初始化
3. 检查防火墙设置

### 需要连接池？
Supabase 默认支持连接池，使用标准连接字符串即可。

### 查看数据？
在 Supabase Dashboard 中使用 Table Editor 或 SQL Editor。