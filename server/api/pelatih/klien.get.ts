import { inisialisasiPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (peristiwa) => {
  try {
    const kueri = getQuery(peristiwa)
    const idPelatih = (kueri.id || '').toString()
    const emailPelatih = (kueri.email || '').toString()

    const prisma = inisialisasiPrisma()

    // 1. Dapatkan pengguna pelatih
    const pelatih = await prisma.pengguna.findFirst({
      where: {
        OR: [
          idPelatih ? { id: idPelatih } : undefined,
          emailPelatih ? { email: emailPelatih.toLowerCase().trim() } : undefined
        ].filter(Boolean) as any,
        peran: 'PELATIH'
      },
      include: {
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
              }
            }
          }
        }
      }
    })

    if (!pelatih) {
      return { sukses: true, data: [] }
    }

    // 2. Kumpulkan seluruh member unik dari kelas yang diajar
    const mapMember = new Map<string, any>()

    for (const k of pelatih.kelas_diajar) {
      for (const p of k.daftar_pemesanan) {
        const idMember = p.member.id
        if (!mapMember.has(idMember)) {
          mapMember.set(idMember, {
            id: idMember,
            nama: p.member.profil?.nama_lengkap || p.member.email,
            email: p.member.email,
            nomor_telepon: p.member.profil?.nomor_telepon || '-',
            paket: p.member.profil?.paket_keanggotaan?.nama_paket || 'Member Studio',
            kelas_diikuti: [k.nama_kelas],
            total_kehadiran: p.status === 'HADIR' ? 1 : 0
          })
        } else {
          const item = mapMember.get(idMember)
          if (!item.kelas_diikuti.includes(k.nama_kelas)) {
            item.kelas_diikuti.push(k.nama_kelas)
          }
          if (p.status === 'HADIR') {
            item.total_kehadiran += 1
          }
        }
      }
    }

    const daftarKlien = Array.from(mapMember.values())

    return {
      sukses: true,
      data: daftarKlien
    }
  } catch (kesalahan: any) {
    console.error('Gagal memuat klien pelatih:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memuat data klien: ${kesalahan.message}`
    })
  }
})
