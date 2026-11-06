import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const prisma = inisialisasiPrisma()

    const sekarang = new Date()

    // 1. Ambil seluruh member untuk menghitung status aktif vs kadaluwarsa berdasarkan masa berlaku sebulan
    const daftarSemuaMember = await prisma.pengguna.findMany({
      where: { peran: 'MEMBER' },
      include: { profil: true }
    })

    const totalMember = daftarSemuaMember.length
    const totalMemberAktif = daftarSemuaMember.filter((m) => {
      if (!m.aktif) return false
      if (!m.profil?.tanggal_kadaluwarsa) return false
      return new Date(m.profil.tanggal_kadaluwarsa) >= sekarang
    }).length
    const totalMemberKadaluwarsa = totalMember - totalMemberAktif

    // 2. Hitung total pelatih aktif
    const totalPelatih = await prisma.pengguna.count({
      where: {
        peran: 'PELATIH',
        aktif: true
      }
    })

    // 3. Hitung total kelas yang tersedia
    const totalKelas = await prisma.kelas.count({
      where: { aktif: true }
    })

    // 4. Hitung total pemesanan/presensi kelas
    const totalPemesanan = await prisma.pemesananKelas.count()

    // 5. Hitung total pembayaran yang menunggu verifikasi admin
    const totalPembayaranMenunggu = await prisma.pembayaran.count({
      where: { status: 'MENUNGGU_KONFIRMASI' }
    })

    // 5. Hitung total pendapatan riil dari tabel Pembayaran (DISETUJUI) disinkronkan dengan laporan keuangan
    const daftarPembayaranSelesai = await prisma.pembayaran.findMany({
      where: { status: 'DISETUJUI' },
      include: {
        pengguna: {
          include: { profil: true }
        }
      }
    })

    const profilDenganPaket = await prisma.profil.findMany({
      where: {
        id_paket_keanggotaan: { not: null }
      },
      include: {
        pengguna: true,
        paket_keanggotaan: true
      }
    })

    const nominalPembayaran = daftarPembayaranSelesai.reduce((total, p) => total + Number(p.jumlah_bayar), 0)
    const emailSudahBayar = new Set(daftarPembayaranSelesai.map(p => p.pengguna?.email).filter(Boolean))

    const nominalFallbackProfil = profilDenganPaket
      .filter(p => !emailSudahBayar.has(p.pengguna.email))
      .reduce((total, p) => total + (p.paket_keanggotaan ? Number(p.paket_keanggotaan.harga) : 0), 0)

    const totalPendapatan = nominalPembayaran + nominalFallbackProfil

    // Hitung total tiket kelas tambahan yang terjual
    const totalTiketKelas = await prisma.pembayaran.count({
      where: {
        tipe_transaksi: 'TAMBAH_KELAS',
        status: 'DISETUJUI'
      }
    })

    // 6. Ambil aktivitas presensi/pemesanan kelas terkini dari database
    const daftarPemesanan = await prisma.pemesananKelas.findMany({
      take: 10,
      orderBy: { dibuat_pada: 'desc' },
      include: {
        member: {
          include: {
            profil: {
              include: {
                paket_keanggotaan: true
              }
            }
          }
        },
        kelas: true
      }
    })

    // Format data presensi untuk antarmuka
    const aktivitasPresensi = daftarPemesanan.map((pesan) => {
      const nama = pesan.member.profil?.nama_lengkap || pesan.member.email
      const namaPaket = pesan.member.profil?.paket_keanggotaan?.nama_paket || 'Member Studio'
      const waktu = new Date(pesan.tanggal_sesi).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB'

      return {
        id: pesan.id,
        nama,
        tipe: namaPaket,
        kelas: pesan.kelas.nama_kelas,
        waktu,
        metode: 'Scan QR Gate',
        status: pesan.status === 'HADIR' ? 'Hadir' : pesan.status === 'DIKONFIRMASI' ? 'Masuk' : pesan.status
      }
    })

    // 7. Ambil daftar 3 kelas resmi yang aktif
    const kelasAktif = await prisma.kelas.findMany({
      where: { aktif: true },
      include: {
        pelatih: {
          include: { profil: true }
        },
        _count: {
          select: { daftar_pemesanan: true }
        }
      }
    })

    return {
      sukses: true,
      data: {
        metrik: {
          total_member: totalMember,
          total_member_aktif: totalMemberAktif,
          total_member_kadaluwarsa: totalMemberKadaluwarsa,
          total_pembayaran_menunggu: totalPembayaranMenunggu,
          total_pelatih: totalPelatih,
          total_kelas: totalKelas,
          total_presensi: totalPemesanan,
          total_tiket_kelas: totalTiketKelas,
          total_pendapatan: totalPendapatan,
          total_pendapatan_rupiah: new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
          }).format(totalPendapatan)
        },
        aktivitas_presensi: aktivitasPresensi,
        daftar_kelas: kelasAktif.map((k) => ({
          id: k.id,
          nama: k.nama_kelas,
          pelatih: k.pelatih.profil?.nama_lengkap || 'Instruktur Mezona',
          hari: k.hari,
          jam: `${k.jam_mulai} - ${k.jam_selesai} WIB`,
          ruang: k.lokasi_ruangan,
          terisi: k._count.daftar_pemesanan,
          kapasitas: k.kapasitas_maksimal
        }))
      }
    }
  } catch (kesalahan: any) {
    console.error('Gagal mengambil data dasbor admin:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memuat data dasbor admin: ${kesalahan.message}`
    })
  }
})
