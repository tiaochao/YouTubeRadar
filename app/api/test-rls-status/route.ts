import { NextResponse } from "next/server"
import { getSupabaseWithNewKeys } from "@/lib/supabase-new"

export async function GET() {
  try {
    const supabase = getSupabaseWithNewKeys()
    
    // 测试不同的操作
    const tests = {
      select: { success: false, error: null as any },
      insert: { success: false, error: null as any },
      update: { success: false, error: null as any },
      delete: { success: false, error: null as any }
    }
    
    // 1. 测试 SELECT
    const { data: selectData, error: selectError } = await supabase
      .from('channels')
      .select('*')
      .limit(1)
    
    tests.select.success = !selectError
    tests.select.error = selectError
    
    // 2. 测试 INSERT
    const testChannel = {
      channel_id: 'TEST_' + Date.now(),
      title: 'Test Channel',
      custom_url: '@test',
      status: 'active'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('channels')
      .insert(testChannel)
      .select()
    
    tests.insert.success = !insertError
    tests.insert.error = insertError
    
    // 3. 如果插入成功，测试 UPDATE 和 DELETE
    if (!insertError && insertData && insertData[0]) {
      const insertedId = insertData[0].channel_id
      
      // 测试 UPDATE
      const { error: updateError } = await supabase
        .from('channels')
        .update({ title: 'Updated Test' })
        .eq('channel_id', insertedId)
      
      tests.update.success = !updateError
      tests.update.error = updateError
      
      // 测试 DELETE
      const { error: deleteError } = await supabase
        .from('channels')
        .delete()
        .eq('channel_id', insertedId)
      
      tests.delete.success = !deleteError
      tests.delete.error = deleteError
    }
    
    // 分析结果
    const allSuccess = Object.values(tests).every(t => t.success)
    const hasPermissionError = Object.values(tests).some(t => 
      t.error?.code === '42501' || t.error?.message?.includes('permission denied')
    )
    
    return NextResponse.json({
      summary: {
        allOperationsWork: allSuccess,
        hasRLSIssues: hasPermissionError,
        recommendation: hasPermissionError 
          ? '仍有 RLS 权限问题。请确保：1) channels 表的 RLS 已禁用 2) 没有数据库级别的权限限制'
          : allSuccess 
            ? '所有操作正常！可以使用数据库了' 
            : '有其他错误，请查看详细信息'
      },
      testResults: {
        select: {
          success: tests.select.success,
          error: tests.select.error ? {
            code: tests.select.error.code,
            message: tests.select.error.message
          } : null
        },
        insert: {
          success: tests.insert.success,
          error: tests.insert.error ? {
            code: tests.insert.error.code,
            message: tests.insert.error.message
          } : null
        },
        update: {
          success: tests.update.success,
          error: tests.update.error ? {
            code: tests.update.error.code,
            message: tests.update.error.message
          } : null
        },
        delete: {
          success: tests.delete.success,
          error: tests.delete.error ? {
            code: tests.delete.error.code,
            message: tests.delete.error.message
          } : null
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}