// Temporarily use mock client for Vercel deployment
export { prisma as db } from './prisma-mock'

// Original Prisma client code (commented out for now)
// import { PrismaClient } from "@prisma/client"
// 
// let prisma: PrismaClient
// 
// declare global {
//   var prismaGlobal: PrismaClient | undefined
// }
// 
// if (process.env.NODE_ENV === "production") {
//   prisma = new PrismaClient()
// } else {
//   if (!global.prismaGlobal) {
//     global.prismaGlobal = new PrismaClient()
//   }
//   prisma = global.prismaGlobal
// }
// 
// export const db = prisma
