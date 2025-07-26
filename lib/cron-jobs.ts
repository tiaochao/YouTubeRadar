import cron from 'node-cron'
import { syncAllChannels } from './sync-all-channels'
import { syncAllChannelStats } from './sync-all-stats'
import { logger } from './logger'

export function setupCronJobs() {
  // 每天凌晨 2 点同步所有频道视频
  cron.schedule('0 2 * * *', async () => {
    logger.info('CronJob', '开始每日视频同步任务')
    try {
      await syncAllChannels()
      logger.info('CronJob', '每日视频同步任务完成')
    } catch (error) {
      logger.error('CronJob', '每日视频同步任务失败', error)
    }
  })

  // 每天凌晨 3 点同步所有频道统计
  cron.schedule('0 3 * * *', async () => {
    logger.info('CronJob', '开始每日统计同步任务')
    try {
      await syncAllChannelStats()
      logger.info('CronJob', '每日统计同步任务完成')
    } catch (error) {
      logger.error('CronJob', '每日统计同步任务失败', error)
    }
  })

  // 每 6 小时同步一次活跃频道的最新数据
  cron.schedule('0 */6 * * *', async () => {
    logger.info('CronJob', '开始定期数据更新任务')
    try {
      // 这里可以实现轻量级的更新逻辑
      // 比如只更新最近发布视频的频道
      logger.info('CronJob', '定期数据更新任务完成')
    } catch (error) {
      logger.error('CronJob', '定期数据更新任务失败', error)
    }
  })

  logger.info('CronJob', '定时任务已设置')
}