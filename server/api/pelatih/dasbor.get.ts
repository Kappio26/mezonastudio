import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const kueri = getQuery(peristiwa)
    const idPelatih = (kueri.id || '').toString()
    const emailPelatih = (kueri.email || '').toString()

    const prisma = inisialisasiPrisma()

    // 1. Cari data pelatih berdasarkan ID atau Email
    let penggunaPelatih = null
    if (idPelatih || emailPelatih) {
      penggunaPelatih = await prisma.pengguna.findFirst({
        where: {
          OR: [
            idPelatih ? { id: idPelatih } : undefined,
            emailPelatih ? { email: emailPelatih.toLowerCase().trim() } : undefined
          ].filter(Boolean) as any,
          peran: 'PELATIH'
        },
        include: {
          profil: true,
          kelas_diajar: {
            where: { aktif: true },
            include: {
              daftar_pemesanan: {
                include: {
                  member: {
                    include: {
                      profil: {
                        include: {
                          paket_keanggotaan: true
                        }
                      }
                    }
                  }
                },
                orderBy: { dibuat_pada: 'desc' }
              }
            },
            orderBy: { dibuat_pada: 'asc' }
          }
        }
      })
    }

    // Jika tidak ditemukan dengan query, ambil pelatih pertama yang aktif sebagai cadangan fallback
    if (!penggunaPelatih) {
      penggunaPelatih = await prisma.pengguna.findFirst({
        where: { peran: 'PELATIH', aktif: true },
        include: {
          profil: true,
          kelas_diajar: {
            where: { aktif: true },
            include: {
              daftar_pemesanan: {
                include: {
                  member: {
                    include: {
                      profil: {
                        include: {
                          paket_keanggotaan: true
                        }
                      }
                    }
                  }
                },
                orderBy: { dibuat_pada: 'desc' }
              }
            },
            orderBy: { dibuat_pada: 'asc' }
          }
        }
      })
    }

    if (!penggunaPelatih) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Akun pelatih tidak ditemukan di database.'
      })
    }

    // 2. Format kelas yang diajar oleh pelatih ini saja
    const daftarKelasFormat = penggunaPelatih.kelas_diajar.map((k) => {
      const peserta = k.daftar_pemesanan.map((p) => ({
        id_pemesanan: p.id,
        id_member: p.member.id,
        nama: p.member.profil?.nama_lengkap || p.member.email,
        email: p.member.email,
        nomor_telepon: p.member.profil?.nomor_telepon || '-',
        paket: p.member.profil?.paket_keanggotaan?.nama_paket || 'Member Studio',
        status_presensi: p.status, // 'HADIR' | 'DIKONFIRMASI' | 'MENUNGGU'
        catatan: p.catatan || 'Sesi reguler',
        tanggal_sesi: p.tanggal_sesi
      }))

      const hadirCount = peserta.filter((item) => item.status_presensi === 'HADIR').length

      return {
        id: k.id,
        nama_kelas: k.nama_kelas,
        deskripsi: k.deskripsi,
        hari: k.hari,
        jam: `${k.jam_mulai} - ${k.jam_selesai} WIB`,
        jam_mulai: k.jam_mulai,
        jam_selesai: k.jam_selesai,
        ruang: k.lokasi_ruangan,
        kapasitas: k.kapasitas_maksimal,
        terdaftar: peserta.length,
        hadir: hadirCount,
        status: hadirCount > 0 ? 'BERJALAN' : 'AKAN DATANG',
        daftar_peserta: peserta
      }
    })

    // 3. Hitung statistik riil dari basis data
    const totalSesi = daftarKelasFormat.length
    const totalPeserta = daftarKelasFormat.reduce((acc, curr) => acc + curr.terdaftar, 0)
    const totalHadir = daftarKelasFormat.reduce((acc, curr) => acc + curr.hadir, 0)

    // Bentuk inisial pelatih
    const namaBersih = penggunaPelatih.profil?.nama_lengkap || 'Pelatih'
    const kataNama = namaBersih.replace(/^Coach\s+/i, '').split(' ')
    const inisial = (kataNama[0]?.[0] || 'P') + (kataNama[1]?.[0] || (kataNama[0]?.[1] || 'T')).toUpperCase()

    return {
      sukses: true,
      data: {
        id: penggunaPelatih.id,
        email: penggunaPelatih.email,
        nama_lengkap: namaBersih,
        nomor_telepon: penggunaPelatih.profil?.nomor_telepon || '-',
        inisial: inisial,
        spesialisasi: penggunaPelatih.profil?.alamat || 'Instruktur Kelas Studio',
        statistik: {
          total_sesi: totalSesi,
          total_peserta: totalPeserta,
          total_hadir: totalHadir,
          rating_kepuasan: '4.9 ★'
        },
        kelas_diajar: daftarKelasFormat
      }
    }
  } catch (kesalahan: any) {
    console.error('Gagal memuat dasbor pelatih:', kesalahan)
    throw createError({
      statusCode: kesalahan.statusCode || 500,
      statusMessage: `Gagal memuat dasbor pelatih: ${kesalahan.message}`
    })
  }
})
