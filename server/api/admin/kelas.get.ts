import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const prisma = inisialisasiPrisma()
    const daftarKelas = await prisma.kelas.findMany({
      include: {
        pelatih: {
          include: { profil: true }
        },
        _count: {
          select: {
            daftar_pemesanan: {
              where: {
                status: { in: ['DIKONFIRMASI', 'HADIR', 'MENUNGGU'] }
              }
            }
          }
        }
      },
      orderBy: { dibuat_pada: 'asc' }
    })

    return {
      sukses: true,
      data: daftarKelas.map((k) => {
        let tanggalFormat = ''
        let tanggalTeks = ''

        if (k.tanggal) {
          const tgl = new Date(k.tanggal)
          tanggalFormat = tgl.toISOString().split('T')[0]
          tanggalTeks = tgl.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        }

        return {
          id: k.id,
          nama: k.nama_kelas,
          nama_kelas: k.nama_kelas,
          deskripsi: k.deskripsi || '',
          id_pelatih: k.id_pelatih,
          pelatih: k.pelatih?.profil?.nama_lengkap || 'Instruktur Mezona',
          tanggal: tanggalFormat,
          tanggal_teks: tanggalTeks,
          hari: k.hari,
          jam_mulai: k.jam_mulai,
          jam_selesai: k.jam_selesai,
          jam: `${k.jam_mulai} - ${k.jam_selesai} WIB`,
          ruang: k.lokasi_ruangan,
          kategori: k.kategori || 'Studio Fitness',
          harga: Number(k.harga || 50000),
          harga_rupiah: new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
          }).format(Number(k.harga || 50000)),
          terisi: k._count.daftar_pemesanan,
          kapasitas: k.kapasitas_maksimal,
          aktif: k.aktif,
          status: k.aktif ? 'Aktif' : 'Nonaktif'
        }
      })
    }
  } catch (kesalahan: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memuat data kelas: ${kesalahan.message}`
    })
  }
})
