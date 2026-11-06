<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'admin'
})

const { tampilkanNotifikasi } = useOtentikasi()

interface PembayaranItem {
  id: string
  nomor_invoice: string
  id_pengguna: string
  nama_member: string
  email: string
  nomor_telepon: string
  foto_profil: string | null
  tipe_transaksi?: string
  id_paket: string
  id_kelas?: string
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

interface StatistikPembayaran {
  total: number
  menunggu: number
  disetujui: number
  ditolak: number
  total_omset: number
  total_omset_rupiah: string
}

const sedangMemuat = ref(true)
const sedangProses = ref(false)
const daftarPembayaran = ref<PembayaranItem[]>([])
const statistik = ref<StatistikPembayaran>({
  total: 0,
  menunggu: 0,
  disetujui: 0,
  ditolak: 0,
  total_omset: 0,
  total_omset_rupiah: 'Rp 0'
})

// Tab & Pencarian
const tabAktif = ref<'SEMUA' | 'MENUNGGU_KONFIRMASI' | 'DISETUJUI' | 'DITOLAK'>('SEMUA')
const kataKunciCari = ref('')

// Modal Pratinjau Gambar Bukti Transfer
const modalBuktiTerbuka = ref(false)
const pembayaranDipilih = ref<PembayaranItem | null>(null)

// Modal Aksi Konfirmasi (Setujui / Tolak)
const modalAksiTerbuka = ref(false)
const jenisAksi = ref<'SETUJUI' | 'TOLAK'>('SETUJUI')
const inputCatatanAdmin = ref('')

// Memuat data pembayaran dari server
const muatData = async () => {
  sedangMemuat.value = true
  try {
    const respon: any = await $fetch('/api/admin/pembayaran')
    if (respon.sukses) {
      daftarPembayaran.value = respon.data || []
      if (respon.statistik) {
        statistik.value = respon.statistik
      }
    }
  } catch (err: any) {
    tampilkanNotifikasi(err.data?.statusMessage || 'Gagal memuat data pembayaran', 'kesalahan')
  } finally {
    sedangMemuat.value = false
  }
}

// Buka modal pratinjau bukti transfer
const bukaModalBukti = (item: PembayaranItem) => {
  pembayaranDipilih.value = item
  modalBuktiTerbuka.value = true
}

// Buka modal konfirmasi aksi (Setujui atau Tolak)
const bukaModalAksi = (item: PembayaranItem, aksi: 'SETUJUI' | 'TOLAK') => {
  pembayaranDipilih.value = item
  jenisAksi.value = aksi
  if (aksi === 'SETUJUI') {
    inputCatatanAdmin.value = 'Pembayaran terverifikasi dan paket telah diaktifkan.'
  } else {
    inputCatatanAdmin.value = 'Bukti transfer tidak valid atau dana belum masuk ke rekening studio.'
  }
  modalAksiTerbuka.value = true
}

// Jalankan eksekusi verifikasi ke backend
const prosesVerifikasi = async () => {
  if (!pembayaranDipilih.value) return

  sedangProses.value = true
  try {
    const respon: any = await $fetch('/api/admin/pembayaran/konfirmasi', {
      method: 'POST',
      body: {
        id_pembayaran: pembayaranDipilih.value.id,
        aksi: jenisAksi.value,
        catatan_admin: inputCatatanAdmin.value
      }
    })

    if (respon.sukses) {
      tampilkanNotifikasi(respon.pesan || 'Status pembayaran berhasil diperbarui!', 'sukses', 4000)
      modalAksiTerbuka.value = false
      modalBuktiTerbuka.value = false
      await muatData()
    }
  } catch (err: any) {
    tampilkanNotifikasi(err.data?.statusMessage || 'Gagal memproses verifikasi', 'kesalahan')
  } finally {
    sedangProses.value = false
  }
}

// Filter data berdasarkan tab dan pencarian
const daftarDisaring = computed(() => {
  return daftarPembayaran.value.filter((item) => {
    // Saring status
    if (tabAktif.value !== 'SEMUA' && item.status !== tabAktif.value) {
      return false
    }

    // Saring kata kunci pencarian
    if (kataKunciCari.value.trim()) {
      const q = kataKunciCari.value.toLowerCase().trim()
      const invoice = (item.nomor_invoice || '').toLowerCase()
      const nama = (item.nama_member || '').toLowerCase()
      const email = (item.email || '').toLowerCase()
      const telp = (item.nomor_telepon || '').toLowerCase()
      const paket = (item.nama_paket || '').toLowerCase()

      return invoice.includes(q) || nama.includes(q) || email.includes(q) || telp.includes(q) || paket.includes(q)
    }

    return true
  })
})

onMounted(() => {
  muatData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Halaman -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2">
          <span class="w-2.5 h-2.5 rounded-full bg-neon-pink animate-pulse"></span>
          <span class="text-xs font-bold uppercase tracking-widest text-neon-pink">Kasir & Keuangan Studio</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-white mt-1">Verifikasi Pembayaran Member</h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Tinjau bukti transfer member untuk perpanjangan dan aktivasi paket membership secara real-time.
        </p>
      </div>

      <div class="flex items-center space-x-3">
        <button
          @click="muatData"
          :disabled="sedangMemuat"
          class="px-4 py-2.5 rounded-xl efek-kaca border border-rose-500/30 hover:border-neon-magenta text-slate-200 text-xs font-bold transition flex items-center space-x-2"
        >
          <span :class="{ 'animate-spin': sedangMemuat }">🔄</span>
          <span>Muat Ulang</span>
        </button>
      </div>
    </div>

    <!-- 4 Kartu Statistik Cepat -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Transaksi -->
      <div class="efek-kaca p-5 rounded-3xl border border-white/10 relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400">Total Transaksi</span>
          <span class="p-2 rounded-xl bg-slate-800 text-sm">📋</span>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-white mt-2">{{ statistik.total }}</div>
        <div class="text-[11px] text-slate-400 mt-1">Semua riwayat transfer</div>
      </div>

      <!-- Menunggu Konfirmasi (Glowing Alert) -->
      <div class="efek-kaca p-5 rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-transparent relative overflow-hidden shadow-lg shadow-amber-500/10">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-amber-300">Menunggu Verifikasi</span>
          <span class="p-2 rounded-xl bg-amber-500/20 text-amber-300 text-sm animate-pulse">⏳</span>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-amber-300 mt-2">{{ statistik.menunggu }}</div>
        <div class="text-[11px] text-amber-200/80 mt-1 font-medium">Perlu segera dicek</div>
      </div>

      <!-- Disetujui -->
      <div class="efek-kaca p-5 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-emerald-400">Telah Disetujui</span>
          <span class="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm">✓</span>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">{{ statistik.disetujui }}</div>
        <div class="text-[11px] text-emerald-300/80 mt-1">Paket otomatis aktif</div>
      </div>

      <!-- Total Omset Terverifikasi -->
      <div class="efek-kaca p-5 rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-transparent relative overflow-hidden shadow-glow-magenta">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-neon-pink">Omset Terverifikasi</span>
          <span class="p-2 rounded-xl bg-rose-500/20 text-neon-pink text-sm">💰</span>
        </div>
        <div class="text-xl sm:text-2xl font-black text-white mt-2 truncate">{{ statistik.total_omset_rupiah }}</div>
        <div class="text-[11px] text-rose-300/80 mt-1">Dana sah masuk studio</div>
      </div>
    </div>

    <!-- Filter Tab & Kolom Pencarian -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <!-- Tabs -->
      <div class="flex items-center space-x-2 overflow-x-auto pb-1">
        <button
          @click="tabAktif = 'SEMUA'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap"
          :class="tabAktif === 'SEMUA'
            ? 'bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white shadow-glow-magenta'
            : 'efek-kaca text-slate-400 hover:text-white border border-white/5'"
        >
          Semua ({{ statistik.total }})
        </button>
        <button
          @click="tabAktif = 'MENUNGGU_KONFIRMASI'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5"
          :class="tabAktif === 'MENUNGGU_KONFIRMASI'
            ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30'
            : 'efek-kaca text-amber-300/90 hover:text-amber-200 border border-amber-500/30'"
        >
          <span>Menunggu</span>
          <span v-if="statistik.menunggu > 0" class="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black">
            {{ statistik.menunggu }}
          </span>
        </button>
        <button
          @click="tabAktif = 'DISETUJUI'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap"
          :class="tabAktif === 'DISETUJUI'
            ? 'bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/30'
            : 'efek-kaca text-emerald-400 hover:text-emerald-300 border border-emerald-500/30'"
        >
          Disetujui ({{ statistik.disetujui }})
        </button>
        <button
          @click="tabAktif = 'DITOLAK'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap"
          :class="tabAktif === 'DITOLAK'
            ? 'bg-red-600 text-white font-black shadow-lg shadow-red-500/30'
            : 'efek-kaca text-red-400 hover:text-red-300 border border-red-500/30'"
        >
          Ditolak ({{ statistik.ditolak }})
        </button>
      </div>

      <!-- Search Input -->
      <div class="relative w-full md:w-80">
        <input
          v-model="kataKunciCari"
          type="text"
          placeholder="Cari invoice, nama member, paket..."
          class="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-neon-magenta focus:ring-1 focus:ring-neon-magenta transition"
        />
        <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <!-- Tabel Data Verifikasi Pembayaran -->
    <div class="efek-kaca rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
      <div v-if="sedangMemuat" class="p-12 text-center space-y-3">
        <div class="w-10 h-10 border-4 border-neon-magenta border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs text-slate-400 font-medium">Memuat data transaksi pembayaran...</p>
      </div>

      <div v-else-if="daftarDisaring.length === 0" class="p-12 text-center space-y-3">
        <div class="text-4xl">💳</div>
        <h3 class="text-sm font-bold text-white">Tidak ada data transaksi pembayaran</h3>
        <p class="text-xs text-slate-400 max-w-sm mx-auto">
          Belum ada pembayaran yang sesuai dengan filter atau kata kunci saat ini.
        </p>
      </div>

      <!-- Desktop & Tablet Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-800/80 bg-slate-900/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th class="py-4 px-5">Invoice & Waktu</th>
              <th class="py-4 px-5">Member</th>
              <th class="py-4 px-5">Paket & Nominal</th>
              <th class="py-4 px-5">Metode</th>
              <th class="py-4 px-5 text-center">Bukti Transfer</th>
              <th class="py-4 px-5">Status</th>
              <th class="py-4 px-5 text-center">Aksi Verifikasi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-xs">
            <tr
              v-for="item in daftarDisaring"
              :key="item.id"
              class="hover:bg-slate-800/30 transition group"
            >
              <!-- Invoice & Waktu -->
              <td class="py-4 px-5">
                <span class="font-mono font-bold text-white block">{{ item.nomor_invoice }}</span>
                <span class="text-[11px] text-slate-400 block mt-0.5">{{ item.dibuat_pada_teks }}</span>
              </td>

              <!-- Member Info -->
              <td class="py-4 px-5">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center font-bold text-neon-pink text-xs shrink-0">
                    <img v-if="item.foto_profil" :src="item.foto_profil" class="w-full h-full object-cover" />
                    <span v-else>{{ item.nama_member.substring(0, 2).toUpperCase() }}</span>
                  </div>
                  <div>
                    <span class="font-bold text-white block">{{ item.nama_member }}</span>
                    <span class="text-[11px] text-slate-400 block">{{ item.email }}</span>
                    <span v-if="item.nomor_telepon !== '-'" class="text-[10px] text-slate-500 block">{{ item.nomor_telepon }}</span>
                  </div>
                </div>
              </td>

              <!-- Paket & Nominal -->
              <td class="py-4 px-5">
                <div class="flex items-center space-x-1.5">
                  <span class="font-bold text-white block">{{ item.nama_paket }}</span>
                  <span
                    v-if="item.tipe_transaksi === 'TAMBAH_KELAS'"
                    class="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0"
                  >
                    Tiket Kelas
                  </span>
                </div>
                <span class="text-[11px] text-slate-400 block">
                  {{ item.tipe_transaksi === 'TAMBAH_KELAS' ? '1 Sesi Kelas Studio' : `Durasi: ${item.durasi_hari} Hari` }}
                </span>
                <span class="text-xs font-black text-neon-pink block mt-0.5">{{ item.jumlah_bayar_rupiah }}</span>
              </td>

              <!-- Metode -->
              <td class="py-4 px-5">
                <span class="px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-300 font-medium text-[11px] border border-slate-700/60 inline-block">
                  {{ item.metode_pembayaran }}
                </span>
                <p v-if="item.catatan_member" class="text-[11px] text-slate-400 mt-1 italic">
                  "{{ item.catatan_member }}"
                </p>
              </td>

              <!-- Bukti Transfer Preview Button -->
              <td class="py-4 px-5 text-center">
                <button
                  @click="bukaModalBukti(item)"
                  class="group/btn relative inline-block p-1 rounded-xl border border-rose-500/30 hover:border-neon-magenta bg-slate-900 transition overflow-hidden shadow-sm"
                  title="Klik untuk memperbesar bukti transfer"
                >
                  <img
                    :src="item.bukti_pembayaran"
                    alt="Bukti Transfer"
                    class="w-12 h-12 object-cover rounded-lg group-hover/btn:scale-105 transition"
                  />
                  <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition rounded-lg">
                    <span class="text-xs">🔍</span>
                  </div>
                </button>
              </td>

              <!-- Status Badge -->
              <td class="py-4 px-5">
                <div v-if="item.status === 'MENUNGGU_KONFIRMASI'">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center space-x-1 animate-pulse">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>Menunggu</span>
                  </span>
                </div>
                <div v-else-if="item.status === 'DISETUJUI'">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center space-x-1">
                    <span>✓</span>
                    <span>Disetujui</span>
                  </span>
                  <p v-if="item.catatan_admin" class="text-[10px] text-slate-400 mt-1">
                    {{ item.catatan_admin }}
                  </p>
                </div>
                <div v-else>
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40 inline-flex items-center space-x-1">
                    <span>✕</span>
                    <span>Ditolak</span>
                  </span>
                  <p v-if="item.catatan_admin" class="text-[10px] text-red-300/80 mt-1 max-w-xs">
                    {{ item.catatan_admin }}
                  </p>
                </div>
              </td>

              <!-- Aksi Verifikasi -->
              <td class="py-4 px-5 text-center">
                <div v-if="item.status === 'MENUNGGU_KONFIRMASI'" class="flex items-center justify-center space-x-2">
                  <button
                    @click="bukaModalAksi(item, 'SETUJUI')"
                    class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center space-x-1"
                  >
                    <span>✓</span>
                    <span>Setujui</span>
                  </button>
                  <button
                    @click="bukaModalAksi(item, 'TOLAK')"
                    class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/80 text-red-400 hover:text-red-200 border border-red-500/30 font-bold text-xs transition flex items-center space-x-1"
                  >
                    <span>✕</span>
                    <span>Tolak</span>
                  </button>
                </div>
                <div v-else class="text-[11px] text-slate-500">
                  Selesai Diproses
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL PRATINJAU BUKTI PEMBAYARAN (ZOOM & DETAIL) -->
    <div
      v-if="modalBuktiTerbuka && pembayaranDipilih"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      @click="modalBuktiTerbuka = false"
    >
      <div
        class="w-full max-w-2xl efek-kaca-gelap rounded-3xl p-6 border border-rose-500/40 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        @click.stop
      >
        <!-- Header Modal Bukti -->
        <div class="flex justify-between items-start pb-4 border-b border-white/10">
          <div>
            <span class="text-[10px] font-black uppercase tracking-widest text-neon-pink">Tinjauan Bukti Transfer</span>
            <h3 class="text-lg font-black text-white mt-0.5">{{ pembayaranDipilih.nomor_invoice }}</h3>
            <p class="text-xs text-slate-400">
              Pengirim: <strong class="text-white">{{ pembayaranDipilih.nama_member }}</strong> ({{ pembayaranDipilih.email }})
            </p>
          </div>
          <button
            @click="modalBuktiTerbuka = false"
            class="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>

        <!-- Konten Gambar Bukti -->
        <div class="flex-1 overflow-y-auto py-4 space-y-4">
          <div class="bg-black/60 rounded-2xl p-2 border border-white/10 flex items-center justify-center min-h-[300px]">
            <img
              :src="pembayaranDipilih.bukti_pembayaran"
              alt="Bukti Transfer Lengkap"
              class="max-h-[60vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>

          <!-- Rincian Transaksi -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-slate-400 block text-[10px]">Paket</span>
              <span class="font-bold text-white">{{ pembayaranDipilih.nama_paket }}</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-slate-400 block text-[10px]">Nominal Transfer</span>
              <span class="font-black text-neon-pink">{{ pembayaranDipilih.jumlah_bayar_rupiah }}</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-slate-400 block text-[10px]">Metode</span>
              <span class="font-bold text-white">{{ pembayaranDipilih.metode_pembayaran }}</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-slate-400 block text-[10px]">Status Saat Ini</span>
              <span class="font-black" :class="{
                'text-amber-400': pembayaranDipilih.status === 'MENUNGGU_KONFIRMASI',
                'text-emerald-400': pembayaranDipilih.status === 'DISETUJUI',
                'text-red-400': pembayaranDipilih.status === 'DITOLAK'
              }">{{ pembayaranDipilih.status }}</span>
            </div>
          </div>

          <div v-if="pembayaranDipilih.catatan_member" class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <span class="text-slate-400 text-[10px] block">Catatan dari Member:</span>
            <span class="text-slate-200 italic">{{ pembayaranDipilih.catatan_member }}</span>
          </div>
        </div>

        <!-- Footer Modal dengan Tombol Verifikasi Cepat -->
        <div class="pt-4 border-t border-white/10 flex items-center justify-between">
          <button
            @click="modalBuktiTerbuka = false"
            class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
          >
            Tutup
          </button>

          <div v-if="pembayaranDipilih.status === 'MENUNGGU_KONFIRMASI'" class="flex items-center space-x-3">
            <button
              @click="bukaModalAksi(pembayaranDipilih, 'TOLAK')"
              class="px-4 py-2 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 hover:text-white font-bold text-xs transition"
            >
              ✕ Tolak Pembayaran
            </button>
            <button
              @click="bukaModalAksi(pembayaranDipilih, 'SETUJUI')"
              class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition flex items-center space-x-1"
            >
              <span>✓ Setujui & Aktifkan Paket (+{{ pembayaranDipilih.durasi_hari }} Hari)</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL KONFIRMASI AKSI (SETUJUI / TOLAK DENGAN CATATAN) -->
    <div
      v-if="modalAksiTerbuka && pembayaranDipilih"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div class="w-full max-w-md efek-kaca-gelap rounded-3xl p-6 border shadow-2xl" :class="jenisAksi === 'SETUJUI' ? 'border-emerald-500/40' : 'border-red-500/40'">
        <div class="flex items-start space-x-3 mb-4">
          <div
            class="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black shrink-0"
            :class="jenisAksi === 'SETUJUI' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'"
          >
            {{ jenisAksi === 'SETUJUI' ? '✓' : '✕' }}
          </div>
          <div>
            <h3 class="text-base font-black text-white">
              {{ jenisAksi === 'SETUJUI' ? 'Setujui Pembayaran Member?' : 'Tolak Pembayaran Member?' }}
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Invoice: <strong class="text-white">{{ pembayaranDipilih.nomor_invoice }}</strong> • {{ pembayaranDipilih.nama_member }}
            </p>
          </div>
        </div>

        <div v-if="jenisAksi === 'SETUJUI'" class="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200/90 mb-4 leading-relaxed">
          ✨ Menyetujui pembayaran akan <strong>memperpanjang masa aktif</strong> member selama <strong>+{{ pembayaranDipilih.durasi_hari }} Hari</strong> dan mengubah status keanggotaan menjadi <strong>AKTIF</strong> secara instan.
        </div>
        <div v-else class="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-200/90 mb-4 leading-relaxed">
          ⚠️ Menolak pembayaran akan menandai transaksi ini sebagai <strong>Ditolak</strong>. Berikan alasan penolakan agar member dapat mengunggah bukti transfer yang benar.
        </div>

        <div class="space-y-2 mb-5">
          <label class="block text-xs font-bold text-slate-300">
            {{ jenisAksi === 'SETUJUI' ? 'Catatan Konfirmasi (Opsional):' : 'Alasan Penolakan (Wajib/Disarankan):' }}
          </label>
          <textarea
            v-model="inputCatatanAdmin"
            rows="3"
            placeholder="Tuliskan catatan verifikasi untuk member..."
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-neon-magenta focus:outline-none"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            @click="modalAksiTerbuka = false"
            class="py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
          >
            Batal
          </button>
          <button
            type="button"
            @click="prosesVerifikasi"
            :disabled="sedangProses"
            class="py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center space-x-1.5"
            :class="jenisAksi === 'SETUJUI'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:brightness-110'
              : 'bg-red-600 text-white shadow-lg shadow-red-500/30 hover:bg-red-500'"
          >
            <span>{{ sedangProses ? 'Memproses...' : (jenisAksi === 'SETUJUI' ? '✓ Ya, Setujui Sekarang' : '✕ Ya, Tolak Pembayaran') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
