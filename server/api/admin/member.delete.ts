import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const kueri = getQuery(peristiwa)
    const dataTubuh = peristiwa.node.req.method !== 'GET' ? await readBody(peristiwa).catch(() => ({})) : {}
    const id = (kueri.id || dataTubuh?.id) as string

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID member yang akan dihapus wajib disertakan.'
      })
    }

    const prisma = inisialisasiPrisma()

    const member = await prisma.pengguna.findUnique({
      where: { id },
      include: { profil: true }
    })

    if (!member) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Member tidak ditemukan.'
      })
    }

    // Hapus seluruh pemesanan kelas yang pernah dibuat oleh member ini
    await prisma.pemesananKelas.deleteMany({
      where: { id_pengguna: id }
    })

    // Hapus profil dan akun pengguna
    await prisma.profil.deleteMany({
      where: { id_pengguna: id }
    })

    await prisma.pengguna.delete({
      where: { id }
    })

    return {
      sukses: true,
      pesan: `Member ${member.profil?.nama_lengkap || member.email} berhasil dihapus.`
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal menghapus member:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal menghapus member: ${kesalahan.message}`
    })
  }
})
