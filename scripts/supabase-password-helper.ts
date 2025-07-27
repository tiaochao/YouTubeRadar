console.log('🔐 Supabase 密码设置助手\n')

console.log('您的 Supabase 项目信息：')
console.log('- 项目 ID: ufcszgnfhiurfzrknofr')
console.log('- 主机: db.ufcszgnfhiurfzrknofr.supabase.co')
console.log('- 端口: 5432')
console.log('- 数据库: postgres')
console.log('- 用户: postgres')

console.log('\n⚠️  您需要提供密码！')
console.log('\n如果忘记密码，请：')
console.log('1. 登录 Supabase Dashboard')
console.log('2. 进入 Settings → Database')
console.log('3. 点击 "Reset database password"')
console.log('4. 设置新密码')
console.log('5. 复制完整的连接字符串')

console.log('\n📋 完整的连接字符串格式：')
console.log('postgresql://postgres:您的实际密码@db.ufcszgnfhiurfzrknofr.supabase.co:5432/postgres')

console.log('\n💡 示例（假设密码是 MySecurePass123）：')
console.log('postgresql://postgres:MySecurePass123@db.ufcszgnfhiurfzrknofr.supabase.co:5432/postgres')

// 如果通过命令行参数提供密码
const password = process.argv[2]
if (password) {
  console.log('\n✅ 生成的连接字符串：')
  console.log(`postgresql://postgres:${password}@db.ufcszgnfhiurfzrknofr.supabase.co:5432/postgres`)
  
  console.log('\n📝 请将此连接字符串添加到：')
  console.log('1. .env 文件')
  console.log('2. .env.local 文件')
  console.log('3. Vercel 环境变量')
} else {
  console.log('\n💡 提示：您可以运行以下命令生成连接字符串：')
  console.log('npx tsx scripts/supabase-password-helper.ts 您的密码')
}