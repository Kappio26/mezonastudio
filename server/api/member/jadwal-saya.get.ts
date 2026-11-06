import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const kueri = getQuery(peristiwa)
    const idMember = (kueri.id || '').toString()
    const emailMember = (kueri.email || '').toString()

    const prisma = inisialisasiPrisma()

    let pengguna = null
    if (idMember || emailMember) {
      pengguna = await prisma.pengguna.findFirst({
        where: {
          OR: [
            idMember ? { id: idMember } : undefined,
            emailMember ? { email: emailMember.toLowerCase().trim() } : undefined
          ].filter(Boolean) as any
        }
      })
    }

    if (!pengguna) {
      return { sukses: true, data: [] }
    }

    const daftarPemesanan = await prisma.pemesananKelas.findMany({
      where: {
        id_pengguna: pengguna.id
      },
      include: {
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

    const jadwalSaya = daftarPemesanan.map((p) => {
      const tanggalFormat = new Date(p.tanggal_sesi).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })

      return {
        id: p.id,
        id_kelas: p.kelas.id,
        nama_kelas: p.kelas.nama_kelas,
        deskripsi: p.kelas.deskripsi,
        pelatih: p.kelas?.pelatih?.profil?.nama_lengkap || 'Instruktur Mezona',
        hari: p.kelas.hari,
        jam: `${p.kelas.jam_mulai} - ${p.kelas.jam_selesai} WIB`,
        ruangan: p.kelas.lokasi_ruangan,
        hari_tanggal: `${tanggalFormat} (${p.kelas.jam_mulai} WIB)`,
        tanggal_sesi_teks: tanggalFormat,
        status: p.status, // 'DIKONFIRMASI' | 'HADIR' | 'DIBATALKAN'
        catatan: p.catatan
      }
    })

    return {
      sukses: true,
      data: jadwalSaya
    }
  } catch (kesalahan: any) {
    console.error('Gagal memuat jadwal saya:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memuat jadwal saya: ${kesalahan.message}`
    })
  }
})
