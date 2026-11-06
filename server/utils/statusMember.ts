// Utilitas Penentu Status Keanggotaan Member Mezona Studio
// Menentukan apakah member AKTIF atau KADALUWARSA berdasarkan tanggal kadaluwarsa sebulan (30 hari).

export interface HasilStatusMember {
  status: 'AKTIF' | 'KADALUWARSA' | 'NONAKTIF'
  sisa_hari: number
  keterangan_sisa: string
  apakah_aktif: boolean
  tanggal_kadaluwarsa_teks: string
}

export function hitungStatusMember(tanggalKadaluwarsa: Date | string | null | undefined, statusDb?: string): HasilStatusMember {
  if (statusDb === 'NONAKTIF') {
    return {
      status: 'NONAKTIF',
      sisa_hari: 0,
      keterangan_sisa: 'Akun Dinonaktifkan',
      apakah_aktif: false,
      tanggal_kadaluwarsa_teks: '-'
    }
  }

  if (!tanggalKadaluwarsa) {
    return {
      status: 'KADALUWARSA',
      sisa_hari: 0,
      keterangan_sisa: 'Belum Memiliki Paket',
      apakah_aktif: false,
      tanggal_kadaluwarsa_teks: 'Belum Berlangganan'
    }
  }

  const sekarang = new Date()
  const tglExp = new Date(tanggalKadaluwarsa)

  // Hitung selisih dalam milidetik dan konversi ke hari
  const selisihWaktu = tglExp.getTime() - sekarang.getTime()
  const sisaHari = Math.ceil(selisihWaktu / (1000 * 60 * 60 * 24))

  const tanggalFormat = tglExp.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  if (sisaHari > 0) {
    return {
      status: 'AKTIF',
      sisa_hari: sisaHari,
      keterangan_sisa: sisaHari === 1 ? 'Aktif Hari Ini (1 Hari)' : `Sisa ${sisaHari} Hari`,
      apakah_aktif: true,
      tanggal_kadaluwarsa_teks: tanggalFormat
    }
  } else {
    const hariTerlewat = Math.abs(sisaHari)
    return {
      status: 'KADALUWARSA',
      sisa_hari: sisaHari,
      keterangan_sisa: hariTerlewat === 0 ? 'Habis Hari Ini' : `Kadaluwarsa ${hariTerlewat} Hari Lalu`,
      apakah_aktif: false,
      tanggal_kadaluwarsa_teks: tanggalFormat
    }
  }
}
