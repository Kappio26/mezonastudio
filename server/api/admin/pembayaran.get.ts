import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const kueri = getQuery(peristiwa)
    const statusFilter = (kueri.status || 'SEMUA').toString()
    const kataKunci = (kueri.cari || '').toString().toLowerCase().trim()

    const prisma = inisialisasiPrisma()

    // 1. Ambil seluruh data pembayaran beserta relasi member dan paket
    const semuaPembayaran = await prisma.pembayaran.findMany({
      include: {
        pengguna: {
          include: {
            profil: true
          }
        },
        paket: true,
        kelas: true
      },
      orderBy: { dibuat_pada: 'desc' }
    })

    // 2. Hitung statistik keseluruhan
    const statistik = {
      total: semuaPembayaran.length,
      menunggu: semuaPembayaran.filter(p => p.status === 'MENUNGGU_KONFIRMASI').length,
      disetujui: semuaPembayaran.filter(p => p.status === 'DISETUJUI').length,
      ditolak: semuaPembayaran.filter(p => p.status === 'DITOLAK').length,
      total_omset: semuaPembayaran
        .filter(p => p.status === 'DISETUJUI')
        .reduce((total, p) => total + Number(p.jumlah_bayar), 0)
    }

    // 3. Terapkan filter status & pencarian
    let hasilSaring = semuaPembayaran

    if (statusFilter !== 'SEMUA') {
      hasilSaring = hasilSaring.filter(p => p.status === statusFilter)
    }

    if (kataKunci) {
      hasilSaring = hasilSaring.filter(p => {
        const invoice = (p.nomor_invoice || '').toLowerCase()
        const nama = (p.pengguna?.profil?.nama_lengkap || '').toLowerCase()
        const email = (p.pengguna?.email || '').toLowerCase()
        const telepon = (p.pengguna?.profil?.nomor_telepon || '').toLowerCase()
        const namaPaket = (p.paket?.nama_paket || '').toLowerCase()
        const namaKelas = (p.kelas?.nama_kelas || '').toLowerCase()
        const metode = (p.metode_pembayaran || '').toLowerCase()

        return (
          invoice.includes(kataKunci) ||
          nama.includes(kataKunci) ||
          email.includes(kataKunci) ||
          telepon.includes(kataKunci) ||
          namaPaket.includes(kataKunci) ||
          namaKelas.includes(kataKunci) ||
          metode.includes(kataKunci)
        )
      })
    }

    // 4. Format data untuk antarmuka admin
    const dataFormatted = hasilSaring.map(p => ({
      id: p.id,
      nomor_invoice: p.nomor_invoice,
      id_pengguna: p.id_pengguna,
      tipe_transaksi: p.tipe_transaksi || 'PAKET',
      nama_member: p.pengguna?.profil?.nama_lengkap || 'Member Tanpa Nama',
      email: p.pengguna?.email || '-',
      nomor_telepon: p.pengguna?.profil?.nomor_telepon || '-',
      foto_profil: p.pengguna?.profil?.foto_profil || null,
      id_paket: p.id_paket,
      id_kelas: p.id_kelas,
      nama_paket: p.tipe_transaksi === 'TAMBAH_KELAS'
        ? `Kelas: ${p.kelas?.nama_kelas || 'Studio'}`
        : (p.paket?.nama_paket || 'Paket Gym'),
      durasi_hari: p.paket?.durasi_hari || (p.tipe_transaksi === 'TAMBAH_KELAS' ? 1 : 30),
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
      statistik: {
        ...statistik,
        total_omset_rupiah: new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(statistik.total_omset)
      },
      data: dataFormatted
    }
  } catch (kesalahan: any) {
    console.error('Gagal memuat daftar verifikasi pembayaran admin:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memuat pembayaran: ${kesalahan.message}`
    })
  }
})
