<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: false
})

const { dataPengguna, inisialisasiSesi, dapatkanRuteSesuaiPeran } = useOtentikasi()

// State Interaktif
const modalFotoTerbuka = ref(false)
const fotoDipilih = ref<{ url: string; judul: string; deskripsi: string; tag: string } | null>(null)
const modalDownloadTerbuka = ref(false)
const menuSelulerTerbuka = ref(false)
const tabPeranLogin = ref<'MEMBER' | 'PELATIH' | 'ADMIN'>('MEMBER')

// 3 Program Kelas Spesialisasi Mezona Studio
const programKelas = [
  {
    id: 'zumba',
    nama: 'Zumba',
    ikon: '💃',
    tag: 'Kardio & Dance Party',
    kalori: '± 500 - 650 kkal',
    durasi: '60 Menit',
    pelatih: 'Coach Tania Putri',
    jadwal: 'Selasa & Kamis, 18:30 WITA',
    ruang: 'Studio Beta',
    deskripsi: 'Kombinasi tarian berenergi tinggi dengan irama Latin & hits terpopuler. Membakar lemak secara maksimal sambil melepas stres dalam suasana penuh keseruan.',
    manfaat: [
      'Pembakaran lemak seluruh tubuh',
      'Meningkatkan mood & relaksasi pikiran',
      'Melatih fleksibilitas dan kelenturan',
      'Cocok untuk semua tingkatan kebugaran'
    ],
    warnaAksen: 'from-pink-500 to-rose-600',
    warnaBorder: 'border-pink-500/30'
  },
  {
    id: 'poundfit',
    nama: 'Poundfit',
    ikon: '🥁',
    tag: 'Ripstix Drum Cardio',
    kalori: '± 600 - 750 kkal',
    durasi: '60 Menit',
    pelatih: 'Coach Tania Putri',
    jadwal: 'Senin & Jumat, 19:00 WITA',
    ruang: 'Studio Alpha',
    deskripsi: 'Latihan kardio intensif menggunakan stik drum Ripstix bervolume ringan. Menggabungkan gerakan kardio, pilates, dan yoga dengan ketukan ritme musik rock yang memacu adrenalin.',
    manfaat: [
      'Membentuk otot lengan, paha & perut',
      'Latihan kekuatan otot inti (Core strength)',
      'Meningkatkan koordinasi ritmik tubuh',
      'Pelepas penat dan penambah stamina ekstra'
    ],
    warnaAksen: 'from-rose-600 to-fuchsia-600',
    warnaBorder: 'border-rose-500/40',
    populer: true
  },
  {
    id: 'Yoga',
    nama: 'Yoga',
    ikon: '🧘‍♀️',
    tag: 'Stamina & Pembentukan Tubuh',
    kalori: '± 450 - 550 kkal',
    durasi: '60 Menit',
    pelatih: 'Coach Tania Putri',
    jadwal: 'Rabu & Sabtu, 07:30 WITA',
    ruang: 'Studio Zen',
    deskripsi: 'Latihan senam aerobik ritmis terpadu untuk melatih ketahanan jantung, melancarkan sirkulasi darah, dan mengencangkan postur tubuh secara terarah dan aman.',
    manfaat: [
      'Memperbaiki daya tahan kardiovaskular',
      'Mengencangkan otot pinggul & kaki',
      'Sesi pagi yang menyegarkan metabolisme',
      'Dipandu langsung instruktur berpengalaman'
    ],
    warnaAksen: 'from-fuchsia-600 to-pink-600',
    warnaBorder: 'border-fuchsia-500/30'
  }
]

// 4 Nilai Utama Keunggulan Mezona
const keunggulanMezona = [
  {
    ikon: '🌸',
    judul: '100% Woman Only & Private',
    deskripsi: 'Area studio tertutup eksklusif khusus wanita. Anda bebas berolahraga tanpa hijab atau busana olahraga favorit dengan rasa aman dan nyaman.'
  },
  {
    ikon: '⭐',
    judul: 'Pelatih Tersertifikasi & Ramah',
    deskripsi: 'Didampingi instruktur profesional yang memandu setiap gerakan dengan teknik yang benar, aman untuk pemula, dan penuh motivasi.'
  },
  {
    ikon: '🎵',
    judul: 'Sound System & Studio Modern',
    deskripsi: 'Ruangan berpendingin udara (AC), cermin latihan luas dari dinding ke dinding, serta sistem audio jernih yang membakar semangat latihan.'
  },
  {
    ikon: '📱',
    judul: 'Presensi Digital & Booking Mudah',
    deskripsi: 'Pemesanan kursi kelas dan presensi check-in gym secara instan menggunakan QR Code melalui portal aplikasi web Mezona Studio.'
  }
]

// 4 Statistik Riil Mezona Studio
const statistikUtama = [
  { angka: '3.000+', label: 'Kunjungan Komunitas', sub: 'Member aktif & tamu studio' },
  { angka: '3 Program', label: 'Kelas Spesialisasi', sub: 'Zumba, Poundfit & Aerobik' },
  { angka: '2+ Tahun', label: 'Pengalaman Studio', sub: 'Pelopor fitness wanita Jeneponto' },
  { angka: '100%', label: 'Lingkungan Nyaman', sub: 'Fasilitas bersih & aman' }
]

// 4 Foto Dokumentasi Kegiatan Nyata Mezona Studio
const galeriDokumentasi = [
  {
    url: '/images/dokumentasi/kegiatan-1.jpg',
    judul: 'Kompak & Ceria di Studio Cermin Mezona',
    tag: 'Suasana Studio',
    deskripsi: 'Momen kebersamaan member seusai menuntaskan sesi latihan kardio penuh keringat dan senyuman.'
  },
  {
    url: '/images/dokumentasi/kegiatan-2.jpg',
    judul: 'Komunitas Sehat di Gedung Mezona Studio',
    tag: 'Komunitas Member',
    deskripsi: 'Para member berpose bangga di depan gedung Mezona Studio Jl. Pahlawan Jeneponto.'
  },
  {
    url: '/images/dokumentasi/kegiatan-3.jpg',
    judul: 'Latihan Matras, Peregangan & Kelenturan',
    tag: 'Sesi Latihan',
    deskripsi: 'Fokus gerakan teknik pernapasan dan fleksibilitas untuk menyegarkan stamina tubuh.'
  },
  {
    url: '/images/dokumentasi/kegiatan-4.jpg',
    judul: 'Antusiasme Kelas Studio Khusus Wanita',
    tag: 'Kelas Ramai',
    deskripsi: 'Suasana kelas yang ramai, bersahabat, dan aman bagi muslimah untuk bebas aktif berolahraga.'
  }
]

const bukaLightbox = (foto: typeof galeriDokumentasi[0]) => {
  fotoDipilih.value = foto
  modalFotoTerbuka.value = true
}

const tutupLightbox = () => {
  modalFotoTerbuka.value = false
  fotoDipilih.value = null
}

const salinAlamat = () => {
  navigator.clipboard.writeText('Mezona Studio, Jl. Pahlawan No.13, Kabupaten Jeneponto, Sulawesi Selatan')
  alert('Alamat Mezona Studio berhasil disalin!')
}

// State modal pop-up detail kelas spesialisasi (lebih ringkas & hemat tempat)
const modalDetailKelasTerbuka = ref(false)
const kelasDipilih = ref<typeof programKelas[0] | null>(null)

const bukaDetailKelas = (kelas: typeof programKelas[0]) => {
  kelasDipilih.value = kelas
  modalDetailKelasTerbuka.value = true
}

const tutupDetailKelas = () => {
  modalDetailKelasTerbuka.value = false
  kelasDipilih.value = null
}

// State deteksi scroll untuk navbar mengambang permanen (sticky/fixed)
const isScrolled = ref(false)
const bagianAktif = ref('hero')
const daftarBagian = ['hero', 'program', 'tentang', 'dokumentasi', 'lokasi']

// Fungsi navigasi scroll halus dengan kompensasi fixed navbar
const scrollKeBagian = (idTujuan: string) => {
  menuSelulerTerbuka.value = false
  bagianAktif.value = idTujuan
  if (import.meta.client) {
    if (idTujuan === 'hero') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
      if (history.pushState) {
        history.pushState(null, '', '#hero')
      }
      return
    }

    const elemen = document.getElementById(idTujuan)
    if (elemen) {
      // Offset fixed navbar (75px) agar judul section tidak tertutup navbar
      const offsetNavbar = 75
      const rect = elemen.getBoundingClientRect()
      const posisiScroll = rect.top + window.pageYOffset - offsetNavbar

      window.scrollTo({
        top: Math.max(0, posisiScroll),
        behavior: 'smooth'
      })

      if (history.pushState) {
        history.pushState(null, '', `#${idTujuan}`)
      }
    }
  }
}

const tanganiScroll = () => {
  if (import.meta.client) {
    isScrolled.value = window.scrollY > 20

    // Deteksi otomatis bagian yang sedang aktif di layar
    if (window.scrollY < 100) {
      bagianAktif.value = 'hero'
      return
    }

    const offsetNavbar = 120
    const scrollPos = window.scrollY + offsetNavbar

    for (let i = daftarBagian.length - 1; i >= 0; i--) {
      const id = daftarBagian[i]
      const el = document.getElementById(id)
      if (el) {
        const top = el.offsetTop
        if (scrollPos >= top) {
          bagianAktif.value = id
          break
        }
      }
    }
  }
}

onMounted(() => {
  inisialisasiSesi()

  // Jika aplikasi dibuka dari aplikasi native Capacitor (Member / Pelatih),
  // langsung alihkan ke Dasbor peran jika sudah login atau ke login mobile jika belum.
  if (import.meta.client && Capacitor.isNativePlatform()) {
    if (dataPengguna.value) {
      navigateTo(dapatkanRuteSesuaiPeran(dataPengguna.value.peran), { replace: true })
      return
    } else {
      navigateTo('/masuk?mobile=1', { replace: true })
      return
    }
  }

  if (import.meta.client) {
    window.addEventListener('scroll', tanganiScroll, { passive: true })
    tanganiScroll()

    // Jika membuka URL dengan hash tujuan (misal #dokumentasi), scroll secara halus
    if (window.location.hash) {
      const hashId = window.location.hash.replace('#', '')
      if (daftarBagian.includes(hashId)) {
        setTimeout(() => {
          scrollKeBagian(hashId)
        }, 300)
      }
    }
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', tanganiScroll)
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-rose-500 selection:text-white scroll-smooth relative">
    <!-- Ambient Glow Aksen Latar Belakang Lembut di Latar Putih -->
    <div class="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-rose-200/30 blur-[160px] rounded-full pointer-events-none z-0"></div>
    <div class="fixed top-1/3 -right-40 w-[550px] h-[550px] bg-pink-200/25 blur-[170px] rounded-full pointer-events-none z-0"></div>
    <div class="fixed bottom-20 -left-40 w-[550px] h-[550px] bg-rose-300/20 blur-[170px] rounded-full pointer-events-none z-0"></div>

    <!-- ======================================================== -->
    <!-- 1. FLOATING MODERN NAVBAR (FIXED SELALU ADA SAAT SCROLL) -->
    <!-- ======================================================== -->
    <header
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      :class="isScrolled
        ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-md'
        : 'bg-white/90 backdrop-blur-lg border-b border-slate-200/80 shadow-xs'"
    >
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300"
        :class="isScrolled ? 'h-16' : 'h-20'"
      >
        <!-- Brand Logo Resmi -->
        <NuxtLink
          to="/"
          @click.prevent="scrollKeBagian('hero')"
          class="flex items-center space-x-3 group"
        >
          <img
            src="/images/logo-mezona.png"
            alt="Mezona Studio Logo"
            class="w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-all duration-300"
            :class="isScrolled ? 'h-9 sm:h-10' : 'h-10 sm:h-12'"
          />
        </NuxtLink>

        <!-- Menu Navigasi Desktop -->
        <nav class="hidden lg:flex items-center space-x-8 text-sm font-semibold">
          <a
            href="#hero"
            @click.prevent="scrollKeBagian('hero')"
            class="transition-colors duration-200 relative py-1 cursor-pointer"
            :class="bagianAktif === 'hero' ? 'text-rose-600 font-bold' : 'text-slate-600 hover:text-rose-600'"
          >
            Beranda
            <span v-if="bagianAktif === 'hero'" class="absolute -bottom-1 left-0 right-0 h-0.5 bg-rose-600 rounded-full animate-fade-in"></span>
          </a>
          <a
            href="#program"
            @click.prevent="scrollKeBagian('program')"
            class="transition-colors duration-200 relative py-1 cursor-pointer"
            :class="bagianAktif === 'program' ? 'text-rose-600 font-bold' : 'text-slate-600 hover:text-rose-600'"
          >
            Program Kelas
            <span v-if="bagianAktif === 'program'" class="absolute -bottom-1 left-0 right-0 h-0.5 bg-rose-600 rounded-full animate-fade-in"></span>
          </a>
          <a
            href="#tentang"
            @click.prevent="scrollKeBagian('tentang')"
            class="transition-colors duration-200 relative py-1 cursor-pointer"
            :class="bagianAktif === 'tentang' ? 'text-rose-600 font-bold' : 'text-slate-600 hover:text-rose-600'"
          >
            Tentang Kami
            <span v-if="bagianAktif === 'tentang'" class="absolute -bottom-1 left-0 right-0 h-0.5 bg-rose-600 rounded-full animate-fade-in"></span>
          </a>
          <a
            href="#dokumentasi"
            @click.prevent="scrollKeBagian('dokumentasi')"
            class="transition-colors duration-200 relative py-1 cursor-pointer"
            :class="bagianAktif === 'dokumentasi' ? 'text-rose-600 font-bold' : 'text-slate-600 hover:text-rose-600'"
          >
            Dokumentasi
            <span v-if="bagianAktif === 'dokumentasi'" class="absolute -bottom-1 left-0 right-0 h-0.5 bg-rose-600 rounded-full animate-fade-in"></span>
          </a>
          <a
            href="#lokasi"
            @click.prevent="scrollKeBagian('lokasi')"
            class="transition-colors duration-200 relative py-1 cursor-pointer"
            :class="bagianAktif === 'lokasi' ? 'text-rose-600 font-bold' : 'text-slate-600 hover:text-rose-600'"
          >
            Lokasi & Kontak
            <span v-if="bagianAktif === 'lokasi'" class="absolute -bottom-1 left-0 right-0 h-0.5 bg-rose-600 rounded-full animate-fade-in"></span>
          </a>
        </nav>

        <!-- Tombol Aksi Kanan -->
        <div class="hidden sm:flex items-center space-x-3">
          <!-- Jika Sudah Memiliki Sesi Login Aktif -->
          <NuxtLink
            v-if="dataPengguna"
            :to="dapatkanRuteSesuaiPeran(dataPengguna.peran)"
            class="px-5 py-2.5 rounded-full bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 transition flex items-center space-x-2"
          >
            <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span>Buka Dasbor ({{ dataPengguna.nama_lengkap.split(' ')[0] }}) →</span>
          </NuxtLink>

          <!-- Jika Pengguna Tamu / Belum Login -->
          <template v-else>
            <NuxtLink
              to="/masuk"
              class="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs border border-slate-200 transition active:scale-95 inline-flex items-center space-x-1.5"
            >
              <span>🔑</span>
              <span>Masuk Akun</span>
            </NuxtLink>
            <NuxtLink
              to="/daftar"
              class="px-4 py-2 rounded-full bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white font-extrabold text-xs shadow-sm hover:brightness-110 transition active:scale-95 inline-flex items-center space-x-1.5"
            >
              <span>Daftar Member</span>
              <span>→</span>
            </NuxtLink>
          </template>
        </div>

        <!-- Tombol Hamburger Mobile -->
        <button
          @click="menuSelulerTerbuka = !menuSelulerTerbuka"
          class="lg:hidden p-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
          aria-label="Menu"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!menuSelulerTerbuka" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Drawer Navigasi Mobile -->
      <div v-if="menuSelulerTerbuka" class="lg:hidden px-4 pt-2 pb-6 border-b border-slate-200 bg-white/95 backdrop-blur-2xl space-y-3 shadow-lg">
        <a @click.prevent="scrollKeBagian('hero')" href="#hero" class="block py-2 text-sm font-semibold transition" :class="bagianAktif === 'hero' ? 'text-rose-600 font-bold' : 'text-slate-700 hover:text-rose-600'">Beranda</a>
        <a @click.prevent="scrollKeBagian('program')" href="#program" class="block py-2 text-sm font-semibold transition" :class="bagianAktif === 'program' ? 'text-rose-600 font-bold' : 'text-slate-700 hover:text-rose-600'">Program Kelas</a>
        <a @click.prevent="scrollKeBagian('tentang')" href="#tentang" class="block py-2 text-sm font-semibold transition" :class="bagianAktif === 'tentang' ? 'text-rose-600 font-bold' : 'text-slate-700 hover:text-rose-600'">Tentang Kami</a>
        <a @click.prevent="scrollKeBagian('dokumentasi')" href="#dokumentasi" class="block py-2 text-sm font-semibold transition" :class="bagianAktif === 'dokumentasi' ? 'text-rose-600 font-bold' : 'text-slate-700 hover:text-rose-600'">Dokumentasi</a>
        <a @click.prevent="scrollKeBagian('lokasi')" href="#lokasi" class="block py-2 text-sm font-semibold transition" :class="bagianAktif === 'lokasi' ? 'text-rose-600 font-bold' : 'text-slate-700 hover:text-rose-600'">Lokasi & Kontak</a>
        <div class="pt-3 border-t border-slate-200 flex flex-col space-y-2">
          <NuxtLink
            to="/masuk"
            @click="menuSelulerTerbuka = false"
            class="w-full py-2.5 text-center rounded-xl bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200 border border-slate-200 flex items-center justify-center space-x-1.5"
          >
            <span>🔑</span>
            <span>Masuk Akun (Member / Pelatih / Admin)</span>
          </NuxtLink>
          <NuxtLink
            to="/daftar"
            @click="menuSelulerTerbuka = false"
            class="w-full py-2.5 text-center rounded-xl bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5"
          >
            <span>✨</span>
            <span>Daftar Member Baru</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- ======================================================== -->
    <!-- 2. ULTRA-FRESH HERO SHOWCASE SECTION -->
    <!-- ======================================================== -->
    <section id="hero" class="relative z-10 pt-28 pb-20 md:pt-36 md:pb-28 scroll-mt-24">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">


        <!-- Headline Utama dengan Gradient Mewah Kontras Tinggi -->
        <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.18] max-w-4xl mx-auto">
          Wujudkan Tubuh Bugar,
          <span class="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-700 bg-clip-text text-transparent block mt-1">
            Pikiran Bahagia & Percaya Diri.
          </span>
        </h1>

        <!-- Subtitle Penjelasan Mezona Studio -->
        <p class="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          <strong class="text-slate-900 font-bold">Mezona Studio</strong> adalah ruang kebugaran modern yang dirancang khusus untuk menjadi ruang transformasi bagi tubuh dan pikiran wanita. Nikmati kelas dinamis Zumba, Poundfit, dan Aerobik dalam atmosfer privat, nyaman, dan saling mendukung.
        </p>

        <!-- Tombol Aksi Utama -->
        <div class="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <NuxtLink
            to="/daftar"
            class="px-8 py-4 rounded-full bg-gradient-to-r from-neon-magenta via-pink-600 to-neon-fuchsia text-white font-extrabold text-sm shadow-md hover:brightness-110 active:scale-95 transition duration-200 flex items-center space-x-2"
          >
            <span>Daftar Member Sekarang</span>
            <span>→</span>
          </NuxtLink>

          <NuxtLink
            to="/masuk"
            class="px-7 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-xs transition active:scale-95 flex items-center space-x-2"
          >
            <span>Masuk Akun</span>
            <span class="text-xs text-rose-500">🔑</span>
          </NuxtLink>

          <NuxtLink
            to="/masuk?peran=MEMBER"
            class="px-6 py-4 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 shadow-2xs transition active:scale-95 flex items-center space-x-1.5"
          >
            <span>📱 Mode Seluler Member</span>
          </NuxtLink>
        </div>


      </div>
    </section>

    <!-- ======================================================== -->
    <!-- 3. STATISTIK KEUNGGULAN (4 ANGKA BESAR) -->
    <!-- ======================================================== -->
    <section class="py-14 border-y border-slate-200 bg-white relative z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div
            v-for="stat in statistikUtama"
            :key="stat.label"
            class="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-rose-300 hover:shadow-md transition duration-300 flex flex-col items-center text-center shadow-xs"
          >
            <span class="text-3xl sm:text-4xl font-black bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 bg-clip-text text-transparent">
              {{ stat.angka }}
            </span>
            <span class="text-xs sm:text-sm font-bold text-slate-900 mt-2">
              {{ stat.label }}
            </span>
            <span class="text-[11px] text-slate-500 mt-0.5 font-medium">
              {{ stat.sub }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================== -->
    <!-- 4. PROGRAM KELAS SPESIALISASI (ELEGANT & COMPACT SHOWCASE) -->
    <!-- ======================================================== -->
    <section id="program" class="py-12 md:py-16 relative z-10 scroll-mt-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header Section Lebih Ringkas & Elegan -->
        <div class="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span class="text-xs font-black uppercase tracking-widest text-rose-600">
            Program Latihan Pilihan
          </span>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Kelas Spesialisasi yang Dirancang untuk Anda
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Pilihan sesi kebugaran wanita terpadu yang membakar kalori secara intensif dan menyegarkan stamina.
          </p>
        </div>

        <!-- Grid 3 Kartu Kelas Bersih & Premium -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7">
          <div
            v-for="kelas in programKelas"
            :key="kelas.id"
            @click="bukaDetailKelas(kelas)"
            class="relative rounded-[28px] p-6 bg-white border transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 shadow-sm hover:shadow-xl cursor-pointer group"
            :class="kelas.populer
              ? 'border-rose-300 ring-2 ring-rose-500/20 bg-gradient-to-b from-rose-50/25 via-white to-white'
              : 'border-slate-200 hover:border-rose-300'"
          >
            <!-- Badge Terfavorit -->
            <div v-if="kelas.populer" class="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white text-[9px] font-black tracking-widest uppercase shadow-sm">
              ★ PALING DIMINATI
            </div>

            <div>
              <!-- Baris Atas: Ikon Artistik & Kalori Pill -->
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-2xl group-hover:scale-110 transition duration-300 shadow-xs">
                  {{ kelas.ikon }}
                </div>
                <div class="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80">
                  <span class="text-rose-500">⚡</span>
                  <span>{{ kelas.kalori }}</span>
                </div>
              </div>

              <!-- Judul Kelas & Tag Kategori -->
              <div class="space-y-1 mb-2.5">
                <span class="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                  {{ kelas.tag }}
                </span>
                <h3 class="text-2xl font-black text-slate-900 group-hover:text-rose-600 transition">
                  {{ kelas.nama }}
                </h3>
              </div>

              <!-- Deskripsi Ringkas -->
              <p class="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">
                {{ kelas.deskripsi }}
              </p>

              <!-- Meta Info Mini Bar -->
              <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600 mb-5">
                <div class="flex items-center space-x-1.5">
                  <span>⏱️</span>
                  <span class="font-bold text-slate-800">{{ kelas.durasi }}</span>
                </div>
                <span class="text-slate-300">•</span>
                <div class="flex items-center space-x-1.5">
                  <span>📍</span>
                  <span class="font-bold text-slate-800">{{ kelas.ruang }}</span>
                </div>
                <span class="text-slate-300">•</span>
                <div class="flex items-center space-x-1.5 truncate">
                  <span>👤</span>
                  <span class="font-bold text-slate-800 truncate">{{ kelas.pelatih.replace('Coach ', '') }}</span>
                </div>
              </div>
            </div>

            <!-- Tombol Tunggal Rapi: Lihat Detail Kelas -->
            <button
              @click.stop="bukaDetailKelas(kelas)"
              type="button"
              class="w-full py-3 px-4 rounded-2xl font-bold text-xs transition duration-200 flex items-center justify-center space-x-2 active:scale-95 border"
              :class="kelas.populer
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 font-extrabold group-hover:bg-gradient-to-r group-hover:from-neon-magenta group-hover:to-neon-fuchsia group-hover:text-white group-hover:border-transparent shadow-xs'
                : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border-slate-200 hover:border-rose-200'"
            >
              <span>Lihat Detail Kelas</span>
              <span class="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================== -->
    <!-- 5. TENTANG KAMI & KEUNGGULAN STUDIO -->
    <!-- ======================================================== -->
    <section id="tentang" class="py-20 md:py-28 relative z-10 border-t border-slate-200 bg-slate-50 scroll-mt-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <!-- Sisi Kiri: Narasi Studio -->
          <div class="lg:col-span-6 space-y-6">
            <span class="text-xs font-black uppercase tracking-widest text-rose-600">
              Tentang Mezona Studio
            </span>
            <h2 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Lebih Dari Sekadar Gym,
              <span class="text-rose-600 block">Ruang Transformasi Hidup Anda.</span>
            </h2>

            <div class="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              <p>
                Mezona Studio didirikan dari keyakinan bahwa setiap wanita berhak memiliki ruang olahraga yang aman, bersih, dan memotivasi tanpa merasa terintimidasi.
              </p>
              <p>
                Olahraga bukan sekadar pembakaran kalori rutin, melainkan bentuk apresiasi diri untuk kesehatan jangka panjang dan kualitas hidup yang jauh lebih bahagia (*Healthy & Happier*).
              </p>
              <p>
                Dengan kombinasi instruktur profesional, fasilitas cermin studio luas, serta komunitas yang hangat, Anda akan selalu menemukan energi baru di setiap sesi.
              </p>
            </div>


          </div>

          <!-- Sisi Kanan: 4 Kotak Fitur Nilai Tambah -->
          <div class="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="fitur in keunggulanMezona"
              :key="fitur.judul"
              class="p-6 rounded-3xl bg-white border border-slate-200 hover:border-rose-300 transition duration-300 space-y-2.5 shadow-sm"
            >
              <span class="text-3xl block">{{ fitur.ikon }}</span>
              <h4 class="text-sm font-black text-slate-900">{{ fitur.judul }}</h4>
              <p class="text-xs text-slate-600 leading-relaxed">{{ fitur.deskripsi }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================== -->
    <!-- 6. DOKUMENTASI KEGIATAN (FOTO ASLI MEZONA DENGAN LIGHTBOX) -->
    <!-- ======================================================== -->
    <section id="dokumentasi" class="py-20 md:py-28 relative z-10 border-t border-slate-200 bg-white scroll-mt-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span class="text-xs font-black uppercase tracking-widest text-rose-600">
            Galeri Komunitas
          </span>
          <h2 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Dokumentasi Kegiatan Asli Member
          </h2>
          <p class="text-xs sm:text-sm text-slate-600">
            Intip keseruan latihan, kebersamaan, dan atmosfer positif di Mezona Studio Jeneponto.
          </p>
        </div>

        <!-- Grid 4 Foto Dokumentasi Nyata -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            v-for="(foto, index) in galeriDokumentasi"
            :key="index"
            @click="bukaLightbox(foto)"
            class="group relative rounded-3xl overflow-hidden border border-slate-200 hover:border-rose-400 shadow-md cursor-pointer aspect-[4/3] bg-slate-100 transition-all duration-300 hover:-translate-y-1.5"
          >
            <img
              :src="foto.url"
              :alt="foto.judul"
              class="w-full h-full object-cover group-hover:scale-110 transition duration-500"
            />
            <!-- Overlay Info -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <div>
                <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-600 text-white">
                  {{ foto.tag }}
                </span>
                <p class="text-xs font-bold text-white mt-1.5 leading-snug">{{ foto.judul }}</p>
                <span class="text-[10px] text-rose-200 mt-1 inline-flex items-center space-x-1">
                  <span>🔍 Klik untuk perbesar</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================== -->
    <!-- 7. LOKASI, KONTAK & FOOTER MEZONA -->
    <!-- ======================================================== -->
    <footer id="lokasi" class="py-16 border-t border-slate-200 bg-white relative z-10 scroll-mt-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 items-start mb-12">
          <!-- Info Brand & Media Sosial -->
          <div class="space-y-4">
            <img
              src="/images/logo-mezona.png"
              alt="Mezona Studio Logo"
              class="h-10 w-auto object-contain drop-shadow-sm"
            />
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md">
              Tempat kebugaran modern khusus wanita di Jeneponto. Ruang transformasi bagi tubuh dan pikiran untuk hidup lebih sehat, bugar, dan bahagia.
            </p>
            <!-- Media Sosial -->
            <div class="flex items-center space-x-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center transition"
                title="Instagram"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-cyan-600 hover:border-cyan-300 flex items-center justify-center transition"
                title="TikTok"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 flex items-center justify-center transition"
                title="WhatsApp CS"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Lokasi & Kontak Studio -->
          <div class="space-y-2 text-xs text-slate-600 md:pl-8">
            <p class="font-black text-slate-900 uppercase tracking-wider text-sm mb-3">Lokasi &amp; Kontak Studio</p>
            <p class="font-bold text-slate-900 text-sm">Mezona Studio Jeneponto</p>
            <p class="text-slate-600">Jl. Pahlawan No.13, Kabupaten Jeneponto, Sulawesi Selatan</p>
            <p class="pt-2 text-slate-600">
              <strong class="text-slate-800">Jam Operasional:</strong><br />
              Sesi Pagi: 07:00 - 10:00 WITA<br />
              Sesi Sore - Malam: 16:00 - 20:30 WITA
            </p>
            <div class="pt-2 flex flex-wrap items-center gap-4">
              <button
                @click="salinAlamat"
                class="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-semibold text-xs transition"
              >
                <span>📍</span> Salin Alamat Studio
              </button>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                class="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-semibold text-xs transition"
              >
                <span>💬</span> WhatsApp CS: +62 812-3456-7890
              </a>
            </div>
          </div>
        </div>

        <!-- Copyright -->
        <div class="pt-8 border-t border-slate-200 text-center text-xs text-slate-500">
          <p>© 2026 Mezona Studio. Seluruh hak cipta dilindungi undang-undang.</p>
        </div>
      </div>
    </footer>

    <!-- ======================================================== -->
    <!-- MODAL POP-UP DETAIL KELAS SPESIALISASI -->
    <!-- ======================================================== -->
    <div
      v-if="modalDetailKelasTerbuka && kelasDipilih"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in"
      @click.self="tutupDetailKelas"
    >
      <div class="relative max-w-lg w-full rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5">
        <!-- Tombol Tutup Silang -->
        <button
          @click="tutupDetailKelas"
          class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center transition border border-slate-200"
          aria-label="Tutup"
        >
          ✕
        </button>

        <!-- Header Modal -->
        <div class="flex items-start space-x-4">
          <div class="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-3xl shrink-0 shadow-xs">
            {{ kelasDipilih.ikon }}
          </div>
          <div>
            <div class="flex items-center space-x-2 mb-1">
              <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                {{ kelasDipilih.tag }}
              </span>
              <span class="text-xs font-semibold text-slate-500">
                ⚡ {{ kelasDipilih.kalori }}
              </span>
            </div>
            <h3 class="text-2xl font-black text-slate-900">
              {{ kelasDipilih.nama }}
            </h3>
            <p class="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              {{ kelasDipilih.deskripsi }}
            </p>
          </div>
        </div>

        <!-- Info Jadwal, Instruktur & Lokasi -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-slate-500">Instruktur:</span>
            <span class="font-bold text-slate-900">{{ kelasDipilih.pelatih }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500">Jadwal Sesi:</span>
            <span class="font-bold text-rose-600">{{ kelasDipilih.jadwal }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500">Durasi:</span>
            <span class="font-medium text-slate-800">{{ kelasDipilih.durasi }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500">Lokasi Studio:</span>
            <span class="font-medium text-slate-700">{{ kelasDipilih.ruang }}</span>
          </div>
        </div>

        <!-- Manfaat Sesi -->
        <div>
          <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
            Manfaat & Hasil Latihan:
          </h4>
          <ul class="space-y-2 text-xs text-slate-600">
            <li v-for="(m, idx) in kelasDipilih.manfaat" :key="idx" class="flex items-start space-x-2">
              <span class="text-rose-600 font-bold mt-0.5">✓</span>
              <span class="text-slate-700 font-medium leading-snug">{{ m }}</span>
            </li>
          </ul>
        </div>

        <!-- Tombol Aksi Modal -->
        <div class="pt-2 flex items-center space-x-3">
          <NuxtLink
            to="/masuk?peran=MEMBER"
            @click="tutupDetailKelas"
            class="flex-1 py-3 rounded-2xl bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white font-extrabold text-xs shadow-md hover:brightness-110 text-center transition flex items-center justify-center space-x-1.5"
          >
            <span>📱</span>
            <span>Masuk &amp; Ikuti Kelas (Mode Seluler) →</span>
          </NuxtLink>
          <button
            @click="tutupDetailKelas"
            class="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL LIGHTBOX FOTO PREVIEW -->
    <!-- ======================================================== -->
    <div
      v-if="modalFotoTerbuka && fotoDipilih"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in"
      @click.self="tutupLightbox"
    >
      <div class="relative max-w-2xl w-full rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-2xl">
        <button
          @click="tutupLightbox"
          class="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white font-bold text-sm flex items-center justify-center border border-white/10"
        >
          ✕
        </button>
        <img
          :src="fotoDipilih.url"
          :alt="fotoDipilih.judul"
          class="w-full max-h-[70vh] object-contain bg-slate-950"
        />
        <div class="p-6 bg-white border-t border-slate-200">
          <span class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
            {{ fotoDipilih.tag }}
          </span>
          <h4 class="text-base font-black text-slate-900 mt-2">{{ fotoDipilih.judul }}</h4>
          <p class="text-xs text-slate-600 mt-1 leading-relaxed">{{ fotoDipilih.deskripsi }}</p>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL DOWNLOAD APLIKASI MOBILE (MEMBER & PELATIH) -->
    <!-- ======================================================== -->
    <div
      v-if="modalDownloadTerbuka"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in"
      @click.self="modalDownloadTerbuka = false"
    >
      <div class="w-full max-w-sm rounded-[32px] p-6 bg-white border border-slate-200 shadow-2xl text-center space-y-4">
        <div class="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-neon-magenta to-neon-fuchsia p-1 shadow-md">
          <div class="w-full h-full bg-white rounded-[20px] flex items-center justify-center text-3xl">
            📱
          </div>
        </div>

        <div>
          <span class="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            Khusus Member &amp; Pelatih
          </span>
          <h3 class="text-lg font-black text-slate-900 mt-2">Aplikasi Mobile Mezona Studio</h3>
          <p class="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Member dan Pelatih mengakses jadwal kelas, booking sesi latihan, presensi QR Code masuk studio, dan info membership langsung lewat aplikasi ponsel.
          </p>
        </div>

        <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2">
          <div class="flex items-center space-x-2.5 text-xs text-slate-700">
            <span class="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs shrink-0 text-sm">📲</span>
            <div>
              <p class="font-bold text-slate-800">Tersedia di Play Store &amp; App Store</p>
              <p class="text-[11px] text-slate-500">Unduh aplikasi resmi Mezona Studio di smartphone Anda</p>
            </div>
          </div>
          <div class="flex items-center space-x-2.5 text-xs text-slate-700">
            <span class="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs shrink-0 text-sm">💬</span>
            <div>
              <p class="font-bold text-slate-800">Daftar &amp; Bantuan CS</p>
              <p class="text-[11px] text-slate-500">Pendaftaran member baru &amp; aktivasi akun dipandu via WhatsApp</p>
            </div>
          </div>
        </div>

        <div class="space-y-2 pt-1">
          <NuxtLink
            to="/masuk?peran=MEMBER"
            @click="modalDownloadTerbuka = false"
            class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 transition flex items-center justify-center space-x-2"
          >
            <span>📱</span>
            <span>Buka Langsung Mode Seluler di Web</span>
          </NuxtLink>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20Mezona%20Studio,%20saya%20ingin%20info%20pendaftaran%20member%20dan%20download%20aplikasi"
            target="_blank"
            class="w-full py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition flex items-center justify-center space-x-2"
          >
            <span>💬</span>
            <span>Hubungi WhatsApp CS Studio</span>
          </a>
          <button
            @click="modalDownloadTerbuka = false"
            class="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 block transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
