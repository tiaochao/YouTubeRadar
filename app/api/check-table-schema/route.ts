import { NextResponse } from "next/server"
import { getSupabaseWithNewKeys } from "@/lib/supabase-new"

export async function GET() {
  try {
    const supabase = getSupabaseWithNewKeys()
    
    // 获取表结构信息
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'channels')
      .order('ordinal_position')
    
    if (error) {
      // 如果无法访问 information_schema，尝试直接插入一条记录看看错误信息
      const testInsert = await supabase
        .from('channels')
        .insert({})
        .select()
      
      return NextResponse.json({
        error: 'Cannot access table schema',
        insertError: testInsert.error,
        suggestion: 'Check table structure in Supabase Dashboard'
      })
    }
    
    // 找出必需的字段
    const requiredFields = columns?.filter(col => 
      col.is_nullable === 'NO' && 
      !col.column_default
    ) || []
    
    // 找出有默认值的字段
    const fieldsWithDefaults = columns?.filter(col => 
      col.column_default !== null
    ) || []
    
    return NextResponse.json({
      tableStructure: columns,
      requiredFields: requiredFields.map(f => ({
        name: f.column_name,
        type: f.data_type
      })),
      fieldsWithDefaults: fieldsWithDefaults.map(f => ({
        name: f.column_name,
        default: f.column_default
      })),
      recommendation: requiredFields.find(f => f.column_name === 'id') 
        ? 'ID field is required. Need to generate UUID or check if it should have default value.'
        : 'Check required fields above'
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}