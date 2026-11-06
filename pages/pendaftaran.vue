<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'default',
  alias: ['/daftar']
})

const { prosesDaftar, sedangMemuat, tampilkanNotifikasi } = useOtentikasi()

const formPendaftaran = reactive({
  nama_lengkap: '',
  email: '',
  nomor_telepon: '',
  kata_sandi: '',
  konfirmasi_sandi: '',
  jenis_kelamin: 'PRIA',
  setuju_ketentuan: false
})

const pesanKesalahan = ref('')

const tanganiPendaftaran = async () => {
  pesanKesalahan.value = ''

  if (!formPendaftaran.nama_lengkap || !formPendaftaran.email || !formPendaftaran.kata_sandi) {
    pesanKesalahan.value = 'Harap lengkapi semua kolom yang wajib diisi.'
    return
  }

  if (formPendaftaran.kata_sandi !== formPendaftaran.konfirmasi_sandi) {
    pesanKesalahan.value = 'Konfirmasi kata sandi tidak cocok dengan kata sandi.'
    return
  }

  if (formPendaftaran.kata_sandi.length < 6) {
    pesanKesalahan.value = 'Kata sandi minimal harus 6 karakter.'
    return
  }

  if (!formPendaftaran.setuju_ketentuan) {
    pesanKesalahan.value = 'Anda harus menyetujui syarat & ketentuan keanggotaan Mezona Studio.'
    return
  }

  const hasil = await prosesDaftar({
    nama_lengkap: formPendaftaran.nama_lengkap,
    email: formPendaftaran.email,
    kata_sandi: formPendaftaran.kata_sandi,
    nomor_telepon: formPendaftaran.nomor_telepon,
    jenis_kelamin: formPendaftaran.jenis_kelamin
  })

  if (!hasil.sukses) {
    pesanKesalahan.value = hasil.pesan
  } else {
    tampilkanNotifikasi(hasil.pesan || 'Pendaftaran berhasil! Selamat bergabung di Mezona Studio.', 'sukses')
    await navigateTo(hasil.rute_tujuan || '/member/dasbor')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 relative overflow-hidden">
    <!-- Glow ambient background -->
    <div class="absolute -top-12 -right-12 w-72 h-72 bg-rose-200/50 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-12 -left-12 w-72 h-72 bg-pink-200/40 rounded-full blur-3xl pointer-events-none"></div>

    <div class="w-full max-w-lg relative z-10">
      <!-- Tombol Resmi Kembali ke Beranda -->
      <div class="mb-3.5">
        <NuxtLink
          to="/"
          class="inline-flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-rose-600 px-3.5 py-2 rounded-2xl bg-white/90 hover:bg-white border border-slate-200 shadow-xs backdrop-blur-md transition active:scale-95 group"
        >
          <span class="group-hover:-translate-x-0.5 transition-transform duration-200">←</span>
          <span>Kembali ke Beranda</span>
        </NuxtLink>
      </div>

      <!-- Kartu Pendaftaran Bersih & Elegan -->
      <div class="bg-white rounded-3xl p-6 sm:p-9 shadow-xl border border-slate-200 relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600"></div>

        <!-- Header -->
        <div class="text-center mb-6">
          <NuxtLink to="/" class="inline-block relative mb-2 group" title="Kembali ke Beranda">
            <img
              src="/images/logo-mezona.png"
              alt="Mezona Studio Logo"
              class="h-14 sm:h-16 w-auto mx-auto object-contain drop-shadow-sm group-hover:scale-105 transition duration-200"
            />
          </NuxtLink>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Gabung <span class="text-rose-600">Mezona Studio</span>
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Mulai transformasi kebugaran tubuh Anda hari ini
          </p>
        </div>

        <!-- Notifikasi Pesan Kesalahan -->
        <div v-if="pesanKesalahan" class="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5">
          <svg class="w-4 h-4 mt-0.5 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-medium">{{ pesanKesalahan }}</span>
        </div>

        <!-- Formulir Pendaftaran -->
        <form @submit.prevent="tanganiPendaftaran" class="space-y-4">
          <!-- Nama Lengkap -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Nama Lengkap
            </label>
            <input
              v-model="formPendaftaran.nama_lengkap"
              type="text"
              required
              placeholder="Contoh: Raden Surya"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition duration-200"
            />
          </div>

          <!-- Email & Nomor Telepon (2 Kolom di Desktop) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Alamat Email
              </label>
              <input
                v-model="formPendaftaran.email"
                type="email"
                required
                placeholder="nama@email.com"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition duration-200"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                WhatsApp / No. HP
              </label>
              <input
                v-model="formPendaftaran.nomor_telepon"
                type="tel"
                placeholder="081234567890"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition duration-200"
              />
            </div>
          </div>

          <!-- Pilihan Jenis Kelamin -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Jenis Kelamin
            </label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                @click="formPendaftaran.jenis_kelamin = 'PRIA'"
                class="py-2.5 px-4 rounded-xl text-xs font-bold border transition duration-200 flex items-center justify-center space-x-2"
                :class="formPendaftaran.jenis_kelamin === 'PRIA'
                  ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'"
              >
                <span>Pria</span>
              </button>
              <button
                type="button"
                @click="formPendaftaran.jenis_kelamin = 'WANITA'"
                class="py-2.5 px-4 rounded-xl text-xs font-bold border transition duration-200 flex items-center justify-center space-x-2"
                :class="formPendaftaran.jenis_kelamin === 'WANITA'
                  ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'"
              >
                <span>Wanita (Khusus)</span>
              </button>
            </div>
          </div>

          <!-- Kata Sandi & Konfirmasi -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Kata Sandi
              </label>
              <input
                v-model="formPendaftaran.kata_sandi"
                type="password"
                required
                placeholder="Minimal 6 karakter"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition duration-200"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Ulangi Sandi
              </label>
              <input
                v-model="formPendaftaran.konfirmasi_sandi"
                type="password"
                required
                placeholder="Ketik ulang sandi"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition duration-200"
              />
            </div>
          </div>

          <!-- Checkbox Ketentuan -->
          <div class="flex items-start space-x-2.5 pt-1">
            <input
              id="setuju"
              v-model="formPendaftaran.setuju_ketentuan"
              type="checkbox"
              class="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
            />
            <label for="setuju" class="text-xs text-slate-600">
              Saya menyetujui aturan tata tertib studio dan kebijakan privasi Mezona Studio.
            </label>
          </div>

          <!-- Tombol Daftar -->
          <button
            type="submit"
            :disabled="sedangMemuat"
            class="w-full mt-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-neon-magenta via-pink-600 to-neon-fuchsia text-white font-black text-sm tracking-wide shadow-md hover:brightness-110 active:scale-[0.99] transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="sedangMemuat" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ sedangMemuat ? 'Mendaftarkan Akun Anda...' : 'Daftar Sebagai Member' }}</span>
          </button>
        </form>

        <!-- Garis Pemisah / Tautan Masuk -->
        <div class="mt-6 pt-4 border-t border-slate-200 text-center">
          <p class="text-xs text-slate-600">
            Sudah memiliki akun?
            <NuxtLink to="/masuk" class="font-black text-rose-600 hover:text-rose-700 hover:underline ml-1">
              Masuk di sini
            </NuxtLink>
          </p>
        </div>
      </div>

      <!-- Tautan Bawah ke Beranda -->
      <div class="mt-4 text-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition"
        >
          <span>←</span>
          <span>Kembali ke Beranda Mezona Studio</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
