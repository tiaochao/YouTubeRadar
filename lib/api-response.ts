import { NextResponse } from "next/server"

interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
  details?: string
  statusCode?: number
}

export function successResponse<T>(data: T, statusCode = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ ok: true, data }, { status: statusCode })
}

export function errorResponse(message: string, details?: string, statusCode = 500): NextResponse<ApiResponse<any>> {
  return NextResponse.json({ ok: false, error: message, details }, { status: statusCode })
}
