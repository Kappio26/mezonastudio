<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

const rute = useRoute()
const { dataPengguna, inisialisasiSesi, bukaKonfirmasiKeluar } = useOtentikasi()

const periksaAksesSeluler = () => {
  inisialisasiSesi()
  if (!dataPengguna.value) {
    navigateTo('/masuk', { replace: true })
  }
}

onMounted(() => {
  periksaAksesSeluler()
  if (import.meta.client) {
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        periksaAksesSeluler()
      }
    })
  }
})

watch(() => rute.path, () => {
  periksaAksesSeluler()
})

// Menu navigasi bawah berdasarkan peran
const menuNavigasi = computed(() => {
  const peran = dataPengguna.value?.peran

  if (peran === 'PELATIH') {
    return [
      { nama: 'Dasbor', ikon: 'dasbor', rute: '/pelatih/dasbor' },
      { nama: 'Jadwal', ikon: 'kalender', rute: '/pelatih/jadwal' },
      { nama: 'Klien', ikon: 'pengguna', rute: '/pelatih/klien' },
      { nama: 'Profil', ikon: 'profil', rute: '/pelatih/profil' }
    ]
  }

  // Standar untuk MEMBER
  return [
    { nama: 'Beranda', ikon: 'beranda', rute: '/member/dasbor' },
    { nama: 'Kelas', ikon: 'barbel', rute: '/member/kelas' },
    { nama: 'Jadwal', ikon: 'kalender', rute: '/member/jadwal' },
    { nama: 'Profil', ikon: 'profil', rute: '/member/profil' }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
    <!-- Efek Cahaya Ambient Background Lembut di Latar Putih -->
    <div class="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-200/35 blur-[120px] rounded-full pointer-events-none z-0"></div>
    <div class="fixed bottom-24 right-0 w-80 h-80 bg-pink-200/30 blur-[120px] rounded-full pointer-events-none z-0"></div>

    <!-- Header Atas Seluler -->
    <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 pt-aman-seluler shadow-xs">
      <div class="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        <!-- Logo Resmi Mezona Studio -->
        <NuxtLink to="/member/dasbor" class="flex items-center space-x-2 py-1">
          <img
            src="/images/logo-mezona.png"
            alt="Mezona Studio"
            class="h-9 w-auto object-contain drop-shadow-sm"
          />
        </NuxtLink>

        <!-- Tombol Aksi Kanan (Status Pengguna / Keluar) -->
        <div class="flex items-center space-x-2">
          <NuxtLink
            v-if="dataPengguna"
            :to="dataPengguna.peran === 'PELATIH' ? '/pelatih/profil' : '/member/profil'"
            class="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 pl-1.5 pr-2.5 py-1 rounded-full transition"
            title="Buka Profil"
          >
            <div class="w-4 h-4 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
              <img
                v-if="dataPengguna.foto_profil"
                :src="dataPengguna.foto_profil"
                class="w-full h-full object-cover"
              />
              <span v-else class="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
            </div>
            <span class="text-xs font-bold text-rose-600">{{ dataPengguna.peran }}</span>
          </NuxtLink>
          <button
            @click="bukaKonfirmasiKeluar"
            title="Keluar Akun"
            class="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 transition-all duration-300 active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Konten Halaman Seluler Utama -->
    <main class="flex-1 w-full max-w-md mx-auto px-4 py-5 z-10 pb-aman-seluler">
      <slot />
    </main>

    <!-- Navigasi Bawah Mengambang Glassmorphism (Bottom Bar) -->
    <nav class="fixed bottom-0 left-0 right-0 z-50">
      <div class="max-w-md mx-auto px-3 pb-3 pt-1">
        <div class="bg-white/95 backdrop-blur-xl rounded-2xl p-1.5 shadow-xl border border-slate-200 flex items-center justify-around">
          <NuxtLink
            v-for="item in menuNavigasi"
            :key="item.rute"
            :to="item.rute"
            class="relative flex flex-col items-center justify-center py-2 px-3.5 rounded-xl transition-all duration-300 group"
            :class="rute.path === item.rute ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-800'"
          >
            <!-- Indikator Efek Glow Latar Belakang Tab Aktif -->
            <div
              v-if="rute.path === item.rute"
              class="absolute inset-0 bg-rose-50 rounded-xl border border-rose-200 shadow-xs"
            ></div>

            <!-- Ikon Navigasi Berdasarkan Tipe -->
            <div class="relative z-10 transform transition-transform group-active:scale-90">
              <!-- Ikon Beranda / Dasbor -->
              <svg v-if="item.ikon === 'beranda' || item.ikon === 'dasbor'" class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <!-- Ikon Barbel / Kelas Gym -->
              <svg v-else-if="item.ikon === 'barbel'" class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <!-- Ikon Kalender / Jadwal -->
              <svg v-else-if="item.ikon === 'kalender'" class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 7V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <!-- Ikon Klien / Pengguna -->
              <svg v-else-if="item.ikon === 'pengguna'" class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <!-- Ikon Profil -->
              <svg v-else class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <!-- Teks Label Menu -->
            <span class="relative z-10 text-[11px] font-semibold tracking-wide">
              {{ item.nama }}
            </span>
          </NuxtLink>
        </div>
      </div>
    </nav>
  </div>
</template>
