#!/usr/bin/env node
/**
 * YouTube Analytics API OAuth设置助手
 * 帮助获取YouTube Analytics API的OAuth凭据
 */

const https = require('https')
const url = require('url')
const { createServer } = require('http')
const { exec } = require('child_process')

// OAuth配置
const OAUTH_CONFIG = {
  client_id: process.env.YOUTUBE_OAUTH_CLIENT_ID || '',
  client_secret: process.env.YOUTUBE_OAUTH_CLIENT_SECRET || '',
  redirect_uri: 'http://localhost:3000/oauth/callback',
  scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
  access_type: 'offline',
  prompt: 'consent'
}

console.log('🎯 YouTube Analytics API OAuth设置助手')
console.log('==========================================')

// 检查必要的环境变量
if (!OAUTH_CONFIG.client_id || !OAUTH_CONFIG.client_secret) {
  console.error('❌ 错误：缺少OAuth凭据')
  console.log('\n请先在 .env 文件中设置以下环境变量：')
  console.log('YOUTUBE_OAUTH_CLIENT_ID=你的客户端ID')
  console.log('YOUTUBE_OAUTH_CLIENT_SECRET=你的客户端密钥')
  console.log('\n获取这些凭据的步骤：')
  console.log('1. 访问 https://console.cloud.google.com/')
  console.log('2. 创建新项目或选择现有项目')
  console.log('3. 启用 YouTube Analytics API')
  console.log('4. 创建 OAuth 2.0 客户端 ID 凭据')
  console.log('5. 将授权重定向URI设置为: http://localhost:3000/oauth/callback')
  process.exit(1)
}

/**
 * 生成OAuth授权URL
 */
function generateAuthURL() {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.client_id,
    redirect_uri: OAUTH_CONFIG.redirect_uri,
    scope: OAUTH_CONFIG.scope,
    response_type: 'code',
    access_type: OAUTH_CONFIG.access_type,
    prompt: OAUTH_CONFIG.prompt
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * 使用授权码交换访问令牌和刷新令牌
 */
function exchangeCodeForTokens(code) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      client_id: OAUTH_CONFIG.client_id,
      client_secret: OAUTH_CONFIG.client_secret,
      redirect_uri: OAUTH_CONFIG.redirect_uri,
      grant_type: 'authorization_code',
      code: code
    }).toString()

    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        try {
          const tokenData = JSON.parse(data)
          if (tokenData.error) {
            reject(new Error(`OAuth错误: ${tokenData.error_description || tokenData.error}`))
          } else {
            resolve(tokenData)
          }
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}`))
        }
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

/**
 * 启动本地服务器处理OAuth回调
 */
function startOAuthServer() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true)
      
      if (parsedUrl.pathname === '/oauth/callback') {
        const { code, error } = parsedUrl.query

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(`
            <html>
              <body>
                <h1>❌ 授权失败</h1>
                <p>错误: ${error}</p>
                <p>请关闭此页面并重试</p>
              </body>
            </html>
          `)
          server.close()
          reject(new Error(`OAuth授权失败: ${error}`))
          return
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(`
            <html>
              <body>
                <h1>✅ 授权成功！</h1>
                <p>正在处理授权码...</p>
                <p>请返回终端查看结果</p>
                <script>setTimeout(() => window.close(), 3000)</script>
              </body>
            </html>
          `)
          
          server.close()
          resolve(code)
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(`
            <html>
              <body>
                <h1>❌ 未收到授权码</h1>
                <p>请重试授权流程</p>
              </body>
            </html>
          `)
          server.close()
          reject(new Error('未收到授权码'))
        }
      } else {
        res.writeHead(404)
        res.end('Not Found')
      }
    })

    server.listen(3000, (err) => {
      if (err) {
        reject(err)
      } else {
        console.log('🚀 本地OAuth服务器已启动在 http://localhost:3000')
      }
    })

    server.on('error', reject)
  })
}

/**
 * 打开浏览器进行授权
 */
function openBrowser(url) {
  const start = process.platform === 'darwin' ? 'open' :
                process.platform === 'win32' ? 'start' : 'xdg-open'
  
  exec(`${start} "${url}"`, (error) => {
    if (error) {
      console.log('⚠️  无法自动打开浏览器，请手动访问以下URL:')
      console.log(url)
    } else {
      console.log('🌐 正在打开浏览器进行授权...')
    }
  })
}

/**
 * 主要流程
 */
async function main() {
  try {
    console.log('📋 开始OAuth授权流程...\n')
    
    // 1. 启动本地服务器
    console.log('1️⃣  启动本地OAuth回调服务器...')
    const codePromise = startOAuthServer()
    
    // 2. 生成授权URL并打开浏览器
    console.log('2️⃣  生成授权URL...')
    const authURL = generateAuthURL()
    
    console.log('3️⃣  打开浏览器进行授权...')
    console.log('📝 授权URL:', authURL)
    openBrowser(authURL)
    
    console.log('\n⏳ 等待用户授权...')
    console.log('请在浏览器中完成以下步骤：')
    console.log('   • 选择您的Google账户')
    console.log('   • 允许访问YouTube Analytics数据')
    console.log('   • 确认授权')
    
    // 3. 等待授权码
    const code = await codePromise
    console.log('✅ 收到授权码!')
    
    // 4. 交换令牌
    console.log('4️⃣  交换访问令牌和刷新令牌...')
    const tokens = await exchangeCodeForTokens(code)
    
    // 5. 显示结果
    console.log('\n🎉 OAuth设置完成!')
    console.log('==========================================')
    console.log('📝 请将以下环境变量添加到您的 .env.production 文件中：')
    console.log('')
    console.log('# YouTube Analytics API OAuth配置')
    console.log(`YOUTUBE_OAUTH_CLIENT_ID=${OAUTH_CONFIG.client_id}`)
    console.log(`YOUTUBE_OAUTH_CLIENT_SECRET=${OAUTH_CONFIG.client_secret}`)
    console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`)
    console.log('')
    console.log('🔧 同时也需要在Vercel中设置这些环境变量')
    console.log('📊 访问令牌 (临时使用): ' + tokens.access_token)
    console.log('⏰ 过期时间: ' + (tokens.expires_in ? `${tokens.expires_in}秒` : '未知'))
    console.log('')
    console.log('✨ 现在您可以使用YouTube Analytics API获取真实数据了!')
    
  } catch (error) {
    console.error('\n❌ OAuth设置失败:', error.message)
    process.exit(1)
  }
}

// 运行主程序
if (require.main === module) {
  main()
}