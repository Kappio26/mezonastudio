import { Capacitor } from '@capacitor/core'

export interface TipePenggunaSesi {
  id: string
  email: string
  peran: 'ADMIN' | 'PELATIH' | 'MEMBER'
  nama_lengkap: string
  foto_profil?: string | null
  status_keanggotaan?: string
  apakah_aktif?: boolean
  nama_paket?: string
  id_paket?: string | null
  sisa_hari?: number
  keterangan_sisa?: string
  tanggal_kadaluwarsa?: string | null
  tanggal_kadaluwarsa_teks?: string
}

export interface TipeNotifikasi {
  pesan: string
  tipe: 'sukses' | 'kesalahan' | 'info'
}

export const useOtentikasi = () => {
  const dataPengguna = useState<TipePenggunaSesi | null>('pengguna_sesi', () => null)
  const tokenAkses = useState<string | null>('token_jwt', () => null)
  const sedangMemuat = useState<boolean>('memuat_otentikasi', () => false)

  // Status Modal Konfirmasi Keluar & Notifikasi Toast
  const modalKeluarTerbuka = useState<boolean>('modal_keluar_terbuka', () => false)
  const notifikasiGlobal = useState<TipeNotifikasi | null>('notifikasi_global', () => null)

  const tampilkanNotifikasi = (pesan: string, tipe: 'sukses' | 'kesalahan' | 'info' = 'sukses', durasiMs = 3500) => {
    notifikasiGlobal.value = { pesan, tipe }
    if (import.meta.client) {
      setTimeout(() => {
        if (notifikasiGlobal.value?.pesan === pesan) {
          notifikasiGlobal.value = null
        }
      }, durasiMs)
    }
  }

  const bukaKonfirmasiKeluar = () => {
    modalKeluarTerbuka.value = true
  }

  const tutupKonfirmasiKeluar = () => {
    modalKeluarTerbuka.value = false
  }

  // Inisialisasi status sesi dari Cookie & LocalStorage saat klien aktif
  const inisialisasiSesi = () => {
    const cookieToken = useCookie<string | null>('mezona_token', { maxAge: 60 * 60 * 24 * 7, path: '/' })
    const cookiePengguna = useCookie<TipePenggunaSesi | null>('mezona_pengguna', { maxAge: 60 * 60 * 24 * 7, path: '/' })

    if (cookieToken.value && cookiePengguna.value) {
      tokenAkses.value = cookieToken.value
      dataPengguna.value = cookiePengguna.value
    }

    if (import.meta.client) {
      const tokenTersimpan = localStorage.getItem('mezona_token')
      const penggunaTersimpan = localStorage.getItem('mezona_pengguna')
      if (tokenTersimpan && penggunaTersimpan) {
        try {
          tokenAkses.value = tokenTersimpan
          dataPengguna.value = JSON.parse(penggunaTersimpan)
          cookieToken.value = tokenTersimpan
          cookiePengguna.value = dataPengguna.value
        } catch {
          keluar()
        }
      } else if (!cookieToken.value) {
        tokenAkses.value = null
        dataPengguna.value = null
      }
    }
  }

  // Menentukan alamat dasbor berdasarkan hak peran
  const dapatkanRuteSesuaiPeran = (peran?: string): string => {
    switch (peran) {
      case 'ADMIN':
        return '/admin/dasbor'
      case 'PELATIH':
        return '/pelatih/dasbor'
      case 'MEMBER':
      default:
        return '/member/dasbor'
    }
  }

  // Utilitas resolusi URL API backend untuk HP Native (Capacitor)
  const dapatkanUrlBackend = (endpoint: string) => {
    if (endpoint.startsWith('http')) return endpoint
    if (import.meta.client && Capacitor.isNativePlatform()) {
      const host = localStorage.getItem('mezona_api_host') || 'http://192.168.1.3:3012'
      return `${host.replace(/\/$/, '')}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
    }
    return endpoint
  }

  // Fungsi proses masuk / login tunggal
  const prosesMasuk = async (email: string, kata_sandi: string) => {
    sedangMemuat.value = true
    const targetUrl = dapatkanUrlBackend('/api/autentikasi/masuk')
    try {
      const respon: any = await $fetch(targetUrl, {
        method: 'POST',
        body: { surel: email, email, kata_sandi }
      })

      if (respon.sukses && respon.data) {
        tokenAkses.value = respon.data.token
        dataPengguna.value = respon.data.pengguna

        const cookieToken = useCookie<string | null>('mezona_token', { maxAge: 60 * 60 * 24 * 7, path: '/' })
        const cookiePengguna = useCookie<any>('mezona_pengguna', { maxAge: 60 * 60 * 24 * 7, path: '/' })
        cookieToken.value = respon.data.token
        cookiePengguna.value = respon.data.pengguna

        if (import.meta.client) {
          localStorage.setItem('mezona_token', respon.data.token)
          localStorage.setItem('mezona_pengguna', JSON.stringify(respon.data.pengguna))
        }

        const ruteTujuan = respon.data.rute_tujuan || dapatkanRuteSesuaiPeran(respon.data.pengguna.peran)
        return {
          sukses: true,
          pesan: respon.pesan,
          rute_tujuan: ruteTujuan,
          pengguna: respon.data.pengguna
        }
      }
      return { sukses: false, pesan: respon.pesan || 'Login gagal.' }
    } catch (kesalahan: any) {
      // Fallback akun demo cerdas: Jika koneksi server gagal / offline pada HP native
      const em = email.toLowerCase().trim()
      if (em === 'member@mezonastudio.com' && kata_sandi === 'MemberMezona2026!') {
        const demoData = {
          token: 'demo_token_jwt_member_2026',
          rute_tujuan: '/member/dasbor',
          pengguna: {
            id: 'demo-member-1',
            email: 'member@mezonastudio.com',
            peran: 'MEMBER' as const,
            nama_lengkap: 'Siti Rahma (Demo Member)',
            foto_profil: null,
            status_keanggotaan: 'AKTIF',
            apakah_aktif: true,
            nama_paket: 'Paket Unlimited Bulanan',
            id_paket: 'paket-unlimited-1',
            sisa_hari: 24,
            keterangan_sisa: '24 Hari Lagi',
            tanggal_kadaluwarsa: new Date(Date.now() + 24 * 86400000).toISOString(),
            tanggal_kadaluwarsa_teks: '24 Nov 2026'
          }
        }
        tokenAkses.value = demoData.token
        dataPengguna.value = demoData.pengguna
        if (import.meta.client) {
          localStorage.setItem('mezona_token', demoData.token)
          localStorage.setItem('mezona_pengguna', JSON.stringify(demoData.pengguna))
        }
        return {
          sukses: true,
          pesan: 'Berhasil masuk dengan Akun Member Demo',
          rute_tujuan: '/member/dasbor',
          pengguna: demoData.pengguna
        }
      } else if (em === 'pelatih@mezonastudio.com' && kata_sandi === 'PelatihMezona2026!') {
        const demoData = {
          token: 'demo_token_jwt_pelatih_2026',
          rute_tujuan: '/pelatih/dasbor',
          pengguna: {
            id: 'demo-pelatih-1',
            email: 'pelatih@mezonastudio.com',
            peran: 'PELATIH' as const,
            nama_lengkap: 'Coach Tania Putri (Demo)',
            foto_profil: null,
            status_keanggotaan: 'AKTIF',
            apakah_aktif: true,
            nama_paket: 'Instruktur Spesialis',
            id_paket: null,
            sisa_hari: 365,
            keterangan_sisa: 'Aktif',
            tanggal_kadaluwarsa: null,
            tanggal_kadaluwarsa_teks: 'Permanen'
          }
        }
        tokenAkses.value = demoData.token
        dataPengguna.value = demoData.pengguna
        if (import.meta.client) {
          localStorage.setItem('mezona_token', demoData.token)
          localStorage.setItem('mezona_pengguna', JSON.stringify(demoData.pengguna))
        }
        return {
          sukses: true,
          pesan: 'Berhasil masuk dengan Akun Pelatih Demo',
          rute_tujuan: '/pelatih/dasbor',
          pengguna: demoData.pengguna
        }
      }

      const pesanError = kesalahan.data?.statusMessage || kesalahan.message || 'Gagal terhubung ke server backend Mezona. Pastikan server aktif di http://192.168.1.3:3012'
      return { sukses: false, pesan: pesanError }
    } finally {
      sedangMemuat.value = false
    }
  }

  // Fungsi proses pendaftaran member baru
  const prosesDaftar = async (dataForm: {
    nama_lengkap: string
    email: string
    kata_sandi: string
    nomor_telepon?: string
    jenis_kelamin?: string
  }) => {
    sedangMemuat.value = true
    try {
      const respon: any = await $fetch('/api/autentikasi/daftar', {
        method: 'POST',
        body: dataForm
      })

      if (respon.sukses && respon.data) {
        tokenAkses.value = respon.data.token
        dataPengguna.value = respon.data.pengguna

        const cookieToken = useCookie<string | null>('mezona_token', { maxAge: 60 * 60 * 24 * 7, path: '/' })
        const cookiePengguna = useCookie<any>('mezona_pengguna', { maxAge: 60 * 60 * 24 * 7, path: '/' })
        cookieToken.value = respon.data.token
        cookiePengguna.value = respon.data.pengguna

        if (import.meta.client) {
          localStorage.setItem('mezona_token', respon.data.token)
          localStorage.setItem('mezona_pengguna', JSON.stringify(respon.data.pengguna))
        }

        return {
          sukses: true,
          pesan: respon.pesan,
          rute_tujuan: '/member/dasbor',
          pengguna: respon.data.pengguna
        }
      }
      return { sukses: false, pesan: respon.pesan || 'Pendaftaran gagal.' }
    } catch (kesalahan: any) {
      const pesanError = kesalahan.data?.statusMessage || kesalahan.message || 'Gagal memproses pendaftaran.'
      return { sukses: false, pesan: pesanError }
    } finally {
      sedangMemuat.value = false
    }
  }

  // Keluar / Logout langsung dengan replace history
  const keluar = async () => {
    tokenAkses.value = null
    dataPengguna.value = null

    const cookieToken = useCookie<string | null>('mezona_token', { path: '/' })
    const cookiePengguna = useCookie<any>('mezona_pengguna', { path: '/' })
    cookieToken.value = null
    cookiePengguna.value = null

    if (import.meta.client) {
      localStorage.removeItem('mezona_token')
      localStorage.removeItem('mezona_pengguna')
      sessionStorage.clear()
    }

    // Menggunakan replace: true agar rute dasbor digantikan oleh /masuk dalam history
    await navigateTo('/masuk', { replace: true })
  }

  // Keluar dengan konfirmasi
  const konfirmasiDanKeluar = async () => {
    modalKeluarTerbuka.value = false
    tampilkanNotifikasi('Anda telah keluar dari akun.', 'info')
    await keluar()
  }

  // Memperbarui data pengguna di state sesi dan localStorage secara reaktif
  const perbaruiDataSesi = (dataBaru: Partial<TipePenggunaSesi>) => {
    if (dataPengguna.value) {
      dataPengguna.value = { ...dataPengguna.value, ...dataBaru }
      const cookiePengguna = useCookie<any>('mezona_pengguna', { maxAge: 60 * 60 * 24 * 7, path: '/' })
      cookiePengguna.value = dataPengguna.value

      if (import.meta.client) {
        localStorage.setItem('mezona_pengguna', JSON.stringify(dataPengguna.value))
      }
    }
  }

  return {
    dataPengguna,
    tokenAkses,
    sedangMemuat,
    modalKeluarTerbuka,
    notifikasiGlobal,
    apakahOtentikasi: computed(() => !!tokenAkses.value),
    inisialisasiSesi,
    perbaruiDataSesi,
    dapatkanRuteSesuaiPeran,
    prosesMasuk,
    prosesDaftar,
    keluar,
    bukaKonfirmasiKeluar,
    tutupKonfirmasiKeluar,
    konfirmasiDanKeluar,
    tampilkanNotifikasi
  }
}
