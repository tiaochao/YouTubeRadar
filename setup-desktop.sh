#!/bin/bash

echo "设置 YouTube Analytics Dashboard 桌面版..."

# 安装 Electron 相关依赖
echo "安装 Electron 依赖..."
npm install --save-dev electron@latest
npm install --save-dev @electron-forge/cli@latest
npm install --save-dev @electron-forge/maker-deb@latest
npm install --save-dev @electron-forge/maker-rpm@latest
npm install --save-dev @electron-forge/maker-squirrel@latest
npm install --save-dev @electron-forge/maker-zip@latest
npm install --save-dev @electron-forge/maker-dmg@latest
npm install --save-dev electron-builder@latest
npm install --save wait-on

# 创建构建目录
echo "创建构建目录..."
mkdir -p build
mkdir -p dist-electron

# 提示用户添加图标
echo "请添加以下图标文件到 build 目录："
echo "- icon.png (512x512) - Linux"
echo "- icon.ico - Windows" 
echo "- icon.icns - macOS"

# 更新 package.json
echo "更新 package.json..."
node -e "
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// 添加 Electron 相关脚本
packageJson.main = 'electron-main.js';
packageJson.scripts['electron:dev'] = 'electron .';
packageJson.scripts['electron:build'] = 'npm run build && electron-builder';
packageJson.scripts['electron:dist'] = 'npm run build && electron-builder --publish=never';
packageJson.scripts['electron:dist:mac'] = 'npm run build && electron-builder --mac';
packageJson.scripts['electron:dist:win'] = 'npm run build && electron-builder --win';
packageJson.scripts['electron:dist:linux'] = 'npm run build && electron-builder --linux';
packageJson.scripts['forge:package'] = 'electron-forge package';
packageJson.scripts['forge:make'] = 'electron-forge make';

// 添加构建配置
packageJson.build = {
  appId: 'com.yourcompany.youtube-analytics-dashboard',
  productName: 'YouTube Analytics Dashboard',
  directories: {
    output: 'dist-electron'
  }
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('package.json 已更新');
"

echo "设置完成！"
echo ""
echo "使用说明："
echo "1. 开发模式：npm run electron:dev"
echo "2. 构建应用："
echo "   - Windows: npm run electron:dist:win"
echo "   - macOS: npm run electron:dist:mac" 
echo "   - Linux: npm run electron:dist:linux"
echo "   - 所有平台: npm run electron:dist"
echo ""
echo "注意事项："
echo "1. 首次运行前，请确保已添加应用图标到 build 目录"
echo "2. Windows 上构建需要安装 NSIS"
echo "3. macOS 上构建需要在 macOS 系统上进行"
echo "4. 构建的应用将在 dist-electron 目录中"