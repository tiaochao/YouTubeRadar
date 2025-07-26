import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "YouTube Analytics Dashboard - Development Test Setup",
    instructions: [
      "1. 测试数据已创建完成",
      "2. 访问 http://localhost:3000/channels 查看频道列表",
      "3. API endpoints available:",
      "   - GET /api/channels - 获取频道列表", 
      "   - GET /api/tasks - 获取任务日志",
      "   - POST /api/dev/add-test-channel - 创建测试数据",
      "4. 数据库包含:",
      "   - 1个测试YouTube频道",
      "   - 7天的每日统计数据",
      "   - 5个测试视频",
      "   - 10条任务日志"
    ],
    status: "Ready for testing"
  })
}