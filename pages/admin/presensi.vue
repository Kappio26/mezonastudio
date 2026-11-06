<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'admin'
})

const { tampilkanNotifikasi } = useOtentikasi()

interface PresensiItem {
  id: string
  id_member: string
  nama_member: string
  email_member: string
  telepon_member: string
  paket_member: string
  id_kelas: string
  nama_kelas: string
  pelatih: string
  ruang: string
  jadwal: string
  tanggal_sesi: string
  tanggal_sesi_teks: string
  jam_sesi_teks: string
  status: 'HADIR' | 'DIKONFIRMASI' | 'MENUNGGU' | 'DIBATALKAN' | string
  catatan: string
  waktu_check_in: string | null
}

const sedangMemuat = ref(true)
const sedangMenyimpan = ref(false)
const daftarPresensi = ref<PresensiItem[]>([])
const ringkasan = ref({
  total: 0,
  hadir: 0,
  dikonfirmasi: 0,
  dibatalkan: 0
})

// Tab & Pencarian
const tabAktif = ref<'SEMUA' | 'HADIR' | 'DIKONFIRMASI' | 'DIBATALKAN'>('SEMUA')
const kataKunciCari = ref('')

const muatPresensi = async () => {
  sedangMemuat.value = true
  try {
    const respon: any = await $fetch('/api/admin/presensi')
    if (respon.sukses && respon.data) {
      daftarPresensi.value = respon.data
      if (respon.ringkasan) {
        ringkasan.value = respon.ringkasan
      }
    }
  } catch (e: any) {
    tampilkanNotifikasi(e.data?.statusMessage || 'Gagal memuat log presensi', 'kesalahan')
  } finally {
    sedangMemuat.value = false
  }
}

const ubahStatusPresensi = async (item: PresensiItem, statusBaru: string) => {
  sedangMenyimpan.value = true
  try {
    const res: any = await $fetch('/api/admin/presensi', {
      method: 'PUT',
      body: {
        id_pemesanan: item.id,
        status: statusBaru
      }
    })
    tampilkanNotifikasi(res.pesan || `Presensi berhasil diubah ke ${statusBaru}`, 'sukses')
    await muatPresensi()
  } catch (e: any) {
    tampilkanNotifikasi(e.data?.statusMessage || 'Gagal memperbarui status presensi', 'kesalahan')
  } finally {
    sedangMenyimpan.value = false
  }
}

const daftarPresensiTersaring = computed(() => {
  return daftarPresensi.value.filter((item) => {
    // Filter Tab Status
    if (tabAktif.value !== 'SEMUA' && item.status !== tabAktif.value) {
      return false
    }

    // Filter Kata Kunci
    if (kataKunciCari.value.trim()) {
      const q = kataKunciCari.value.toLowerCase()
      const cocokNama = item.nama_member.toLowerCase().includes(q)
      const cocokEmail = item.email_member.toLowerCase().includes(q)
      const cocokKelas = item.nama_kelas.toLowerCase().includes(q)
      const cocokPelatih = item.pelatih.toLowerCase().includes(q)
      if (!cocokNama && !cocokEmail && !cocokKelas && !cocokPelatih) return false
    }

    return true
  })
})

onMounted(() => {
  muatPresensi()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Halaman Presensi -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-white tracking-tight">Log Presensi & Gate Masuk</h2>
        <p class="text-xs text-slate-400 mt-1">
          Pantau kehadiran sesi kelas member dan verifikasi check-in turnstile studio secara real-time.
        </p>
      </div>

      <div class="flex items-center space-x-3">
        <button
          @click="muatPresensi"
          :disabled="sedangMemuat"
          class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center space-x-2"
        >
          <span :class="{ 'animate-spin': sedangMemuat }">🔄</span>
          <span>Perbarui Data</span>
        </button>
      </div>
    </div>

    <!-- Kartu Statistik Cepat Presensi -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Presensi -->
      <div
        @click="tabAktif = 'SEMUA'"
        class="cursor-pointer efek-kaca rounded-2xl p-4 border transition duration-200"
        :class="tabAktif === 'SEMUA' ? 'border-neon-zamrud bg-rose-950/20 shadow-glow-magenta' : 'border-slate-800 hover:border-slate-700'"
      >
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Booking Sesi</span>
          <span class="text-lg">🎟️</span>
        </div>
        <p class="text-2xl font-black text-white">{{ ringkasan.total }} <span class="text-xs text-slate-400 font-normal">Sesi</span></p>
        <p class="text-[11px] text-slate-500 mt-1">Seluruh reservasi kelas studio</p>
      </div>

      <!-- Terkonfirmasi Hadir -->
      <div
        @click="tabAktif = 'HADIR'"
        class="cursor-pointer efek-kaca rounded-2xl p-4 border transition duration-200"
        :class="tabAktif === 'HADIR' ? 'border-emerald-500 bg-emerald-950/30' : 'border-slate-800 hover:border-emerald-500/40'"
      >
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Telah Hadir</span>
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <p class="text-2xl font-black text-emerald-400">{{ ringkasan.hadir }} <span class="text-xs text-slate-400 font-normal">Check-In</span></p>
        <p class="text-[11px] text-emerald-400/80 mt-1">Member terverifikasi hadir di studio</p>
      </div>

      <!-- Menunggu Masuk / Dikonfirmasi -->
      <div
        @click="tabAktif = 'DIKONFIRMASI'"
        class="cursor-pointer efek-kaca rounded-2xl p-4 border transition duration-200"
        :class="tabAktif === 'DIKONFIRMASI' ? 'border-pink-500 bg-pink-950/30' : 'border-slate-800 hover:border-pink-500/40'"
      >
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs text-pink-400 font-semibold uppercase tracking-wider">Terdaftar / Menunggu</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold">Siap Scan</span>
        </div>
        <p class="text-2xl font-black text-pink-400">{{ ringkasan.dikonfirmasi }} <span class="text-xs text-slate-400 font-normal">Member</span></p>
        <p class="text-[11px] text-pink-400/70 mt-1">Belum melakukan scan masuk</p>
      </div>

      <!-- Dibatalkan -->
      <div
        @click="tabAktif = 'DIBATALKAN'"
        class="cursor-pointer efek-kaca rounded-2xl p-4 border transition duration-200"
        :class="tabAktif === 'DIBATALKAN' ? 'border-red-500 bg-red-950/30' : 'border-slate-800 hover:border-red-500/40'"
      >
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs text-red-400 font-semibold uppercase tracking-wider">Dibatalkan</span>
          <span class="text-lg">✕</span>
        </div>
        <p class="text-2xl font-black text-red-400">{{ ringkasan.dibatalkan }} <span class="text-xs text-slate-400 font-normal">Batal</span></p>
        <p class="text-[11px] text-red-400/70 mt-1">Pemesanan kursi dilepas</p>
      </div>
    </div>

    <!-- Filter & Pencarian -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <!-- Tab Pilihan Status -->
      <div class="flex items-center space-x-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 max-w-fit">
        <button
          @click="tabAktif = 'SEMUA'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition"
          :class="tabAktif === 'SEMUA' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'"
        >
          Semua ({{ ringkasan.total }})
        </button>
        <button
          @click="tabAktif = 'HADIR'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
          :class="tabAktif === 'HADIR' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-emerald-400'"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Hadir ({{ ringkasan.hadir }})</span>
        </button>
        <button
          @click="tabAktif = 'DIKONFIRMASI'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
          :class="tabAktif === 'DIKONFIRMASI' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'text-slate-400 hover:text-pink-400'"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
          <span>Dikonfirmasi ({{ ringkasan.dikonfirmasi }})</span>
        </button>
      </div>

      <!-- Kotak Cari -->
      <div class="relative w-full sm:w-72">
        <input
          v-model="kataKunciCari"
          type="text"
          placeholder="Cari member, kelas, instruktur..."
          class="w-full px-3.5 py-2 pl-9 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-magenta transition"
        />
        <span class="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
      </div>
    </div>

    <!-- Tabel Data Presensi Riil dari Database -->
    <div class="efek-kaca rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th class="px-6 py-3.5">Member Studio</th>
              <th class="px-6 py-3.5">Kelas & Instruktur</th>
              <th class="px-6 py-3.5">Waktu Sesi</th>
              <th class="px-6 py-3.5">Status Presensi</th>
              <th class="px-6 py-3.5 text-right">Aksi Verifikasi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-200">
            <tr v-if="sedangMemuat">
              <td colspan="5" class="px-6 py-12 text-center text-slate-400 text-xs">
                <div class="inline-block animate-spin text-2xl mb-2">🔄</div>
                <p>Memuat catatan presensi gate dari basis data...</p>
              </td>
            </tr>
            <tr v-else-if="daftarPresensiTersaring.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-slate-400 text-xs">
                Tidak ada data presensi yang sesuai dengan filter.
              </td>
            </tr>
            <tr v-else v-for="item in daftarPresensiTersaring" :key="item.id" class="hover:bg-slate-800/40 transition">
              <!-- Member -->
              <td class="px-6 py-4">
                <div class="flex items-center space-x-3">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs bg-neon-magenta/20 text-neon-pink border border-neon-magenta/30">
                    {{ item.nama_member.substring(0, 2).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-bold text-white text-xs sm:text-sm">{{ item.nama_member }}</p>
                    <p class="text-[11px] text-slate-400">{{ item.email_member }}</p>
                    <span class="inline-block mt-0.5 text-[10px] text-rose-300 font-semibold">
                      {{ item.paket_member }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Kelas & Pelatih -->
              <td class="px-6 py-4">
                <p class="font-bold text-white text-xs sm:text-sm">{{ item.nama_kelas }}</p>
                <p class="text-[11px] text-rose-300">Instruktur: {{ item.pelatih }}</p>
                <span class="text-[10px] text-slate-500">📍 {{ item.ruang }}</span>
              </td>

              <!-- Waktu Sesi -->
              <td class="px-6 py-4">
                <p class="text-xs text-white font-medium">{{ item.tanggal_sesi_teks }}</p>
                <p class="text-[11px] text-slate-400 font-mono">{{ item.jadwal }}</p>
              </td>

              <!-- Status Badge -->
              <td class="px-6 py-4">
                <span
                  class="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
                  :class="item.status === 'HADIR'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : item.status === 'DIKONFIRMASI'
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'"
                >
                  {{ item.status === 'HADIR' ? '✓ Hadir' : item.status === 'DIKONFIRMASI' ? 'Dikonfirmasi' : item.status }}
                </span>
              </td>

              <!-- Aksi Verifikasi -->
              <td class="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                <button
                  v-if="item.status !== 'HADIR'"
                  @click="ubahStatusPresensi(item, 'HADIR')"
                  :disabled="sedangMenyimpan"
                  class="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition shadow-sm"
                  title="Verifikasi Check-in Hadir"
                >
                  ✓ Konfirmasi Hadir
                </button>
                <button
                  v-else
                  @click="ubahStatusPresensi(item, 'DIKONFIRMASI')"
                  :disabled="sedangMenyimpan"
                  class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                  title="Batalkan Verifikasi Hadir"
                >
                  Reset Status
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
