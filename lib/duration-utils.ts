/**
 * Parse ISO 8601 duration to seconds
 * Example: PT1H2M10S = 1 hour, 2 minutes, 10 seconds = 3730 seconds
 * P0D = 0 days = 0 seconds (no duration)
 */
export function parseDuration(duration: string | null | undefined): number {
  if (!duration) return 0
  
  // Handle edge case for P0D (zero duration)
  if (duration === 'P0D' || duration === 'PT0S') return 0
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0') 
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Check if a live stream is valid (has duration and views)
 */
export function isValidLiveStream(
  duration: string | null | undefined,
  viewCount: bigint | number
): boolean {
  const durationSeconds = parseDuration(duration)
  const views = typeof viewCount === 'bigint' ? Number(viewCount) : viewCount
  
  // Live stream is valid if it has both duration > 0 and views > 0
  return durationSeconds > 0 && views > 0
}