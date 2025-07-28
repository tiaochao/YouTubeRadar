import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const response = NextResponse.json({ 
    message: 'Test cookie set',
    timestamp: new Date().toISOString()
  })
  
  // 设置测试 cookie
  response.cookies.set('test_cookie', 'test_value_' + Date.now(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/'
  })
  
  console.log('[Test Cookie] Setting test cookie')
  return response
}

export async function POST(req: NextRequest) {
  const testCookie = req.cookies.get('test_cookie')
  
  console.log('[Test Cookie] Reading test cookie:', {
    hasCookie: !!testCookie,
    value: testCookie?.value,
    allCookies: req.cookies.getAll()
  })
  
  return NextResponse.json({
    testCookie: testCookie?.value || null,
    allCookies: req.cookies.getAll()
  })
}