# Windows 构建简单指南

## 快速开始

### 方法 1：使用 CMD（命令提示符）
```cmd
build-win.cmd
```

### 方法 2：使用 PowerShell
```powershell
# 如果遇到权限问题，先运行：
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# 然后运行：
.\build-win.ps1
```

### 方法 3：使用 npm 命令
```bash
# 安装依赖
npm install --legacy-peer-deps

# 构建应用
npm run build:win
```

## 常见问题

### 1. "npm 不是内部或外部命令"
- 需要安装 Node.js：https://nodejs.org/
- 安装时勾选 "Add to PATH"

### 2. "无法加载文件 build-win.ps1"
在 PowerShell 中运行：
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser
```

### 3. 构建失败 - 缺少工具
以管理员身份运行：
```cmd
npm install --global windows-build-tools
```

### 4. Python 错误
安装 Python 2.7 或 3.x：https://www.python.org/

### 5. 图标问题
- 创建 `build` 文件夹
- 将图标文件保存为 `build/icon.ico`
- 使用在线转换工具：https://www.icoconverter.com/

## 手动构建步骤

如果脚本无法运行，按以下步骤手动构建：

1. **打开命令提示符（CMD）**

2. **进入项目目录**
   ```cmd
   cd C:\path\to\YouTubeRadar
   ```

3. **安装依赖**
   ```cmd
   npm install --legacy-peer-deps
   ```

4. **构建 Next.js**
   ```cmd
   npm run build
   ```

5. **复制文件**
   ```cmd
   mkdir .next\standalone\.next\static
   mkdir .next\standalone\public
   xcopy /E /I /Y .next\static .next\standalone\.next\static
   xcopy /E /I /Y public .next\standalone\public
   copy .env.local .next\standalone\
   ```

6. **构建安装程序**
   ```cmd
   npx electron-builder --win
   ```

## 输出文件

构建成功后，在 `dist-electron` 文件夹中会有：
- `YouTube Radar-Setup-0.1.0.exe` - 安装程序
- `YouTube Radar-Portable-0.1.0.exe` - 便携版（如果配置了）

## 测试应用

1. 双击运行 exe 文件
2. 如果遇到 "Windows 保护了你的电脑" 警告：
   - 点击 "更多信息"
   - 点击 "仍要运行"

## 分发注意事项

- 未签名的应用会触发 Windows Defender 警告
- 考虑购买代码签名证书
- 或告诉用户如何绕过警告