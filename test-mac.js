const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>测试服务器</title>
    </head>
    <body>
      <h1>测试服务器运行正常！</h1>
      <p>如果你能看到这个页面，说明：</p>
      <ul>
        <li>Node.js 正常</li>
        <li>端口 3002 可用</li>
        <li>问题可能在 Next.js 配置</li>
      </ul>
      <p>时间: ${new Date().toLocaleString()}</p>
    </body>
    </html>
  `);
});

server.listen(3002, () => {
  console.log('测试服务器运行在: http://localhost:3002');
});