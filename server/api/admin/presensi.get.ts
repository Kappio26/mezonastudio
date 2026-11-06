import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const kueri = getQuery(peristiwa)
    const statusFilter = (kueri.status || '').toString().toUpperCase()
    const kataKunci = (kueri.q || '').toString().toLowerCase().trim()

    const prisma = inisialisasiPrisma()

    const daftarPemesanan = await prisma.pemesananKelas.findMany({
      where: {
        status: statusFilter && statusFilter !== 'SEMUA' ? (statusFilter as any) : undefined
      },
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
        kelas: {
          include: {
            pelatih: {
              include: { profil: true }
            }
          }
        }
      },
      orderBy: { dibuat_pada: 'desc' }
    })

    const formatData = daftarPemesanan.map((p) => {
      const namaMember = p.member.profil?.nama_lengkap || p.member.email
      const namaKelas = p.kelas?.nama_kelas || 'Kelas Studio'
      const pelatih = p.kelas?.pelatih?.profil?.nama_lengkap || 'Instruktur Mezona'
      const paket = p.member.profil?.paket_keanggotaan?.nama_paket || 'Member Studio'

      return {
        id: p.id,
        id_member: p.member.id,
        nama_member: namaMember,
        email_member: p.member.email,
        telepon_member: p.member.profil?.nomor_telepon || '-',
        paket_member: paket,
        id_kelas: p.kelas?.id,
        nama_kelas: namaKelas,
        pelatih: pelatih,
        ruang: p.kelas?.lokasi_ruangan || 'Studio Utama',
        jadwal: `${p.kelas?.hari || 'Hari Ini'}, ${p.kelas?.jam_mulai || '00:00'} - ${p.kelas?.jam_selesai || '00:00'} WIB`,
        tanggal_sesi: p.tanggal_sesi,
        tanggal_sesi_teks: new Date(p.tanggal_sesi).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        jam_sesi_teks: new Date(p.tanggal_sesi).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        }) + ' WIB',
        status: p.status, // 'HADIR' | 'DIKONFIRMASI' | 'MENUNGGU' | 'DIBATALKAN'
        catatan: p.catatan || 'Check-in Turnstile',
        waktu_check_in: p.waktu_check_in ? new Date(p.waktu_check_in).toISOString() : null,
        dibuat_pada: p.dibuat_pada
      }
    })

    // Filter pencarian jika ada
    const dataTersaring = kataKunci
      ? formatData.filter((item) =>
          item.nama_member.toLowerCase().includes(kataKunci) ||
          item.email_member.toLowerCase().includes(kataKunci) ||
          item.nama_kelas.toLowerCase().includes(kataKunci) ||
          item.pelatih.toLowerCase().includes(kataKunci)
        )
      : formatData

    // Hitung ringkasan
    const totalSemua = formatData.length
    const totalHadir = formatData.filter((p) => p.status === 'HADIR').length
    const totalDikonfirmasi = formatData.filter((p) => p.status === 'DIKONFIRMASI').length
    const totalDibatalkan = formatData.filter((p) => p.status === 'DIBATALKAN').length

    return {
      sukses: true,
      data: dataTersaring,
      ringkasan: {
        total: totalSemua,
        hadir: totalHadir,
        dikonfirmasi: totalDikonfirmasi,
        dibatalkan: totalDibatalkan
      }
    }
  } catch (kesalahan: any) {
    console.error('Gagal memuat log presensi admin:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memuat data presensi: ${kesalahan.message}`
    })
  }
})
