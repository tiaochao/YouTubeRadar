const { app, BrowserWindow, Menu, shell, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')

// 自动更新（仅在打包后启用）
let autoUpdater = null
if (app.isPackaged) {
  try {
    autoUpdater = require('electron-updater').autoUpdater
    autoUpdater.checkForUpdatesAndNotify()
  } catch (e) {
    console.log('Auto-updater not available:', e.message)
  }
}

let mainWindow
let serverProcess

// 开发模式标志
const isDev = process.env.NODE_ENV !== 'production'

// 跨平台文件复制函数
function copyFolderRecursiveSync(source, target) {
  let files = []
  
  // 确保目标文件夹存在
  const targetFolder = path.join(target, path.basename(source))
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true })
  }
  
  // 复制文件
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source)
    files.forEach(function(file) {
      const curSource = path.join(source, file)
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder)
      } else {
        fs.copyFileSync(curSource, path.join(targetFolder, file))
      }
    })
  }
}

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
    icon: path.join(__dirname, 'build', 'icon.png'),
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
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  // 先显示加载页面
  mainWindow.loadURL(`data:text/html,
    <html>
      <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="text-align: center;">
          <h2>YouTube Radar</h2>
          <p>正在启动应用...</p>
        </div>
      </body>
    </html>
  `)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 启动 Next.js 服务器
async function startServer() {
  return new Promise((resolve, reject) => {
    // 确定 standalone 目录位置
    const standaloneDir = app.isPackaged 
      ? path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'standalone')
      : path.join(__dirname, '.next', 'standalone')
    
    // 确保目录存在
    if (!fs.existsSync(standaloneDir)) {
      console.error('Standalone directory not found:', standaloneDir)
      reject(new Error('Standalone directory not found'))
      return
    }

    console.log('Starting server from:', standaloneDir)
    
    // 在打包的应用中，确保静态文件在正确的位置
    if (app.isPackaged) {
      const staticSource = path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'static')
      const staticDest = path.join(standaloneDir, '.next', 'static')
      const publicSource = path.join(process.resourcesPath, 'app.asar.unpacked', 'public')
      const publicDest = path.join(standaloneDir, 'public')
      
      // 复制静态文件（跨平台）
      if (!fs.existsSync(staticDest) && fs.existsSync(staticSource)) {
        console.log('Copying static files...')
        copyFolderRecursiveSync(staticSource, path.dirname(staticDest))
      }
      
      // 复制 public 文件（跨平台）
      if (!fs.existsSync(publicDest) && fs.existsSync(publicSource)) {
        console.log('Copying public files...')
        copyFolderRecursiveSync(publicSource, standaloneDir)
      }
    }
    
    // 启动服务器
    serverProcess = spawn('node', ['server.js'], {
      cwd: standaloneDir,
      env: {
        ...process.env,
        PORT: '3000',
        NODE_ENV: 'production'
      }
    })

    let serverStarted = false

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`)
      if (!serverStarted && data.toString().includes('Ready')) {
        serverStarted = true
        resolve()
      }
    })

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`)
    })

    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err)
      reject(err)
    })

    // 如果5秒内没有启动，也尝试加载
    setTimeout(() => {
      if (!serverStarted) {
        console.log('Server startup timeout, attempting to load anyway...')
        resolve()
      }
    }, 5000)
  })
}

// 应用启动
app.whenReady().then(async () => {
  try {
    createWindow()
    
    // 启动服务器
    await startServer()
    
    // 加载应用
    console.log('Loading application...')
    mainWindow.loadURL('http://localhost:3000')
  } catch (error) {
    console.error('Failed to start application:', error)
    mainWindow.loadURL(`data:text/html,
      <html>
        <body style="font-family: system-ui; padding: 20px;">
          <h2>启动失败</h2>
          <p>错误: ${error.message}</p>
          <p>请检查日志获取更多信息。</p>
        </body>
      </html>
    `)
  }
})

// 窗口全部关闭时退出应用
app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
  app.quit()
})

// 应用退出前清理
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
})