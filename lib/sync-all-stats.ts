import { prisma } from './db'

export async function syncAllStats(): Promise<{ synced: number; failed: number }> {
  const channels = await prisma.channel.findMany({
    where: {
      status: 'active'
    }
  })

  let synced = 0
  let failed = 0

  for (const channel of channels) {
    try {
      // Placeholder for stats sync logic
      console.log(`Syncing stats for channel ${channel.channelId}`)
      synced++
    } catch (error) {
      console.error(`Failed to sync stats for channel ${channel.channelId}:`, error)
      failed++
    }
  }

  return { synced, failed }
}