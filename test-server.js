// 简单的测试服务器
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
  console.log(`请求: ${req.url}`);
  
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>YouTube Radar - 测试页面</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .status { 
            background: #fff; 
            padding: 20px; 
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .ok { color: green; }
          .error { color: red; }
          pre {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
          }
        </style>
      </head>
      <body>
        <h1>YouTube Radar 测试页面</h1>
        <div class="status">
          <h2>服务器状态</h2>
          <p class="ok">✓ Node.js 服务器运行正常</p>
          <p class="ok">✓ 端口 ${PORT} 已开启</p>
          
          <h2>项目文件检查</h2>
          <p class="${fs.existsSync('package.json') ? 'ok' : 'error'}">
            ${fs.existsSync('package.json') ? '✓' : '✗'} package.json
          </p>
          <p class="${fs.existsSync('app') ? 'ok' : 'error'}">
            ${fs.existsSync('app') ? '✓' : '✗'} app 目录
          </p>
          <p class="${fs.existsSync('node_modules') ? 'ok' : 'error'}">
            ${fs.existsSync('node_modules') ? '✓' : '✗'} node_modules
          </p>
          <p class="${fs.existsSync('.env.local') ? 'ok' : 'error'}">
            ${fs.existsSync('.env.local') ? '✓' : '✗'} .env.local
          </p>
          
          <h2>下一步</h2>
          <p>这个测试服务器证明端口 3000 可以正常使用。</p>
          <p>现在需要修复 Next.js 的依赖问题。</p>
          
          <h3>建议操作：</h3>
          <pre>
1. 关闭此服务器 (Ctrl+C)
2. 运行: minimal-start.cmd
3. 或手动安装最小依赖:
   npm install next react react-dom @prisma/client
4. 然后运行: npm run dev
          </pre>
        </div>
      </body>
      </html>
    `);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, (err) => {
  if (err) {
    console.error('无法启动服务器:', err);
    return;
  }
  console.log(`\n测试服务器已启动！`);
  console.log(`请在浏览器访问: http://localhost:${PORT}`);
  console.log(`\n按 Ctrl+C 停止服务器\n`);
});