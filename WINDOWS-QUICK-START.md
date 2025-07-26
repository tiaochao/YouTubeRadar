# Windows 快速开始指南

## 步骤 1：继续当前的安装

你已经正确清理了缓存，现在继续等待 `npm install` 完成。

那些警告（warn）是正常的：
- `deprecated` 警告不影响使用
- `--no-optional` 已经跳过了可选依赖
- `crypto` 警告可以忽略（现在是内置模块）

## 步骤 2：安装完成后

运行构建命令：
```cmd
npm run build:win
```

## 如果遇到错误

### 错误：Cannot find module
```cmd
# 确保依赖安装完整
npm list

# 如果有缺失，重新安装
npm install --legacy-peer-deps
```

### 错误：图标文件缺失
```cmd
# 创建 build 目录
mkdir build

# 临时解决方案（复制 PNG 作为 ICO）
copy public\placeholder-logo.png build\icon.ico
```

### 错误：环境变量未设置
创建 `.env.local` 文件：
```
YOUTUBE_API_KEY=你的API密钥
DATABASE_URL="file:./dev.db"
NODE_ENV=production
```

## 完整的构建命令序列

```cmd
# 1. 确保在项目根目录
cd C:\Users\萧炎\Desktop\YouTubeRadar

# 2. 如果 npm install 还在运行，等待完成
# 看到 "added XXX packages" 表示完成

# 3. 构建 Next.js
npm run build

# 4. 复制必要文件（如果需要）
xcopy /E /I /Y .next\static .next\standalone\.next\static
xcopy /E /I /Y public .next\standalone\public
copy .env.local .next\standalone\

# 5. 构建 Windows 安装程序
npx electron-builder --win
```

## 预期输出

成功后会在 `dist-electron` 目录看到：
- `YouTube Radar-Setup-0.1.0.exe` - 安装程序
- `YouTube Radar-Portable-0.1.0.exe` - 便携版（如果配置了）

## 测试构建的应用

1. 进入 `dist-electron` 目录
2. 双击 exe 文件运行
3. 如果看到安全警告，点击"更多信息" → "仍要运行"

## 下一步

1. 配置 YouTube API 密钥
2. 测试应用功能
3. 使用同步脚本在其他设备上部署