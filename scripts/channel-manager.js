#!/usr/bin/env node

// 加载环境变量
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const { PrismaClient } = require('@prisma/client')

// 简化的YouTube API客户端，避免TypeScript导入问题
class SimpleYouTubeAPI {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "AIzaSyDNCuHT7Bw7VO5AtWWzqrogsumX4Uvxej4"
    this.baseUrl = 'https://www.googleapis.com/youtube/v3'
  }

  async searchChannel(query) {
    try {
      const searchUrl = `${this.baseUrl}/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&key=${this.apiKey}`
      const response = await fetch(searchUrl)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message || 'API请求失败')
      }
      
      if (!data.items || data.items.length === 0) {
        return null
      }
      
      const channelId = data.items[0].id.channelId
      return this.getChannelById(channelId)
    } catch (error) {
      throw error
    }
  }

  async getChannelById(channelId) {
    try {
      const params = channelId.startsWith('@') 
        ? `forHandle=${channelId.substring(1)}`
        : `id=${channelId}`
        
      const url = `${this.baseUrl}/channels?part=snippet,statistics&${params}&key=${this.apiKey}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message || 'API请求失败')
      }
      
      if (!data.items || data.items.length === 0) {
        return null
      }
      
      return data.items[0]
    } catch (error) {
      throw error
    }
  }
}

const prisma = new PrismaClient()
const youtubeAPI = new SimpleYouTubeAPI()

// 获取命令行参数
const command = process.argv[2]
const channelInput = process.argv[3]

async function addChannel(input) {
  try {
    console.log(`🔍 搜索频道: ${input}`)
    
    let channel = null
    
    // 支持多种输入格式
    if (input.startsWith('@')) {
      channel = await youtubeAPI.getChannelById(input)
    } else if (input.includes('youtube.com')) {
      const match = input.match(/channel\/(UC[\w-]+)/) || input.match(/@([\w-]+)/)
      if (match) {
        const id = match[0].includes('@') ? `@${match[1]}` : match[1]
        channel = await youtubeAPI.getChannelById(id)
      }
    } else {
      channel = await youtubeAPI.searchChannel(input)
    }

    if (!channel) {
      console.error('❌ 未找到频道')
      return
    }

    console.log(`✅ 找到频道: ${channel.snippet.title}`)
    console.log(`📊 订阅者: ${channel.statistics.subscriberCount}`)
    console.log(`👀 总观看: ${channel.statistics.viewCount}`)

    // 检查频道是否已存在
    const existingChannel = await prisma.channel.findUnique({
      where: { channelId: channel.id }
    })

    if (existingChannel) {
      console.log('⚠️  频道已存在，正在更新信息...')
      
      const updatedChannel = await prisma.channel.update({
        where: { channelId: channel.id },
        data: {
          title: channel.snippet.title,
          thumbnailUrl: channel.snippet.thumbnails.medium?.url,
          totalViews: channel.statistics.viewCount || "0",
          totalSubscribers: channel.statistics.subscriberCount || "0",
          country: channel.snippet.country,
          note: channel.snippet.description,
          updatedAt: new Date()
        }
      })
      
      console.log('✅ 频道信息已更新')
    } else {
      // 保存到数据库
      const savedChannel = await prisma.channel.create({
        data: {
          channelId: channel.id,
          title: channel.snippet.title,
          thumbnailUrl: channel.snippet.thumbnails.medium?.url,
          totalViews: channel.statistics.viewCount || "0",
          totalSubscribers: channel.statistics.subscriberCount || "0",
          status: 'active',
          country: channel.snippet.country,
          note: channel.snippet.description
        }
      })

      console.log('✅ 频道已添加到数据库')
    }
    
  } catch (error) {
    console.error('❌ 添加频道失败:', error.message)
  }
}

async function listChannels() {
  try {
    const channels = await prisma.channel.findMany({
      orderBy: { createdAt: 'desc' }
    })

    if (channels.length === 0) {
      console.log('📝 暂无频道数据')
      return
    }

    console.log(`\n📺 已保存的频道 (${channels.length}个):\n`)
    
    channels.forEach((channel, index) => {
      console.log(`${index + 1}. ${channel.title}`)
      console.log(`   ID: ${channel.channelId}`)
      console.log(`   订阅者: ${channel.totalSubscribers}`)
      console.log(`   总观看: ${channel.totalViews}`)
      console.log(`   状态: ${channel.status}`)
      console.log(`   添加时间: ${channel.createdAt.toLocaleString()}`)
      console.log('')
    })
  } catch (error) {
    console.error('❌ 获取频道列表失败:', error.message)
  }
}

async function syncAllChannels() {
  try {
    const channels = await prisma.channel.findMany()
    
    if (channels.length === 0) {
      console.log('📝 暂无频道需要同步')
      return
    }

    console.log(`🔄 开始同步 ${channels.length} 个频道...`)

    for (const channel of channels) {
      try {
        console.log(`📡 同步频道: ${channel.title}`)
        
        const latestData = await youtubeAPI.getChannelById(channel.channelId)
        
        if (latestData) {
          await prisma.channel.update({
            where: { id: channel.id },
            data: {
              title: latestData.snippet.title,
              thumbnailUrl: latestData.snippet.thumbnails.medium?.url,
              totalViews: latestData.statistics.viewCount || "0",
              totalSubscribers: latestData.statistics.subscriberCount || "0",
              country: latestData.snippet.country,
              updatedAt: new Date()
            }
          })
          
          console.log(`✅ ${channel.title} 同步完成`)
        } else {
          console.log(`⚠️  ${channel.title} 同步失败`)
        }
      } catch (error) {
        console.log(`❌ ${channel.title} 同步错误: ${error.message}`)
      }
    }
    
    console.log('🎉 所有频道同步完成')
  } catch (error) {
    console.error('❌ 同步频道失败:', error.message)
  }
}

async function removeChannel(input) {
  try {
    const channel = await prisma.channel.findFirst({
      where: {
        OR: [
          { channelId: input },
          { title: { contains: input, mode: 'insensitive' } }
        ]
      }
    })

    if (!channel) {
      console.log('❌ 未找到指定频道')
      return
    }

    await prisma.channel.delete({
      where: { id: channel.id }
    })

    console.log(`✅ 已删除频道: ${channel.title}`)
  } catch (error) {
    console.error('❌ 删除频道失败:', error.message)
  }
}

function showHelp() {
  console.log(`
📺 YouTube Radar 频道管理工具

用法:
  node scripts/channel-manager.js <command> [参数]

命令:
  add <频道>     添加频道 (支持 @handle, 频道名, YouTube链接)
  list          列出所有已保存的频道
  sync          同步所有频道的最新数据
  remove <频道>  删除频道 (通过ID或名称)
  help          显示帮助信息

示例:
  node scripts/channel-manager.js add @mkbhd
  node scripts/channel-manager.js add "Marques Brownlee"
  node scripts/channel-manager.js add "https://www.youtube.com/@mkbhd"
  node scripts/channel-manager.js list
  node scripts/channel-manager.js sync
  node scripts/channel-manager.js remove @mkbhd
`)
}

async function main() {
  switch (command) {
    case 'add':
      if (!channelInput) {
        console.error('❌ 请提供频道信息')
        showHelp()
        process.exit(1)
      }
      await addChannel(channelInput)
      break
      
    case 'list':
      await listChannels()
      break
      
    case 'sync':
      await syncAllChannels()
      break
      
    case 'remove':
      if (!channelInput) {
        console.error('❌ 请提供要删除的频道信息')
        process.exit(1)
      }
      await removeChannel(channelInput)
      break
      
    case 'help':
    case '--help':
    case '-h':
      showHelp()
      break
      
    default:
      console.error('❌ 未知命令')
      showHelp()
      process.exit(1)
  }
  
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('❌ 程序执行失败:', error)
  process.exit(1)
})