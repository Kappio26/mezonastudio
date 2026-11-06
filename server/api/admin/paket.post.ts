import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const { nama_paket, deskripsi, harga, durasi_hari, keuntungan } = dataTubuh

    if (!nama_paket || harga === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nama paket dan harga wajib diisi.'
      })
    }

    const prisma = inisialisasiPrisma()

    const paketBaru = await prisma.paketKeanggotaan.create({
      data: {
        nama_paket: nama_paket.trim(),
        deskripsi: deskripsi ? deskripsi.trim() : null,
        harga: Number(harga),
        durasi_hari: durasi_hari ? Number(durasi_hari) : 30,
        keuntungan: Array.isArray(keuntungan) ? keuntungan : [],
        aktif: true
      }
    })

    return {
      sukses: true,
      pesan: `Paket membership ${nama_paket} berhasil dibuat!`,
      data: paketBaru
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal menambah paket:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal menambah paket: ${kesalahan.message}`
    })
  }
})
