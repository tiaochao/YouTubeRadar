import { createClient } from '@supabase/supabase-js'

// 支持新的 Supabase 密钥格式
export function getSupabaseWithNewKeys() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ufcszgnfhiurfzrknofr.supabase.co'
  
  // 新格式的密钥
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_dO58qjBGCUHAFRhndvCswA_kE87bgIv'
  const secretKey = process.env.SUPABASE_SECRET_KEY || 'sb_secret_B9auZ3f53JzphAUE2jdTVg_UWOcaDD7'
  
  // 使用 anon key (您之前提供的)
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmY3N6Z25maGl1cmZ6cmtub2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzM2OTQsImV4cCI6MjA2NTc0OTY5NH0._MedjtAfZbs9r_VDb-X7zaHEB_m7SRKHJaae4UWVSTM'
  
  console.log('Creating Supabase client with:', {
    url,
    hasPublishableKey: !!publishableKey,
    hasSecretKey: !!secretKey,
    usingAnonKey: true
  })
  
  // 使用 anon key 创建客户端
  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false
    }
  })
  
  return supabase
}

// 直接的数据库操作（绕过 RLS）
export const supabaseOps = {
  async testConnection() {
    try {
      const supabase = getSupabaseWithNewKeys()
      
      // 先检查 RLS 状态
      const { data: tables, error: tablesError } = await supabase
        .from('channels')
        .select('count', { count: 'exact', head: true })
      
      if (tablesError?.code === '42501') {
        return {
          success: false,
          error: 'RLS is blocking access. Please disable RLS for the channels table in Supabase Dashboard.',
          rlsEnabled: true
        }
      }
      
      return {
        success: !tablesError,
        error: tablesError?.message,
        rlsEnabled: false
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  },
  
  async getChannels() {
    const supabase = getSupabaseWithNewKeys()
    
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error getting channels:', error)
      if (error.code === '42501') {
        throw new Error('权限被拒绝：请在 Supabase 中禁用 channels 表的 RLS')
      }
      throw error
    }
    
    return data || []
  },
  
  async addChannel(channel: any) {
    const supabase = getSupabaseWithNewKeys()
    
    // 先检查是否已存在
    const { data: existing } = await supabase
      .from('channels')
      .select('channel_id')
      .eq('channel_id', channel.channelId)
      .single()
    
    if (existing) {
      throw new Error('频道已存在')
    }
    
    const { data, error } = await supabase
      .from('channels')
      .insert({
        channel_id: channel.channelId,
        title: channel.title,
        custom_url: channel.handle,
        thumbnail_url: channel.thumbnailUrl,
        view_count: channel.viewCount || 0,
        total_views: channel.viewCount || 0,
        total_subscribers: channel.subscriberCount || 0,
        video_count: channel.videoCount || 0,
        note: channel.note,
        status: 'active'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error adding channel:', error)
      if (error.code === '42501') {
        throw new Error('权限被拒绝：请在 Supabase 中禁用 channels 表的 RLS')
      }
      throw error
    }
    
    return data
  },
  
  async updateChannel(channelId: string, updates: any) {
    const supabase = getSupabaseWithNewKeys()
    
    const { data, error } = await supabase
      .from('channels')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('channel_id', channelId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating channel:', error)
      if (error.code === '42501') {
        throw new Error('权限被拒绝：请在 Supabase 中禁用 channels 表的 RLS')
      }
      throw error
    }
    
    return data
  },
  
  async deleteChannel(channelId: string) {
    const supabase = getSupabaseWithNewKeys()
    
    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('channel_id', channelId)
    
    if (error) {
      console.error('Error deleting channel:', error)
      if (error.code === '42501') {
        throw new Error('权限被拒绝：请在 Supabase 中禁用 channels 表的 RLS')
      }
      throw error
    }
    
    return true
  }
}