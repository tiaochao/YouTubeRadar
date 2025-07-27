import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export interface ApiError {
  error: string
  details?: any
  code?: string
}

export function handleApiError(error: unknown): NextResponse<ApiError> {
  console.error('API Error:', error)

  // Prisma 错误处理
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          { error: '该记录已存在', code: 'DUPLICATE_ENTRY' },
          { status: 409 }
        )
      case 'P2025':
        return NextResponse.json(
          { error: '找不到该记录', code: 'NOT_FOUND' },
          { status: 404 }
        )
      case 'P2003':
        return NextResponse.json(
          { error: '外键约束失败', code: 'FOREIGN_KEY_CONSTRAINT' },
          { status: 400 }
        )
      default:
        return NextResponse.json(
          { error: '数据库操作失败', code: error.code },
          { status: 400 }
        )
    }
  }

  // 数据库连接错误
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      { 
        error: '数据库连接失败，请检查配置', 
        code: 'DB_CONNECTION_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 503 }
    )
  }

  // 数据验证错误
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      { error: '数据验证失败', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  // 通用错误处理
  if (error instanceof Error) {
    return NextResponse.json(
      { 
        error: error.message || '服务器内部错误',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }

  // 未知错误
  return NextResponse.json(
    { error: '发生未知错误' },
    { status: 500 }
  )
}

// 包装 API 处理函数以自动处理错误
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }) as T
}