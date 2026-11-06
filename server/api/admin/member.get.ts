import { inisialisasiPrisma } from '~/server/utils/prisma'
import { hitungStatusMember } from '~/server/utils/statusMember'

export default defineEventHandler(async () => {
  try {
    const prisma = inisialisasiPrisma()
    const daftarPengguna = await prisma.pengguna.findMany({
      where: { peran: 'MEMBER' },
      include: {
        profil: {
          include: {
            paket_keanggotaan: true
          }
        }
      },
      orderBy: { dibuat_pada: 'desc' }
    })

    const dataMember = daftarPengguna.map((p) => {
      const hasilStatus = hitungStatusMember(
        p.profil?.tanggal_kadaluwarsa,
        p.aktif ? p.profil?.status_keanggotaan : 'NONAKTIF'
      )

      return {
        id: p.id,
        nama: p.profil?.nama_lengkap || 'Member Mezona',
        email: p.email,
        nomor_telepon: p.profil?.nomor_telepon || '-',
        paket: p.profil?.paket_keanggotaan?.nama_paket || 'Belum Berlangganan',
        id_paket: p.profil?.id_paket_keanggotaan || null,
        kelas_pilihan: p.profil?.kelas_pilihan || null,
        durasi_hari_paket: p.profil?.paket_keanggotaan?.durasi_hari || 30,
        status: hasilStatus.status,
        apakah_aktif: hasilStatus.apakah_aktif,
        sisa_hari: hasilStatus.sisa_hari,
        keterangan_sisa: hasilStatus.keterangan_sisa,
        tanggal_kadaluwarsa: p.profil?.tanggal_kadaluwarsa ? new Date(p.profil.tanggal_kadaluwarsa).toISOString() : null,
        tanggal_kadaluwarsa_teks: hasilStatus.tanggal_kadaluwarsa_teks,
        tanggal_daftar: new Date(p.dibuat_pada).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      }
    })

    const totalMember = dataMember.length
    const totalAktif = dataMember.filter((m) => m.apakah_aktif).length
    const totalKadaluwarsa = totalMember - totalAktif

    return {
      sukses: true,
      data: dataMember,
      ringkasan: {
        total_member: totalMember,
        total_aktif: totalAktif,
        total_kadaluwarsa: totalKadaluwarsa
      }
    }
  } catch (kesalahan: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memuat data member: ${kesalahan.message}`
    })
  }
})
