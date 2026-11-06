import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const { id, nama_paket, deskripsi, harga, durasi_hari, keuntungan, aktif } = dataTubuh

    if (!id || !nama_paket) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID dan nama paket wajib disertakan.'
      })
    }

    const prisma = inisialisasiPrisma()

    const paket = await prisma.paketKeanggotaan.update({
      where: { id },
      data: {
        nama_paket: nama_paket.trim(),
        deskripsi: deskripsi !== undefined ? (deskripsi ? deskripsi.trim() : null) : undefined,
        harga: harga !== undefined ? Number(harga) : undefined,
        durasi_hari: durasi_hari !== undefined ? Number(durasi_hari) : undefined,
        keuntungan: Array.isArray(keuntungan) ? keuntungan : undefined,
        aktif: aktif !== undefined ? Boolean(aktif) : undefined
      }
    })

    return {
      sukses: true,
      pesan: `Paket ${nama_paket} berhasil diperbarui!`,
      data: paket
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal memperbarui paket:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memperbarui paket: ${kesalahan.message}`
    })
  }
})
