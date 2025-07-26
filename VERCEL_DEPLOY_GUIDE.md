# Vercel 部署指南

## 方法 1：通过 Vercel 网站部署（最简单）

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 点击 "Start Deploying"

2. **导入 Git 仓库**
   - 选择 "Import Git Repository"
   - 连接您的 GitHub 账号
   - 选择 `tiaochao/YouTubeRadar` 仓库

3. **配置项目**
   - Framework Preset: Next.js（会自动检测）
   - Root Directory: ./（保持默认）
   - Build Command: `npm run build`（保持默认）
   - Output Directory: `.next`（保持默认）

4. **设置环境变量**
   点击 "Environment Variables" 添加：
   ```
   NEXT_PUBLIC_YOUTUBE_API_KEY = AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4
   NEXT_PUBLIC_USE_LOCAL_STORAGE = true
   ```

5. **部署**
   - 点击 "Deploy"
   - 等待构建完成（约 1-2 分钟）

## 方法 2：使用 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   cd /Volumes/AI/YouTubeRadar
   vercel
   ```

4. **按提示操作**
   - Set up and deploy? Y
   - Which scope? 选择您的账号
   - Link to existing project? N
   - Project name? YouTubeRadar
   - In which directory? ./
   - Want to override settings? N

## 部署后配置

1. **自定义域名**（可选）
   - 在 Vercel 项目设置中
   - Settings → Domains
   - 添加您的域名

2. **环境变量**（如需修改）
   - Settings → Environment Variables
   - 修改后需要重新部署

3. **查看部署状态**
   - 访问 https://vercel.com/dashboard
   - 查看构建日志和访问链接

## 预期结果

部署成功后，您将获得：
- 生产环境 URL：`https://youtube-radar.vercel.app`
- 预览环境 URL：每次提交都会生成新的预览链接
- 自动 HTTPS
- 全球 CDN 加速
- 自动部署（GitHub 推送后自动更新）

## 注意事项

- 确保 `vercel.json` 配置正确
- 环境变量必须以 `NEXT_PUBLIC_` 开头才能在客户端使用
- 首次部署可能需要 2-3 分钟
- 后续更新只需推送到 GitHub，Vercel 会自动部署

## 故障排除

如果部署失败：
1. 检查构建日志
2. 确认环境变量设置正确
3. 确保没有类型错误（已配置忽略）
4. 查看 Vercel 文档：https://vercel.com/docs