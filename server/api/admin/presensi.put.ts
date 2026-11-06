import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const { id_pemesanan, status, catatan } = dataTubuh

    if (!id_pemesanan || !status) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID pemesanan dan status presensi wajib disertakan.'
      })
    }

    const prisma = inisialisasiPrisma()

    const pemesanan = await prisma.pemesananKelas.update({
      where: { id: id_pemesanan },
      data: {
        status,
        catatan: catatan !== undefined ? catatan : undefined,
        waktu_check_in: status === 'HADIR' ? new Date() : undefined
      },
      include: {
        member: {
          include: { profil: true }
        },
        kelas: true
      }
    })

    return {
      sukses: true,
      pesan: `Status presensi ${pemesanan.member.profil?.nama_lengkap || 'Member'} berhasil diubah menjadi ${pemesanan.status}!`,
      data: pemesanan
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal memperbarui presensi admin:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memperbarui presensi: ${kesalahan.message}`
    })
  }
})
