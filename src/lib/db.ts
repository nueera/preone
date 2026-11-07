import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Disable query logging in production for performance.
// Prisma 6 requires each entry to be either a bare LogLevel string or a
// fully-typed LogDefinition ({ level, emit }). A bare `{ level: 'query' }`
// is rejected by the type checker because `emit` is required.
const logLevel: Prisma.LogDefinition[] = process.env.NODE_ENV === 'production'
  ? [{ level: 'error', emit: 'stdout' }, { level: 'warn', emit: 'stdout' }]
  : [{ level: 'query', emit: 'stdout' }, { level: 'error', emit: 'stdout' }, { level: 'warn', emit: 'stdout' }]

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevel,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Alias for convenience — many modules import { prisma } from '@/lib/db'
export const prisma = db
