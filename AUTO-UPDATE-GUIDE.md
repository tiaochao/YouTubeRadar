# 多设备自动更新方案

## 方案一：使用 Git 版本控制（推荐）

### 1. 初始化 Git 仓库
在开发机器上：
```bash
# 初始化 Git
git init
git add .
git commit -m "Initial commit"

# 创建 GitHub/Gitee 仓库并推送
git remote add origin https://github.com/yourusername/youtube-radar.git
git push -u origin main
```

### 2. 在其他设备上克隆
```bash
git clone https://github.com/yourusername/youtube-radar.git
cd youtube-radar
npm install --legacy-peer-deps
```

### 3. 自动同步脚本
创建 `sync-and-build.cmd`：
```cmd
@echo off
echo 同步最新代码...
git pull origin main

echo 安装依赖...
npm install --legacy-peer-deps

echo 构建应用...
npm run build:win

echo 更新完成！
pause
```

## 方案二：自动更新功能（应用内更新）

### 1. 安装 electron-updater
```bash
npm install electron-updater --save
```

### 2. 配置自动更新
在 `electron-standalone.js` 中添加：
```javascript
const { autoUpdater } = require('electron-updater')

// 配置更新服务器
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'yourusername',
  repo: 'youtube-radar'
})

// 检查更新
app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify()
})

// 更新事件
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: '发现新版本',
    message: '发现新版本，是否现在更新？',
    buttons: ['是', '否']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate()
    }
  })
})

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})
```

### 3. 配置发布
在 `electron-builder.yml` 中添加：
```yaml
publish:
  - provider: github
    owner: yourusername
    repo: youtube-radar
```

## 方案三：网络共享文件夹

### 1. 设置共享文件夹
在开发机器上：
- 右键项目文件夹 → 属性 → 共享
- 设置共享权限

### 2. 其他设备访问
```cmd
# 映射网络驱动器
net use Z: \\开发机器名\YouTubeRadar

# 复制到本地并构建
xcopy Z:\*.* C:\YouTubeRadar\ /E /Y
cd C:\YouTubeRadar
npm install --legacy-peer-deps
npm run build:win
```

## 方案四：云同步服务

### 使用 OneDrive/Dropbox/百度网盘
1. 将项目文件夹放在云同步目录
2. 其他设备自动同步
3. 同步完成后运行构建

### 注意事项：
- 排除 `node_modules` 和 `dist-electron` 文件夹
- 创建 `.gitignore` 或同步排除规则

## 方案五：CI/CD 自动构建

### 使用 GitHub Actions
创建 `.github/workflows/build.yml`：
```yaml
name: Build and Release

on:
  push:
    branches: [ main ]
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install --legacy-peer-deps
    
    - name: Build
      run: npm run build:win
    
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: windows-installer
        path: dist-electron/*.exe
```

## 推荐方案组合

### 开发环境：Git + 同步脚本
1. 使用 Git 管理代码
2. 创建一键同步脚本
3. 其他设备运行脚本即可更新

### 生产环境：自动更新
1. 集成 electron-updater
2. 发布到 GitHub Releases
3. 应用自动检查更新

## 快速同步脚本

创建 `quick-sync.cmd` 供其他设备使用：
```cmd
@echo off
echo YouTube Radar 快速同步工具
echo ========================
echo.

:: 检查 Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：未安装 Git！
    echo 请从 https://git-scm.com/ 下载安装
    pause
    exit /b 1
)

:: 拉取最新代码
echo [1/4] 同步最新代码...
git fetch origin
git reset --hard origin/main

:: 安装依赖
echo.
echo [2/4] 更新依赖...
call npm install --legacy-peer-deps --no-optional

:: 构建应用
echo.
echo [3/4] 构建应用...
call npm run build:win

:: 完成
echo.
echo [4/4] 同步完成！
echo.
echo 可执行文件位置：dist-electron\
pause
```

## 最佳实践

1. **版本控制**：始终使用 Git
2. **自动化**：创建一键更新脚本
3. **版本号**：在 package.json 中维护版本号
4. **更新日志**：记录每次更新内容
5. **测试**：更新前先在开发机测试