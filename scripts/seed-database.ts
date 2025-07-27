import { db } from '../lib/db'
import { ChannelStatus } from '@prisma/client'

async function seedDatabase() {
  console.log('🌱 Starting database seed...')

  try {
    // 创建示例频道
    const channels = [
      {
        channelId: 'UCHnyfMqiRRG1u-2MsSQLbXA',
        title: 'Veritasium',
        description: 'An element of truth - videos about science with experiments',
        customUrl: '@veritasium',
        status: ChannelStatus.active,
        totalSubscribers: BigInt(14900000),
        totalViews: BigInt(2300000000),
        videoCount: 400,
      },
      {
        channelId: 'UCBJycsmduvYEL83R_U4JriQ',
        title: 'Marques Brownlee',
        description: 'MKBHD: Quality Tech Videos',
        customUrl: '@mkbhd',
        status: ChannelStatus.active,
        totalSubscribers: BigInt(18700000),
        totalViews: BigInt(3900000000),
        videoCount: 1500,
      },
    ]

    console.log('📺 Creating sample channels...')
    for (const channel of channels) {
      const existing = await db.channel.findUnique({
        where: { channelId: channel.channelId }
      })

      if (!existing) {
        await db.channel.create({
          data: channel
        })
        console.log(`✅ Created channel: ${channel.title}`)
      } else {
        console.log(`⏭️ Channel already exists: ${channel.title}`)
      }
    }

    // 创建系统配置
    const systemConfigs = [
      {
        key: 'max_videos_per_sync',
        value: '50',
        description: '每次同步的最大视频数量'
      },
      {
        key: 'sync_interval_hours',
        value: '1',
        description: '同步间隔时间（小时）'
      },
      {
        key: 'enable_auto_sync',
        value: 'true',
        description: '是否启用自动同步'
      }
    ]

    console.log('⚙️ Creating system configurations...')
    for (const config of systemConfigs) {
      await db.systemConfig.upsert({
        where: { key: config.key },
        update: { value: config.value, description: config.description },
        create: config
      })
      console.log(`✅ Set config: ${config.key} = ${config.value}`)
    }

    console.log('✨ Database seed completed!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

seedDatabase()