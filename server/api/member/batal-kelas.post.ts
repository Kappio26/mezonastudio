import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const { id_pemesanan, id_pengguna, email } = dataTubuh

    if (!id_pemesanan) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID pemesanan wajib disertakan.'
      })
    }

    const prisma = inisialisasiPrisma()

    // Cari pemesanan yang bersangkutan
    const pemesanan = await prisma.pemesananKelas.findUnique({
      where: { id: id_pemesanan },
      include: {
        kelas: true,
        member: true
      }
    })

    if (!pemesanan) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Data pemesanan tidak ditemukan.'
      })
    }

    // Jika pemesanan berstatus MENUNGGU (ada pembayaran tiket kelas yang belum diverifikasi), batalkan transaksinya
    if (pemesanan.status === 'MENUNGGU') {
      await prisma.pembayaran.updateMany({
        where: {
          id_pengguna: pemesanan.id_pengguna,
          id_kelas: pemesanan.id_kelas,
          status: 'MENUNGGU_KONFIRMASI'
        },
        data: {
          status: 'DITOLAK',
          catatan_admin: 'Pemesanan kelas dibatalkan oleh member sebelum diverifikasi'
        }
      })
    }

    // Hapus atau batalkan pemesanan
    await prisma.pemesananKelas.delete({
      where: { id: id_pemesanan }
    })

    return {
      sukses: true,
      pesan: `Pemesanan kelas ${pemesanan.kelas.nama_kelas} berhasil dibatalkan.`
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal membatalkan pemesanan:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal membatalkan pemesanan: ${kesalahan.message}`
    })
  }
})
