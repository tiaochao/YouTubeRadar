const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3003;

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Simple route handling
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>YouTube Radar - Static Deployment</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #0070f3;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 10px 10px 0;
          }
          .button:hover {
            background: #0051cc;
          }
          code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
          }
          .step {
            margin: 20px 0;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <h1>🚀 YouTube Radar - 准备部署！</h1>
        
        <p>您的应用已成功构建。由于本地环境限制，请选择以下部署方式：</p>
        
        <div class="step">
          <h2>方法 1: Netlify Drop（最简单）</h2>
          <p>无需注册，直接拖拽部署：</p>
          <a href="https://app.netlify.com/drop" target="_blank" class="button">打开 Netlify Drop</a>
          <p>然后将 <code>YouTubeRadar</code> 文件夹拖到页面上即可。</p>
        </div>
        
        <div class="step">
          <h2>方法 2: Surge.sh（命令行）</h2>
          <p>在终端运行：</p>
          <pre><code>npm install -g surge
cd /Volumes/AI/YouTubeRadar
surge .next</code></pre>
        </div>
        
        <div class="step">
          <h2>方法 3: 静态文件托管</h2>
          <p>将 <code>.next</code> 文件夹上传到任何静态文件托管服务：</p>
          <ul>
            <li>GitHub Pages</li>
            <li>Cloudflare Pages</li>
            <li>Firebase Hosting</li>
          </ul>
        </div>
        
        <h2>应用特性</h2>
        <ul>
          <li>✅ 无需服务器</li>
          <li>✅ 客户端 YouTube API</li>
          <li>✅ 本地数据存储</li>
          <li>✅ 离线可用</li>
          <li>✅ 响应式设计</li>
        </ul>
        
        <p><strong>提示：</strong>部署后，您的数据将保存在浏览器本地存储中。</p>
      </body>
      </html>
    `);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`静态服务器运行在: http://localhost:${PORT}`);
  console.log(`也可以访问: http://127.0.0.1:${PORT}`);
});

// 错误处理
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用`);
  } else {
    console.error('服务器错误:', err);
  }
});