import { NextResponse } from "next/server"

export async function GET() {
  const url = 'https://ufcszgnfhiurfzrknofr.supabase.co'
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmY3N6Z25maGl1cmZ6cmtub2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzM2OTQsImV4cCI6MjA2NTc0OTY5NH0._MedjtAfZbs9r_VDb-X7zaHEB_m7SRKHJaae4UWVSTM'
  
  // 需要检查的表
  const tables = [
    'channels',
    'videos',
    'video_stat_snapshots',
    'channel_daily_stats',
    'task_logs',
    'system_config'
  ]
  
  const results: any = {}
  
  for (const table of tables) {
    try {
      const response = await fetch(`${url}/rest/v1/${table}?select=count`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Prefer': 'count=exact'
        }
      })
      
      const text = await response.text()
      
      results[table] = {
        accessible: response.ok,
        status: response.status,
        error: !response.ok ? text : null,
        hasRLS: response.status === 401 && text.includes('permission denied')
      }
    } catch (error: any) {
      results[table] = {
        accessible: false,
        error: error.message
      }
    }
  }
  
  // 分析结果
  const tablesWithRLS = Object.entries(results)
    .filter(([_, result]: any) => result.hasRLS)
    .map(([table]) => table)
  
  return NextResponse.json({
    tableAccessibility: results,
    summary: {
      tablesWithRLS,
      recommendation: tablesWithRLS.length > 0 
        ? `请在 Supabase Dashboard 中禁用以下表的 RLS: ${tablesWithRLS.join(', ')}`
        : '所有表都可以访问'
    }
  })
}