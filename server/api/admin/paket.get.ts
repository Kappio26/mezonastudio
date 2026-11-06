import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const prisma = inisialisasiPrisma()
    const daftarPaket = await prisma.paketKeanggotaan.findMany({
      include: {
        _count: {
          select: { daftar_profil: true }
        }
      },
      orderBy: { harga: 'desc' }
    })

    return {
      sukses: true,
      data: daftarPaket.map((p) => ({
        id: p.id,
        nama: p.nama_paket,
        nama_paket: p.nama_paket,
        deskripsi: p.deskripsi,
        harga: Number(p.harga),
        harga_rupiah: new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(Number(p.harga)),
        durasi: `${p.durasi_hari} Hari`,
        durasi_hari: p.durasi_hari,
        keuntungan: p.keuntungan,
        total_pengguna: p._count.daftar_profil,
        aktif: p.aktif
      }))
    }
  } catch (kesalahan: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memuat paket keanggotaan: ${kesalahan.message}`
    })
  }
})
