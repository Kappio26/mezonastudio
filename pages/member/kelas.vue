<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'seluler'
})

const { dataPengguna, inisialisasiSesi, tampilkanNotifikasi } = useOtentikasi()

interface KelasItem {
  id: string
  nama: string
  deskripsi: string
  kategori: string
  harga: number
  harga_rupiah: string
  apakah_termasuk_paket: boolean
  keterangan_biaya: string
  biaya_tambahan: number
  id_pelatih: string
  pelatih: string
  hari: string
  jam_mulai: string
  jam_selesai: string
  jadwal: string
  durasi: string
  ruang: string
  kapasitas: number
  terisi: number
  sisa_kursi: number
  apakah_penuh: boolean
  sudah_dipesan: boolean
  id_pemesanan_saya: string | null
}

const sedangMemuat = ref(true)
const sedangMemesan = ref(false)
const daftarKelas = ref<KelasItem[]>([])
const statusMember = ref<any>(null)

// State Modal Konfirmasi Pesan
const modalPesanTerbuka = ref(false)
const kelasDipilih = ref<KelasItem | null>(null)

// State Pembayaran Kelas Tambahan
const metodePembayaranDipilih = ref<'Transfer Bank BCA' | 'Transfer Bank Mandiri' | 'QRIS Studio Mezona'>('Transfer Bank BCA')
const buktiPembayaranBase64 = ref<string>('')
const buktiPembayaranNamaFile = ref<string>('')
const inputUploadBukti = ref<HTMLInputElement | null>(null)

// Data Rekening Resmi Studio Mezona
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

const salinNomorRekening = (nomor: string, namaBank: string) => {
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(nomor)
    tampilkanNotifikasi(`Nomor rekening ${namaBank} berhasil disalin!`, 'sukses', 2500)
  }
}

// Kompresi gambar bukti transfer menggunakan Canvas
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
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const tanganiPilihBukti = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    tampilkanNotifikasi('Format file bukti harus berupa gambar (JPG/PNG/WEBP).', 'kesalahan')
    return
  }

  try {
    buktiPembayaranNamaFile.value = file.name
    buktiPembayaranBase64.value = await kompresGambar(file)
  } catch (err) {
    console.error('Gagal memproses gambar:', err)
    tampilkanNotifikasi('Gagal membaca gambar bukti pembayaran.', 'kesalahan')
  }
}

const hapusBukti = () => {
  buktiPembayaranBase64.value = ''
  buktiPembayaranNamaFile.value = ''
  if (inputUploadBukti.value) {
    inputUploadBukti.value.value = ''
  }
}

// Mengambil data kelas riil dari basis data PostgreSQL
const muatKelas = async () => {
  inisialisasiSesi()
  sedangMemuat.value = true
  try {
    const params = new URLSearchParams()
    if (dataPengguna.value?.id) params.append('id', dataPengguna.value.id)
    if (dataPengguna.value?.email) params.append('email', dataPengguna.value.email)

    const res: any = await $fetch(`/api/member/kelas?${params.toString()}`)
    if (res.sukses && res.data) {
      daftarKelas.value = res.data
      if (res.status_member) {
        statusMember.value = res.status_member
      }
    }
  } catch (err: any) {
    console.error('Gagal mengambil data kelas:', err)
    tampilkanNotifikasi(err.data?.statusMessage || 'Gagal memuat daftar kelas', 'kesalahan')
  } finally {
    sedangMemuat.value = false
  }
}

// Buka dialog konfirmasi pemesanan
const bukaModalPesan = (kelas: KelasItem) => {
  const apakahAktif = statusMember.value?.apakah_aktif ?? (dataPengguna.value?.status_keanggotaan === 'AKTIF')
  if (!apakahAktif) {
    tampilkanNotifikasi('Paket membership Anda kadaluwarsa/tidak aktif. Silakan perpanjang paket terlebih dahulu!', 'kesalahan', 4500)
    return
  }

  kelasDipilih.value = kelas
  buktiPembayaranBase64.value = ''
  buktiPembayaranNamaFile.value = ''
  modalPesanTerbuka.value = true
}

// Eksekusi pemesanan kursi kelas
const konfirmasiPemesanan = async () => {
  if (!kelasDipilih.value) return

  // Jika kelas berbayar (kelas tambahan di luar paket studio)
  if (!kelasDipilih.value.apakah_termasuk_paket && !buktiPembayaranBase64.value) {
    tampilkanNotifikasi(`Wajib mengunggah bukti transfer pembayaran kelas (${kelasDipilih.value.harga_rupiah})!`, 'kesalahan')
    return
  }

  sedangMemesan.value = true
  try {
    const res: any = await $fetch('/api/member/pesan-kelas', {
      method: 'POST',
      body: {
        id_kelas: kelasDipilih.value.id,
        id_pengguna: dataPengguna.value?.id,
        email: dataPengguna.value?.email,
        metode_pembayaran: !kelasDipilih.value.apakah_termasuk_paket ? metodePembayaranDipilih.value : undefined,
        bukti_pembayaran: !kelasDipilih.value.apakah_termasuk_paket ? buktiPembayaranBase64.value : undefined
      }
    })

    if (res.sukses) {
      tampilkanNotifikasi(res.pesan || 'Kursi berhasil dipesan!', 'sukses')
      modalPesanTerbuka.value = false
      kelasDipilih.value = null
      await muatKelas()
    }
  } catch (err: any) {
    tampilkanNotifikasi(err.data?.statusMessage || 'Gagal memesan kelas', 'kesalahan')
  } finally {
    sedangMemesan.value = false
  }
}

// Batalkan pemesanan kursi
const batalkanPemesanan = async (kelas: KelasItem) => {
  if (!kelas.id_pemesanan_saya) return
  if (!confirm(`Batalkan pendaftaran sesi kelas ${kelas.nama}? Kursi Anda akan dibuka kembali untuk member lain.`)) return

  sedangMemesan.value = true
  try {
    const res: any = await $fetch('/api/member/batal-kelas', {
      method: 'POST',
      body: {
        id_pemesanan: kelas.id_pemesanan_saya,
        id_pengguna: dataPengguna.value?.id
      }
    })

    if (res.sukses) {
      tampilkanNotifikasi(res.pesan || 'Pemesanan berhasil dibatalkan', 'info')
      await muatKelas()
    }
  } catch (err: any) {
    tampilkanNotifikasi(err.data?.statusMessage || 'Gagal membatalkan pemesanan', 'kesalahan')
  } finally {
    sedangMemesan.value = false
  }
}

onMounted(() => {
  muatKelas()
})
</script>

<template>
  <div class="space-y-4 pb-6">
    <!-- Header Halaman -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black text-slate-900">Eksplorasi Kelas Studio</h2>
        <p class="text-xs text-slate-500">Pilih sesi latihan spesialis favoritmu</p>
      </div>
      <span class="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
        {{ daftarKelas.length }} Kelas Aktif
      </span>
    </div>

    <!-- Banner Info Hak Akses Paket Member -->
    <div
      v-if="statusMember && statusMember.apakah_aktif"
      class="p-3.5 rounded-2xl border text-xs shadow-2xs transition"
      :class="statusMember.apakah_vip
        ? 'bg-amber-50 border-amber-200 text-amber-900'
        : (statusMember.apakah_studio
          ? 'bg-purple-50 border-purple-200 text-purple-900'
          : 'bg-slate-50 border-slate-200 text-slate-800')"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-base">{{ statusMember.apakah_vip ? '👑' : (statusMember.apakah_studio ? '🎯' : '🎟️') }}</span>
          <div>
            <span class="font-extrabold text-slate-900 block">
              {{ statusMember.nama_paket }}
            </span>
            <span v-if="statusMember.apakah_vip" class="text-[11px] text-amber-800 font-medium">
              Akses Penuh: BEBAS mengikuti seluruh sesi kelas studio tanpa biaya tambahan.
            </span>
            <span v-else-if="statusMember.apakah_studio" class="text-[11px] text-purple-800 font-medium">
              Pilihan Utama: <strong>{{ statusMember.kelas_pilihan || 'Belum Dipilih' }}</strong> (Gratis). Kelas studio lain dapat diambil sebagai kelas tambahan.
            </span>
            <span v-else class="text-[11px] text-slate-600">
              {{ statusMember.keterangan }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Keanggotaan Tidak Aktif -->
    <div
      v-if="statusMember && !statusMember.apakah_aktif && !sedangMemuat"
      class="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs flex items-start justify-between gap-3 shadow-xs"
    >
      <div class="flex items-start space-x-2.5">
        <span class="text-lg">⚠️</span>
        <div>
          <p class="font-bold text-red-900">Status Membership: {{ statusMember.status || 'KADALUWARSA' }}</p>
          <p class="text-[11px] text-red-700 mt-0.5">
            Perpanjang paket membership untuk dapat memesan kursi sesi kelas studio.
          </p>
        </div>
      </div>
      <NuxtLink
        to="/member/dasbor"
        class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white font-bold text-[11px] shrink-0 shadow-md hover:brightness-110 transition"
      >
        Perpanjang ⚡
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="sedangMemuat" class="efek-kaca rounded-2xl p-10 text-center text-slate-400 text-xs">
      <div class="inline-block animate-spin text-2xl mb-2">🔄</div>
      <p>Memuat jadwal kelas dan tarif sesi studio dari database...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="daftarKelas.length === 0" class="efek-kaca rounded-2xl p-8 text-center text-slate-400 text-xs">
      Belum ada kelas aktif yang tersedia saat ini.
    </div>

    <!-- Daftar Kelas Riil Terhubung ke PostgreSQL Admin -->
    <div v-else class="space-y-3">
      <div
        v-for="kelas in daftarKelas"
        :key="kelas.id"
        class="efek-kaca rounded-2xl p-4 border transition duration-200"
        :class="kelas.sudah_dipesan
          ? 'border-neon-magenta/50 bg-rose-950/20 shadow-glow-magenta'
          : 'border-white/5 hover:border-rose-500/30'"
      >
        <div class="flex justify-between items-start mb-1.5">
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="text-sm font-black text-white">{{ kelas.nama }}</h3>
              <!-- Badge Kategori -->
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block"
                :class="kelas.kategori.toLowerCase().includes('zumba')
                  ? 'border-pink-500/30 text-pink-300 bg-pink-500/10'
                  : kelas.kategori.toLowerCase().includes('yoga')
                  ? 'border-purple-500/30 text-purple-300 bg-purple-500/10'
                  : 'border-rose-500/30 text-rose-300 bg-rose-500/10'"
              >
                {{ kelas.kategori }}
              </span>
            </div>

            <!-- Badge Status Biaya / Hak Akses -->
            <div class="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center space-x-1"
                :class="kelas.apakah_termasuk_paket
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'"
              >
                <span>{{ kelas.apakah_termasuk_paket ? '✓' : '🏷️' }}</span>
                <span>{{ kelas.keterangan_biaya }}</span>
              </span>
              <span class="text-[10px] text-slate-400 font-mono">
                Tarif Reguler: {{ kelas.harga_rupiah }}
              </span>
            </div>
          </div>

          <!-- Badge Sisa Kursi Riil -->
          <span
            class="text-[10px] font-bold px-2 py-0.5 rounded-full"
            :class="kelas.sisa_kursi <= 3
              ? 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse'
              : 'bg-rose-500/20 text-rose-200 border border-rose-500/30'"
          >
            {{ kelas.apakah_penuh ? 'Penuh' : `Sisa ${kelas.sisa_kursi} Kursi` }}
          </span>
        </div>

        <p class="text-xs text-slate-400 my-2">
          {{ kelas.pelatih }} • {{ kelas.ruang }}
        </p>

        <div class="flex items-center justify-between pt-2.5 border-t border-white/5">
          <span class="text-xs text-slate-300">
            🕒 {{ kelas.jadwal }} ({{ kelas.durasi }})
          </span>

          <!-- Aksi Tombol -->
          <div class="flex items-center space-x-2">
            <!-- Jika Sudah Dipesan Oleh Member Ini -->
            <template v-if="kelas.sudah_dipesan">
              <span class="text-[11px] font-bold text-neon-pink flex items-center space-x-1">
                <span>✓</span>
                <span>Terdaftar</span>
              </span>
              <button
                @click="batalkanPemesanan(kelas)"
                :disabled="sedangMemesan"
                class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 text-[10px] font-semibold transition"
                title="Batalkan pendaftaran kursi"
              >
                Batal
              </button>
            </template>

            <!-- Jika Kelas Penuh -->
            <button
              v-else-if="kelas.apakah_penuh"
              disabled
              class="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed border border-slate-700"
            >
              Penuh
            </button>

            <!-- Tombol Pesan Kursi -->
            <button
              v-else
              @click="bukaModalPesan(kelas)"
              :disabled="sedangMemesan"
              class="px-3.5 py-1.5 rounded-xl text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 transition flex items-center space-x-1"
              :class="kelas.apakah_termasuk_paket
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-emerald-500/20'
                : 'bg-gradient-to-r from-neon-magenta to-neon-fuchsia shadow-glow-magenta'"
            >
              <span>{{ kelas.apakah_termasuk_paket ? 'Pesan Kursi (Gratis)' : `+ Tambah Kelas (${kelas.harga_rupiah})` }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL PEMESANAN KELAS & PEMBAYARAN KELAS TAMBAHAN -->
    <div
      v-if="modalPesanTerbuka && kelasDipilih"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
    >
      <div class="w-full max-w-md efek-kaca-gelap rounded-3xl p-5 sm:p-6 border border-rose-500/35 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <span class="text-[10px] font-black uppercase tracking-widest text-neon-pink">
              {{ kelasDipilih.apakah_termasuk_paket ? 'Konfirmasi Pemesanan' : 'Pembayaran Kelas Tambahan' }}
            </span>
            <h3 class="text-base font-black text-white mt-0.5">{{ kelasDipilih.nama }}</h3>
          </div>
          <button @click="modalPesanTerbuka = false" class="text-slate-400 hover:text-white text-xs">✕</button>
        </div>

        <!-- Rincian Sesi Kelas -->
        <div class="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs space-y-2">
          <div class="flex justify-between">
            <span class="text-slate-400">Instruktur:</span>
            <span class="font-bold text-white">{{ kelasDipilih.pelatih }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Jadwal Sesi:</span>
            <span class="font-semibold text-slate-200">{{ kelasDipilih.jadwal }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Ruangan:</span>
            <span class="text-slate-300">{{ kelasDipilih.ruang }}</span>
          </div>
          <div class="flex justify-between pt-1 border-t border-white/5">
            <span class="text-slate-400">Biaya Kursi:</span>
            <span class="font-black" :class="kelasDipilih.apakah_termasuk_paket ? 'text-emerald-400' : 'text-neon-pink'">
              {{ kelasDipilih.apakah_termasuk_paket ? 'Rp 0 (Termasuk Paket)' : kelasDipilih.harga_rupiah }}
            </span>
          </div>
        </div>

        <!-- JIKA KELAS TAMBAHAN (BERBAYAR) -->
        <div v-if="!kelasDipilih.apakah_termasuk_paket" class="space-y-3.5 pt-1">
          <!-- Penjelasan Alur -->
          <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 space-y-1">
            <p class="font-bold">ℹ️ Informasi Kelas Tambahan:</p>
            <p class="leading-relaxed">
              Paket membership Anda saat ini mencakup spesialisasi:
              <strong>{{ statusMember?.kelas_pilihan || 'Kelas Studio Utama' }}</strong>.
              Untuk mengikuti sesi <strong>{{ kelasDipilih.nama }}</strong>, silakan lakukan pembayaran sebesar
              <strong class="text-white">{{ kelasDipilih.harga_rupiah }}</strong> dan sertakan bukti transfer di bawah ini.
            </p>
          </div>

          <!-- Pilihan Rekening Pembayaran -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-300">Pilih Rekening Tujuan Transfer:</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                @click="metodePembayaranDipilih = 'Transfer Bank BCA'"
                class="p-2 rounded-xl border text-center transition"
                :class="metodePembayaranDipilih === 'Transfer Bank BCA'
                  ? 'bg-rose-950/40 border-neon-magenta text-white font-black shadow-glow-magenta'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 font-semibold text-xs'"
              >
                <span class="text-xs block">Bank BCA</span>
                <span class="text-[9px] text-slate-400">Transfer</span>
              </button>

              <button
                type="button"
                @click="metodePembayaranDipilih = 'Transfer Bank Mandiri'"
                class="p-2 rounded-xl border text-center transition"
                :class="metodePembayaranDipilih === 'Transfer Bank Mandiri'
                  ? 'bg-rose-950/40 border-neon-magenta text-white font-black shadow-glow-magenta'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 font-semibold text-xs'"
              >
                <span class="text-xs block">Bank Mandiri</span>
                <span class="text-[9px] text-slate-400">Transfer</span>
              </button>

              <button
                type="button"
                @click="metodePembayaranDipilih = 'QRIS Studio Mezona'"
                class="p-2 rounded-xl border text-center transition"
                :class="metodePembayaranDipilih === 'QRIS Studio Mezona'
                  ? 'bg-rose-950/40 border-neon-magenta text-white font-black shadow-glow-magenta'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 font-semibold text-xs'"
              >
                <span class="text-xs block">QRIS Studio</span>
                <span class="text-[9px] text-slate-400">Scan</span>
              </button>
            </div>

            <!-- Detail Rekening -->
            <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
              <div v-if="metodePembayaranDipilih === 'Transfer Bank BCA'" class="flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-slate-400 block">Bank BCA (a.n. {{ dataRekeningStudio.bca.atas_nama }})</span>
                  <span class="font-mono text-sm font-black text-neon-pink">{{ dataRekeningStudio.bca.nomor_format }}</span>
                </div>
                <button
                  type="button"
                  @click="salinNomorRekening(dataRekeningStudio.bca.nomor, 'Bank BCA')"
                  class="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30"
                >
                  Salin 📋
                </button>
              </div>

              <div v-else-if="metodePembayaranDipilih === 'Transfer Bank Mandiri'" class="flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-slate-400 block">Bank Mandiri (a.n. {{ dataRekeningStudio.mandiri.atas_nama }})</span>
                  <span class="font-mono text-sm font-black text-neon-pink">{{ dataRekeningStudio.mandiri.nomor_format }}</span>
                </div>
                <button
                  type="button"
                  @click="salinNomorRekening(dataRekeningStudio.mandiri.nomor, 'Bank Mandiri')"
                  class="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30"
                >
                  Salin 📋
                </button>
              </div>

              <div v-else class="text-center py-1">
                <span class="text-[11px] text-slate-300 block">Scan kode QRIS Studio Mezona di kasir resepsionis studio.</span>
              </div>
            </div>
          </div>

          <!-- Unggah Bukti Transfer -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-300">Unggah Bukti Transfer Kelas *</label>
            <div v-if="!buktiPembayaranBase64" class="relative">
              <input
                ref="inputUploadBukti"
                type="file"
                accept="image/*"
                @change="tanganiPilihBukti"
                class="hidden"
                id="bukti_kelas_input"
              />
              <label
                for="bukti_kelas_input"
                class="w-full p-4 rounded-2xl border-2 border-dashed border-rose-500/40 hover:border-neon-magenta bg-slate-900/60 hover:bg-slate-900 cursor-pointer flex flex-col items-center justify-center space-y-1.5 transition text-center"
              >
                <span class="text-2xl">📸</span>
                <span class="text-xs font-bold text-white">Klik untuk Unggah Bukti Transfer</span>
                <span class="text-[10px] text-slate-400">JPG, PNG atau screenshot m-Banking</span>
              </label>
            </div>

            <div v-else class="p-3 rounded-2xl bg-slate-900 border border-emerald-500/40 flex items-center justify-between">
              <div class="flex items-center space-x-2.5 overflow-hidden">
                <img :src="buktiPembayaranBase64" alt="Bukti" class="w-10 h-10 object-cover rounded-lg shrink-0 border border-white/10" />
                <div class="truncate text-xs">
                  <span class="text-emerald-300 font-bold block truncate">✓ Bukti Siap Dikirim</span>
                  <span class="text-[10px] text-slate-400 truncate block">{{ buktiPembayaranNamaFile }}</span>
                </div>
              </div>
              <button
                type="button"
                @click="hapusBukti"
                class="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-bold transition shrink-0"
              >
                Ganti
              </button>
            </div>
          </div>
        </div>

        <!-- Tombol Aksi -->
        <div class="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            @click="modalPesanTerbuka = false"
            class="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
          >
            Batal
          </button>
          <button
            type="button"
            @click="konfirmasiPemesanan"
            :disabled="sedangMemesan"
            class="py-2.5 rounded-xl bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white font-black text-xs shadow-glow-magenta hover:brightness-110 transition flex items-center justify-center space-x-1"
          >
            <span>{{ sedangMemesan ? 'Memproses...' : (kelasDipilih.apakah_termasuk_paket ? 'Ya, Pesan Kursi' : 'Kirim & Pesan Kelas') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
