import { db as prisma } from './db'
import { syncChannelData } from './youtube-channel-stats'

export async function syncAllChannels(): Promise<{ synced: number; failed: number }> {
  const channels = await prisma.channel.findMany({
    where: {
      status: 'active'
    }
  })

  let synced = 0
  let failed = 0

  for (const channel of channels) {
    try {
      await syncChannelData(channel.channelId)
      synced++
    } catch (error) {
      console.error(`Failed to sync channel ${channel.channelId}:`, error)
      failed++
    }
  }

  return { synced, failed }
}