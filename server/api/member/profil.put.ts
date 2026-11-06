import { inisialisasiPrisma } from '~/server/utils/prisma'
import { hitungStatusMember } from '~/server/utils/statusMember'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const {
      id_pengguna,
      email,
      nama_lengkap,
      nomor_telepon,
      foto_profil,
      jenis_kelamin,
      tanggal_lahir,
      alamat,
      kata_sandi_baru
    } = dataTubuh

    if (!id_pengguna && !email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID pengguna atau email wajib disertakan.'
      })
    }

    if (!nama_lengkap || !nama_lengkap.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nama lengkap wajib diisi.'
      })
    }

    const prisma = inisialisasiPrisma()

    // Cari pengguna
    const pengguna = await prisma.pengguna.findFirst({
      where: {
        OR: [
          id_pengguna ? { id: id_pengguna } : undefined,
          email ? { email: email.toLowerCase().trim() } : undefined
        ].filter(Boolean) as any
      },
      include: {
        profil: {
          include: { paket_keanggotaan: true }
        }
      }
    })

    if (!pengguna || !pengguna.profil) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Data pengguna tidak ditemukan.'
      })
    }

    // Persiapkan data pembaruan profil
    const dataUpdateProfil: any = {
      nama_lengkap: nama_lengkap.trim()
    }

    if (nomor_telepon !== undefined) {
      dataUpdateProfil.nomor_telepon = nomor_telepon ? nomor_telepon.trim() : null
    }

    if (alamat !== undefined) {
      dataUpdateProfil.alamat = alamat ? alamat.trim() : null
    }

    // Perbarui foto profil jika disertakan (bisa base64 data URL atau URL gambar)
    if (foto_profil !== undefined) {
      dataUpdateProfil.foto_profil = foto_profil
    }

    // Jenis kelamin jika valid
    if (jenis_kelamin === 'PRIA' || jenis_kelamin === 'WANITA') {
      dataUpdateProfil.jenis_kelamin = jenis_kelamin
    } else if (jenis_kelamin === null || jenis_kelamin === '') {
      dataUpdateProfil.jenis_kelamin = null
    }

    // Tanggal lahir
    if (tanggal_lahir) {
      const parsedTanggal = new Date(tanggal_lahir)
      if (!isNaN(parsedTanggal.getTime())) {
        dataUpdateProfil.tanggal_lahir = parsedTanggal
      }
    } else if (tanggal_lahir === null || tanggal_lahir === '') {
      dataUpdateProfil.tanggal_lahir = null
    }

    // Perbarui profil
    const profilTerbaru = await prisma.profil.update({
      where: { id: pengguna.profil.id },
      data: dataUpdateProfil,
      include: {
        paket_keanggotaan: true
      }
    })

    // Jika member ingin mengganti password
    if (kata_sandi_baru && kata_sandi_baru.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10)
      const kataSandiHash = await bcrypt.hash(kata_sandi_baru.trim(), salt)
      await prisma.pengguna.update({
        where: { id: pengguna.id },
        data: { kata_sandi: kataSandiHash }
      })
    }

    const statusTerbaru = hitungStatusMember(
      profilTerbaru.tanggal_kadaluwarsa,
      pengguna.aktif ? profilTerbaru.status_keanggotaan : 'NONAKTIF'
    )

    return {
      sukses: true,
      pesan: 'Profil berhasil diperbarui!',
      data: {
        id: pengguna.id,
        email: pengguna.email,
        nama_lengkap: profilTerbaru.nama_lengkap,
        nomor_telepon: profilTerbaru.nomor_telepon || '',
        foto_profil: profilTerbaru.foto_profil,
        jenis_kelamin: profilTerbaru.jenis_kelamin,
        tanggal_lahir: profilTerbaru.tanggal_lahir ? profilTerbaru.tanggal_lahir.toISOString().split('T')[0] : null,
        alamat: profilTerbaru.alamat || '',
        paket: profilTerbaru.paket_keanggotaan?.nama_paket || 'Belum Berlangganan',
        id_paket: profilTerbaru.id_paket_keanggotaan,
        durasi_hari: profilTerbaru.paket_keanggotaan?.durasi_hari || 30,
        status: statusTerbaru.status,
        apakah_aktif: statusTerbaru.apakah_aktif,
        sisa_hari: statusTerbaru.sisa_hari,
        keterangan_sisa: statusTerbaru.keterangan_sisa,
        tanggal_kadaluwarsa: profilTerbaru.tanggal_kadaluwarsa ? new Date(profilTerbaru.tanggal_kadaluwarsa).toISOString() : null,
        tanggal_kadaluwarsa_teks: statusTerbaru.tanggal_kadaluwarsa_teks
      }
    }
  } catch (kesalahan: any) {
    console.error('Gagal memperbarui profil member:', kesalahan)
    throw createError({
      statusCode: kesalahan.statusCode || 500,
      statusMessage: kesalahan.statusMessage || `Gagal menyimpan profil: ${kesalahan.message}`
    })
  }
})
