<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'seluler',
  alias: ['/member/dashboard']
})

const { dataPengguna, inisialisasiSesi, perbaruiDataSesi, tampilkanNotifikasi } = useOtentikasi()

interface InfoProfilMember {
  id: string
  email: string
  nama_lengkap: string
  paket: string
  id_paket: string | null
  kelas_pilihan?: string | null
  durasi_hari: number
  status: 'AKTIF' | 'KADALUWARSA' | 'NONAKTIF'
  apakah_aktif: boolean
  sisa_hari: number
  keterangan_sisa: string
  tanggal_kadaluwarsa: string | null
  tanggal_kadaluwarsa_teks: string
}

interface PaketTersedia {
  id: string
  nama_paket: string
  deskripsi: string
  harga: number
  harga_rupiah: string
  durasi_hari: number
  keuntungan: string[]
}

interface KelasMendatangItem {
  id: string
  id_kelas: string
  nama_kelas: string
  pelatih: string
  hari_tanggal: string
  ruangan: string
  status: string
}

interface RiwayatPembayaranItem {
  id: string
  nomor_invoice: string
  nama_paket: string
  durasi_hari: number
  jumlah_bayar: number
  jumlah_bayar_rupiah: string
  metode_pembayaran: string
  bukti_pembayaran: string
  status: 'MENUNGGU_KONFIRMASI' | 'DISETUJUI' | 'DITOLAK'
  catatan_member: string | null
  catatan_admin: string | null
  tanggal_konfirmasi: string | null
  dibuat_pada: string
  dibuat_pada_teks: string
}

const sedangMemuat = ref(true)
const sedangKirimBukti = ref(false)
const profilMember = ref<InfoProfilMember | null>(null)
const daftarPaket = ref<PaketTersedia[]>([])

// Status Pembayaran & Verifikasi Admin
const adaPembayaranMenunggu = ref(false)
const pembayaranMenunggu = ref<any>(null)
const pembayaranDitolakTerbaru = ref<RiwayatPembayaranItem | null>(null)
const daftarRiwayatPembayaran = ref<RiwayatPembayaranItem[]>([])
const tampilkanRiwayat = ref(false)

// Modal States
const modalPerpanjangTerbuka = ref(false)
const modalQrTerbuka = ref(false)
const modalDetailBuktiTerbuka = ref(false)
const buktiTerpilihUntukZoom = ref<string>('')
const paketDipilih = ref<string>('')
const kelasPilihanStudio = ref<'Zumba' | 'Yoga' | 'Poundfit'>('Zumba')
const metodePembayaranDipilih = ref<'QRIS Studio Mezona' | 'Transfer Bank BCA' | 'Transfer Bank Mandiri'>('Transfer Bank BCA')
const buktiPembayaranBase64 = ref<string>('')
const buktiPembayaranNamaFile = ref<string>('')
const catatanMemberInput = ref<string>('')
const inputUploadFile = ref<HTMLInputElement | null>(null)

const statistikMember = ref([
  { label: 'Status Member', nilai: 'AKTIF', ikon: '⭐' },
  { label: 'Kelas Diikuti', nilai: '0 Sesi', ikon: '🏋️' },
  { label: 'Sisa Durasi', nilai: '30 Hari', ikon: '⏳' }
])

const kelasMendatang = ref<KelasMendatangItem[]>([])

// Rekening Bank Resmi Studio Mezona
const dataRekeningStudio = {
  bca: {
    bank: 'Bank BCA',
    nomor: '8735091234',
    nomor_format: '8735-0912-34',
    atas_nama: 'Mezona Studio Fitness'
  },
  mandiri: {
    bank: 'Bank Mandiri',
    nomor: '1370098765432',
    nomor_format: '137-00-9876543-2',
    atas_nama: 'Mezona Studio'
  }
}

// Salin nomor rekening ke clipboard
const salinNomorRekening = (nomor: string, namaBank: string) => {
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(nomor)
    tampilkanNotifikasi(`Nomor rekening ${namaBank} berhasil disalin!`, 'sukses', 2500)
  }
}

// Paket terpilih saat ini
const paketDipilihObj = computed(() => {
  return daftarPaket.value.find((p) => p.id === paketDipilih.value) || daftarPaket.value[0] || null
})

// Memuat status riwayat pembayaran member
const muatRiwayatPembayaran = async () => {
  try {
    const params = new URLSearchParams()
    if (dataPengguna.value?.id) params.append('id', dataPengguna.value.id)
    if (dataPengguna.value?.email) params.append('email', dataPengguna.value.email)

    const res: any = await $fetch(`/api/member/pembayaran?${params.toString()}`)
    if (res.sukses) {
      adaPembayaranMenunggu.value = res.ada_menunggu
      pembayaranMenunggu.value = res.pembayaran_menunggu
      daftarRiwayatPembayaran.value = res.daftar || []

      // Cek apakah ada pembayaran terakhir yang ditolak admin
      const pembayaranTerakhir = res.daftar && res.daftar.length > 0 ? res.daftar[0] : null
      if (pembayaranTerakhir && pembayaranTerakhir.status === 'DITOLAK') {
        pembayaranDitolakTerbaru.value = pembayaranTerakhir
      } else {
        pembayaranDitolakTerbaru.value = null
      }
    }
  } catch (err: any) {
    console.error('Gagal mengambil riwayat pembayaran:', err)
  }
}

// Memuat status keanggotaan riil dari database
const muatDataMember = async () => {
  inisialisasiSesi()
  sedangMemuat.value = true
  try {
    const params = new URLSearchParams()
    if (dataPengguna.value?.id) params.append('id', dataPengguna.value.id)
    if (dataPengguna.value?.email) params.append('email', dataPengguna.value.email)

    const [res, resJadwal] = await Promise.all([
      $fetch(`/api/member/profil?${params.toString()}`),
      $fetch(`/api/member/jadwal-saya?${params.toString()}`).catch(() => ({ sukses: false, data: [] })),
      muatRiwayatPembayaran()
    ]) as [any, any, any]

    if (res.sukses) {
      if (res.data) {
        profilMember.value = res.data
        // Sinkronisasi data sesi lokal jika ada perbedaan
        perbaruiDataSesi({
          status_keanggotaan: res.data.status,
          apakah_aktif: res.data.apakah_aktif,
          nama_paket: res.data.paket,
          id_paket: res.data.id_paket,
          sisa_hari: res.data.sisa_hari,
          keterangan_sisa: res.data.keterangan_sisa,
          tanggal_kadaluwarsa: res.data.tanggal_kadaluwarsa,
          tanggal_kadaluwarsa_teks: res.data.tanggal_kadaluwarsa_teks
        })
      }
      if (res.paket_tersedia && res.paket_tersedia.length > 0) {
        daftarPaket.value = res.paket_tersedia
        if (!paketDipilih.value) {
          const paketCocok = res.paket_tersedia.find((p: any) => p.id === profilMember.value?.id_paket)
          paketDipilih.value = paketCocok ? paketCocok.id : res.paket_tersedia[0].id
        }
      }
    }

    if (resJadwal.sukses && Array.isArray(resJadwal.data)) {
      kelasMendatang.value = resJadwal.data
        .filter((j: any) => j.status === 'DIKONFIRMASI' || j.status === 'MENUNGGU')
        .map((j: any) => ({
          id: j.id,
          id_kelas: j.id_kelas,
          nama_kelas: j.nama_kelas,
          pelatih: j.pelatih,
          hari_tanggal: j.hari_tanggal,
          ruangan: j.ruangan,
          status: j.status
        }))

      const totalSesi = resJadwal.data.length
      statistikMember.value = [
        {
          label: 'Status Member',
          nilai: adaPembayaranMenunggu.value ? 'MENUNGGU' : (profilMember.value?.status || 'AKTIF'),
          ikon: '⭐'
        },
        { label: 'Kelas Diikuti', nilai: `${totalSesi} Sesi`, ikon: '🏋️' },
        { label: 'Sisa Durasi', nilai: profilMember.value?.keterangan_sisa || '0 Hari', ikon: '⏳' }
      ]
    }
  } catch (err: any) {
    console.error('Gagal mengambil data profil member:', err)
  } finally {
    if (!profilMember.value && dataPengguna.value) {
      profilMember.value = {
        id: dataPengguna.value.id,
        nama: dataPengguna.value.nama_lengkap,
        email: dataPengguna.value.email,
        nomor_telepon: '081234567890',
        status: dataPengguna.value.status_keanggotaan || 'AKTIF',
        apakah_aktif: dataPengguna.value.apakah_aktif ?? true,
        paket: dataPengguna.value.nama_paket || 'Paket Unlimited Bulanan',
        id_paket: dataPengguna.value.id_paket || 'paket-1',
        tanggal_kadaluwarsa: dataPengguna.value.tanggal_kadaluwarsa || new Date(Date.now() + 24 * 86400000).toISOString(),
        tanggal_kadaluwarsa_teks: dataPengguna.value.tanggal_kadaluwarsa_teks || '24 Nov 2026',
        sisa_hari: dataPengguna.value.sisa_hari ?? 24,
        keterangan_sisa: dataPengguna.value.keterangan_sisa || '24 Hari Lagi'
      }
      statistikMember.value = [
        { label: 'Status Member', nilai: 'AKTIF', ikon: '⭐' },
        { label: 'Kelas Diikuti', nilai: '8 Sesi', ikon: '🏋️' },
        { label: 'Sisa Durasi', nilai: '24 Hari Lagi', ikon: '⏳' }
      ]
      kelasMendatang.value = [
        {
          id: 'demo-1',
          id_kelas: 'zumba',
          nama_kelas: 'Zumba Cardio Party',
          pelatih: 'Coach Tania Putri',
          hari_tanggal: 'Besok, 18:30 WITA',
          ruangan: 'Studio Beta',
          status: 'DIKONFIRMASI'
        },
        {
          id: 'demo-2',
          id_kelas: 'poundfit',
          nama_kelas: 'Poundfit Ripstix Drum',
          pelatih: 'Coach Tania Putri',
          hari_tanggal: 'Jumat, 19:00 WITA',
          ruangan: 'Studio Alpha',
          status: 'DIKONFIRMASI'
        }
      ]
    }
    sedangMemuat.value = false
  }
}

// Buka dialog perpanjangan
const bukaModalPerpanjang = () => {
  buktiPembayaranBase64.value = ''
  buktiPembayaranNamaFile.value = ''
  catatanMemberInput.value = ''
  modalPerpanjangTerbuka.value = true
}

// Buka QR Masuk Gym
const klikQrMasuk = () => {
  if (!statusAktif.value) {
    if (adaPembayaranMenunggu.value) {
      tampilkanNotifikasi('Pembayaran Anda sedang menunggu konfirmasi admin. Akses QR akan terbuka otomatis setelah disetujui.', 'peringatan')
    } else {
      tampilkanNotifikasi('Paket Anda telah kadaluwarsa. Perpanjang dan unggah bukti pembayaran terlebih dahulu!', 'kesalahan')
      modalPerpanjangTerbuka.value = true
    }
    return
  }
  modalQrTerbuka.value = true
}

// Buka zoom foto bukti transfer
const bukaZoomBukti = (url: string) => {
  buktiTerpilihUntukZoom.value = url
  modalDetailBuktiTerbuka.value = true
}

// Kompresi gambar bukti transfer di sisi browser (Canvas)
const kompresGambar = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        resolve(dataUrl)
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Tangani pemilihan file bukti transfer
const tanganiPilihFile = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    tampilkanNotifikasi('Format file harus berupa gambar (JPG, PNG, atau WEBP).', 'kesalahan')
    return
  }

  try {
    buktiPembayaranNamaFile.value = file.name
    const hasilBase64 = await kompresGambar(file)
    buktiPembayaranBase64.value = hasilBase64
  } catch (err) {
    console.error('Gagal memproses gambar bukti:', err)
    tampilkanNotifikasi('Gagal membaca gambar bukti pembayaran. Coba file lain.', 'kesalahan')
  }
}

// Hapus bukti yang dipilih
const hapusBuktiTerpilih = () => {
  buktiPembayaranBase64.value = ''
  buktiPembayaranNamaFile.value = ''
  if (inputUploadFile.value) {
    inputUploadFile.value.value = ''
  }
}

// Kirim bukti pembayaran ke server untuk diverifikasi admin
const kirimBuktiPembayaran = async () => {
  if (!paketDipilih.value) {
    tampilkanNotifikasi('Silakan pilih salah satu paket membership!', 'kesalahan')
    return
  }

  if (!buktiPembayaranBase64.value) {
    tampilkanNotifikasi('Wajib mengunggah foto / screenshot bukti transfer pembayaran!', 'kesalahan')
    return
  }

  sedangKirimBukti.value = true
  try {
    const res: any = await $fetch('/api/member/pembayaran', {
      method: 'POST',
      body: {
        id_pengguna: dataPengguna.value?.id,
        email: dataPengguna.value?.email,
        id_paket: paketDipilih.value,
        kelas_pilihan: paketDipilihObj.value?.nama_paket.toLowerCase().includes('studio') ? kelasPilihanStudio.value : undefined,
        metode_pembayaran: metodePembayaranDipilih.value,
        bukti_pembayaran: buktiPembayaranBase64.value,
        catatan_member: catatanMemberInput.value
      }
    })

    if (res.sukses) {
      tampilkanNotifikasi(
        res.pesan || 'Bukti pembayaran berhasil dikirim! Silakan menunggu konfirmasi verifikasi admin.',
        'sukses',
        5000
      )
      modalPerpanjangTerbuka.value = false
      buktiPembayaranBase64.value = ''
      buktiPembayaranNamaFile.value = ''
      catatanMemberInput.value = ''

      // Muat ulang data terbaru
      await muatDataMember()
    }
  } catch (err: any) {
    tampilkanNotifikasi(err.data?.statusMessage || 'Gagal mengirim bukti pembayaran', 'kesalahan')
  } finally {
    sedangKirimBukti.value = false
  }
}

// Komputasi status aktif
const statusAktif = computed(() => {
  if (profilMember.value) return profilMember.value.apakah_aktif
  return dataPengguna.value?.apakah_aktif ?? (dataPengguna.value?.status_keanggotaan === 'AKTIF')
})

const namaPaketTampil = computed(() => {
  return profilMember.value?.paket || dataPengguna.value?.nama_paket || 'VIP ALL ACCESS'
})

const masaBerlakuTeks = computed(() => {
  return profilMember.value?.tanggal_kadaluwarsa_teks || dataPengguna.value?.tanggal_kadaluwarsa_teks || '26 Nov 2026'
})

const keteranganSisaTeks = computed(() => {
  return profilMember.value?.keterangan_sisa || dataPengguna.value?.keterangan_sisa || 'Sisa 30 Hari'
})

onMounted(() => {
  muatDataMember()
})
</script>

<template>
  <div class="space-y-5 pb-6">
    <!-- Sambutan Pengguna -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-[11px] font-bold text-neon-pink uppercase tracking-widest">Ruang Member Mezona</p>
        <h2 class="text-xl font-black text-white">
          Halo, {{ dataPengguna?.nama_lengkap || 'Member Juara' }} 👋
        </h2>
      </div>
      <NuxtLink to="/member/profil" class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-neon-magenta to-neon-fuchsia p-0.5 shadow-glow-magenta block hover:scale-105 transition" title="Buka Profil">
        <div class="w-full h-full bg-slate-900 rounded-[14px] overflow-hidden flex items-center justify-center font-bold text-neon-pink text-sm">
          <img
            v-if="dataPengguna?.foto_profil"
            :src="dataPengguna.foto_profil"
            alt="Foto Profil"
            class="w-full h-full object-cover"
          />
          <span v-else>
            {{ (dataPengguna?.nama_lengkap || 'M').substring(0, 2).toUpperCase() }}
          </span>
        </div>
      </NuxtLink>
    </div>

    <!-- 1. BANNER PEMBAYARAN MENUNGGU KONFIRMASI ADMIN -->
    <div
      v-if="adaPembayaranMenunggu && pembayaranMenunggu"
      class="p-4 rounded-3xl bg-amber-50 border border-amber-200 shadow-xs relative overflow-hidden"
    >
      <div class="flex items-start space-x-3 relative z-10">
        <div class="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold shrink-0 text-lg animate-pulse">
          ⏳
        </div>
        <div class="flex-1">
          <div class="flex items-center space-x-2">
            <h4 class="text-xs font-black text-amber-800 uppercase tracking-wider">Menunggu Konfirmasi Admin</h4>
            <span class="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-bold border border-amber-300">
              Proses Verifikasi
            </span>
          </div>
          <p class="text-[11px] text-amber-800 mt-1 leading-relaxed">
            Bukti transfer paket <strong>{{ pembayaranMenunggu.nama_paket }}</strong> (<strong>{{ pembayaranMenunggu.jumlah_bayar_rupiah }}</strong>) telah diterima. Admin studio sedang memverifikasi pembayaran Anda.
          </p>
          <div class="flex items-center space-x-2 mt-2 text-[10px] text-amber-700 font-mono">
            <span>Invoice: {{ pembayaranMenunggu.nomor_invoice }}</span>
            <span>•</span>
            <span>{{ pembayaranMenunggu.metode_pembayaran }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. BANNER PEMBAYARAN DITOLAK ADMIN (JIKA ADA PENOLAKAN TERBARU) -->
    <div
      v-else-if="pembayaranDitolakTerbaru && !statusAktif"
      class="p-4 rounded-3xl bg-red-50 border border-red-200 shadow-xs relative overflow-hidden"
    >
      <div class="flex items-start space-x-3 relative z-10">
        <div class="w-10 h-10 rounded-2xl bg-red-100 border border-red-300 flex items-center justify-center text-red-700 font-bold shrink-0 text-lg">
          ✕
        </div>
        <div class="flex-1">
          <h4 class="text-xs font-black text-red-800 uppercase tracking-wider">Pembayaran Terakhir Ditolak Admin</h4>
          <p class="text-[11px] text-red-700 mt-1 leading-relaxed">
            Alasan: <strong class="text-red-900">{{ pembayaranDitolakTerbaru.catatan_admin || 'Bukti transfer tidak valid atau dana belum masuk.' }}</strong>
          </p>
          <button
            @click="bukaModalPerpanjang"
            class="mt-3 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-neon-magenta to-neon-fuchsia hover:brightness-110 text-white font-black text-xs shadow-md transition flex items-center space-x-1"
          >
            <span>📤 Unggah Ulang Bukti Pembayaran</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 3. BANNER PERINGATAN KADALUWARSA (JIKA PAKET SUDAH HABIS SEBULAN & TIDAK ADA PENDING) -->
    <div
      v-else-if="!statusAktif && !sedangMemuat"
      class="p-4 rounded-3xl bg-rose-50 border border-rose-200 shadow-xs relative overflow-hidden"
    >
      <div class="flex items-start space-x-3 relative z-10">
        <div class="w-9 h-9 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 font-bold shrink-0 text-base">
          ⚠️
        </div>
        <div class="flex-1">
          <h4 class="text-xs font-black text-rose-800 uppercase tracking-wider">Paket Membership Telah Berakhir</h4>
          <p class="text-[11px] text-rose-700 mt-1 leading-relaxed">
            Masa aktif 1 bulan paket Anda telah habis. Beli atau perpanjang paket dengan mengunggah bukti pembayaran untuk melanjutkan akses gym studio.
          </p>
          <button
            @click="bukaModalPerpanjang"
            class="mt-3 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-neon-magenta to-neon-fuchsia hover:brightness-110 text-white font-black text-xs shadow-md transition flex items-center space-x-1"
          >
            <span>⚡ Beli / Perpanjang Paket Sekarang</span>
          </button>
        </div>
      </div>
    </div>

    <!-- KARTU KEANGGOTAAN DIGITAL MEZONA PASS -->
    <div
      class="relative overflow-hidden rounded-3xl p-5 border shadow-md transition duration-300 bg-white"
      :class="statusAktif
        ? 'border-rose-300 ring-2 ring-rose-500/10'
        : (adaPembayaranMenunggu
          ? 'border-amber-300 ring-2 ring-amber-500/10'
          : 'border-red-300 ring-2 ring-red-500/10')"
    >
      <!-- Glow ambient internal -->
      <div
        class="absolute -right-10 -bottom-10 w-36 h-36 rounded-full blur-2xl pointer-events-none"
        :class="statusAktif ? 'bg-rose-100' : (adaPembayaranMenunggu ? 'bg-amber-100' : 'bg-red-100')"
      ></div>

      <!-- Bagian Atas Kartu dengan Logo Resmi Mezona Studio -->
      <div class="relative z-10 flex justify-between items-start mb-5">
        <div>
          <img
            src="/images/logo-mezona.png"
            alt="Mezona Studio"
            class="h-7 sm:h-8 w-auto object-contain mb-2 drop-shadow-sm"
          />
          <span
            class="text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-full border inline-block"
            :class="statusAktif
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : (adaPembayaranMenunggu
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200')"
          >
            {{ namaPaketTampil }}
            <span v-if="profilMember?.kelas_pilihan && namaPaketTampil.toLowerCase().includes('studio')" class="text-rose-600">
              ({{ profilMember.kelas_pilihan }})
            </span>
          </span>
        </div>

        <div class="text-right">
          <span class="text-[10px] text-slate-500 block font-medium">Status Keanggotaan</span>
          <span
            class="text-xs font-black flex items-center justify-end space-x-1 mt-0.5"
            :class="statusAktif
              ? 'text-rose-600'
              : (adaPembayaranMenunggu ? 'text-amber-600' : 'text-red-600')"
          >
            <span
              class="w-2 h-2 rounded-full inline-block"
              :class="statusAktif
                ? 'bg-rose-600 animate-ping'
                : (adaPembayaranMenunggu ? 'bg-amber-500 animate-pulse' : 'bg-red-500')"
            ></span>
            <span>
              {{
                statusAktif
                  ? `AKTIF (${keteranganSisaTeks})`
                  : (adaPembayaranMenunggu ? 'MENUNGGU VERIFIKASI' : 'KADALUWARSA')
              }}
            </span>
          </span>
        </div>
      </div>

      <!-- Bagian Bawah Kartu -->
      <div class="relative z-10 flex justify-between items-end pt-3 border-t border-slate-200">
        <div>
          <p class="text-[10px] text-slate-500 font-medium">
            {{ statusAktif ? 'Masa Berlaku Hingga (1 Bln)' : 'Telah Berakhir Pada' }}
          </p>
          <p class="text-xs font-bold text-slate-900 font-mono">
            {{ masaBerlakuTeks }}
          </p>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Tombol Perpanjang / Pembayaran Cepat -->
          <button
            @click="bukaModalPerpanjang"
            class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition active:scale-95 flex items-center space-x-1 shadow-2xs"
            :class="statusAktif
              ? 'bg-white hover:bg-slate-50 text-rose-700 border-slate-200'
              : 'bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white border-transparent shadow-md'"
          >
            <span>💳</span>
            <span>{{ adaPembayaranMenunggu ? 'Kirim Bukti Lain' : (statusAktif ? 'Perpanjang' : 'Beli Paket') }}</span>
          </button>

          <!-- Tombol QR Masuk -->
          <button
            @click="klikQrMasuk"
            class="px-3 py-1.5 rounded-xl font-bold text-[11px] shadow-sm flex items-center space-x-1 transition active:scale-95"
            :class="statusAktif
              ? 'bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white shadow-md'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>QR Masuk</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Ringkasan Statistik Tubuh & Aktivitas -->
    <div class="grid grid-cols-3 gap-2.5">
      <div
        v-for="stat in statistikMember"
        :key="stat.label"
        class="efek-kaca rounded-2xl p-3 text-center border border-white/5"
      >
        <span class="text-base block mb-1">{{ stat.ikon }}</span>
        <span class="text-sm font-extrabold text-white block">{{ stat.nilai }}</span>
        <span class="text-[9px] text-slate-400 font-medium leading-tight block mt-0.5">{{ stat.label }}</span>
      </div>
    </div>

    <!-- Jadwal Sesi Kelas Terdaftar (Data Riil Database) -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-white flex items-center space-x-2">
          <span class="w-2 h-2 rounded-full bg-neon-pink"></span>
          <span>Sesi Kelas Anda</span>
        </h3>
        <NuxtLink to="/member/jadwal" class="text-xs font-semibold text-neon-pink hover:underline">
          Lihat Semua
        </NuxtLink>
      </div>

      <!-- Jika Belum Ada Kelas Terdaftar -->
      <div v-if="kelasMendatang.length === 0" class="efek-kaca rounded-2xl p-4 text-center border border-white/5 space-y-2">
        <p class="text-xs text-slate-400">Belum ada sesi kelas terdaftar saat ini.</p>
        <NuxtLink to="/member/kelas" class="inline-block text-xs font-bold text-neon-pink hover:underline">
          Eksplorasi & Pesan Kelas Sekarang →
        </NuxtLink>
      </div>

      <!-- Daftar Kelas Terdaftar -->
      <div v-else class="space-y-2.5">
        <div
          v-for="item in kelasMendatang"
          :key="item.id"
          class="efek-kaca rounded-2xl p-3.5 border transition duration-200"
          :class="item.status === 'MENUNGGU' ? 'border-amber-500/40 bg-amber-950/20' : 'border-rose-500/20 hover:border-rose-500/40'"
        >
          <div class="flex justify-between items-start mb-1.5">
            <h4 class="text-sm font-bold text-white">{{ item.nama_kelas }}</h4>
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded-full"
              :class="item.status === 'DIKONFIRMASI'
                ? 'bg-rose-500/20 text-rose-200 border border-rose-500/30'
                : item.status === 'MENUNGGU'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'"
            >
              {{ item.status === 'DIKONFIRMASI' ? '✓ Terdaftar' : (item.status === 'MENUNGGU' ? '⏳ Menunggu Admin' : item.status) }}
            </span>
          </div>
          <p class="text-xs text-slate-400 mb-2">{{ item.pelatih }}</p>
          <div class="flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-white/5">
            <span class="flex items-center space-x-1">
              <span>🕒</span>
              <span>{{ item.hari_tanggal }}</span>
            </span>
            <span class="text-slate-400">{{ item.ruangan }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tombol Pemesanan Cepat Kelas -->
    <div class="pt-1">
      <NuxtLink
        to="/member/kelas"
        class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-neon-magenta via-pink-600 to-neon-fuchsia text-white font-extrabold text-sm tracking-wide shadow-glow-magenta flex items-center justify-center space-x-2 hover:brightness-110 active:scale-[0.98] transition"
      >
        <span>+ Pesan Sesi Latihan Baru</span>
      </NuxtLink>
    </div>

    <!-- KARTU RIWAYAT PEMBAYARAN & INVOICE -->
    <div class="efek-kaca rounded-3xl p-4 sm:p-5 border border-white/10 space-y-3">
      <div
        @click="tampilkanRiwayat = !tampilkanRiwayat"
        class="flex items-center justify-between cursor-pointer select-none"
      >
        <div class="flex items-center space-x-2">
          <span class="text-base">🧾</span>
          <h3 class="text-sm font-black text-white">Riwayat Pembayaran & Invoice</h3>
          <span v-if="daftarRiwayatPembayaran.length > 0" class="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
            {{ daftarRiwayatPembayaran.length }}
          </span>
        </div>
        <span class="text-xs text-slate-400 transform transition-transform" :class="{ 'rotate-180': tampilkanRiwayat }">
          ▼
        </span>
      </div>

      <div v-show="tampilkanRiwayat" class="pt-2 border-t border-white/5 space-y-2.5">
        <div v-if="daftarRiwayatPembayaran.length === 0" class="text-center py-4 text-xs text-slate-400">
          Belum ada riwayat pembayaran yang tercatat.
        </div>
        <div
          v-for="riwayat in daftarRiwayatPembayaran"
          :key="riwayat.id"
          class="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-rose-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
        >
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <span class="font-mono font-bold text-xs text-white">{{ riwayat.nomor_invoice }}</span>
              <span
                class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider"
                :class="{
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30': riwayat.status === 'MENUNGGU_KONFIRMASI',
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30': riwayat.status === 'DISETUJUI',
                  'bg-red-500/20 text-red-300 border border-red-500/30': riwayat.status === 'DITOLAK'
                }"
              >
                {{ riwayat.status === 'MENUNGGU_KONFIRMASI' ? 'Menunggu Konfirmasi' : (riwayat.status === 'DISETUJUI' ? 'Disetujui' : 'Ditolak') }}
              </span>
            </div>
            <p class="text-xs text-slate-300 font-semibold">
              {{ riwayat.nama_paket }} • <span class="text-neon-pink font-bold">{{ riwayat.jumlah_bayar_rupiah }}</span>
            </p>
            <p class="text-[10px] text-slate-400">
              {{ riwayat.dibuat_pada_teks }} • {{ riwayat.metode_pembayaran }}
            </p>
            <p v-if="riwayat.catatan_admin" class="text-[10px] text-rose-300/90 italic">
              Catatan Admin: {{ riwayat.catatan_admin }}
            </p>
          </div>

          <div class="flex items-center space-x-2 shrink-0">
            <button
              v-if="riwayat.bukti_pembayaran"
              @click="bukaZoomBukti(riwayat.bukti_pembayaran)"
              class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700 transition flex items-center space-x-1"
            >
              <span>🔍 Bukti Transfer</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL PEMBAYARAN & UNGGAH BUKTI TRANSFER (MEMBER SELF-SERVICE) -->
    <div
      v-if="modalPerpanjangTerbuka"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
    >
      <div class="w-full max-w-lg efek-kaca-gelap rounded-3xl p-5 sm:p-6 border border-rose-500/40 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
        <!-- Header Modal -->
        <div class="flex justify-between items-start pb-2 border-b border-white/10">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-widest text-neon-pink">Pembayaran Keanggotaan</span>
            <h3 class="text-base sm:text-lg font-black text-white mt-0.5">Beli / Perpanjang Paket Membership</h3>
          </div>
          <button
            @click="modalPerpanjangTerbuka = false"
            class="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>

        <!-- 1. Pilih Paket Membership -->
        <div class="space-y-2">
          <label class="block text-xs font-bold text-slate-300">1. Pilih Paket Membership:</label>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div
              v-for="pkt in daftarPaket"
              :key="pkt.id"
              @click="paketDipilih = pkt.id"
              class="p-3 rounded-2xl border cursor-pointer transition duration-200"
              :class="paketDipilih === pkt.id
                ? 'bg-rose-950/40 border-neon-magenta shadow-glow-magenta'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'"
            >
              <div class="flex justify-between items-start">
                <div>
                  <span class="font-black text-white text-xs sm:text-sm">{{ pkt.nama_paket }}</span>
                  <span class="text-[10px] ml-2 px-2 py-0.5 rounded-full font-bold" :class="pkt.durasi_hari === 1 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-rose-500/20 text-rose-300'">
                    {{ pkt.durasi_hari === 1 ? '1 Hari (Daily Pass)' : `${pkt.durasi_hari} Hari` }}
                  </span>
                </div>
                <span class="text-xs font-black text-neon-pink">{{ pkt.harga_rupiah }}</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1 leading-tight">{{ pkt.deskripsi }}</p>
            </div>
          </div>
        </div>

        <!-- Pilihan 1 Kelas Studio Utama (Khusus Paket Kelas Studio) -->
        <div
          v-if="paketDipilihObj && paketDipilihObj.nama_paket.toLowerCase().includes('studio')"
          class="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/40 space-y-2.5"
        >
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-purple-300 flex items-center space-x-1.5">
              <span>🎯</span>
              <span>Pilih 1 Kelas Studio Utama Anda:</span>
            </label>
            <span class="text-[10px] font-bold text-purple-300/80 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-500/30">
              Termasuk Paket
            </span>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="kelasPilihanStudio = 'Zumba'"
              class="p-2.5 rounded-xl border text-center transition"
              :class="kelasPilihanStudio === 'Zumba'
                ? 'bg-pink-950/50 border-pink-500 text-white font-black shadow-lg shadow-pink-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 text-xs'"
            >
              <span class="text-base block">💃</span>
              <span class="text-xs font-bold block mt-0.5">Zumba</span>
              <span class="text-[9px] text-pink-300">Dance Cardio</span>
            </button>

            <button
              type="button"
              @click="kelasPilihanStudio = 'Yoga'"
              class="p-2.5 rounded-xl border text-center transition"
              :class="kelasPilihanStudio === 'Yoga'
                ? 'bg-purple-950/50 border-purple-500 text-white font-black shadow-lg shadow-purple-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 text-xs'"
            >
              <span class="text-base block">🧘</span>
              <span class="text-xs font-bold block mt-0.5">Yoga</span>
              <span class="text-[9px] text-purple-300">Fleksibilitas</span>
            </button>

            <button
              type="button"
              @click="kelasPilihanStudio = 'Poundfit'"
              class="p-2.5 rounded-xl border text-center transition"
              :class="kelasPilihanStudio === 'Poundfit'
                ? 'bg-rose-950/50 border-rose-500 text-white font-black shadow-lg shadow-rose-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 text-xs'"
            >
              <span class="text-base block">🥁</span>
              <span class="text-xs font-bold block mt-0.5">Poundfit</span>
              <span class="text-[9px] text-rose-300">Ripstix Drums</span>
            </button>
          </div>

          <p class="text-[10px] text-slate-400 leading-relaxed italic">
            * Paket Kelas Studio mencakup 1 kelas spesialisasi pilihan di atas. Untuk mengikuti kelas studio lainnya, Anda dapat memesan kelas tambahan sesuai tarif per sesi.
          </p>
        </div>

        <!-- Banner Info Khusus VIP All Access -->
        <div
          v-else-if="paketDipilihObj && paketDipilihObj.nama_paket.toLowerCase().includes('vip')"
          class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1"
        >
          <div class="flex items-center space-x-2 text-amber-800 font-bold">
            <span>✨</span>
            <span>Akses All-Inclusive Bebas Sesi</span>
          </div>
          <p class="text-[11px] text-amber-900">
            Dengan <strong>VIP All Access</strong>, Anda bebas mengikuti seluruh kelas studio (Zumba, Yoga, Poundfit, dll) tanpa batas dan tanpa biaya tambahan!
          </p>
        </div>

        <!-- 2. Pilih Rekening / Metode Pembayaran Studio Mezona -->
        <div class="space-y-2 pt-2 border-t border-slate-200">
          <label class="block text-xs font-bold text-slate-700">2. Pilih Rekening Tujuan Transfer:</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="metodePembayaranDipilih = 'Transfer Bank BCA'"
              class="p-2.5 rounded-xl border text-center transition"
              :class="metodePembayaranDipilih === 'Transfer Bank BCA'
                ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 font-medium text-xs'"
            >
              <span class="text-xs block font-bold">Bank BCA</span>
              <span class="text-[9px] text-slate-500">Transfer</span>
            </button>

            <button
              type="button"
              @click="metodePembayaranDipilih = 'Transfer Bank Mandiri'"
              class="p-2.5 rounded-xl border text-center transition"
              :class="metodePembayaranDipilih === 'Transfer Bank Mandiri'
                ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 font-medium text-xs'"
            >
              <span class="text-xs block font-bold">Bank Mandiri</span>
              <span class="text-[9px] text-slate-500">Transfer</span>
            </button>

            <button
              type="button"
              @click="metodePembayaranDipilih = 'QRIS Studio Mezona'"
              class="p-2.5 rounded-xl border text-center transition"
              :class="metodePembayaranDipilih === 'QRIS Studio Mezona'
                ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 font-medium text-xs'"
            >
              <span class="text-xs block font-bold">QRIS Studio</span>
              <span class="text-[9px] text-slate-500">Scan Instan</span>
            </button>
          </div>

          <!-- Rincian Rekening / QRIS -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 mt-2">
            <!-- Jika Bank BCA -->
            <div v-if="metodePembayaranDipilih === 'Transfer Bank BCA'" class="space-y-1.5">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-slate-500 block">Bank Penerima</span>
                  <span class="text-xs font-bold text-slate-900">{{ dataRekeningStudio.bca.bank }}</span>
                </div>
                <button
                  type="button"
                  @click="salinNomorRekening(dataRekeningStudio.bca.nomor, 'Bank BCA')"
                  class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition flex items-center space-x-1"
                >
                  <span>📋 Salin Rekening</span>
                </button>
              </div>
              <div class="flex justify-between items-baseline pt-1">
                <span class="font-mono text-sm font-black text-rose-600 tracking-wider">
                  {{ dataRekeningStudio.bca.nomor_format }}
                </span>
                <span class="text-[11px] text-slate-600 font-medium">a.n. {{ dataRekeningStudio.bca.atas_nama }}</span>
              </div>
            </div>

            <!-- Jika Bank Mandiri -->
            <div v-else-if="metodePembayaranDipilih === 'Transfer Bank Mandiri'" class="space-y-1.5">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-slate-500 block">Bank Penerima</span>
                  <span class="text-xs font-bold text-slate-900">{{ dataRekeningStudio.mandiri.bank }}</span>
                </div>
                <button
                  type="button"
                  @click="salinNomorRekening(dataRekeningStudio.mandiri.nomor, 'Bank Mandiri')"
                  class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition flex items-center space-x-1"
                >
                  <span>📋 Salin Rekening</span>
                </button>
              </div>
              <div class="flex justify-between items-baseline pt-1">
                <span class="font-mono text-sm font-black text-neon-pink tracking-wider">
                  {{ dataRekeningStudio.mandiri.nomor_format }}
                </span>
                <span class="text-[11px] text-slate-300">a.n. {{ dataRekeningStudio.mandiri.atas_nama }}</span>
              </div>
            </div>

            <!-- Jika QRIS -->
            <div v-else class="text-center py-2 space-y-2">
              <span class="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">QRIS Studio Mezona Fitness</span>
              <div class="w-36 h-36 bg-white rounded-2xl mx-auto p-2 flex items-center justify-center shadow-lg">
                <div class="w-32 h-32 border-4 border-slate-950 p-2 flex flex-col justify-between">
                  <div class="flex justify-between">
                    <div class="w-6 h-6 bg-slate-950"></div>
                    <div class="w-6 h-6 bg-slate-950"></div>
                  </div>
                  <div class="text-[7px] font-black uppercase tracking-tighter text-rose-600 text-center">QRIS MEZONA</div>
                  <div class="flex justify-between">
                    <div class="w-6 h-6 bg-slate-950"></div>
                    <div class="w-3 h-3 bg-slate-950 self-end"></div>
                  </div>
                </div>
              </div>
              <p class="text-[10px] text-slate-400">Scan QRIS menggunakan BCA, Mandiri, GoPay, OVO, ShopeePay, atau DANA</p>
            </div>

            <!-- Ringkasan Nominal Transfer -->
            <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span class="text-xs text-slate-400 font-semibold">Total Nominal Transfer:</span>
              <span class="text-sm sm:text-base font-black text-neon-pink">
                {{ paketDipilihObj?.harga_rupiah || 'Rp 0' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 3. Unggah Bukti Transfer Pembayaran (Wajib) -->
        <div class="space-y-2 pt-2 border-t border-white/10">
          <label class="block text-xs font-bold text-slate-300">
            3. Unggah Bukti Transfer Pembayaran <span class="text-neon-pink">*Wajib</span>:
          </label>

          <!-- Input File Tersembunyi -->
          <input
            ref="inputUploadFile"
            type="file"
            accept="image/*"
            class="hidden"
            @change="tanganiPilihFile"
          />

          <!-- Preview Jika Sudah Memilih Gambar -->
          <div v-if="buktiPembayaranBase64" class="p-3 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-2">
            <div class="flex items-center space-x-3">
              <img
                :src="buktiPembayaranBase64"
                alt="Preview Bukti Transfer"
                class="w-14 h-14 object-cover rounded-xl border border-white/20 shrink-0"
              />
              <div class="flex-1 truncate">
                <span class="text-xs font-bold text-emerald-400 block truncate">✓ Bukti Transfer Siap</span>
                <span class="text-[10px] text-slate-400 block truncate">{{ buktiPembayaranNamaFile }}</span>
              </div>
              <button
                type="button"
                @click="hapusBuktiTerpilih"
                class="px-2.5 py-1.5 rounded-xl bg-slate-800 text-red-400 hover:text-red-300 text-[11px] font-bold border border-red-500/20"
              >
                Ganti
              </button>
            </div>
          </div>

          <!-- Tombol / Area Drop Jika Belum Ada Gambar -->
          <div
            v-else
            @click="inputUploadFile?.click()"
            class="p-4 rounded-2xl border-2 border-dashed border-rose-500/30 hover:border-neon-magenta bg-slate-900/60 hover:bg-slate-900 transition cursor-pointer text-center space-y-1.5 group"
          >
            <div class="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-neon-pink flex items-center justify-center mx-auto text-base group-hover:scale-110 transition">
              📷
            </div>
            <p class="text-xs font-bold text-white">Ketuk untuk Mengunggah Foto Bukti Transfer</p>
            <p class="text-[10px] text-slate-400">Format JPG, PNG, atau WEBP dari galeri ponsel Anda</p>
          </div>
        </div>

        <!-- 4. Catatan Member (Opsional) -->
        <div class="space-y-1 pt-2 border-t border-white/10">
          <label class="block text-xs font-bold text-slate-300">4. Catatan Pengirim (Opsional):</label>
          <input
            v-model="catatanMemberInput"
            type="text"
            placeholder="Contoh: Transfer atas nama Budi Santoso"
            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-magenta focus:outline-none"
          />
        </div>

        <!-- Info Verifikasi Admin -->
        <div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed flex items-start space-x-2">
          <span>ℹ️</span>
          <span>Setelah Anda mengirim bukti transfer, <strong>Admin Studio</strong> akan memverifikasi pembayaran. Paket keanggotaan Anda akan otomatis aktif segera setelah disetujui.</span>
        </div>

        <!-- Tombol Aksi -->
        <div class="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            @click="modalPerpanjangTerbuka = false"
            class="py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
          >
            Batal
          </button>
          <button
            type="button"
            @click="kirimBuktiPembayaran"
            :disabled="sedangKirimBukti || !buktiPembayaranBase64"
            class="py-3 rounded-xl font-black text-xs transition flex items-center justify-center space-x-1.5"
            :class="buktiPembayaranBase64
              ? 'bg-gradient-to-r from-neon-magenta to-neon-fuchsia hover:brightness-110 text-white shadow-glow-magenta'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'"
          >
            <span>{{ sedangKirimBukti ? 'Mengirim...' : '📤 Kirim Bukti Transfer' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL ZOOM BUKTI TRANSFER RIWAYAT -->
    <div
      v-if="modalDetailBuktiTerbuka"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      @click="modalDetailBuktiTerbuka = false"
    >
      <div class="w-full max-w-sm efek-kaca-gelap rounded-3xl p-4 border border-rose-500/40 shadow-2xl text-center space-y-3" @click.stop>
        <div class="flex justify-between items-center pb-2 border-b border-white/10">
          <span class="text-xs font-bold text-neon-pink">Foto Bukti Transfer</span>
          <button @click="modalDetailBuktiTerbuka = false" class="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
        <div class="bg-black/60 rounded-2xl p-2 max-h-[70vh] overflow-auto flex items-center justify-center">
          <img :src="buktiTerpilihUntukZoom" alt="Bukti Transfer" class="max-w-full max-h-[60vh] rounded-xl object-contain" />
        </div>
        <button
          @click="modalDetailBuktiTerbuka = false"
          class="w-full py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold"
        >
          Tutup
        </button>
      </div>
    </div>

    <!-- MODAL QR MASUK GYM -->
    <div
      v-if="modalQrTerbuka"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div class="w-full max-w-xs efek-kaca-gelap rounded-3xl p-6 border border-rose-500/30 shadow-2xl text-center">
        <div class="flex justify-between items-center mb-4">
          <span class="text-[10px] font-bold text-neon-pink uppercase tracking-widest">Akses Masuk Studio</span>
          <button @click="modalQrTerbuka = false" class="text-slate-400 hover:text-white text-xs">✕</button>
        </div>

        <!-- Simulasi QR Code -->
        <div class="p-4 bg-white rounded-2xl mx-auto w-48 h-48 flex items-center justify-center shadow-lg my-3">
          <div class="text-slate-950 font-mono text-[9px] text-center space-y-1">
            <div class="w-36 h-36 border-4 border-slate-950 p-2 flex flex-col justify-between mx-auto">
              <div class="flex justify-between">
                <div class="w-7 h-7 bg-slate-950"></div>
                <div class="w-7 h-7 bg-slate-950"></div>
              </div>
              <div class="text-[8px] font-black uppercase tracking-tighter text-rose-600">MEZONA STUDIO GATE</div>
              <div class="flex justify-between">
                <div class="w-7 h-7 bg-slate-950"></div>
                <div class="w-3 h-3 bg-slate-950 self-end"></div>
              </div>
            </div>
          </div>
        </div>

        <p class="font-bold text-white text-xs mt-3">{{ dataPengguna?.nama_lengkap }}</p>
        <p class="text-[10px] text-neon-pink font-mono">{{ namaPaketTampil }} • AKTIF</p>
        <p class="text-[11px] text-slate-400 mt-2">Arahkan QR ke pemindai di pintu turnstile studio untuk masuk.</p>

        <button
          @click="modalQrTerbuka = false"
          class="mt-4 w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>
