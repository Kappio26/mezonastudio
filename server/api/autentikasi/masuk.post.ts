import { verifikasiKataSandi, buatTokenJwt } from '~/server/utils/keamanan'
import { inisialisasiPrisma } from '~/server/utils/prisma'
import { hitungStatusMember } from '~/server/utils/statusMember'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const { surel, email, kata_sandi } = dataTubuh

    // Akomodasi masukan dari variabel 'surel' maupun 'email'
    const emailMasukan = (surel || email || '').toString().toLowerCase().trim()

    // 1. Validasi masukan wajib
    if (!emailMasukan || !kata_sandi) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email dan kata sandi wajib diisi.'
      })
    }

    const prisma = inisialisasiPrisma()

    // Akomodasi alias email (superadmin -> admin, supermember -> member)
    let emailCari = emailMasukan
    if (emailCari === 'superadmin@mezonastudio.com') {
      const cekAda = await prisma.pengguna.findUnique({ where: { email: 'superadmin@mezonastudio.com' } })
      if (!cekAda) emailCari = 'admin@mezonastudio.com'
    } else if (emailCari === 'supermember@mezonastudio.com') {
      const cekAda = await prisma.pengguna.findUnique({ where: { email: 'supermember@mezonastudio.com' } })
      if (!cekAda) emailCari = 'member@mezonastudio.com'
    }

    // 2. Cari pengguna di basis data berdasarkan email
    const pengguna = await prisma.pengguna.findUnique({
      where: { email: emailCari },
      include: {
        profil: {
          include: {
            paket_keanggotaan: true
          }
        }
      }
    })

    if (!pengguna) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Email atau kata sandi yang Anda masukkan salah.'
      })
    }

    // 3. Verifikasi apakah akun dalam status aktif
    if (!pengguna.aktif) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Akun Anda sedang dinonaktifkan. Hubungi admin Mezona Studio.'
      })
    }

    // 4. Verifikasi kecocokan kata sandi
    const sandiCocok = await verifikasiKataSandi(kata_sandi, pengguna.kata_sandi)
    if (!sandiCocok) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Email atau kata sandi yang Anda masukkan salah.'
      })
    }

    const namaLengkap = pengguna.profil?.nama_lengkap || 'Pengguna Mezona'

    // 5. Buat Token JWT
    const tokenAkses = buatTokenJwt({
      id: pengguna.id,
      email: pengguna.email,
      peran: pengguna.peran,
      nama_lengkap: namaLengkap
    })

    // 6. Tentukan rute pengalihan berdasarkan peran pengguna
    let ruteTujuan = '/member/dasbor'
    if (pengguna.peran === 'ADMIN') {
      ruteTujuan = '/admin/dasbor'
    } else if (pengguna.peran === 'PELATIH') {
      ruteTujuan = '/pelatih/dasbor'
    }

    // Hitung status keanggotaan riil (khususnya untuk peran MEMBER)
    const statusKeanggotaanRiil = hitungStatusMember(
      pengguna.profil?.tanggal_kadaluwarsa,
      pengguna.aktif ? pengguna.profil?.status_keanggotaan : 'NONAKTIF'
    )

    return {
      sukses: true,
      pesan: `Selamat datang kembali, ${namaLengkap}!`,
      data: {
        token: tokenAkses,
        rute_tujuan: ruteTujuan,
        pengguna: {
          id: pengguna.id,
          email: pengguna.email,
          peran: pengguna.peran,
          nama_lengkap: namaLengkap,
          foto_profil: pengguna.profil?.foto_profil || null,
          status_keanggotaan: statusKeanggotaanRiil.status,
          apakah_aktif: statusKeanggotaanRiil.apakah_aktif,
          nama_paket: pengguna.profil?.paket_keanggotaan?.nama_paket || 'Belum Berlangganan',
          id_paket: pengguna.profil?.id_paket_keanggotaan || null,
          sisa_hari: statusKeanggotaanRiil.sisa_hari,
          keterangan_sisa: statusKeanggotaanRiil.keterangan_sisa,
          tanggal_kadaluwarsa: pengguna.profil?.tanggal_kadaluwarsa ? new Date(pengguna.profil.tanggal_kadaluwarsa).toISOString() : null,
          tanggal_kadaluwarsa_teks: statusKeanggotaanRiil.tanggal_kadaluwarsa_teks
        }
      }
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) {
      throw kesalahan
    }
    console.error('Kesalahan server pada proses masuk:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Terjadi kegagalan server saat memproses login: ${kesalahan.message || kesalahan}`
    })
  }
})