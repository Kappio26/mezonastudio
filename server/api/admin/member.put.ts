import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const { id, nama_lengkap, nomor_telepon, status_keanggotaan, id_paket_keanggotaan, kelas_pilihan } = dataTubuh

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID member wajib disertakan.'
      })
    }

    const prisma = inisialisasiPrisma()

    const memberLama = await prisma.pengguna.findUnique({
      where: { id },
      include: { profil: true }
    })

    if (!memberLama) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Member tidak ditemukan.'
      })
    }

    const dataUpdatePengguna: any = {}
    const dataUpdateProfil: any = {}

    if (nama_lengkap !== undefined) {
      dataUpdateProfil.nama_lengkap = nama_lengkap ? nama_lengkap.trim() : memberLama.profil?.nama_lengkap
    }
    if (nomor_telepon !== undefined) {
      dataUpdateProfil.nomor_telepon = nomor_telepon ? nomor_telepon.trim() : null
    }
    if (id_paket_keanggotaan !== undefined) {
      dataUpdateProfil.id_paket_keanggotaan = id_paket_keanggotaan || null
    }
    if (kelas_pilihan !== undefined) {
      dataUpdateProfil.kelas_pilihan = kelas_pilihan ? kelas_pilihan.trim() : null
    }

    if (status_keanggotaan) {
      dataUpdateProfil.status_keanggotaan = status_keanggotaan
      if (status_keanggotaan === 'AKTIF') {
        dataUpdatePengguna.aktif = true
        // Jika belum ada tanggal kadaluwarsa atau sudah kadaluwarsa, beri masa aktif 30 hari ke depan
        const sekarang = new Date()
        if (!memberLama.profil?.tanggal_kadaluwarsa || new Date(memberLama.profil.tanggal_kadaluwarsa) <= sekarang) {
          const tglBaru = new Date(sekarang)
          tglBaru.setDate(tglBaru.getDate() + 30)
          dataUpdateProfil.tanggal_kadaluwarsa = tglBaru
        }
      } else if (status_keanggotaan === 'KADALUWARSA') {
        dataUpdatePengguna.aktif = true
        // Set tanggal kadaluwarsa menjadi kemarin agar perhitungan status konsisten KADALUWARSA
        const tglKemarin = new Date()
        tglKemarin.setDate(tglKemarin.getDate() - 1)
        dataUpdateProfil.tanggal_kadaluwarsa = tglKemarin
      } else if (status_keanggotaan === 'NONAKTIF') {
        dataUpdatePengguna.aktif = false
      }
    }

    const pengguna = await prisma.pengguna.update({
      where: { id },
      data: {
        ...dataUpdatePengguna,
        profil: {
          update: dataUpdateProfil
        }
      },
      include: {
        profil: true
      }
    })

    return {
      sukses: true,
      pesan: `Data member ${pengguna.profil?.nama_lengkap} berhasil diperbarui!`,
      data: pengguna
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal memperbarui member:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memperbarui member: ${kesalahan.message}`
    })
  }
})
