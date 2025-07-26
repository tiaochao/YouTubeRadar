export const defaultLocale = 'en'

export const locales = ['en', 'zh'] as const

export type Locale = typeof locales[number]

export const localeNames = {
  en: 'English',
  zh: '中文',
} as const