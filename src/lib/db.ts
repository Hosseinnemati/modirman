import { createRequire } from 'node:module'
import { PrismaClient } from '@prisma/client'

// با هر تغییر اسکیمای Prisma این نسخه باید افزایش یابد
// تا کلاینت جدید (تولیدشده توسط prisma generate/db:push) بدون ری‌استارت سرور بارگذاری شود
const PRISMA_SCHEMA_VERSION = 3

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaSchemaVersion?: number
}

function loadPrismaClient(): PrismaClient {
  try {
    // باطل‌کردن کش require تا نسخه جدید کلاینت (پس از db:push/generate) از دیسک خوانده شود
    const nodeRequire = createRequire(`${process.cwd()}/package.json`)
    for (const key of Object.keys(nodeRequire.cache)) {
      if (key.includes('@prisma') || key.includes('.prisma')) {
        delete nodeRequire.cache[key]
      }
    }
    const prismaPkg = nodeRequire('@prisma' + '/client') as {
      PrismaClient?: new (o?: { log?: string[] }) => PrismaClient
      default?: { PrismaClient: new (o?: { log?: string[] }) => PrismaClient }
    }
    const PrismaClientCtor = prismaPkg?.PrismaClient ?? prismaPkg?.default?.PrismaClient
    if (typeof PrismaClientCtor === 'function') {
      return new PrismaClientCtor({ log: ['query'] })
    }
  } catch (e) {
    console.error('fresh prisma client load failed, using fallback', e)
  }
  // fallback: کلاینت از طریق import استاتیک (ممکن است قدیمی باشد)
  return new PrismaClient({ log: ['query'] })
}

export const db =
  globalForPrisma.prisma &&
  globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION
    ? globalForPrisma.prisma
    : (() => {
        const client = loadPrismaClient()
        globalForPrisma.prisma = client
        globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION
        return client
      })()
