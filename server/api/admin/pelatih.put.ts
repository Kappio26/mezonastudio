import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const { id, nama_lengkap, nomor_telepon, spesialisasi, aktif } = dataTubuh

    if (!id || !nama_lengkap) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID dan nama lengkap pelatih wajib diisi.'
      })
    }

    const prisma = inisialisasiPrisma()

    const pelatih = await prisma.pengguna.update({
      where: { id },
      data: {
        aktif: aktif !== undefined ? Boolean(aktif) : true,
        profil: {
          update: {
            nama_lengkap: nama_lengkap.trim(),
            nomor_telepon: nomor_telepon ? nomor_telepon.trim() : null,
            alamat: spesialisasi ? `Spesialisasi: ${spesialisasi.trim()}` : undefined
          }
        }
      },
      include: {
        profil: true
      }
    })

    return {
      sukses: true,
      pesan: `Data pelatih ${nama_lengkap} berhasil diperbarui!`,
      data: pelatih
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal memperbarui data pelatih:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memperbarui pelatih: ${kesalahan.message}`
    })
  }
})
