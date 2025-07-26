// Mock Prisma client for client-side only mode
export const prisma = {
  channel: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => null,
    update: async () => null,
    delete: async () => null,
  },
  video: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => null,
    update: async () => null,
    delete: async () => null,
  },
  channelDailyStat: {
    findMany: async () => [],
    create: async () => null,
  },
  videoStatSnapshot: {
    findMany: async () => [],
    create: async () => null,
  },
  taskLog: {
    create: async () => null,
  },
  systemConfig: {
    findUnique: async () => null,
    upsert: async () => null,
  },
}