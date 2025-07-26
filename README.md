<div align="center">
  <h1>
    <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/radar.svg" width="36" height="36" style="vertical-align: middle; margin-right: 8px;" />
    YouTube Radar
  </h1>
  
  <p align="center">
    <strong>实时监控和分析 YouTube 频道数据的强大工具</strong>
  </p>

  <p align="center">
    <a href="#features">功能特性</a> •
    <a href="#demo">在线演示</a> •
    <a href="#quick-start">快速开始</a> •
    <a href="#deployment">部署指南</a> •
    <a href="#tech-stack">技术栈</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
  </p>
</div>

---

## 🌟 项目简介

YouTube Radar 是一个现代化的 YouTube 频道数据分析工具，支持多频道管理、实时数据同步、趋势分析等功能。可以部署为 Web 应用或桌面应用，支持离线使用。

### 🎯 核心特性

- 🔍 **多频道管理** - 同时监控多个 YouTube 频道
- 📊 **数据可视化** - 直观的图表展示频道表现
- 🔄 **实时同步** - 自动更新频道和视频数据
- 💾 **离线支持** - 数据存储在本地，无需服务器
- 🌐 **多语言** - 支持中文和英文界面
- 🎨 **现代 UI** - 基于 Shadcn UI 的精美界面

## 🚀 快速开始 {#quick-start}

### 在线使用（推荐）

访问我们的在线演示版本，无需安装即可体验全部功能。

### 本地运行

```bash
# 克隆项目
git clone https://github.com/tiaochao/YouTubeRadar.git
cd YouTubeRadar

# 安装依赖
npm install --legacy-peer-deps

# 开发模式
npm run dev

# 访问 http://localhost:3000
```

### 环境配置

创建 `.env.local` 文件：

```env
# YouTube API Key (必需)
NEXT_PUBLIC_YOUTUBE_API_KEY=你的_API_密钥

# 启用本地存储模式
NEXT_PUBLIC_USE_LOCAL_STORAGE=true
```

## 📦 部署指南 {#deployment}

### 方式一：Vercel（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tiaochao/YouTubeRadar)

1. 点击上方按钮
2. 连接 GitHub 账号
3. 设置环境变量
4. 完成部署

### 方式二：Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/tiaochao/YouTubeRadar)

### 方式三：Docker

```bash
# 构建镜像
docker build -t youtube-radar .

# 运行容器
docker run -p 3000:3000 -e NEXT_PUBLIC_YOUTUBE_API_KEY=你的密钥 youtube-radar
```

### 方式四：桌面应用

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 🛠️ 技术栈 {#tech-stack}

### 前端框架
- **Next.js 15** - React 全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 原子化 CSS
- **Shadcn UI** - 现代组件库

### 数据处理
- **YouTube Data API v3** - 获取频道数据
- **Local Storage** - 本地数据存储
- **Recharts** - 数据可视化

### 开发工具
- **ESLint** - 代码规范
- **Prettier** - 代码格式化
- **Jest** - 单元测试

## 📱 功能特性 {#features}

### 频道管理
- ➕ 添加频道（支持搜索、@handle、URL）
- 📊 查看频道统计（订阅者、观看数、视频数）
- 🔄 同步频道最新数据
- 🗑️ 删除不需要的频道

### 数据分析
- 📈 频道增长趋势图
- 📹 视频发布频率分析
- 👁️ 观看数据统计
- 📅 每日活动报告

### 系统功能
- 🌍 中英文切换
- 🎨 主题切换（开发中）
- 💾 数据导出
- ⚙️ 系统设置

## 🔧 配置说明

### 获取 YouTube API Key

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 YouTube Data API v3
4. 创建凭据 → API 密钥
5. 复制密钥到环境变量

### API 配额说明

YouTube API 每日配额限制：
- 免费配额：10,000 单位/天
- 搜索操作：100 单位
- 频道信息：1 单位
- 视频列表：1 单位

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 开源协议

本项目基于 MIT 协议开源，详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Shadcn UI](https://ui.shadcn.com/) - UI 组件
- [Lucide Icons](https://lucide.dev/) - 图标库
- [YouTube API](https://developers.google.com/youtube) - 数据接口

---

<div align="center">
  <p>如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！</p>
  
  <p>
    <a href="https://github.com/tiaochao/YouTubeRadar/issues">报告问题</a> •
    <a href="https://github.com/tiaochao/YouTubeRadar/discussions">参与讨论</a>
  </p>
</div>