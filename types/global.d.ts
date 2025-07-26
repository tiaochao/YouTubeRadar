import { NextRequest } from 'next/server'

declare global {
  interface Window {
    // Add global window properties if needed
  }
}

declare module 'next/server' {
  interface NextRequest {
    ip?: string
  }
}

export {}