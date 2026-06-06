import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Disable query logging in production for performance
const logLevel = process.env.NODE_ENV === 'production'
  ? ['error', 'warn'] as const
  : ['query', 'error', 'warn'] as const

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevel,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Alias for convenience — many modules import { prisma } from '@/lib/db'
export const prisma = db
