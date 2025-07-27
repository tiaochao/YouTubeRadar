# Vercel CLI 使用指南

当 Vercel Dashboard 无法访问时，使用 CLI 管理项目。

## 安装和登录

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录（会打开浏览器进行验证）
vercel login
```

## 查看项目信息

```bash
# 列出所有项目
vercel ls

# 查看项目详情
vercel inspect youtuberadar888
```

## 管理环境变量

```bash
# 添加环境变量
vercel env add DATABASE_URL production
# 粘贴您的数据库连接字符串

vercel env add YOUTUBE_API_KEY production
# 输入: AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4

vercel env add NEXT_PUBLIC_YOUTUBE_API_KEY production
# 输入: AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4

# 查看所有环境变量
vercel env ls

# 拉取环境变量到本地
vercel env pull
```

## 查看部署日志

```bash
# 查看最近的部署
vercel ls youtuberadar888

# 查看日志
vercel logs youtuberadar888

# 查看特定部署的日志
vercel logs [deployment-url]
```

## 手动部署

```bash
# 在项目目录中部署
vercel --prod

# 或者指定项目名
vercel --prod --name youtuberadar888
```

## 删除和重新创建项目

```bash
# 删除项目（谨慎使用）
vercel rm youtuberadar888

# 重新创建并部署
vercel --prod
```

## 常用命令

```bash
# 查看帮助
vercel help

# 查看项目域名
vercel domains ls

# 查看函数日志
vercel logs --filter=functions

# 开发环境
vercel dev
```