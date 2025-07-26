# YouTube Radar - 打包为 EXE 程序

## 系统功能清单

### 核心页面（已优化，无重复功能）
1. **主页** (`/`) - 仪表板概览
2. **频道管理** (`/channels`) - 添加、管理YouTube频道
3. **频道详情** (`/channels/[id]`) - 单个频道数据分析
4. **视频列表** (`/videos`) - 所有视频汇总
5. **数据分析** (`/analytics`) - 日度统计分析
6. **公开分析** (`/public-analytics`) - 临时分析任意频道
7. **任务管理** (`/tasks`) - 系统任务监控
8. **设置** (`/settings`) - 系统配置

### 已处理的重复功能
- ✅ 合并了主页和 `/dashboard` 页面
- ✅ 将 `/youtube-config` 重定向到设置页面
- ✅ 移除了未使用的加密功能

## 环境要求
- Node.js 18+
- PostgreSQL 数据库（或 SQLite for 单机版）
- YouTube Data API v3 密钥

## 打包步骤

### 1. 安装 Electron 依赖
```bash
npm install --save-dev electron electron-builder
npm install wait-on
```

### 2. 修改 package.json
添加以下脚本：
```json
{
  "scripts": {
    "electron": "electron .",
    "electron-dev": "NODE_ENV=development electron .",
    "build-win": "npm run build && electron-builder --win",
    "build-mac": "npm run build && electron-builder --mac",
    "dist": "npm run build && electron-builder"
  },
  "build": {
    "appId": "com.yourcompany.youtube-analytics",
    "productName": "YouTube Analytics Dashboard",
    "directories": {
      "output": "dist"
    },
    "files": [
      ".next/**/*",
      "public/**/*",
      "electron-main.js",
      "package.json",
      "node_modules/**/*",
      "prisma/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "public/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "public/icon.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "public/icon.png"
    }
  }
}
```

### 3. 创建生产环境配置
创建 `.env.production` 文件：
```env
# 数据库 - 使用 SQLite for 单机版
DATABASE_URL="file:./youtube-analytics.db"

# 其他配置保持不变
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 修改 Prisma 配置（支持 SQLite）
创建 `prisma/schema.sqlite.prisma`：
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
// 其余保持不变
```

### 5. 构建应用
```bash
# 构建 Next.js 应用
npm run build

# 导出静态文件（如果需要）
npm run export

# 打包为 Windows exe
npm run build-win

# 打包为 macOS app
npm run build-mac
```

## 配置文件说明

### electron-main.js
- 主进程文件，负责创建窗口和管理应用生命周期
- 已配置开发和生产环境
- 包含菜单配置

### electron-config.json
- Electron Builder 配置
- 定义应用元数据和打包选项

## 注意事项

1. **数据库选择**
   - 开发环境：PostgreSQL
   - 单机版：SQLite（自动包含在exe中）

2. **API 密钥**
   - YouTube API 密钥需要用户在设置页面配置
   - 密钥保存在本地配置文件中

3. **图标准备**
   - Windows: icon.ico (256x256)
   - macOS: icon.icns
   - Linux: icon.png

4. **性能优化**
   - 生产版本使用 Next.js 静态导出
   - 减少打包体积

## 测试打包结果
1. 在 `dist` 目录找到生成的安装程序
2. 安装并运行应用
3. 检查所有功能是否正常

## 常见问题

### Q: 打包后数据库连接失败？
A: 确保使用 SQLite 而不是 PostgreSQL，或包含 PostgreSQL 便携版

### Q: 应用启动缓慢？
A: 首次启动需要初始化数据库，请耐心等待

### Q: API 请求失败？
A: 检查网络连接和 YouTube API 密钥配置