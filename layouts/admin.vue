<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

const rute = useRoute()
const { dataPengguna, inisialisasiSesi, bukaKonfirmasiKeluar } = useOtentikasi()

const drawerMobileTerbuka = ref(false)

const periksaAksesAdmin = () => {
  inisialisasiSesi()
  if (!dataPengguna.value || dataPengguna.value.peran !== 'ADMIN') {
    navigateTo('/masuk', { replace: true })
  }
}

onMounted(() => {
  periksaAksesAdmin()
  if (import.meta.client) {
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        periksaAksesAdmin()
      }
    })
  }
})

watch(() => rute.path, () => {
  drawerMobileTerbuka.value = false
  periksaAksesAdmin()
})

const menuAdmin = [
  { nama: 'Dasbor Utama', rute: '/admin/dasbor', ikon: 'dasbor' },
  { nama: 'Verifikasi Pembayaran', rute: '/admin/pembayaran', ikon: 'pembayaran' },
  { nama: 'Data Member', rute: '/admin/member', ikon: 'member' },
  { nama: 'Data Pelatih', rute: '/admin/pelatih', ikon: 'pelatih' },
  { nama: 'Paket Membership', rute: '/admin/paket', ikon: 'paket' },
  { nama: 'Jadwal Kelas', rute: '/admin/kelas', ikon: 'kelas' },
  { nama: 'Presensi Gym', rute: '/admin/presensi', ikon: 'presensi' },
  { nama: 'Laporan Keuangan', rute: '/admin/keuangan', ikon: 'keuangan' }
]
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 flex selection:bg-rose-500 selection:text-white">
    <!-- Sidebar Admin Web (Desktop) -->
    <aside class="w-64 border-r border-slate-200 bg-white shadow-xs flex flex-col justify-between hidden md:flex shrink-0">
      <div>
        <!-- Brand Mezona Admin dengan Logo Resmi -->
        <div class="p-5 border-b border-slate-200">
          <NuxtLink to="/admin/dasbor" class="block group">
            <div class="relative py-1">
              <div class="absolute -inset-1 bg-gradient-to-r from-neon-magenta/15 to-neon-fuchsia/15 rounded-xl blur-sm opacity-50 group-hover:opacity-100 transition"></div>
              <img
                src="/images/logo-mezona.png"
                alt="Mezona Studio"
                class="relative h-10 w-auto object-contain mx-auto drop-shadow-sm"
              />
            </div>
            <div class="text-center mt-2">
              <span class="text-[10px] font-black text-rose-600 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 inline-block">
                ADMIN PANEL STUDIO
              </span>
            </div>
          </NuxtLink>
        </div>

        <!-- Daftar Menu Navigasi -->
        <nav class="p-4 space-y-1.5">
          <NuxtLink
            v-for="item in menuAdmin"
            :key="item.rute"
            :to="item.rute"
            class="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group"
            :class="rute.path === item.rute
              ? 'bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white shadow-md font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <span class="w-2 h-2 rounded-full" :class="rute.path === item.rute ? 'bg-white' : 'bg-rose-400 group-hover:bg-rose-600'"></span>
            <span>{{ item.nama }}</span>
          </NuxtLink>
        </nav>
      </div>

      <!-- Profil Admin & Tombol Keluar di Bawah Sidebar -->
      <div class="p-4 border-t border-slate-200">
        <div class="p-3 rounded-2xl flex items-center justify-between mb-3 border border-slate-200 bg-slate-50">
          <div class="flex items-center space-x-3 truncate">
            <div class="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 font-bold text-sm">
              AD
            </div>
            <div class="truncate">
              <p class="text-xs font-bold text-slate-900 truncate">{{ dataPengguna?.nama_lengkap || 'Administrator' }}</p>
              <p class="text-[10px] text-rose-600 font-semibold">Super Admin</p>
            </div>
          </div>
        </div>

        <button
          @click="bukaKonfirmasiKeluar"
          class="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all duration-200"
        >
          <span>Keluar Sesi</span>
        </button>
      </div>
    </aside>

    <!-- Mobile Drawer Sidebar (Layar Handphone/Tablet) -->
    <div
      v-if="drawerMobileTerbuka"
      class="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm flex"
      @click="drawerMobileTerbuka = false"
    >
      <div
        class="w-72 max-w-[80%] h-full bg-white border-r border-slate-200 flex flex-col justify-between p-5"
        @click.stop
      >
        <div>
          <!-- Header Drawer Mobile -->
          <div class="flex items-center justify-between pb-4 border-b border-slate-200">
            <img
              src="/images/logo-mezona.png"
              alt="Mezona Studio"
              class="h-8 w-auto object-contain"
            />
            <button
              @click="drawerMobileTerbuka = false"
              class="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>

          <div class="mt-2 mb-4">
            <span class="text-[9px] font-black text-rose-600 uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 inline-block">
              ADMIN PANEL
            </span>
          </div>

          <!-- Nav Menu Mobile -->
          <nav class="space-y-1">
            <NuxtLink
              v-for="item in menuAdmin"
              :key="item.rute"
              :to="item.rute"
              class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition"
              :class="rute.path === item.rute
                ? 'bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white shadow-md font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="rute.path === item.rute ? 'bg-white' : 'bg-rose-400'"></span>
              <span>{{ item.nama }}</span>
            </NuxtLink>
          </nav>
        </div>

        <div class="pt-4 border-t border-slate-200">
          <p class="text-xs font-bold text-slate-900 mb-2">{{ dataPengguna?.nama_lengkap || 'Administrator' }}</p>
          <button
            @click="bukaKonfirmasiKeluar"
            class="w-full py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition"
          >
            Keluar Sesi
          </button>
        </div>
      </div>
    </div>

    <!-- Konten Utama Halaman Web Admin -->
    <div class="flex-1 flex flex-col overflow-y-auto min-w-0">
      <!-- Header Atas Web Admin -->
      <header class="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div class="flex items-center space-x-3">
          <!-- Tombol Hamburger Mobile -->
          <button
            @click="drawerMobileTerbuka = true"
            class="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            title="Buka Menu"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <span class="text-xs px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-semibold tracking-wide">
            Panel Kontrol Studio
          </span>
          <span class="text-slate-300 text-xs hidden sm:inline">|</span>
          <span class="text-xs text-slate-500 hidden sm:inline">Status Server: <strong class="text-emerald-600">Online</strong></span>
        </div>

        <div class="flex items-center space-x-3 text-xs text-slate-600">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Sesi Aktif</span>
        </div>
      </header>

      <!-- Area Tampilan Konten -->
      <main class="p-4 sm:p-8 flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>
