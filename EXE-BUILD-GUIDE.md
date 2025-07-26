# YouTube Radar EXE封装指南

## 前提准备

### 1. 安装必要的依赖
```bash
# 安装Electron相关依赖
npm install --save-dev electron electron-builder

# 安装Next.js静态导出相关依赖
npm install --save-dev @electron/remote
```

### 2. 更新package.json
```json
{
  "name": "youtube-radar",
  "version": "0.1.0",
  "main": "electron-main.js",
  "scripts": {
    // 现有脚本...
    "build:next": "next build",
    "export": "next export",
    "electron": "electron .",
    "electron:dev": "ELECTRON_IS_DEV=1 electron .",
    "build:electron": "npm run build:next && npm run export && electron-builder",
    "dist": "electron-builder",
    "pack": "electron-builder --dir",
    "postinstall": "electron-builder install-app-deps"
  },
  "build": {
    "productName": "YouTube Radar",
    "appId": "com.yourdomain.youtuberadar",
    "directories": {
      "output": "dist"
    },
    "files": [
      "electron-main.js",
      "preload.js",
      "out/**/*",
      "public/**/*",
      "prisma/**/*",
      "node_modules/**/*"
    ],
    "extraResources": [
      {
        "from": "prisma",
        "to": "prisma",
        "filter": ["**/*"]
      }
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "icon": "build/icon.icns"
    },
    "win": {
      "target": "nsis",
      "icon": "build/icon.ico"
    },
    "linux": {
      "target": "AppImage",
      "icon": "build/icon.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

## 步骤一：配置Next.js静态导出

### 1. 更新next.config.mjs
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true
  },
  // 添加基础路径配置
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : '',
  // 禁用服务端功能
  experimental: {
    appDir: true
  }
}

export default nextConfig
```

### 2. 创建静态API处理
由于静态导出不支持API路由，需要在Electron主进程中处理API请求：

```javascript
// electron-api-handler.js
const { ipcMain } = require('electron')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// 处理数据库查询
ipcMain.handle('db-query', async (event, { model, method, args }) => {
  try {
    const result = await prisma[model][method](args)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 处理YouTube API请求
ipcMain.handle('youtube-api', async (event, { endpoint, params }) => {
  try {
    const response = await fetch(endpoint, params)
    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

## 步骤二：更新Electron主文件

### 更新electron-main.js
```javascript
const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('path')
const isDev = process.env.ELECTRON_IS_DEV === '1'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'build/icon.png')
  })

  // 开发模式下连接到Next.js开发服务器
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    // 生产模式下加载静态文件
    mainWindow.loadFile(path.join(__dirname, 'out/index.html'))
  }

  // 设置菜单
  const template = [
    {
      label: 'YouTube Radar',
      submenu: [
        { label: '关于', role: 'about' },
        { type: 'separator' },
        { label: '退出', role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 加载API处理器
require('./electron-api-handler')
```

## 步骤三：创建preload脚本

### preload.js
```javascript
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 数据库操作
  db: {
    query: (model, method, args) => 
      ipcRenderer.invoke('db-query', { model, method, args })
  },
  // YouTube API
  youtube: {
    fetch: (endpoint, params) => 
      ipcRenderer.invoke('youtube-api', { endpoint, params })
  },
  // 系统信息
  platform: process.platform,
  isElectron: true
})
```

## 步骤四：修改前端代码适配Electron

### 创建API适配层
```typescript
// lib/api-adapter.ts
const isElectron = typeof window !== 'undefined' && window.electronAPI

export async function apiRequest(path: string, options?: RequestInit) {
  if (isElectron) {
    // Electron环境下使用IPC通信
    const method = path.split('/').pop()
    const model = path.split('/')[2]
    
    const result = await window.electronAPI.db.query(model, method, options?.body)
    if (result.success) {
      return { ok: true, data: result.data }
    } else {
      return { ok: false, error: result.error }
    }
  } else {
    // Web环境下使用HTTP请求
    const response = await fetch(path, options)
    return response.json()
  }
}
```

## 步骤五：构建流程

### 1. 清理项目
```bash
# 删除未使用的文件（参考CLEANUP-FOR-PRODUCTION.md）
rm -rf __tests__
rm -rf app/api/dev
rm -rf app/api/test-sync
# ... 其他清理命令
```

### 2. 设置环境变量
创建 `.env.production` 文件：
```env
DATABASE_URL="file:./youtube-radar.db"
YOUTUBE_API_KEY="your-api-key"
ENCRYPTION_KEY="your-encryption-key"
NODE_ENV="production"
```

### 3. 构建应用
```bash
# 1. 构建Next.js应用
npm run build:next

# 2. 导出静态文件
npm run export

# 3. 准备数据库
npx prisma generate
npx prisma db push

# 4. 构建Electron应用
npm run build:electron
```

## 步骤六：创建安装程序

### Windows (NSIS)
```bash
npm run dist -- --win
```
生成文件：
- `dist/YouTube Radar Setup 0.1.0.exe` (安装程序)
- `dist/win-unpacked/` (便携版)

### macOS
```bash
npm run dist -- --mac
```
生成文件：
- `dist/YouTube Radar-0.1.0.dmg` (安装镜像)
- `dist/mac/YouTube Radar.app` (应用程序)

### Linux
```bash
npm run dist -- --linux
```
生成文件：
- `dist/YouTube Radar-0.1.0.AppImage` (AppImage格式)

## 步骤七：测试打包后的应用

1. **功能测试**
   - 启动应用，检查所有页面是否正常加载
   - 测试数据库连接和操作
   - 测试YouTube API功能
   - 测试数据同步功能

2. **性能测试**
   - 检查应用启动时间
   - 检查内存使用情况
   - 检查CPU占用

3. **兼容性测试**
   - 在不同操作系统版本上测试
   - 检查不同分辨率下的显示效果

## 注意事项

1. **数据库路径**
   - 使用应用数据目录存储SQLite数据库
   - Windows: `%APPDATA%/youtube-radar/`
   - macOS: `~/Library/Application Support/youtube-radar/`
   - Linux: `~/.config/youtube-radar/`

2. **API密钥安全**
   - 不要在代码中硬编码API密钥
   - 使用加密存储敏感信息
   - 考虑让用户在首次使用时输入自己的API密钥

3. **自动更新**
   - 配置electron-updater实现自动更新
   - 设置更新服务器（GitHub Releases或自建服务器）

4. **代码签名**
   - Windows: 需要代码签名证书
   - macOS: 需要Apple开发者账号
   - 未签名的应用可能被系统安全软件拦截

## 构建优化建议

1. **减小体积**
   - 使用electron-builder的优化选项
   - 删除不必要的node_modules
   - 使用生产模式构建

2. **启动速度**
   - 实现启动画面
   - 延迟加载非必要模块
   - 优化数据库初始化

3. **内存优化**
   - 及时释放不用的资源
   - 实现数据分页加载
   - 优化图片和视频预览

## 发布准备

1. 更新版本号
2. 编写更新日志
3. 准备用户文档
4. 设置官方网站/下载页面
5. 配置崩溃报告收集（Sentry等）