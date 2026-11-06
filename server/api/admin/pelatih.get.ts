import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const prisma = inisialisasiPrisma()
    const daftarPelatih = await prisma.pengguna.findMany({
      where: { peran: 'PELATIH' },
      include: {
        profil: true,
        kelas_diajar: true
      },
      orderBy: { dibuat_pada: 'asc' }
    })

    return {
      sukses: true,
      data: daftarPelatih.map((p) => {
        const spesialisasiTersimpan = p.profil?.alamat ? p.profil.alamat.replace('Spesialisasi: ', '') : ''
        const kelasMengajar = p.kelas_diajar.map((k) => k.nama_kelas).join(', ')
        return {
          id: p.id,
          nama: p.profil?.nama_lengkap || 'Instruktur',
          email: p.email,
          nomor_telepon: p.profil?.nomor_telepon || '',
          spesialisasi: spesialisasiTersimpan || kelasMengajar || 'Instruktur Studio',
          total_kelas: p.kelas_diajar.length,
          aktif: p.aktif,
          status: p.aktif ? 'Aktif' : 'Nonaktif'
        }
      })
    }
  } catch (kesalahan: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memuat data pelatih: ${kesalahan.message}`
    })
  }
})
