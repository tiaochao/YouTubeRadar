import { PrismaClient } from "@prisma/client"
import { validateEnv } from "./env-validation"

let prisma: PrismaClient

declare global {
  var prismaGlobal: PrismaClient | undefined
}

// 验证环境变量
const envValidation = validateEnv()
if (!envValidation.valid) {
  console.error("Environment validation failed:", envValidation.error)
  // 在生产环境中，如果缺少必要的环境变量，使用模拟客户端
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
    console.warn("Using mock Prisma client due to missing DATABASE_URL")
    // 导入模拟客户端作为后备
    const { prisma: mockPrisma } = require("./prisma-mock")
    prisma = mockPrisma as any
  }
}

// 只在有 DATABASE_URL 时创建真实的 Prisma 客户端
if (process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient({
      errorFormat: 'minimal',
    })
  } else {
    if (!global.prismaGlobal) {
      global.prismaGlobal = new PrismaClient({
        log: ['error', 'warn'],
        errorFormat: 'pretty',
      })
    }
    prisma = global.prismaGlobal
  }
} else {
  // 如果没有设置 DATABASE_URL，使用模拟客户端
  console.warn("DATABASE_URL not found, using mock Prisma client")
  const { prisma: mockPrisma } = require("./prisma-mock")
  prisma = mockPrisma as any
}

export const db = prisma
