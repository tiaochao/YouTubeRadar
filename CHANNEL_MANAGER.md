# 📺 YouTube Radar 频道管理工具

这是一个命令行工具，让你可以通过终端轻松管理YouTube频道数据，而不需要每次都通过网页界面操作。

## ✨ 功能特点

- 🔍 支持多种频道输入格式（@handle、频道名、YouTube链接）
- 💾 自动保存频道信息到数据库
- 🔄 批量同步所有频道的最新数据
- 📋 查看已保存的频道列表
- 🗑️ 删除不需要的频道

## 🚀 快速开始

### 添加频道

```bash
# 通过 @handle 添加
npm run channel:add @mkbhd

# 通过频道名添加
npm run channel:add "Marques Brownlee"

# 通过YouTube链接添加
npm run channel:add "https://www.youtube.com/@mkbhd"
```

### 查看频道列表

```bash
npm run channel:list
```

输出示例：
```
📺 已保存的频道 (2个):

1. Kurzgesagt – In a Nutshell
   ID: UCsXVk37bltHxD1rDPwtNM8Q
   订阅者: 24400000
   总观看: 3372188185
   状态: active
   添加时间: 2025/7/30 21:09:30

2. Marques Brownlee
   ID: UCBJycsmduvYEL83R_U4JriQ
   订阅者: 20100000
   总观看: 4872990102
   状态: active
   添加时间: 2025/7/30 21:09:19
```

### 同步频道数据

```bash
# 同步所有频道的最新数据（订阅者数、观看数等）
npm run channel:sync
```

### 删除频道

```bash
# 通过频道ID删除
npm run channel:remove UCBJycsmduvYEL83R_U4JriQ

# 通过频道名删除
npm run channel:remove "Marques Brownlee"
```

### 查看帮助

```bash
npm run channel:help
```

## 📝 使用场景

### 场景1：批量添加频道
```bash
npm run channel:add @mkbhd
npm run channel:add @veritasium
npm run channel:add @kurzgesagt
npm run channel:add @3blue1brown
```

### 场景2：定期数据同步
```bash
# 同步所有频道的最新数据
npm run channel:sync

# 然后启动网页查看分析结果
npm run dev
```

### 场景3：数据库管理
```bash
# 查看当前有哪些频道
npm run channel:list

# 删除不需要的频道
npm run channel:remove "不想要的频道"

# 添加新频道
npm run channel:add @新频道
```

## 🔧 技术说明

- 数据保存在本地SQLite数据库中，确保数据持久化
- 自动获取频道的最新统计信息（订阅者数、观看数等）
- 支持频道信息更新，如果频道已存在会自动更新数据
- 使用YouTube Data API v3获取准确的频道信息

## 💡 工作流程建议

1. **通过终端批量添加频道**：使用 `npm run channel:add` 添加所有你想分析的频道
2. **定期同步数据**：运行 `npm run channel:sync` 获取最新的频道统计
3. **网页查看分析**：启动 `npm run dev` 在网页界面查看详细的数据分析和图表

这样你就不需要每次打开电脑都重新通过网页添加频道，所有数据都已经保存在数据库中了！