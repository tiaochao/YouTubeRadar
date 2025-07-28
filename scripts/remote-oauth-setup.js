#!/usr/bin/env node
/**
 * 远程 OAuth 设置助手
 * 支持在任何设备上完成 YouTube Analytics API 的 OAuth 授权
 * 无需在目标服务器上运行浏览器
 */

const https = require('https')
const readline = require('readline')

// OAuth 配置
const OAUTH_CONFIG = {
  client_id: process.env.YOUTUBE_OAUTH_CLIENT_ID || '',
  client_secret: process.env.YOUTUBE_OAUTH_CLIENT_SECRET || '',
  // 使用 Google 的标准重定向 URI（不需要本地服务器）
  redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
  scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
  access_type: 'offline',
  prompt: 'consent'
}

console.log('🌐 YouTube Analytics API 远程 OAuth 设置助手')
console.log('================================================')
console.log('✨ 支持在任何设备上完成授权，无需本地服务器')

// 检查必要的环境变量
if (!OAUTH_CONFIG.client_id || !OAUTH_CONFIG.client_secret) {
  console.error('❌ 错误：缺少 OAuth 凭据')
  console.log('\n请先设置以下环境变量：')
  console.log('export YOUTUBE_OAUTH_CLIENT_ID="你的客户端ID"')
  console.log('export YOUTUBE_OAUTH_CLIENT_SECRET="你的客户端密钥"')
  console.log('\n或者在 .env 文件中设置：')
  console.log('YOUTUBE_OAUTH_CLIENT_ID=你的客户端ID')
  console.log('YOUTUBE_OAUTH_CLIENT_SECRET=你的客户端密钥')
  console.log('\n📚 获取这些凭据的详细步骤请参考：docs/YOUTUBE_ANALYTICS_SETUP.md')
  process.exit(1)
}

/**
 * 生成 OAuth 授权 URL（使用 OOB 重定向）
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
      code: code.trim()
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
 * 从用户输入获取授权码
 */
function getAuthorizationCodeFromUser() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question('请输入授权码: ', (code) => {
      rl.close()
      resolve(code)
    })
  })
}

/**
 * 主要流程
 */
async function main() {
  try {
    console.log('📋 开始远程 OAuth 授权流程...\n')
    
    // 1. 生成授权 URL
    console.log('1️⃣  生成授权 URL...')
    const authURL = generateAuthURL()
    
    console.log('\n🌐 请在任何设备的浏览器中访问以下 URL：')
    console.log('=' .repeat(80))
    console.log(authURL)
    console.log('=' .repeat(80))
    
    console.log('\n📱 操作步骤：')
    console.log('   1. 复制上面的 URL')
    console.log('   2. 在任何设备的浏览器中打开（电脑、手机、平板都可以）')
    console.log('   3. 登录您的 Google 账户')
    console.log('   4. 选择拥有 YouTube 频道的账户')
    console.log('   5. 授权访问 YouTube Analytics 数据')
    console.log('   6. 复制显示的授权码（通常是一长串字符）')
    console.log('   7. 返回这里输入授权码')
    
    console.log('\n💡 提示：')
    console.log('   • 可以在指纹浏览器中完成授权')
    console.log('   • 可以在不同的电脑上打开授权链接')
    console.log('   • 可以在手机浏览器中完成授权')
    console.log('   • 授权页面会显示一个授权码，复制它即可')
    
    // 2. 等待用户输入授权码
    console.log('\n⏳ 等待输入授权码...')
    const code = await getAuthorizationCodeFromUser()
    
    if (!code || code.trim().length === 0) {
      throw new Error('未输入授权码')
    }
    
    console.log('✅ 收到授权码!')
    
    // 3. 交换令牌
    console.log('2️⃣  交换访问令牌和刷新令牌...')
    const tokens = await exchangeCodeForTokens(code)
    
    // 4. 显示结果
    console.log('\n🎉 远程 OAuth 设置完成!')
    console.log('==========================================')
    console.log('📝 请将以下环境变量添加到您的生产环境中：')
    console.log('')
    console.log('# YouTube Analytics API OAuth 配置')
    console.log(`YOUTUBE_OAUTH_CLIENT_ID=${OAUTH_CONFIG.client_id}`)
    console.log(`YOUTUBE_OAUTH_CLIENT_SECRET=${OAUTH_CONFIG.client_secret}`)
    console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`)
    console.log('')
    console.log('🔧 Vercel 环境变量设置：')
    console.log('   1. 访问 Vercel Dashboard')
    console.log('   2. 进入项目设置 > Environment Variables')
    console.log('   3. 添加上述三个环境变量')
    console.log('   4. 设置环境为 "Production"')
    console.log('')
    console.log('📊 临时访问令牌（测试用）: ' + tokens.access_token)
    console.log('⏰ 访问令牌过期时间: ' + (tokens.expires_in ? `${tokens.expires_in}秒` : '未知'))
    console.log('')
    console.log('✨ 现在您可以在服务器上使用 YouTube Analytics API 获取真实数据了!')
    console.log('')
    console.log('🧪 测试建议：')
    console.log('   curl https://your-domain.vercel.app/api/test-analytics?testAuth=true')
    
  } catch (error) {
    console.error('\n❌ 远程 OAuth 设置失败:', error.message)
    console.log('\n🔧 故障排除：')
    console.log('   1. 确认授权码正确复制（不要包含多余空格）')
    console.log('   2. 确认 Google Cloud Console 中 OAuth 应用配置正确')
    console.log('   3. 确认客户端 ID 和密钥正确')
    console.log('   4. 如果授权码过期，请重新获取')
    process.exit(1)
  }
}

// 处理命令行参数
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('YouTube Analytics API 远程 OAuth 设置助手')
  console.log('')
  console.log('用法:')
  console.log('  node scripts/remote-oauth-setup.js')
  console.log('')
  console.log('环境变量:')
  console.log('  YOUTUBE_OAUTH_CLIENT_ID     - Google OAuth 客户端 ID')
  console.log('  YOUTUBE_OAUTH_CLIENT_SECRET - Google OAuth 客户端密钥')
  console.log('')
  console.log('特点:')
  console.log('  • 支持跨设备授权（在任何设备的浏览器中完成）')
  console.log('  • 无需本地服务器')
  console.log('  • 支持指纹浏览器')
  console.log('  • 支持移动设备浏览器')
  console.log('')
  process.exit(0)
}

// 运行主程序
if (require.main === module) {
  main()
}