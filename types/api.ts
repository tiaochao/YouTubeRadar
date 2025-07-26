export interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ConfigData {
  googleClientId: string
  googleClientSecret: string
  googleRedirectUri: string
  youtubeApiKey: string
  hasYoutubeApiKey: boolean
  databaseUrl: string
  hasEncryptionKey: boolean
  hasRedisConfig: boolean
  hasCronSecret: boolean
}

export interface ChannelData {
  id: string
  channelId: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  status: 'active' | 'syncing' | 'needs_reauth' | 'revoked'
  country: string | null
  customUrl: string | null
  publishedAt: string | null
  videoCount: number | null
  viewCount: string
  totalViews: string
  totalSubscribers: string
  lastAnalyticsAt: string | null
  lastVideoSyncAt: string | null
  createdAt: string
  updatedAt: string
  note: string | null
}

export interface VideoData {
  id: string
  videoId: string
  channelId: string
  title: string
  publishedAt: string
  live: boolean
  createdAt: string
  snapshots?: VideoSnapshot[]
  channel?: {
    title: string
    thumbnailUrl: string | null
  }
}

export interface VideoSnapshot {
  id: string
  videoId: string
  channelId: string
  collectedAt: string
  viewCount: string
  likeCount: string
  commentCount: string
}

export interface TaskLogData {
  id: string
  taskType: 'VIDEO_SYNC' | 'CHANNEL_HOURLY' | 'CHANNEL_DAILY' | 'PUBSUB_NEW_VIDEO' | 'REAUTH_CHECK'
  startedAt: string
  finishedAt: string | null
  success: boolean
  message: string | null
  durationMs: number | null
}

export interface AnalyticsData {
  id: string
  channelId: string
  date: string
  views: string
  watchTimeHours: number
  subscribersGained: number
  subscribersLost: number
  estimatedMinutesWatched: string
  impressions: string
  impressionCtr: number
  updatedAt: string
  channel: {
    title: string
    thumbnailUrl: string | null
  }
}