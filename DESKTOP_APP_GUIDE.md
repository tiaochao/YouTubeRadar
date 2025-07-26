# YouTube Analytics Dashboard 桌面应用指南

## 概述

这个桌面应用版本将 YouTube Analytics Dashboard 打包成一个独立的桌面应用程序，内置了数据库和服务器，无需手动启动服务器或配置数据库。

## 技术方案

### 使用的技术栈
- **Electron**: 将 Web 应用打包为桌面应用
- **SQLite**: 替代 PostgreSQL 作为内置数据库（轻量级，无需安装）
- **Next.js**: 继续使用原有的 Web 框架
- **Prisma**: 数据库 ORM（配置为使用 SQLite）

### 架构优势
1. **一键启动**: 双击即可运行，无需命令行操作
2. **内置数据库**: 使用 SQLite，数据存储在本地
3. **自动服务器**: 应用启动时自动启动内置服务器
4. **跨平台**: 支持 Windows、macOS 和 Linux

## 设置步骤

### 1. 安装依赖
```bash
# 运行设置脚本
./setup-desktop.sh

# 或手动安装
npm install --save-dev electron@latest
npm install --save-dev electron-builder@latest
npm install --save wait-on
```

### 2. 准备应用图标
在 `build` 目录下添加以下图标文件：
- `icon.png` (512x512) - 用于 Linux
- `icon.ico` - 用于 Windows
- `icon.icns` - 用于 macOS

### 3. 配置数据库
```bash
# 生成 SQLite 版本的 Prisma Client
npx prisma generate --schema=./prisma/schema.sqlite.prisma

# 创建 SQLite 数据库
npx prisma migrate dev --schema=./prisma/schema.sqlite.prisma
```

### 4. 修改环境配置
创建 `.env.desktop` 文件：
```env
DATABASE_URL="file:./prisma/youtube-analytics.db"
GOOGLE_CLIENT_ID="你的Google客户端ID"
GOOGLE_CLIENT_SECRET="你的Google客户端密钥"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/callback"
YOUTUBE_API_KEY="你的YouTube API密钥"
NEXT_PUBLIC_YOUTUBE_API_KEY="你的YouTube API密钥"
```

## 开发和构建

### 开发模式
```bash
# 启动 Electron 开发模式
npm run electron:dev
```

### 构建应用

#### Windows
```bash
npm run electron:dist:win
```
生成 `.exe` 安装程序

#### macOS
```bash
npm run electron:dist:mac
```
生成 `.dmg` 安装包（需要在 macOS 上构建）

#### Linux
```bash
npm run electron:dist:linux
```
生成 `.AppImage` 和 `.deb` 包

#### 所有平台
```bash
npm run electron:dist
```

构建的应用将在 `dist-electron` 目录中。

## 应用特性

### 1. 自动启动
- 应用启动时自动启动内置服务器
- 自动打开主窗口
- 自动连接本地 SQLite 数据库

### 2. 菜单栏
- 文件菜单：退出应用
- 编辑菜单：复制、粘贴等
- 视图菜单：刷新、缩放、全屏
- 帮助菜单：关于信息

### 3. 数据存储
- 所有数据存储在本地 SQLite 数据库
- 数据库文件位于应用目录的 `prisma/youtube-analytics.db`
- 支持数据导出功能

### 4. 安全性
- 外部链接在默认浏览器中打开
- 使用 contextIsolation 提高安全性
- 不暴露 Node.js API 到渲染进程

## 注意事项

1. **数据迁移**: 如果之前使用 PostgreSQL，需要手动迁移数据到 SQLite
2. **API 密钥**: 确保正确配置 Google 和 YouTube API 密钥
3. **端口冲突**: 应用默认使用 3000 端口，确保该端口未被占用
4. **自动更新**: 可以集成 electron-updater 实现自动更新功能

## 分发应用

### 代码签名
- Windows: 需要代码签名证书
- macOS: 需要 Apple 开发者账号
- Linux: 不需要签名

### 应用商店
- Windows: Microsoft Store
- macOS: Mac App Store（需要额外配置）
- Linux: Snap Store、Flathub

## 故障排除

### 应用无法启动
1. 检查端口 3000 是否被占用
2. 查看应用日志文件
3. 确保所有依赖正确安装

### 数据库错误
1. 删除 `prisma/youtube-analytics.db` 文件
2. 重新运行迁移命令
3. 检查数据库权限

### API 连接问题
1. 确认 API 密钥正确
2. 检查网络连接
3. 查看控制台错误信息

## 未来优化

1. **自动更新**: 集成 electron-updater
2. **系统托盘**: 添加系统托盘支持
3. **离线模式**: 增强离线功能
4. **数据备份**: 自动备份数据库
5. **性能优化**: 使用 V8 快照加速启动