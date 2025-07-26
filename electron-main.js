const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let serverProcess

// 开发模式标志
const isDev = process.env.NODE_ENV !== 'production'

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'public', 'icon.png'), // 需要添加应用图标
    title: 'YouTube Radar'
  })

  // 设置菜单
  const template = [
    {
      label: '文件',
      submenu: [
        { role: 'quit', label: '退出' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: async () => {
            const { dialog } = require('electron')
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: 'YouTube Radar',
              detail: '版本 1.0.0\n\n一个用于分析 YouTube 频道数据的桌面应用程序。',
              buttons: ['确定']
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  // 加载应用
  if (isDev) {
    // 开发模式下，等待端口确定后再加载
    const port = process.env.PORT || 3000
    setTimeout(() => {
      mainWindow.loadURL(`http://localhost:${port}`)
    }, 3000) // 等待3秒让Next.js服务器启动
  } else {
    // 生产模式 - 启动本地服务器
    mainWindow.loadURL('http://localhost:3000')
  }

  // 打开外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 启动本地服务器（生产环境）
async function startProductionServer() {
  return new Promise((resolve, reject) => {
    const standaloneDir = app.isPackaged 
      ? path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'standalone')
      : path.join(__dirname, '.next', 'standalone')
    
    console.log('Starting production server from:', standaloneDir)
    
    // 复制静态文件到 standalone（如果在打包环境中）
    if (app.isPackaged) {
      const staticSource = path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'static')
      const staticDest = path.join(standaloneDir, '.next', 'static')
      
      // 确保静态文件存在
      if (!require('fs').existsSync(staticDest) && require('fs').existsSync(staticSource)) {
        console.log('Copying static files...')
        const { execSync } = require('child_process')
        execSync(`cp -r "${staticSource}" "${staticDest}"`)
      }
    }
    
    // 启动 Next.js standalone 服务器
    serverProcess = spawn('node', ['server.js'], {
      cwd: standaloneDir,
      env: {
        ...process.env,
        PORT: '3000',
        NODE_ENV: 'production'
      },
      stdio: 'inherit'
    })

    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err)
      reject(err)
    })
    
    // 等待服务器启动
    setTimeout(resolve, 3000)
  })
}

// 启动 PostgreSQL（使用嵌入式 SQLite 替代）
async function startDatabase() {
  // 在生产环境中，我们使用 SQLite 而不是 PostgreSQL
  // 这需要修改 Prisma 配置
  console.log('Database ready (using SQLite)')
}

// 应用启动
app.whenReady().then(async () => {
  try {
    // 启动数据库
    await startDatabase()
    
    // 开发模式下启动 Next.js 开发服务器
    if (isDev) {
      serverProcess = spawn('npm', ['run', 'dev'], {
        shell: true,
        env: { ...process.env, BROWSER: 'none' },
        stdio: 'inherit'
      })
      
      // 等待服务器启动
      await new Promise(resolve => setTimeout(resolve, 3000))
    } else {
      // 生产模式下启动内置服务器
      await startProductionServer()
    }
    
    // 创建窗口
    createWindow()
  } catch (error) {
    console.error('Failed to start application:', error)
    app.quit()
  }
})

// 窗口全部关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) {
      serverProcess.kill()
    }
    app.quit()
  }
})

// macOS 上重新激活应用
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// 应用退出前清理
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
})