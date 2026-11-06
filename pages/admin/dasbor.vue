<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'admin',
  alias: ['/admin/dashboard']
})

const { dataPengguna } = useOtentikasi()

interface MetrikAdmin {
  total_member: number
  total_member_aktif: number
  total_member_kadaluwarsa: number
  total_pembayaran_menunggu?: number
  total_pelatih: number
  total_kelas: number
  total_presensi: number
  total_tiket_kelas?: number
  total_pendapatan: number
  total_pendapatan_rupiah: string
}

interface AktivitasItem {
  id: string
  nama: string
  tipe: string
  kelas: string
  waktu: string
  metode: string
  status: string
}

interface KelasItem {
  id: string
  nama: string
  pelatih: string
  hari: string
  jam: string
  ruang: string
  terisi: number
  kapasitas: number
}

const sedangMemuat = ref(true)
const metrik = ref<MetrikAdmin>({
  total_member: 0,
  total_member_aktif: 0,
  total_member_kadaluwarsa: 0,
  total_pelatih: 0,
  total_kelas: 0,
  total_presensi: 0,
  total_pendapatan: 0,
  total_pendapatan_rupiah: 'Rp 0'
})

const daftarAktivitas = ref<AktivitasItem[]>([])
const daftarKelas = ref<KelasItem[]>([])

const muatDataDasbor = async () => {
  sedangMemuat.value = true
  try {
    const respon: any = await $fetch('/api/admin/dasbor')
    if (respon.sukses && respon.data) {
      metrik.value = respon.data.metrik
      daftarAktivitas.value = respon.data.aktivitas_presensi
      daftarKelas.value = respon.data.daftar_kelas
    }
  } catch (error) {
    console.error('Gagal memuat data dasbor:', error)
  } finally {
    sedangMemuat.value = false
  }
}

onMounted(() => {
  muatDataDasbor()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header Dasbor Admin -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-slate-900 tracking-tight">
          Ringkasan Operasional Mezona Studio
        </h2>
        <p class="text-sm text-slate-500 mt-1">
          Pantau statistik anggota, keuangan gym, dan pergerakan kelas secara real-time dari database.
        </p>
      </div>

      <div class="flex items-center space-x-3">
        <button
          @click="muatDataDasbor"
          :disabled="sedangMemuat"
          class="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs transition flex items-center space-x-1.5"
        >
          <span :class="{ 'animate-spin': sedangMemuat }">🔄</span>
          <span>Perbarui Data</span>
        </button>
        <NuxtLink
          to="/admin/keuangan"
          class="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition flex items-center space-x-1.5"
        >
          <span>📥 Laporan Keuangan PDF</span>
        </NuxtLink>
        <NuxtLink
          to="/admin/pembayaran"
          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white text-xs font-bold shadow-md hover:brightness-110 transition flex items-center space-x-1.5"
        >
          <span>💳 Verifikasi Pembayaran</span>
          <span
            v-if="(metrik.total_pembayaran_menunggu || 0) > 0"
            class="px-1.5 py-0.2 bg-white text-rose-600 rounded-full text-[10px] font-black animate-pulse"
          >
            {{ metrik.total_pembayaran_menunggu }}
          </span>
        </NuxtLink>
        <NuxtLink
          to="/admin/member"
          class="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition flex items-center space-x-1"
        >
          <span>+ Kelola Member</span>
        </NuxtLink>
      </div>
    </div>

    <!-- BANNER PERINGATAN VERIFIKASI PEMBAYARAN MENUNGGU KONFIRMASI -->
    <div
      v-if="(metrik.total_pembayaran_menunggu || 0) > 0"
      class="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div class="flex items-center space-x-3.5">
        <div class="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-xl shrink-0 animate-bounce">
          ⏳
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-black uppercase tracking-wider text-amber-800">Perhatian Admin</span>
            <span class="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
              {{ metrik.total_pembayaran_menunggu }} Menunggu
            </span>
          </div>
          <p class="text-xs text-amber-700 mt-0.5 font-medium">
            Terdapat bukti transfer paket member baru yang menunggu konfirmasi persetujuan Anda.
          </p>
        </div>
      </div>
      <NuxtLink
        to="/admin/pembayaran"
        class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5 shrink-0"
      >
        <span>Lihat & Verifikasi Sekarang →</span>
      </NuxtLink>
    </div>

    <!-- Kartu Metrik Utama (Diambil Riil dari PostgreSQL) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <!-- 1. Total Member Aktif -->
      <NuxtLink
        to="/admin/member"
        class="efek-kaca rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/20 transition duration-300 block group"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-2xl group-hover:scale-110 transition">👥</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Paket Aktif
          </span>
        </div>
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Member Aktif</p>
        <p class="text-2xl font-black text-neon-zamrud mt-1">
          {{ sedangMemuat ? '...' : `${metrik.total_member_aktif} Orang` }}
        </p>
        <p class="text-[11px] text-slate-500 mt-1">
          Dari {{ metrik.total_member }} terdaftar
        </p>
      </NuxtLink>

      <!-- 2. Total Member Tidak Aktif / Kadaluwarsa -->
      <NuxtLink
        to="/admin/member"
        class="efek-kaca rounded-2xl p-5 border border-slate-800 hover:border-red-500/40 hover:bg-slate-800/20 transition duration-300 block group"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-2xl group-hover:scale-110 transition">⚠️</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            Perlu Perpanjang
          </span>
        </div>
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Member Tidak Aktif</p>
        <p class="text-2xl font-black text-red-400 mt-1">
          {{ sedangMemuat ? '...' : `${metrik.total_member_kadaluwarsa} Orang` }}
        </p>
        <p class="text-[11px] text-red-400/80 mt-1">
          Paket 1 bln telah habis
        </p>
      </NuxtLink>

      <!-- 3. Pendapatan Member -->
      <NuxtLink
        to="/admin/keuangan"
        class="efek-kaca rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/20 transition duration-300 block group"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-2xl group-hover:scale-110 transition">💰</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Omset Paket
          </span>
        </div>
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimasi Omset</p>
        <p class="text-xl sm:text-2xl font-black text-white mt-1 truncate">
          {{ sedangMemuat ? '...' : metrik.total_pendapatan_rupiah }}
        </p>
        <p class="text-[11px] text-slate-500 mt-1">
          Total omset berjalan
        </p>
      </NuxtLink>

      <!-- 4. Total Presensi/Pemesanan -->
      <NuxtLink
        to="/admin/presensi"
        class="efek-kaca rounded-2xl p-5 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-800/20 transition duration-300 block group"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-2xl group-hover:scale-110 transition">🏷️</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
            Check-In Sesi
          </span>
        </div>
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Presensi Sesi</p>
        <p class="text-2xl font-black text-white mt-1">
          {{ sedangMemuat ? '...' : `${metrik.total_presensi} Sesi` }}
        </p>
        <p class="text-[11px] text-slate-500 mt-1">
          Studio turnstile scan
        </p>
      </NuxtLink>

      <!-- 5. Pelatih Aktif -->
      <NuxtLink
        to="/admin/pelatih"
        class="efek-kaca rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/20 transition duration-300 block group"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-2xl group-hover:scale-110 transition">🏋️</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Instruktur
          </span>
        </div>
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pelatih Aktif</p>
        <p class="text-2xl font-black text-white mt-1">
          {{ sedangMemuat ? '...' : `${metrik.total_pelatih} Trainer` }}
        </p>
        <p class="text-[11px] text-slate-500 mt-1">
          Coach Tania Putri
        </p>
      </NuxtLink>
    </div>

    <!-- Ringkasan 3 Kelas Aktif Studio -->
    <div class="efek-kaca rounded-2xl border border-slate-800 p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-white text-base">Status 3 Kelas Studio</h3>
          <p class="text-xs text-slate-400">Jadwal dan kuota peserta Zumba, Yoga, dan Pomfit</p>
        </div>
        <NuxtLink to="/admin/kelas" class="text-xs font-semibold text-neon-teal hover:underline">
          Kelola Detail →
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="k in daftarKelas"
          :key="k.id"
          class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
        >
          <div>
            <div class="flex justify-between items-start mb-1">
              <h4 class="text-sm font-bold text-white">{{ k.nama }}</h4>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Aktif
              </span>
            </div>
            <p class="text-xs text-slate-400">{{ k.pelatih }} • {{ k.ruang }}</p>
            <p class="text-xs text-teal-300 mt-2 font-medium">🕒 {{ k.hari }} ({{ k.jam }})</p>
          </div>
          <div class="mt-3 pt-2 border-t border-slate-800/80 flex justify-between text-xs text-slate-300">
            <span>Kapasitas Kursi</span>
            <span class="font-bold text-neon-zamrud">{{ k.terisi }}/{{ k.kapasitas }} Peserta</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabel Presensi Real-Time & Aktivitas Terkini (Data Riil Database) -->
    <div class="efek-kaca rounded-2xl border border-slate-800 overflow-hidden">
      <div class="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 class="font-bold text-white text-base">Aktivitas Presensi Terkini</h3>
          <p class="text-xs text-slate-400 mt-0.5">Catatan check-in sesi kelas member terdaftar di database</p>
        </div>
        <span class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Live Feed Database</span>
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th class="px-6 py-3.5">Nama Member</th>
              <th class="px-6 py-3.5">Paket Membership</th>
              <th class="px-6 py-3.5">Kelas Diikuti</th>
              <th class="px-6 py-3.5">Waktu Sesi</th>
              <th class="px-6 py-3.5">Metode</th>
              <th class="px-6 py-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-200">
            <tr v-if="sedangMemuat">
              <td colspan="6" class="px-6 py-8 text-center text-slate-400 text-xs">
                Memuat data riil dari PostgreSQL...
              </td>
            </tr>
            <tr v-else-if="daftarAktivitas.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-slate-400 text-xs">
                Belum ada aktivitas presensi kelas yang tercatat.
              </td>
            </tr>
            <tr
              v-else
              v-for="item in daftarAktivitas"
              :key="item.id"
              class="hover:bg-slate-800/30 transition"
            >
              <td class="px-6 py-4 font-bold text-white">{{ item.nama }}</td>
              <td class="px-6 py-4 text-xs">
                <span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                  {{ item.tipe }}
                </span>
              </td>
              <td class="px-6 py-4 text-xs font-semibold text-emerald-300">{{ item.kelas }}</td>
              <td class="px-6 py-4 text-slate-400 text-xs">{{ item.waktu }}</td>
              <td class="px-6 py-4 text-slate-400 text-xs">{{ item.metode }}</td>
              <td class="px-6 py-4 text-right">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-bold"
                  :class="item.status === 'Hadir' ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'"
                >
                  {{ item.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
