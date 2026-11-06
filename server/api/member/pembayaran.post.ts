import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const {
      id_pengguna,
      email,
      id_paket,
      kelas_pilihan,
      metode_pembayaran,
      bukti_pembayaran,
      catatan_member
    } = dataTubuh

    if (!id_paket) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Silakan pilih paket membership yang ingin dibeli atau diperpanjang.'
      })
    }

    if (!bukti_pembayaran) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bukti transfer pembayaran (foto/screenshot) wajib diunggah.'
      })
    }

    const prisma = inisialisasiPrisma()

    // 1. Cari data member
    const pengguna = await prisma.pengguna.findFirst({
      where: {
        OR: [
          id_pengguna ? { id: id_pengguna } : undefined,
          email ? { email: email.toLowerCase().trim() } : undefined
        ].filter(Boolean) as any
      },
      include: {
        profil: true
      }
    })

    if (!pengguna || !pengguna.profil) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Data profil member tidak ditemukan. Silakan masuk kembali.'
      })
    }

    // 2. Cari paket yang dipilih
    const paket = await prisma.paketKeanggotaan.findUnique({
      where: { id: id_paket }
    })

    if (!paket || !paket.aktif) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Paket keanggotaan tidak ditemukan atau sudah tidak aktif.'
      })
    }

    // Jika memilih paket kelas studio dan memilih kelas utama
    let catatanLengkap = catatan_member ? catatan_member.trim() : ''
    if (kelas_pilihan) {
      catatanLengkap = `Pilihan Kelas: ${kelas_pilihan}${catatanLengkap ? ' • ' + catatanLengkap : ''}`
      // Update kelas_pilihan di profil pengguna
      await prisma.profil.update({
        where: { id_pengguna: pengguna.id },
        data: { kelas_pilihan: kelas_pilihan.trim() }
      })
    }

    // 3. Buat nomor invoice unik
    const tgl = new Date()
    const tglStr = tgl.toISOString().slice(0, 10).replace(/-/g, '')
    const acak = Math.floor(1000 + Math.random() * 9000)
    const nomorInvoice = `INV-${tglStr}-${acak}`

    // 4. Simpan transaksi pembayaran dengan status MENUNGGU_KONFIRMASI
    const pembayaranBaru = await prisma.pembayaran.create({
      data: {
        id_pengguna: pengguna.id,
        id_paket: paket.id,
        tipe_transaksi: 'PAKET',
        nomor_invoice: nomorInvoice,
        jumlah_bayar: paket.harga,
        metode_pembayaran: metode_pembayaran || 'QRIS Studio Mezona',
        bukti_pembayaran: bukti_pembayaran,
        status: 'MENUNGGU_KONFIRMASI',
        catatan_member: catatanLengkap || null
      },
      include: {
        paket: true
      }
    })

    return {
      sukses: true,
      pesan: `Bukti pembayaran paket ${paket.nama_paket} berhasil dikirim! Silakan menunggu konfirmasi verifikasi dari Admin Studio.`,
      data: {
        id: pembayaranBaru.id,
        nomor_invoice: pembayaranBaru.nomor_invoice,
        nama_paket: paket.nama_paket,
        jumlah_bayar: Number(pembayaranBaru.jumlah_bayar),
        jumlah_bayar_rupiah: new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(Number(pembayaranBaru.jumlah_bayar)),
        metode_pembayaran: pembayaranBaru.metode_pembayaran,
        status: pembayaranBaru.status,
        dibuat_pada: pembayaranBaru.dibuat_pada
      }
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal mengirim bukti pembayaran member:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal mengirim pembayaran: ${kesalahan.message}`
    })
  }
})
