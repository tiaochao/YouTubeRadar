import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: Date | null | undefined, t?: (key: string, options?: any) => string): string {
  if (!date) return t ? t('common.notAvailable') : "N/A"
  const now = new Date()
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffSeconds < 60) return t ? t('common.secondsAgo', { value: diffSeconds }) : `${diffSeconds} seconds ago`
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return t ? t('common.minutesAgo', { value: diffMinutes }) : `${diffMinutes} minutes ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return t ? t('common.hoursAgo', { value: diffHours }) : `${diffHours} hours ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return t ? t('common.daysAgo', { value: diffDays }) : `${diffDays} days ago`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return t ? t('common.monthsAgo', { value: diffMonths }) : `${diffMonths} months ago`
  const diffYears = Math.floor(diffMonths / 12)
  return t ? t('common.yearsAgo', { value: diffYears }) : `${diffYears} years ago`
}

export function formatBigInt(value: bigint | number | string | null | undefined, t?: (key: string) => string): string {
  if (value === null || value === undefined) return t ? t('common.notAvailable') : "N/A"
  try {
    return Number(value).toLocaleString()
  } catch (e) {
    return String(value)
  }
}

// New utility for delay
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Format numbers with K, M, B suffix
export function formatNumber(num: string | number | undefined): string {
  if (!num) return '0'
  const n = typeof num === 'string' ? parseInt(num) : num
  if (n >= 1000000000) {
    return (n / 1000000000).toFixed(1) + 'B'
  } else if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + 'M'
  } else if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'K'
  }
  return n.toString()
}
