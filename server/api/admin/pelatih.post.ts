import { enkripsiKataSandi } from '~/server/utils/keamanan'
import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const { nama_lengkap, email, kata_sandi, nomor_telepon, spesialisasi } = dataTubuh

    if (!nama_lengkap || !email || !kata_sandi) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nama lengkap, email, dan kata sandi pelatih wajib diisi.'
      })
    }

    const prisma = inisialisasiPrisma()

    // Cek apakah email sudah terdaftar
    const sudahAda = await prisma.pengguna.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (sudahAda) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email pelatih ini sudah terdaftar di sistem.'
      })
    }

    const hashKataSandi = await enkripsiKataSandi(kata_sandi)

    const pelatihBaru = await prisma.pengguna.create({
      data: {
        email: email.toLowerCase().trim(),
        kata_sandi: hashKataSandi,
        peran: 'PELATIH',
        aktif: true,
        profil: {
          create: {
            nama_lengkap: nama_lengkap.trim(),
            nomor_telepon: nomor_telepon ? nomor_telepon.trim() : null,
            alamat: spesialisasi ? `Spesialisasi: ${spesialisasi.trim()}` : null,
            status_keanggotaan: 'AKTIF'
          }
        }
      },
      include: {
        profil: true
      }
    })

    return {
      sukses: true,
      pesan: `Pelatih ${nama_lengkap} berhasil ditambahkan!`,
      data: {
        id: pelatihBaru.id,
        nama: pelatihBaru.profil?.nama_lengkap,
        email: pelatihBaru.email
      }
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal menambah pelatih:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal menambah pelatih: ${kesalahan.message}`
    })
  }
})
