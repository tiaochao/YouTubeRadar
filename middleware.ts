import { NextResponse, type NextRequest } from "next/server"
import { logger } from "@/lib/logger"

export async function middleware(req: NextRequest) {
  // Apply cron authentication to /api/cron routes
  if (req.nextUrl.pathname.startsWith("/api/cron/")) {
    const cronToken = req.headers.get("X-CRON-TOKEN")
    const expectedToken = process.env.CRON_SECRET_TOKEN

    if (!expectedToken) {
      logger.error("Middleware", "CRON_SECRET_TOKEN environment variable is not set.")
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 })
    }

    if (!cronToken || cronToken !== expectedToken) {
      logger.warn("Middleware", "Unauthorized cron access attempt.", {
        path: req.nextUrl.pathname,
        ip: req.ip,
      })
      return NextResponse.json({ error: "Unauthorized", details: "Invalid X-CRON-TOKEN header." }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/cron/:path*"
  ],
}
