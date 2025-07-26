# GitHub 推送指南

## 方法 1: 使用 Personal Access Token (推荐)

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置名称，选择权限（至少需要 repo）
4. 生成 token 并复制

然后运行：
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/tiaochao/YouTube-Radar.git
git push -u origin main
```

## 方法 2: 使用 SSH

1. 生成 SSH 密钥（如果没有）：
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. 添加 SSH 密钥到 GitHub：
   - 复制公钥：`cat ~/.ssh/id_ed25519.pub`
   - 访问 https://github.com/settings/keys
   - 点击 "New SSH key" 并粘贴

3. 更改远程地址：
```bash
git remote set-url origin git@github.com:tiaochao/YouTube-Radar.git
git push -u origin main
```

## 方法 3: 使用 GitHub Desktop

1. 下载 GitHub Desktop: https://desktop.github.com/
2. 登录您的 GitHub 账号
3. 添加本地仓库
4. 发布到 GitHub

## 方法 4: 命令行输入凭据

运行以下命令，然后输入您的 GitHub 用户名和密码/token：
```bash
git push -u origin main
```

注意：GitHub 不再支持密码认证，需要使用 Personal Access Token。