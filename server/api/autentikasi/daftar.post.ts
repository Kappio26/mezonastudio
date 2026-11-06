import { enkripsiKataSandi, buatTokenJwt } from '~/server/utils/keamanan'
import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const { nama_lengkap, email, surel, kata_sandi, nomor_telepon, jenis_kelamin } = dataTubuh

    const emailMasukan = (surel || email || '').toString().toLowerCase().trim()

    // 1. Validasi input wajib
    if (!nama_lengkap || !emailMasukan || !kata_sandi) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nama lengkap, email, dan kata sandi wajib diisi.'
      })
    }

    if (kata_sandi.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Kata sandi minimal harus terdiri dari 6 karakter.'
      })
    }

    const prisma = inisialisasiPrisma()

    // 2. Cek apakah email sudah terdaftar sebelumnya
    const penggunaSudahAda = await prisma.pengguna.findUnique({
      where: { email: emailMasukan }
    })

    if (penggunaSudahAda) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Alamat email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.'
      })
    }

    // 3. Enkripsi kata sandi
    const hashKataSandi = await enkripsiKataSandi(kata_sandi)

    // 4. Buat entitas Pengguna & Profil melalui transaksi Prisma
    const penggunaBaru = await prisma.$transaction(async (tx) => {
      const pengguna = await tx.pengguna.create({
        data: {
          email: emailMasukan,
          kata_sandi: hashKataSandi,
          peran: 'MEMBER'
        }
      })

      const profil = await tx.profil.create({
        data: {
          id_pengguna: pengguna.id,
          nama_lengkap: nama_lengkap.trim(),
          nomor_telepon: nomor_telepon ? nomor_telepon.trim() : null,
          jenis_kelamin: jenis_kelamin || null,
          status_keanggotaan: 'NONAKTIF'
        }
      })

      return { ...pengguna, profil }
    })

    // 5. Terbitkan Token JWT
    const tokenAkses = buatTokenJwt({
      id: penggunaBaru.id,
      email: penggunaBaru.email,
      peran: penggunaBaru.peran,
      nama_lengkap: penggunaBaru.profil.nama_lengkap
    })

    // 6. Respon sukses
    return {
      sukses: true,
      pesan: 'Pendaftaran member Mezona Studio berhasil! Selamat bergabung.',
      data: {
        token: tokenAkses,
        rute_tujuan: '/member/dasbor',
        pengguna: {
          id: penggunaBaru.id,
          email: penggunaBaru.email,
          peran: penggunaBaru.peran,
          nama_lengkap: penggunaBaru.profil.nama_lengkap,
          nomor_telepon: penggunaBaru.profil.nomor_telepon,
          status_keanggotaan: penggunaBaru.profil.status_keanggotaan
        }
      }
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) {
      throw kesalahan
    }
    console.error('Kesalahan server pada proses pendaftaran:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Terjadi kegagalan pada server saat memproses pendaftaran akun: ${kesalahan.message || kesalahan}`
    })
  }
})
