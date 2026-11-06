import { inisialisasiPrisma } from '~/server/utils/prisma'
import { hitungStatusMember } from '~/server/utils/statusMember'

export default defineEventHandler(async (peristiwa) => {
  try {
    const kueri = getQuery(peristiwa)
    const idMember = (kueri.id || '').toString()
    const emailMember = (kueri.email || '').toString()

    const prisma = inisialisasiPrisma()

    // 1. Ambil data pengguna member jika ada untuk mengecek status dan pemesanan aktif
    let pengguna = null
    if (idMember || emailMember) {
      pengguna = await prisma.pengguna.findFirst({
        where: {
          OR: [
            idMember ? { id: idMember } : undefined,
            emailMember ? { email: emailMember.toLowerCase().trim() } : undefined
          ].filter(Boolean) as any
        },
        include: {
          profil: {
            include: { paket_keanggotaan: true }
          },
          pemesanan_kelas_saya: {
            where: {
              status: { in: ['DIKONFIRMASI', 'HADIR', 'MENUNGGU'] }
            }
          }
        }
      })
    }

    const idPemesananMember = new Map<string, string>()
    if (pengguna?.pemesanan_kelas_saya) {
      for (const p of pengguna.pemesanan_kelas_saya) {
        idPemesananMember.set(p.id_kelas, p.id)
      }
    }

    const statusKeanggotaan = hitungStatusMember(
      pengguna?.profil?.tanggal_kadaluwarsa,
      pengguna?.aktif ? pengguna?.profil?.status_keanggotaan : 'NONAKTIF'
    )

    // Deteksi jenis paket member
    const namaPaketMember = pengguna?.profil?.paket_keanggotaan?.nama_paket || ''
    const isVip = statusKeanggotaan.apakah_aktif && namaPaketMember.toLowerCase().includes('vip')
    const isStudio = statusKeanggotaan.apakah_aktif && (namaPaketMember.toLowerCase().includes('kelas studio') || namaPaketMember.toLowerCase().includes('studio'))
    const isDaily = statusKeanggotaan.apakah_aktif && (namaPaketMember.toLowerCase().includes('daily') || namaPaketMember.toLowerCase().includes('harian'))
    const kelasPilihanMember = (pengguna?.profil?.kelas_pilihan || '').trim()

    // 2. Ambil seluruh kelas resmi yang aktif dari basis data (sinkron 100% dengan admin)
    const daftarKelasDb = await prisma.kelas.findMany({
      where: { aktif: true },
      include: {
        pelatih: {
          include: { profil: true }
        },
        daftar_pemesanan: {
          where: {
            status: { in: ['DIKONFIRMASI', 'HADIR', 'MENUNGGU'] }
          }
        }
      },
      orderBy: { dibuat_pada: 'asc' }
    })

    // Hitung durasi menit dari jam_mulai dan jam_selesai
    const hitungDurasiMenit = (mulai: string, selesai: string): string => {
      try {
        const [jm, mm] = mulai.split(':').map(Number)
        const [js, ms] = selesai.split(':').map(Number)
        const totalMenit = (js * 60 + ms) - (jm * 60 + mm)
        return totalMenit > 0 ? `${totalMenit} Menit` : '60 Menit'
      } catch {
        return '60 Menit'
      }
    }

    const dataKelas = daftarKelasDb.map((k) => {
      const terisi = k.daftar_pemesanan.length
      const kapasitas = k.kapasitas_maksimal
      const sisaKursi = Math.max(0, kapasitas - terisi)
      const sudahDipesan = idPemesananMember.has(k.id)
      const idPemesananSaya = idPemesananMember.get(k.id) || null

      let kategori = k.kategori || 'Studio Fitness'
      const namaKecil = k.nama_kelas.toLowerCase()
      if (!k.kategori) {
        if (namaKecil.includes('zumba')) kategori = 'Zumba'
        else if (namaKecil.includes('yoga')) kategori = 'Yoga'
        else if (namaKecil.includes('pomfit') || namaKecil.includes('pound')) kategori = 'Poundfit'
      }

      const nominalHarga = Number(k.harga || 50000)
      const hargaRupiah = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(nominalHarga)

      let tanggalTeks = ''
      if (k.tanggal) {
        tanggalTeks = new Date(k.tanggal).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      }

      const jadwalTeks = tanggalTeks
        ? `${tanggalTeks} (${k.jam_mulai} - ${k.jam_selesai} WIB)`
        : `${k.hari}, ${k.jam_mulai} WIB`

      // Evaluasi apakah kelas ini GRATIS / TERMASUK dalam paket member
      let apakahTermasukPaket = false
      let keteranganBiaya = `Tarif Kelas: ${hargaRupiah}`
      let biayaTambahan = nominalHarga

      if (isVip) {
        // VIP All Access: BEBAS semua kelas tanpa biaya tambahan
        apakahTermasukPaket = true
        keteranganBiaya = 'Gratis (Termasuk Paket VIP All Access)'
        biayaTambahan = 0
      } else if (isStudio) {
        // Paket Kelas Studio: Hanya 1 kelas pilihan yang termasuk
        const cocokKelasPilihan = kelasPilihanMember && (
          namaKecil.includes(kelasPilihanMember.toLowerCase()) ||
          kategori.toLowerCase().includes(kelasPilihanMember.toLowerCase())
        )

        if (cocokKelasPilihan) {
          apakahTermasukPaket = true
          keteranganBiaya = `Gratis (Pilihan Paket Studio: ${kelasPilihanMember})`
          biayaTambahan = 0
        } else if (!kelasPilihanMember) {
          // Jika member belum menentukan kelas pilihan utamanya, kelas pertama yang dipilih bisa jadi kelas utamanya
          apakahTermasukPaket = true
          keteranganBiaya = 'Gratis (Klaim sebagai 1 Kelas Pilihan Studio)'
          biayaTambahan = 0
        } else {
          // Kelas lain di luar kelas pilihannya -> bayar sesuai harga kelas
          apakahTermasukPaket = false
          keteranganBiaya = `Kelas Tambahan (${hargaRupiah})`
          biayaTambahan = nominalHarga
        }
      } else if (isDaily) {
        // Daily Pass: Bebas 1 sesi kelas
        const jumlahPemesananHariIni = pengguna?.pemesanan_kelas_saya?.length || 0
        if (jumlahPemesananHariIni === 0 || sudahDipesan) {
          apakahTermasukPaket = true
          keteranganBiaya = 'Gratis (1 Sesi Daily Pass Hari Ini)'
          biayaTambahan = 0
        } else {
          apakahTermasukPaket = false
          keteranganBiaya = `Kelas Tambahan (${hargaRupiah})`
          biayaTambahan = nominalHarga
        }
      }

      return {
        id: k.id,
        nama: k.nama_kelas,
        deskripsi: k.deskripsi || '',
        kategori,
        harga: nominalHarga,
        harga_rupiah: hargaRupiah,
        apakah_termasuk_paket: apakahTermasukPaket,
        keterangan_biaya: keteranganBiaya,
        biaya_tambahan: biayaTambahan,
        id_pelatih: k.id_pelatih,
        pelatih: k.pelatih?.profil?.nama_lengkap || 'Instruktur Mezona',
        tanggal: k.tanggal ? new Date(k.tanggal).toISOString().split('T')[0] : null,
        tanggal_teks: tanggalTeks,
        hari: k.hari,
        jam_mulai: k.jam_mulai,
        jam_selesai: k.jam_selesai,
        jadwal: jadwalTeks,
        durasi: hitungDurasiMenit(k.jam_mulai, k.jam_selesai),
        ruang: k.lokasi_ruangan,
        kapasitas: kapasitas,
        terisi: terisi,
        sisa_kursi: sisaKursi,
        apakah_penuh: sisaKursi <= 0,
        sudah_dipesan: sudahDipesan,
        id_pemesanan_saya: idPemesananSaya
      }
    })

    return {
      sukses: true,
      data: dataKelas,
      status_member: {
        apakah_aktif: statusKeanggotaan.apakah_aktif,
        status: statusKeanggotaan.status,
        keterangan: statusKeanggotaan.keterangan_sisa,
        nama_paket: namaPaketMember || 'Belum Berlangganan',
        apakah_vip: isVip,
        apakah_studio: isStudio,
        apakah_daily: isDaily,
        kelas_pilihan: kelasPilihanMember || null
      }
    }
  } catch (kesalahan: any) {
    console.error('Gagal memuat kelas member:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memuat daftar kelas: ${kesalahan.message}`
    })
  }
})
