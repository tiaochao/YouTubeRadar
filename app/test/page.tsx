export default function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>测试页面</h1>
      <p>如果你能看到这个页面，说明 Next.js 正在运行</p>
      <p>时间: {new Date().toLocaleString()}</p>
    </div>
  )
}