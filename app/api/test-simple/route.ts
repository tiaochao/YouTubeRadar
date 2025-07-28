import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 测试环境变量
    const env = {
      hasDatabase: !!process.env.DATABASE_URL,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      timestamp: new Date().toISOString()
    }
    
    // 直接使用 fetch 测试 Supabase REST API
    const url = 'https://ufcszgnfhiurfzrknofr.supabase.co'
    const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmY3N6Z25maGl1cmZ6cmtub2ZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDc4MjQ0MSwiZXhwIjoyMDUwMzU4NDQxfQ.k9JXmU0hFh0xQ-oiVHtfO5Ag6uPJZD-mkmJ7ZZKNYxs'
    
    console.log('Testing direct Supabase REST API...')
    
    const response = await fetch(`${url}/rest/v1/channels?select=count`, {
      headers: {
        'apikey': apikey,
        'Authorization': `Bearer ${apikey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    })
    
    const responseText = await response.text()
    console.log('Response status:', response.status)
    console.log('Response text:', responseText)
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        env,
        apiResponse: {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        }
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      env,
      apiResponse: {
        status: response.status,
        body: responseText
      }
    })
  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}