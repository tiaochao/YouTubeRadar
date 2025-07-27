"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { zh } from './translations/zh'

type Translations = typeof zh

interface I18nContextType {
  t: (key: string, fallback?: string) => string
  locale: string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const t = (key: string, fallback?: string): string => {
    const keys = key.split('.')
    let value: any = zh
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return fallback || key
      }
    }
    
    return typeof value === 'string' ? value : fallback || key
  }

  return (
    <I18nContext.Provider value={{ t, locale: 'zh' }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}