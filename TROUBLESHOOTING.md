# Vercel 部署故障排除

## "Error loading dashboard" 问题

如果您在 Vercel Dashboard 中看到这个错误，请尝试以下步骤：

### 1. 清除浏览器缓存
- 按 Ctrl/Cmd + Shift + R 强制刷新
- 或尝试无痕/隐私模式
- 或使用不同的浏览器

### 2. 检查 Vercel 状态
- 访问 [Vercel Status](https://www.vercel-status.com/)
- 查看是否有服务中断

### 3. 重新部署项目

通过 Git 推送触发重新部署：
```bash
git commit --allow-empty -m "Trigger rebuild"
git push
```

### 4. 检查项目设置

如果能访问项目设置：
1. 删除所有环境变量
2. 重新添加必要的环境变量
3. 触发重新部署

### 5. 使用 Vercel CLI

如果 Web 界面有问题，使用 CLI：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 查看项目
vercel ls

# 查看日志
vercel logs youtuberadar888

# 设置环境变量
vercel env add DATABASE_URL
```

### 6. 创建新项目（最后手段）

如果以上都不行：
1. 在 Vercel 创建新项目
2. 连接同一个 GitHub 仓库
3. 配置环境变量
4. 删除旧项目

## 应用错误排查

如果是应用本身的错误：

### 检查端点
- `/test` - 基本测试页面
- `/api/test` - API 测试
- `/api/health` - 健康检查

### 查看日志
在 Vercel Dashboard → Functions → Logs

### 环境变量检查清单
- [ ] DATABASE_URL 设置正确
- [ ] YOUTUBE_API_KEY 设置
- [ ] NEXT_PUBLIC_YOUTUBE_API_KEY 设置

### 数据库连接问题
1. 确保使用 Pooled Connection URL
2. 检查密码是否正确
3. 确认数据库服务正常运行