const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`收到请求: ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>YouTube Radar - 测试页面</title>
      <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; padding: 40px;">
      <h1>✅ 服务器运行正常！</h1>
      <p>如果您看到这个页面，说明服务器可以访问。</p>
      <hr>
      <h2>Next.js 应用无法访问的可能原因：</h2>
      <ul>
        <li>防火墙阻止了连接</li>
        <li>Next.js 构建有问题</li>
        <li>浏览器缓存问题</li>
      </ul>
      <h2>解决方案：</h2>
      <ol>
        <li>关闭防火墙或安全软件</li>
        <li>使用开发模式：<code>npm run dev</code></li>
        <li>清除浏览器缓存</li>
        <li>尝试其他浏览器</li>
      </ol>
    </body>
    </html>
  `);
});

const PORT = 3003;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`测试服务器运行在: http://localhost:${PORT}`);
  console.log(`也可以尝试: http://127.0.0.1:${PORT}`);
});

server.on('error', (err) => {
  console.error('服务器错误:', err);
});