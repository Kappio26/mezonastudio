import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const { id_pemesanan, status } = dataTubuh

    if (!id_pemesanan) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID pemesanan wajib disertakan.'
      })
    }

    const prisma = inisialisasiPrisma()

    const pemesananAda = await prisma.pemesananKelas.findUnique({
      where: { id: id_pemesanan },
      include: {
        member: { include: { profil: true } },
        kelas: true
      }
    })

    if (!pemesananAda) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Pemesanan sesi kelas tidak ditemukan.'
      })
    }

    if (pemesananAda.status === 'MENUNGGU') {
      throw createError({
        statusCode: 400,
        statusMessage: `Member ${pemesananAda.member.profil?.nama_lengkap || 'ini'} belum dapat dipresensi karena masih menunggu verifikasi pembayaran tiket kelas dari Admin Studio.`
      })
    }

    const pemesananTerbaru = await prisma.pemesananKelas.update({
      where: { id: id_pemesanan },
      data: {
        status: status || 'HADIR'
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
      pesan: `Presensi ${pemesananTerbaru.member.profil?.nama_lengkap || 'Member'} berhasil dicatat sebagai ${pemesananTerbaru.status}!`,
      data: pemesananTerbaru
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal memperbarui presensi pelatih:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memperbarui presensi: ${kesalahan.message}`
    })
  }
})
