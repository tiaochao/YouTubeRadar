// Electron preload script
// 用于在渲染进程中安全地暴露某些 API

const { contextBridge } = require('electron')

// 可以在这里暴露一些安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
})