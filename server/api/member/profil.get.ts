import { inisialisasiPrisma } from '~/server/utils/prisma'
import { hitungStatusMember } from '~/server/utils/statusMember'

export default defineEventHandler(async (peristiwa) => {
  try {
    const kueri = getQuery(peristiwa)
    const idPengguna = (kueri.id || '').toString()
    const emailPengguna = (kueri.email || '').toString()

    const prisma = inisialisasiPrisma()

    let pengguna = null
    if (idPengguna || emailPengguna) {
      pengguna = await prisma.pengguna.findFirst({
        where: {
          OR: [
            idPengguna ? { id: idPengguna } : undefined,
            emailPengguna ? { email: emailPengguna.toLowerCase().trim() } : undefined
          ].filter(Boolean) as any
        },
        include: {
          profil: {
            include: {
              paket_keanggotaan: true
            }
          }
        }
      })
    }

    // Ambil daftar paket yang tersedia untuk opsi perpanjangan
    const daftarPaketTersedia = await prisma.paketKeanggotaan.findMany({
      where: { aktif: true },
      orderBy: { harga: 'desc' }
    })

    if (!pengguna || !pengguna.profil) {
      return {
        sukses: true,
        data: null,
        paket_tersedia: daftarPaketTersedia
      }
    }

    const hasilStatus = hitungStatusMember(
      pengguna.profil.tanggal_kadaluwarsa,
      pengguna.aktif ? pengguna.profil.status_keanggotaan : 'NONAKTIF'
    )

    return {
      sukses: true,
      data: {
        id: pengguna.id,
        email: pengguna.email,
        nama_lengkap: pengguna.profil.nama_lengkap,
        nomor_telepon: pengguna.profil.nomor_telepon || '',
        foto_profil: pengguna.profil.foto_profil,
        jenis_kelamin: pengguna.profil.jenis_kelamin || null,
        tanggal_lahir: pengguna.profil.tanggal_lahir ? new Date(pengguna.profil.tanggal_lahir).toISOString().split('T')[0] : null,
        alamat: pengguna.profil.alamat || '',
        paket: pengguna.profil.paket_keanggotaan?.nama_paket || 'Belum Berlangganan',
        id_paket: pengguna.profil.id_paket_keanggotaan,
        kelas_pilihan: pengguna.profil.kelas_pilihan || null,
        durasi_hari: pengguna.profil.paket_keanggotaan?.durasi_hari || 30,
        status: hasilStatus.status,
        apakah_aktif: hasilStatus.apakah_aktif,
        sisa_hari: hasilStatus.sisa_hari,
        keterangan_sisa: hasilStatus.keterangan_sisa,
        tanggal_kadaluwarsa: pengguna.profil.tanggal_kadaluwarsa ? new Date(pengguna.profil.tanggal_kadaluwarsa).toISOString() : null,
        tanggal_kadaluwarsa_teks: hasilStatus.tanggal_kadaluwarsa_teks
      },
      paket_tersedia: daftarPaketTersedia.map((p) => ({
        id: p.id,
        nama_paket: p.nama_paket,
        deskripsi: p.deskripsi,
        harga: Number(p.harga),
        harga_rupiah: new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(Number(p.harga)),
        durasi_hari: p.durasi_hari,
        keuntungan: p.keuntungan
      }))
    }
  } catch (kesalahan: any) {
    console.error('Gagal memuat profil member:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memuat profil member: ${kesalahan.message}`
    })
  }
})
