import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const kueri = getQuery(peristiwa)
    const dataTubuh = peristiwa.node.req.method !== 'GET' ? await readBody(peristiwa).catch(() => ({})) : {}
    const id = (kueri.id || dataTubuh?.id) as string

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID paket yang akan dihapus wajib disertakan.'
      })
    }

    const prisma = inisialisasiPrisma()

    const paket = await prisma.paketKeanggotaan.findUnique({
      where: { id }
    })

    if (!paket) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Paket keanggotaan tidak ditemukan.'
      })
    }

    // Lepas relasi id_paket_keanggotaan pada profil member yang memakainya
    await prisma.profil.updateMany({
      where: { id_paket_keanggotaan: id },
      data: { id_paket_keanggotaan: null }
    })

    await prisma.paketKeanggotaan.delete({
      where: { id }
    })

    return {
      sukses: true,
      pesan: `Paket ${paket.nama_paket} berhasil dihapus.`
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal menghapus paket:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal menghapus paket: ${kesalahan.message}`
    })
  }
})
