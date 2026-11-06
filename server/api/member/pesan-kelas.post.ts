import { inisialisasiPrisma } from '~/server/utils/prisma'
import { hitungStatusMember } from '~/server/utils/statusMember'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const {
      id_kelas,
      id_pengguna,
      email,
      catatan,
      metode_pembayaran,
      bukti_pembayaran,
      pilih_sebagai_utama
    } = dataTubuh

    if (!id_kelas) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID kelas wajib disertakan.'
      })
    }

    const prisma = inisialisasiPrisma()

    // 1. Verifikasi data pengguna dan keaktifan membership
    const pengguna = await prisma.pengguna.findFirst({
      where: {
        OR: [
          id_pengguna ? { id: id_pengguna } : undefined,
          email ? { email: email.toLowerCase().trim() } : undefined
        ].filter(Boolean) as any
      },
      include: {
        profil: {
          include: { paket_keanggotaan: true }
        },
        pemesanan_kelas_saya: {
          where: {
            status: { in: ['DIKONFIRMASI', 'HADIR', 'MENUNGGU'] }
          }
        }
      }
    })

    if (!pengguna || !pengguna.profil) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Sesi member tidak valid. Silakan masuk kembali.'
      })
    }

    const hasilStatus = hitungStatusMember(
      pengguna.profil.tanggal_kadaluwarsa,
      pengguna.aktif ? pengguna.profil.status_keanggotaan : 'NONAKTIF'
    )

    if (!hasilStatus.apakah_aktif) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Paket membership Anda telah kadaluwarsa / tidak aktif. Silakan perpanjang paket terlebih dahulu untuk memesan kursi kelas!'
      })
    }

    // 2. Ambil data kelas dan cek kapasitas
    const kelas = await prisma.kelas.findUnique({
      where: { id: id_kelas },
      include: {
        _count: {
          select: {
            daftar_pemesanan: {
              where: { status: { in: ['DIKONFIRMASI', 'HADIR', 'MENUNGGU'] } }
            }
          }
        }
      }
    })

    if (!kelas || !kelas.aktif) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Kelas tidak ditemukan atau sudah tidak aktif.'
      })
    }

    if (kelas._count.daftar_pemesanan >= kelas.kapasitas_maksimal) {
      throw createError({
        statusCode: 400,
        statusMessage: `Maaf, kuota untuk kelas ${kelas.nama_kelas} sudah penuh (${kelas.kapasitas_maksimal} kursi terisi).`
      })
    }

    // 3. Cek apakah member sudah pernah memesan kelas ini sebelumnya
    const pemesananSudahAda = await prisma.pemesananKelas.findFirst({
      where: {
        id_pengguna: pengguna.id,
        id_kelas: kelas.id,
        status: { in: ['DIKONFIRMASI', 'HADIR', 'MENUNGGU'] }
      }
    })

    if (pemesananSudahAda) {
      throw createError({
        statusCode: 400,
        statusMessage: `Anda sudah terdaftar pada kelas ${kelas.nama_kelas} ini.`
      })
    }

    // 4. Hitung Hak Akses Paket (VIP vs Kelas Studio vs Daily Pass)
    const namaPaket = pengguna.profil.paket_keanggotaan?.nama_paket || ''
    const isVip = namaPaket.toLowerCase().includes('vip')
    const isStudio = namaPaket.toLowerCase().includes('kelas studio') || namaPaket.toLowerCase().includes('studio')
    const isDaily = namaPaket.toLowerCase().includes('daily') || namaPaket.toLowerCase().includes('harian')
    let kelasPilihan = (pengguna.profil.kelas_pilihan || '').trim()

    const namaKecilKelas = kelas.nama_kelas.toLowerCase()
    const kategoriKelas = (kelas.kategori || '').toLowerCase()

    let butuhBayar = false
    let statusPemesanan = 'DIKONFIRMASI'
    let pesanSukses = `Kursi Anda untuk kelas ${kelas.nama_kelas} berhasil dipesan!`

    if (isVip) {
      // VIP All Access: Bebas semua kelas tanpa bayar
      butuhBayar = false
      statusPemesanan = 'DIKONFIRMASI'
      pesanSukses = `Kursi untuk kelas ${kelas.nama_kelas} berhasil dipesan (Termasuk Paket VIP All Access)!`
    } else if (isStudio) {
      // Paket Studio: Hanya 1 jenis kelas pilihan yang gratis
      if (!kelasPilihan) {
        // Belum memilih kelas utama: jadikan kelas ini sebagai kelas pilihan utamanya
        const kategoriTersimpan = kelas.kategori || kelas.nama_kelas
        await prisma.profil.update({
          where: { id_pengguna: pengguna.id },
          data: { kelas_pilihan: kategoriTersimpan }
        })
        kelasPilihan = kategoriTersimpan
        butuhBayar = false
        statusPemesanan = 'DIKONFIRMASI'
        pesanSukses = `Kursi kelas ${kelas.nama_kelas} berhasil dipesan dan dikunci sebagai 1 Kelas Studio Pilihan Anda!`
      } else {
        const cocokPilihan = namaKecilKelas.includes(kelasPilihan.toLowerCase()) || kategoriKelas.includes(kelasPilihan.toLowerCase())
        if (cocokPilihan) {
          butuhBayar = false
          statusPemesanan = 'DIKONFIRMASI'
          pesanSukses = `Kursi kelas ${kelas.nama_kelas} berhasil dipesan (Termasuk Paket Studio: ${kelasPilihan})!`
        } else {
          // Kelas tambahan di luar kelas pilihan -> wajib bayar
          butuhBayar = true
        }
      }
    } else if (isDaily) {
      const sudahPesanHariIni = pengguna.pemesanan_kelas_saya.length
      if (sudahPesanHariIni === 0) {
        butuhBayar = false
        statusPemesanan = 'DIKONFIRMASI'
        pesanSukses = `Kursi kelas ${kelas.nama_kelas} berhasil dipesan (1 Sesi Gratis Daily Pass)!`
      } else {
        butuhBayar = true
      }
    }

    // Jika membutuhkan pembayaran kelas tambahan
    if (butuhBayar) {
      if (!bukti_pembayaran) {
        const nominalRupiah = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(Number(kelas.harga || 50000))

        throw createError({
          statusCode: 402,
          statusMessage: `Kelas ${kelas.nama_kelas} merupakan kelas tambahan di luar pilihan paket Anda. Silakan selesaikan pembayaran tiket kelas (${nominalRupiah}) dan sertakan bukti transfer.`
        })
      }

      // Buat invoice dan record pembayaran kelas tambahan
      const tgl = new Date()
      const tglStr = tgl.toISOString().slice(0, 10).replace(/-/g, '')
      const acak = Math.floor(1000 + Math.random() * 9000)
      const nomorInvoice = `INV-KLS-${tglStr}-${acak}`

      const pembayaranKelas = await prisma.pembayaran.create({
        data: {
          id_pengguna: pengguna.id,
          id_kelas: kelas.id,
          tipe_transaksi: 'TAMBAH_KELAS',
          nomor_invoice: nomorInvoice,
          jumlah_bayar: kelas.harga,
          metode_pembayaran: metode_pembayaran || 'QRIS Studio Mezona',
          bukti_pembayaran: bukti_pembayaran,
          status: 'MENUNGGU_KONFIRMASI',
          catatan_member: catatan || `Pemesanan Kelas Tambahan: ${kelas.nama_kelas}`
        }
      })

      // Buat pemesanan berstatus MENUNGGU verifikasi admin
      const pemesananBaru = await prisma.pemesananKelas.create({
        data: {
          id_pengguna: pengguna.id,
          id_kelas: kelas.id,
          tanggal_sesi: kelas.tanggal || new Date(),
          status: 'MENUNGGU',
          catatan: `Kelas Tambahan (Invoice: ${nomorInvoice})`
        },
        include: { kelas: true }
      })

      return {
        sukses: true,
        butuh_verifikasi: true,
        pesan: `Pemesanan kelas ${kelas.nama_kelas} dan bukti transfer berhasil dikirim! Menunggu konfirmasi admin.`,
        data: {
          pemesanan: pemesananBaru,
          pembayaran: pembayaranKelas
        }
      }
    }

    // 5. Buat pemesanan kelas gratis langsung DIKONFIRMASI di PostgreSQL
    const pemesananBaru = await prisma.pemesananKelas.create({
      data: {
        id_pengguna: pengguna.id,
        id_kelas: kelas.id,
        tanggal_sesi: kelas.tanggal || new Date(),
        status: 'DIKONFIRMASI',
        catatan: catatan || 'Pemesanan melalui aplikasi member'
      },
      include: {
        kelas: true
      }
    })

    return {
      sukses: true,
      butuh_verifikasi: false,
      pesan: pesanSukses,
      data: pemesananBaru
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal memesan kelas member:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memesan kelas: ${kesalahan.message}`
    })
  }
})
