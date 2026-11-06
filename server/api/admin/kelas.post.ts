import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const {
      nama_kelas,
      deskripsi,
      id_pelatih,
      tanggal,
      hari,
      jam_mulai,
      jam_selesai,
      kapasitas_maksimal,
      lokasi_ruangan,
      harga,
      kategori
    } = dataTubuh

    if (!nama_kelas || !id_pelatih || !jam_mulai || !jam_selesai) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nama kelas, pelatih, jam mulai, dan jam selesai wajib diisi.'
      })
    }

    // Tentukan hari otomatis dari tanggal jika hari tidak diisi
    let teksHari = (hari || '').trim()
    let tanggalObj: Date | null = null
    if (tanggal) {
      tanggalObj = new Date(tanggal)
      if (!teksHari) {
        teksHari = tanggalObj.toLocaleDateString('id-ID', { weekday: 'long' })
      }
    } else if (!teksHari) {
      teksHari = 'Senin & Kamis'
    }

    const prisma = inisialisasiPrisma()

    // Verifikasi apakah pelatih valid
    const pelatihAda = await prisma.pengguna.findFirst({
      where: { id: id_pelatih, peran: 'PELATIH' }
    })

    if (!pelatihAda) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Pelatih yang dipilih tidak valid atau tidak ditemukan.'
      })
    }

    const nominalHarga = harga !== undefined && harga !== null && !isNaN(Number(harga))
      ? Math.max(0, Number(harga))
      : 50000

    const kelasBaru = await prisma.kelas.create({
      data: {
        nama_kelas: nama_kelas.trim(),
        kategori: kategori ? kategori.trim() : 'Studio Fitness',
        deskripsi: deskripsi ? deskripsi.trim() : null,
        harga: nominalHarga,
        id_pelatih,
        tanggal: tanggalObj,
        hari: teksHari,
        jam_mulai: jam_mulai.trim(),
        jam_selesai: jam_selesai.trim(),
        kapasitas_maksimal: kapasitas_maksimal ? Number(kapasitas_maksimal) : 20,
        lokasi_ruangan: lokasi_ruangan ? lokasi_ruangan.trim() : 'Studio Utama',
        aktif: true
      },
      include: {
        pelatih: {
          include: { profil: true }
        }
      }
    })

    return {
      sukses: true,
      pesan: `Kelas ${nama_kelas} berhasil ditambahkan ke jadwal!`,
      data: kelasBaru
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal menambah kelas:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal menambah kelas: ${kesalahan.message}`
    })
  }
})
