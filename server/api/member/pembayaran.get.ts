import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const kueri = getQuery(peristiwa)
    const idPengguna = (kueri.id || '').toString()
    const emailPengguna = (kueri.email || '').toString()

    if (!idPengguna && !emailPengguna) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID Pengguna atau Email diperlukan untuk memuat riwayat pembayaran.'
      })
    }

    const prisma = inisialisasiPrisma()

    const pengguna = await prisma.pengguna.findFirst({
      where: {
        OR: [
          idPengguna ? { id: idPengguna } : undefined,
          emailPengguna ? { email: emailPengguna.toLowerCase().trim() } : undefined
        ].filter(Boolean) as any
      },
      include: {
        profil: true
      }
    })

    if (!pengguna) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Member tidak ditemukan.'
      })
    }

    const daftarPembayaran = await prisma.pembayaran.findMany({
      where: { id_pengguna: pengguna.id },
      include: {
        paket: true,
        kelas: true
      },
      orderBy: { dibuat_pada: 'desc' }
    })

    const pembayaranMenunggu = daftarPembayaran.find(p => p.status === 'MENUNGGU_KONFIRMASI') || null

    const dataFormatted = daftarPembayaran.map(p => ({
      id: p.id,
      nomor_invoice: p.nomor_invoice,
      tipe_transaksi: p.tipe_transaksi,
      nama_paket: p.tipe_transaksi === 'TAMBAH_KELAS'
        ? `Kelas: ${p.kelas?.nama_kelas || 'Studio'}`
        : (p.paket?.nama_paket || 'Paket Membership'),
      durasi_hari: p.paket?.durasi_hari || 1,
      jumlah_bayar: Number(p.jumlah_bayar),
      jumlah_bayar_rupiah: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(Number(p.jumlah_bayar)),
      metode_pembayaran: p.metode_pembayaran,
      bukti_pembayaran: p.bukti_pembayaran,
      status: p.status,
      catatan_member: p.catatan_member,
      catatan_admin: p.catatan_admin,
      tanggal_konfirmasi: p.tanggal_konfirmasi ? new Date(p.tanggal_konfirmasi).toISOString() : null,
      dibuat_pada: new Date(p.dibuat_pada).toISOString(),
      dibuat_pada_teks: new Date(p.dibuat_pada).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }))

    return {
      sukses: true,
      ada_menunggu: !!pembayaranMenunggu,
      pembayaran_menunggu: pembayaranMenunggu ? {
        id: pembayaranMenunggu.id,
        nomor_invoice: pembayaranMenunggu.nomor_invoice,
        nama_paket: pembayaranMenunggu.paket?.nama_paket,
        jumlah_bayar_rupiah: new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(Number(pembayaranMenunggu.jumlah_bayar)),
        metode_pembayaran: pembayaranMenunggu.metode_pembayaran,
        dibuat_pada_teks: new Date(pembayaranMenunggu.dibuat_pada).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } : null,
      daftar: dataFormatted
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal mengambil riwayat pembayaran member:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memuat pembayaran: ${kesalahan.message}`
    })
  }
})
