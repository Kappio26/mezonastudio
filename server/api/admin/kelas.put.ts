import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const {
      id,
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
      kategori,
      aktif
    } = dataTubuh

    if (!id || !nama_kelas) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID dan nama kelas wajib diisi.'
      })
    }

    let teksHari = hari ? hari.trim() : undefined
    let tanggalObj: Date | null | undefined = undefined

    if (tanggal !== undefined) {
      if (tanggal) {
        tanggalObj = new Date(tanggal)
        if (!teksHari) {
          teksHari = tanggalObj.toLocaleDateString('id-ID', { weekday: 'long' })
        }
      } else {
        tanggalObj = null
      }
    }

    const prisma = inisialisasiPrisma()

    const kelasDiperbarui = await prisma.kelas.update({
      where: { id },
      data: {
        nama_kelas: nama_kelas.trim(),
        kategori: kategori !== undefined ? (kategori ? kategori.trim() : 'Studio Fitness') : undefined,
        deskripsi: deskripsi !== undefined ? (deskripsi ? deskripsi.trim() : null) : undefined,
        harga: harga !== undefined && harga !== null && !isNaN(Number(harga)) ? Math.max(0, Number(harga)) : undefined,
        id_pelatih: id_pelatih || undefined,
        tanggal: tanggalObj,
        hari: teksHari,
        jam_mulai: jam_mulai ? jam_mulai.trim() : undefined,
        jam_selesai: jam_selesai ? jam_selesai.trim() : undefined,
        kapasitas_maksimal: kapasitas_maksimal ? Number(kapasitas_maksimal) : undefined,
        lokasi_ruangan: lokasi_ruangan ? lokasi_ruangan.trim() : undefined,
        aktif: aktif !== undefined ? Boolean(aktif) : undefined
      },
      include: {
        pelatih: {
          include: { profil: true }
        }
      }
    })

    return {
      sukses: true,
      pesan: `Jadwal kelas ${nama_kelas} berhasil diperbarui!`,
      data: kelasDiperbarui
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal memperbarui kelas:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memperbarui kelas: ${kesalahan.message}`
    })
  }
})
