import { NextResponse } from "next/server"

export async function GET() {
  const url = 'https://ufcszgnfhiurfzrknofr.supabase.co'
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmY3N6Z25maGl1cmZ6cmtub2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzM2OTQsImV4cCI6MjA2NTc0OTY5NH0._MedjtAfZbs9r_VDb-X7zaHEB_m7SRKHJaae4UWVSTM'
  
  try {
    // 测试读取权限
    const readResponse = await fetch(`${url}/rest/v1/channels`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    })
    
    const readData = await readResponse.json()
    
    // 测试写入权限
    const testChannel = {
      channel_id: 'TEST_RLS_' + Date.now(),
      title: 'RLS Test',
      custom_url: '@rlstest',
      status: 'active'
    }
    
    const writeResponse = await fetch(`${url}/rest/v1/channels`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testChannel)
    })
    
    const writeResult = await writeResponse.json()
    
    // 如果写入成功，删除测试数据
    if (writeResponse.ok && writeResult.channel_id) {
      await fetch(`${url}/rest/v1/channels?channel_id=eq.${testChannel.channel_id}`, {
        method: 'DELETE',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      })
    }
    
    return NextResponse.json({
      readPermission: readResponse.ok,
      readStatus: readResponse.status,
      readResult: readResponse.ok ? `Found ${readData.length} channels` : readData,
      writePermission: writeResponse.ok,
      writeStatus: writeResponse.status,
      writeResult: writeResult,
      conclusion: readResponse.ok && writeResponse.ok ? 'RLS is disabled or configured for anon access' : 'RLS is blocking access'
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}