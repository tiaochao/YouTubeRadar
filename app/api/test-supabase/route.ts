import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase-direct"

export async function GET() {
  try {
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('DATABASE_URL prefix:', process.env.DATABASE_URL?.substring(0, 30) + '...')
    
    const supabase = getSupabase()
    
    // 测试连接 - 获取频道数量
    const { count, error } = await supabase
      .from('channels')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      channelCount: count,
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
      supabaseClient: 'initialized'
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

export async function POST() {
  try {
    const supabase = getSupabase()
    
    // 测试添加一个测试频道
    const testChannel = {
      channel_id: 'TEST_' + Date.now(),
      title: '测试频道',
      custom_url: '@test',
      thumbnail_url: 'https://example.com/thumb.jpg',
      view_count: 1000,
      total_views: 1000,
      total_subscribers: 100,
      video_count: 10,
      status: 'active'
    }
    
    console.log('尝试添加测试频道:', testChannel)
    
    const { data, error } = await supabase
      .from('channels')
      .insert(testChannel)
      .select()
      .single()
    
    if (error) {
      console.error('添加测试频道失败:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 })
    }
    
    // 删除测试频道
    await supabase
      .from('channels')
      .delete()
      .eq('channel_id', testChannel.channel_id)
    
    return NextResponse.json({
      success: true,
      message: '测试成功 - 可以添加和删除频道',
      testData: data
    })
  } catch (error: any) {
    console.error('测试错误:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}