import { PrismaClient } from "@prisma/client"

let prisma: PrismaClient

declare global {
  var prismaGlobal: PrismaClient | undefined
}

// This is needed because in development, Next.js hot-reloads modules,
// which can cause multiple instances of PrismaClient to be created.
// This global variable ensures only one instance is used.
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient()
} else {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient()
  }
  prisma = global.prismaGlobal
}

export const db = prisma
