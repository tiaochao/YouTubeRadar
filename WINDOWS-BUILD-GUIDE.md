# Windows 构建指南

## 前置要求

1. **Node.js** (v18 或更高版本)
   - 下载地址：https://nodejs.org/

2. **Git** (可选，用于克隆代码)
   - 下载地址：https://git-scm.com/

3. **Windows Build Tools** (C++ 编译器)
   ```powershell
   # 以管理员身份运行 PowerShell
   npm install --global windows-build-tools
   ```

## 构建步骤

### 1. 获取代码
```bash
git clone <repository-url>
cd YouTubeRadar
```

### 2. 安装依赖
```bash
npm install --legacy-peer-deps
```

### 3. 配置环境变量
创建 `.env.local` 文件：
```env
YOUTUBE_API_KEY=your_youtube_api_key
DATABASE_URL="file:./dev.db"
NODE_ENV=production
```

### 4. 准备图标文件
需要创建 Windows 图标文件 `build/icon.ico`：
- 使用在线工具：https://convertio.co/png-ico/
- 或使用图标编辑器（如 IcoFX）
- 图标应包含以下尺寸：16x16, 32x32, 48x48, 256x256

### 5. 构建应用

#### 方法一：使用批处理脚本（推荐）
```bash
build-windows.bat
```

#### 方法二：手动构建
```bash
# 构建 Next.js
npm run build

# 准备文件
xcopy /E /I /Y .next\static .next\standalone\.next\static
xcopy /E /I /Y public .next\standalone\public
copy .env.local .next\standalone\

# 构建 Windows 安装程序
npm run build:win
```

## 输出文件

构建完成后，在 `dist-electron` 目录下会生成：

1. **YouTube Radar-Setup-0.1.0.exe**
   - 标准安装程序
   - 需要管理员权限
   - 安装到 Program Files
   - 创建桌面快捷方式和开始菜单项

2. **YouTube Radar-Portable-0.1.0.exe**
   - 便携版
   - 无需安装
   - 可以从 U 盘运行

## 故障排除

### 1. 构建失败
- 确保已安装 Windows Build Tools
- 尝试删除 `node_modules` 并重新安装

### 2. 图标显示问题
- 确保 `build/icon.ico` 文件存在
- 图标文件必须是真正的 .ico 格式，不能只是重命名的 PNG

### 3. 应用无法启动
- 检查 `.env.local` 文件配置
- 查看 Windows 事件查看器中的错误日志
- 尝试以管理员身份运行

### 4. 防病毒软件警告
- 未签名的应用可能触发防病毒警告
- 考虑购买代码签名证书

## 代码签名（可选）

为了避免 Windows SmartScreen 警告，建议对应用进行代码签名：

1. 购买代码签名证书
2. 在 `electron-builder.yml` 中配置：
```yaml
win:
  signingHashAlgorithms: ['sha256']
  certificateFile: path/to/certificate.pfx
  certificatePassword: your-password
```

## 分发

1. **直接分发**
   - 将 .exe 文件上传到网站或云存储
   - 提供下载链接

2. **使用安装程序**
   - 推荐使用 NSIS 安装程序（默认）
   - 提供卸载功能
   - 自动创建快捷方式

3. **Microsoft Store**（可选）
   - 需要转换为 APPX 格式
   - 需要开发者账号