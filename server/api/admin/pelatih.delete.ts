import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const kueri = getQuery(peristiwa)
    const dataTubuh = peristiwa.node.req.method !== 'GET' ? await readBody(peristiwa).catch(() => ({})) : {}
    const id = (kueri.id || dataTubuh?.id) as string

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID pelatih yang akan dihapus wajib disertakan.'
      })
    }

    const prisma = inisialisasiPrisma()

    // Cek apakah pelatih ada
    const pelatih = await prisma.pengguna.findUnique({
      where: { id },
      include: { profil: true, kelas_diajar: true }
    })

    if (!pelatih) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Pelatih tidak ditemukan.'
      })
    }

    // Jika pelatih mengajar kelas, hapus relasi kelas terlebih dahulu
    if (pelatih.kelas_diajar.length > 0) {
      const idKelasList = pelatih.kelas_diajar.map((k) => k.id)
      await prisma.pemesananKelas.deleteMany({
        where: { id_kelas: { in: idKelasList } }
      })
      await prisma.kelas.deleteMany({
        where: { id_pelatih: id }
      })
    }

    // Hapus profil dan pengguna
    await prisma.profil.deleteMany({
      where: { id_pengguna: id }
    })
    await prisma.pengguna.delete({
      where: { id }
    })

    return {
      sukses: true,
      pesan: `Pelatih ${pelatih.profil?.nama_lengkap || pelatih.email} berhasil dihapus dari sistem.`
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal menghapus pelatih:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal menghapus pelatih: ${kesalahan.message}`
    })
  }
})
