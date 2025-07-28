import { createClient } from '@supabase/supabase-js'

// 从 DATABASE_URL 中提取 Supabase 配置
function parseSupabaseUrl(databaseUrl: string) {
  // postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
  const match = databaseUrl.match(/postgresql:\/\/postgres:(.+)@db\.(.+)\.supabase\.co/)
  if (!match) {
    console.error('DATABASE_URL format:', databaseUrl)
    throw new Error('Invalid Supabase DATABASE_URL')
  }
  
  const [_, passwordAndPort, projectRef] = match
  // 移除端口号
  const password = passwordAndPort.split(':')[0]
  
  console.log('Parsed Supabase config:', { projectRef, passwordLength: password.length })
  
  return {
    url: `https://${projectRef}.supabase.co`,
    anonKey: process.env.SUPABASE_ANON_KEY || password // 需要在环境变量中设置
  }
}

let supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!supabase) {
    // 直接使用配置的 URL 和密钥
    const url = process.env.SUPABASE_URL || 'https://ufcszgnfhiurfzrknofr.supabase.co'
    // 使用您提供的 anon key
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmY3N6Z25maGl1cmZ6cmtub2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzM2OTQsImV4cCI6MjA2NTc0OTY5NH0._MedjtAfZbs9r_VDb-X7zaHEB_m7SRKHJaae4UWVSTM'
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || anonKey
    
    console.log('Initializing Supabase client with URL:', url)
    
    supabase = createClient(url, serviceKey, {
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          'x-my-custom-header': 'youtube-radar'
        }
      }
    })
  }
  return supabase
}

// 频道操作的直接实现
export const supabaseChannelOps = {
  async getChannels() {
    try {
      const supabase = getSupabase()
      console.log('Getting channels from Supabase...')
      
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error getting channels:', error)
        throw error
      }
      
      console.log(`Found ${data?.length || 0} channels`)
      return data || []
    } catch (e: any) {
      console.error('Failed to get channels:', e)
      throw e
    }
  },

  async addChannel(channel: any) {
    const supabase = getSupabase()
    
    // 先检查是否存在
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
    
    if (error) throw error
    return data
  },

  async updateChannel(channelId: string, updates: any) {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('channels')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('channel_id', channelId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteChannel(channelId: string) {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('channel_id', channelId)
    
    if (error) throw error
    return true
  }
}