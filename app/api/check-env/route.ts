import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    hasYouTubeApiKey: !!process.env.YOUTUBE_API_KEY,
    hasPublicYouTubeApiKey: !!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'not set',
    apiKeyPrefix: process.env.YOUTUBE_API_KEY ? process.env.YOUTUBE_API_KEY.substring(0, 10) + '...' : 'not set'
  })
}