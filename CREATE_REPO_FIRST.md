# 请先创建 GitHub 仓库

推送失败，因为仓库还不存在。请按以下步骤操作：

## 1. 创建仓库

1. 访问 https://github.com/new
2. 仓库名称输入：`YouTube-Radar`
3. 设置为 Public 或 Private
4. **不要**勾选 "Initialize this repository with a README"
5. 点击 "Create repository"

## 2. 推送代码

仓库创建后，在终端运行：

```bash
git push -u origin main
```

## 3. 如果仍有权限问题

检查您的 Personal Access Token 权限：
- 需要 `repo` 权限（完整的仓库访问）
- 如果是组织仓库，还需要相应的组织权限

## 4. 验证 Token

可以测试 token 是否有效：
```bash
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

## 备选方案

如果继续遇到问题，可以：
1. 生成新的 Personal Access Token，确保有 `repo` 权限
2. 或使用 GitHub Desktop 应用程序
3. 或配置 SSH 密钥