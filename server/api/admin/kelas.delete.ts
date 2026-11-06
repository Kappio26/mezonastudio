import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const kueri = getQuery(peristiwa)
    const dataTubuh = peristiwa.node.req.method !== 'GET' ? await readBody(peristiwa).catch(() => ({})) : {}
    const id = (kueri.id || dataTubuh?.id) as string

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID kelas yang akan dihapus wajib disertakan.'
      })
    }

    const prisma = inisialisasiPrisma()

    const kelas = await prisma.kelas.findUnique({
      where: { id }
    })

    if (!kelas) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Kelas tidak ditemukan.'
      })
    }

    // Hapus seluruh pemesanan terkait kelas ini terlebih dahulu
    await prisma.pemesananKelas.deleteMany({
      where: { id_kelas: id }
    })

    // Hapus kelas
    await prisma.kelas.delete({
      where: { id }
    })

    return {
      sukses: true,
      pesan: `Kelas ${kelas.nama_kelas} berhasil dihapus dari jadwal studio.`
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal menghapus kelas:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal menghapus kelas: ${kesalahan.message}`
    })
  }
})
