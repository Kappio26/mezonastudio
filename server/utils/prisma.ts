import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

// Membaca URL basis data langsung dari .env secara reaktif agar kredensial terkini selalu digunakan
function ambilUrlDatabase(): string | undefined {
  try {
    const jalurEnv = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(jalurEnv)) {
      const isiEnv = fs.readFileSync(jalurEnv, 'utf-8')
      const barisCocok = isiEnv.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/)
      if (barisCocok && barisCocok[1]) {
        process.env.DATABASE_URL = barisCocok[1]
        return barisCocok[1]
      }
    }
  } catch {
    // Fallback ke process.env
  }
  return process.env.DATABASE_URL
}

const urlDb = ambilUrlDatabase()

const globalForPrisma = globalThis as unknown as {
  prismaGlobal: PrismaClient | undefined
  terakhirUrlDb: string | undefined
}

export function inisialisasiPrisma(): PrismaClient {
  const urlSekarang = ambilUrlDatabase()

  // Jika URL berubah atau belum pernah diinisialisasi, buat instance baru
  if (!globalForPrisma.prismaGlobal || globalForPrisma.terakhirUrlDb !== urlSekarang) {
    if (globalForPrisma.prismaGlobal) {
      try {
        globalForPrisma.prismaGlobal.$disconnect()
      } catch {
        // Abaikan pemutusan koneksi lama
      }
    }

    globalForPrisma.prismaGlobal = new PrismaClient({
      datasources: urlSekarang ? { db: { url: urlSekarang } } : undefined,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    })
    globalForPrisma.terakhirUrlDb = urlSekarang
  }

  return globalForPrisma.prismaGlobal
}

export const klienPrisma = inisialisasiPrisma()
export default klienPrisma
