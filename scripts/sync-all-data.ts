import { db } from '../lib/db'
import { syncChannelVideos } from '../lib/youtube-video-sync'
import { syncChannelAnalytics } from '../lib/youtube-analytics'
import { logger } from '../lib/logger'

async function syncAllData() {
  try {
    console.log('开始同步所有数据...')
    
    // 获取所有活跃频道
    const channels = await db.channel.findMany({
      where: { status: 'active' }
    })
    
    console.log(`找到 ${channels.length} 个频道`)
    
    for (const channel of channels) {
      console.log(`\n同步频道: ${channel.title}`)
      
      try {
        // 同步视频
        console.log('- 同步视频...')
        const videoResult = await syncChannelVideos(channel.id)
        console.log(`  ✓ 同步了 ${videoResult.totalVideos} 个视频`)
        
        // 同步分析数据
        console.log('- 同步分析数据...')
        const analyticsResult = await syncChannelAnalytics(channel.id)
        console.log(`  ✓ 同步了分析数据`)
        
        // 等待一下避免 API 限制
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        console.error(`  ✗ 同步失败: ${error.message}`)
      }
    }
    
    console.log('\n同步完成！')
    
  } catch (error) {
    console.error('同步失败:', error)
  } finally {
    await db.$disconnect()
  }
}

// 运行同步
syncAllData()