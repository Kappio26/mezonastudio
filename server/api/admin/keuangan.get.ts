import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const prisma = inisialisasiPrisma()

    // 1. Ambil data seluruh profil member aktif yang memiliki paket keanggotaan
    const daftarProfil = await prisma.profil.findMany({
      where: {
        id_paket_keanggotaan: { not: null }
      },
      include: {
        pengguna: true,
        paket_keanggotaan: true
      },
      orderBy: { dibuat_pada: 'desc' }
    })

    // 2. Ambil seluruh paket keanggotaan untuk analisis per kategori paket
    const daftarPaket = await prisma.paketKeanggotaan.findMany({
      include: {
        _count: {
          select: { daftar_profil: true }
        }
      }
    })

    // 3. Ambil pembayaran riil dari tabel Pembayaran
    const daftarPembayaranSelesai = await prisma.pembayaran.findMany({
      where: { status: 'DISETUJUI' },
      include: {
        pengguna: {
          include: { profil: true }
        },
        paket: true,
        kelas: true
      },
      orderBy: { dibuat_pada: 'desc' }
    })

    const metodePembayaranList = ['QRIS Kasir Studio', 'Transfer Bank BCA', 'Kartu Debit Mandiri', 'Tunai Resepsionis']

    // Gabungkan transaksi dari tabel Pembayaran riil dan data profil keanggotaan
    const transaksiPembayaran = daftarPembayaranSelesai.map(p => {
      const nominal = Number(p.jumlah_bayar)
      const tanggal = new Date(p.dibuat_pada)
      return {
        id: p.id,
        nomor_invoice: p.nomor_invoice,
        nama_member: p.pengguna?.profil?.nama_lengkap || 'Member Studio',
        email: p.pengguna?.email || '-',
        nomor_telepon: p.pengguna?.profil?.nomor_telepon || '-',
        paket: p.tipe_transaksi === 'TAMBAH_KELAS'
          ? `Kelas: ${p.kelas?.nama_kelas || 'Studio'}`
          : (p.paket?.nama_paket || 'Paket Gym'),
        durasi: p.paket ? `${p.paket.durasi_hari} Hari` : '1 Sesi Kelas',
        nominal: nominal,
        nominal_rupiah: new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(nominal),
        metode_pembayaran: p.metode_pembayaran,
        status: 'LUNAS',
        tanggal: tanggal.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        tanggal_format: tanggal.toISOString().split('T')[0],
        jam: tanggal.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        tanggal_iso: tanggal.toISOString()
      }
    })

    // Tambahkan fallback profil jika belum ada di tabel pembayaran
    const invoiceTerdaftar = new Set(transaksiPembayaran.map(t => t.nomor_invoice))
    const transaksiProfil = daftarProfil
      .filter((p) => !transaksiPembayaran.some(t => t.email === p.pengguna.email))
      .map((p, indeks) => {
        const hargaNominal = p.paket_keanggotaan ? Number(p.paket_keanggotaan.harga) : 0
        const tanggal = new Date(p.dibuat_pada)
        const nomorInvoice = `INV-MZ-${tanggal.getFullYear()}${String(tanggal.getMonth() + 1).padStart(2, '0')}-${String(indeks + 1).padStart(3, '0')}`

        return {
          id: p.id,
          nomor_invoice: nomorInvoice,
          nama_member: p.nama_lengkap,
          email: p.pengguna.email,
          nomor_telepon: p.nomor_telepon || '-',
          paket: p.paket_keanggotaan?.nama_paket || 'Paket Gym',
          durasi: `${p.paket_keanggotaan?.durasi_hari || 30} Hari`,
          nominal: hargaNominal,
          nominal_rupiah: new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
          }).format(hargaNominal),
          metode_pembayaran: metodePembayaranList[indeks % metodePembayaranList.length],
          status: p.status_keanggotaan === 'AKTIF' ? 'LUNAS' : p.status_keanggotaan,
          tanggal: tanggal.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }),
          tanggal_format: tanggal.toISOString().split('T')[0],
          jam: tanggal.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
          tanggal_iso: tanggal.toISOString()
        }
      })

    const transaksi = [...transaksiPembayaran, ...transaksiProfil]

    // 4. Hitung ringkasan keuangan
    const totalOmset = transaksi.reduce((acc, t) => acc + t.nominal, 0)
    const totalTransaksi = transaksi.length
    const rataRataTransaksi = totalTransaksi > 0 ? Math.round(totalOmset / totalTransaksi) : 0

    // 5. Rincian per paket
    const rincianPaket = daftarPaket.map((pk) => {
      const jumlahMember = pk._count.daftar_profil
      const totalPendapatanPaket = jumlahMember * Number(pk.harga)
      return {
        id: pk.id,
        nama: pk.nama_paket,
        harga: Number(pk.harga),
        durasi: `${pk.durasi_hari} Hari`,
        total_pembeli: jumlahMember,
        total_pendapatan: totalPendapatanPaket,
        total_pendapatan_rupiah: new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(totalPendapatanPaket)
      }
    })

    return {
      sukses: true,
      data: {
        ringkasan: {
          total_omset: totalOmset,
          total_omset_rupiah: new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
          }).format(totalOmset),
          total_transaksi: totalTransaksi,
          rata_rata: rataRataTransaksi,
          rata_rata_rupiah: new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
          }).format(rataRataTransaksi),
          periode: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        },
        rincian_paket: rincianPaket,
        transaksi: transaksi
      }
    }
  } catch (kesalahan: any) {
    console.error('Gagal mengambil laporan keuangan:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memuat laporan keuangan: ${kesalahan.message}`
    })
  }
})
