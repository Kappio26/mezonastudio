import { inisialisasiPrisma } from '~/server/utils/prisma'
import { hitungStatusMember } from '~/server/utils/statusMember'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const { id_pembayaran, aksi, catatan_admin } = dataTubuh

    if (!id_pembayaran) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID Pembayaran wajib disertakan.'
      })
    }

    if (!aksi || !['SETUJUI', 'TOLAK'].includes(aksi)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Aksi verifikasi tidak valid. Pilih SETUJUI atau TOLAK.'
      })
    }

    const prisma = inisialisasiPrisma()

    const pembayaran = await prisma.pembayaran.findUnique({
      where: { id: id_pembayaran },
      include: {
        pengguna: {
          include: {
            profil: true
          }
        },
        paket: true,
        kelas: true
      }
    })

    if (!pembayaran) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Data transaksi pembayaran tidak ditemukan.'
      })
    }

    const sekarang = new Date()

    if (aksi === 'SETUJUI') {
      // KASUS 1: Pembayaran Tiket Kelas Tambahan
      if (pembayaran.tipe_transaksi === 'TAMBAH_KELAS' || pembayaran.id_kelas) {
        await prisma.$transaction([
          prisma.pembayaran.update({
            where: { id: pembayaran.id },
            data: {
              status: 'DISETUJUI',
              catatan_admin: catatan_admin ? catatan_admin.trim() : 'Pembayaran kelas tambahan diverifikasi dan disetujui.',
              tanggal_konfirmasi: sekarang
            }
          }),
          // Konfirmasi pemesanan kursi kelas member
          prisma.pemesananKelas.updateMany({
            where: {
              id_pengguna: pembayaran.id_pengguna,
              id_kelas: pembayaran.id_kelas!,
              status: 'MENUNGGU'
            },
            data: {
              status: 'DIKONFIRMASI'
            }
          })
        ])

        return {
          sukses: true,
          pesan: `Pembayaran tiket kelas tambahan ${pembayaran.nomor_invoice} berhasil DISETUJUI! Kursi kelas ${pembayaran.kelas?.nama_kelas || ''} member telah dikonfirmasi.`,
          data: {
            id: pembayaran.id,
            nomor_invoice: pembayaran.nomor_invoice,
            status: 'DISETUJUI',
            nama_member: pembayaran.pengguna.profil?.nama_lengkap
          }
        }
      }

      // KASUS 2: Pembayaran Paket Keanggotaan
      const durasiHari = pembayaran.paket?.durasi_hari || 30
      let tanggalKadaluwarsaBaru: Date

      // Jika member masih memiliki paket aktif, akumulasikan tanggal kadaluwarsa
      if (
        pembayaran.pengguna.profil?.tanggal_kadaluwarsa &&
        new Date(pembayaran.pengguna.profil.tanggal_kadaluwarsa) > sekarang
      ) {
        tanggalKadaluwarsaBaru = new Date(pembayaran.pengguna.profil.tanggal_kadaluwarsa)
        tanggalKadaluwarsaBaru.setDate(tanggalKadaluwarsaBaru.getDate() + durasiHari)
      } else {
        tanggalKadaluwarsaBaru = new Date(sekarang)
        tanggalKadaluwarsaBaru.setDate(tanggalKadaluwarsaBaru.getDate() + durasiHari)
      }

      // Cek apakah ada pilihan kelas studio di catatan member
      let kelasPilihanBaru = pembayaran.pengguna.profil?.kelas_pilihan
      if (pembayaran.catatan_member && pembayaran.catatan_member.includes('Pilihan Kelas:')) {
        const kecocokan = pembayaran.catatan_member.match(/Pilihan Kelas:\s*([^•\n]+)/i)
        if (kecocokan && kecocokan[1]) {
          kelasPilihanBaru = kecocokan[1].trim()
        }
      }

      await prisma.$transaction([
        prisma.pembayaran.update({
          where: { id: pembayaran.id },
          data: {
            status: 'DISETUJUI',
            catatan_admin: catatan_admin ? catatan_admin.trim() : 'Pembayaran telah diverifikasi dan disetujui oleh admin.',
            tanggal_konfirmasi: sekarang
          }
        }),
        prisma.pengguna.update({
          where: { id: pembayaran.id_pengguna },
          data: { aktif: true }
        }),
        prisma.profil.update({
          where: { id_pengguna: pembayaran.id_pengguna },
          data: {
            status_keanggotaan: 'AKTIF',
            tanggal_kadaluwarsa: tanggalKadaluwarsaBaru,
            id_paket_keanggotaan: pembayaran.id_paket,
            kelas_pilihan: kelasPilihanBaru
          }
        })
      ])

      const infoStatus = hitungStatusMember(tanggalKadaluwarsaBaru, 'AKTIF')

      return {
        sukses: true,
        pesan: `Pembayaran ${pembayaran.nomor_invoice} berhasil DISETUJUI. Paket ${pembayaran.paket?.nama_paket} member telah diaktifkan (+${durasiHari} hari)!`,
        data: {
          id: pembayaran.id,
          nomor_invoice: pembayaran.nomor_invoice,
          status: 'DISETUJUI',
          nama_member: pembayaran.pengguna.profil?.nama_lengkap,
          tanggal_kadaluwarsa: tanggalKadaluwarsaBaru.toISOString(),
          tanggal_kadaluwarsa_teks: infoStatus.tanggal_kadaluwarsa_teks
        }
      }
    } else {
      // Aksi TOLAK
      if (pembayaran.tipe_transaksi === 'TAMBAH_KELAS' && pembayaran.id_kelas) {
        await prisma.pemesananKelas.updateMany({
          where: {
            id_pengguna: pembayaran.id_pengguna,
            id_kelas: pembayaran.id_kelas,
            status: 'MENUNGGU'
          },
          data: { status: 'DIBATALKAN' }
        })
      }

      await prisma.pembayaran.update({
        where: { id: pembayaran.id },
        data: {
          status: 'DITOLAK',
          catatan_admin: catatan_admin ? catatan_admin.trim() : 'Bukti transfer tidak valid atau dana belum diterima di rekening studio.',
          tanggal_konfirmasi: sekarang
        }
      })

      return {
        sukses: true,
        pesan: `Pembayaran ${pembayaran.nomor_invoice} telah DITOLAK. Member dapat mengunggah bukti transfer yang valid.`,
        data: {
          id: pembayaran.id,
          nomor_invoice: pembayaran.nomor_invoice,
          status: 'DITOLAK'
        }
      }
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal memproses konfirmasi pembayaran admin:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memproses verifikasi: ${kesalahan.message}`
    })
  }
})
