# 修复 Windows 构建问题

## 不要使用 windows-build-tools！

`windows-build-tools` 已经过时，不再需要。请按以下步骤操作：

## 1. 安装 Visual Studio Build Tools（推荐）

下载并安装 Visual Studio 2022 Build Tools：
https://visualstudio.microsoft.com/zh-hans/downloads/

安装时选择：
- "使用 C++ 的桌面开发" 工作负载
- 或者只选择 "MSVC v143 - VS 2022 C++ x64/x86 生成工具"

## 2. 或者使用 Node.js 自带的工具

新版本的 Node.js 已经包含了必要的构建工具。确保你使用的是：
- Node.js 16.x 或更高版本
- npm 8.x 或更高版本

## 3. 直接构建应用

在项目目录下运行：

```cmd
# 清理缓存
npm cache clean --force

# 安装依赖（不需要 windows-build-tools）
npm install --legacy-peer-deps

# 如果还有问题，尝试：
npm install --legacy-peer-deps --no-optional

# 构建应用
npm run build:win
```

## 4. 如果仍然有错误

尝试设置 npm 配置：

```cmd
# 设置 npm 使用系统的构建工具
npm config set msvs_version 2022

# 或者跳过可选依赖
npm install --legacy-peer-deps --no-optional
```

## 5. 最简单的解决方案

如果以上都不行，尝试：

```cmd
# 1. 删除 node_modules
rmdir /s /q node_modules

# 2. 删除 package-lock.json
del package-lock.json

# 3. 重新安装（跳过可选依赖）
npm install --legacy-peer-deps --no-optional

# 4. 构建
npm run build:win
```

## 注意事项

- **不要**运行 `npm install --global windows-build-tools`
- **不要**安装 Python 2.7（已过时）
- 使用 Visual Studio Build Tools 或 Node.js 16+ 自带的构建支持
- 如果使用公司网络，可能需要配置代理