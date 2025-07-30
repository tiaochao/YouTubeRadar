import { PrismaClient } from "@prisma/client"

let prisma: PrismaClient

declare global {
  var prismaGlobal: PrismaClient | undefined
}

// 创建 Prisma 客户端
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

export const db = prisma
