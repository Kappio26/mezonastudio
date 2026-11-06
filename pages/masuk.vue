<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const { prosesMasuk, sedangMemuat, tampilkanNotifikasi } = useOtentikasi()

type PeranLogin = 'MEMBER' | 'PELATIH' | 'ADMIN'
const peranAktif = ref<PeranLogin>('MEMBER')

const surel = ref('')
const kataSandi = ref('')
const tampilkanSandi = ref(false)
const pesanKesalahan = ref('')
const pesanSukses = ref('')

const isNative = ref(false)

onMounted(() => {
  if (import.meta.client) {
    isNative.value = Capacitor.isNativePlatform()
    const queryPeran = (route.query.peran as string)?.toUpperCase()
    if (queryPeran === 'PELATIH') {
      pilihPeran('PELATIH')
    } else if (queryPeran === 'ADMIN') {
      pilihPeran('ADMIN')
    } else {
      pilihPeran('MEMBER')
    }
  }
})

const pilihPeran = (peran: PeranLogin) => {
  peranAktif.value = peran
  pesanKesalahan.value = ''
  pesanSukses.value = ''
}

const tanganiMasuk = async () => {
  pesanKesalahan.value = ''
  pesanSukses.value = ''

  if (!surel.value || !kataSandi.value) {
    pesanKesalahan.value = 'Silakan masukkan alamat email dan kata sandi Anda.'
    return
  }

  const hasil = await prosesMasuk(surel.value, kataSandi.value)
  if (!hasil.sukses) {
    pesanKesalahan.value = hasil.pesan
  } else {
    const nama = hasil.pengguna?.nama_lengkap || 'Pengguna'
    pesanSukses.value = `Selamat datang kembali, ${nama}! Mengalihkan ke dasbor...`
    tampilkanNotifikasi(pesanSukses.value, 'sukses')

    // Berikan jeda animasi singkat agar pengguna melihat alert sukses sebelum dialihkan
    setTimeout(async () => {
      await navigateTo(hasil.rute_tujuan)
    }, 600)
  }
}

// Utilitas pengisian cepat untuk pengujian peran (Demo Helper)
const setelUjiCoba = (peranUji: PeranLogin) => {
  pilihPeran(peranUji)
  if (peranUji === 'ADMIN') {
    surel.value = 'admin@mezonastudio.com'
    kataSandi.value = 'AdminMezona2026!'
  } else if (peranUji === 'PELATIH') {
    surel.value = 'pelatih@mezonastudio.com'
    kataSandi.value = 'PelatihMezona2026!'
  } else {
    surel.value = 'member@mezonastudio.com'
    kataSandi.value = 'MemberMezona2026!'
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 relative overflow-hidden">
    <!-- Glow ambient di belakang kartu bertema Mezona -->
    <div class="absolute -top-10 -left-10 w-72 h-72 bg-rose-200/50 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-10 -right-10 w-72 h-72 bg-pink-200/40 rounded-full blur-3xl pointer-events-none"></div>

    <div class="w-full max-w-md relative z-10">
      <!-- Tombol Kembali ke Beranda (Tampil saat bukan aplikasi native) -->
      <div v-if="!isNative" class="mb-3.5 flex items-center justify-between">
        <NuxtLink
          to="/"
          class="inline-flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-rose-600 px-3.5 py-2 rounded-2xl bg-white/90 hover:bg-white border border-slate-200 shadow-xs backdrop-blur-md transition active:scale-95 group"
        >
          <span class="group-hover:-translate-x-0.5 transition-transform duration-200">←</span>
          <span>Kembali ke Beranda</span>
        </NuxtLink>

        <span class="text-[11px] font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
          Mode Seluler Aktif
        </span>
      </div>

      <!-- Kartu Masuk Bersih & Elegan -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 relative overflow-hidden">
        <!-- Dekorasi Strip Aksen Atas Sesuai Peran -->
        <div
          class="absolute top-0 left-0 right-0 h-1.5 transition-colors duration-300"
          :class="{
            'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600': peranAktif === 'MEMBER',
            'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500': peranAktif === 'PELATIH',
            'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900': peranAktif === 'ADMIN'
          }"
        ></div>

        <!-- Header / Logo Resmi Mezona Studio -->
        <div class="text-center mb-5">
          <NuxtLink to="/" class="inline-block relative mb-2 group" title="Kembali ke Beranda">
            <img
              src="/images/logo-mezona.png"
              alt="Mezona Studio Logo"
              class="relative h-14 sm:h-16 w-auto mx-auto object-contain drop-shadow-sm group-hover:scale-105 transition duration-200"
            />
          </NuxtLink>

          <!-- Tab Pemilih Peran (Member, Pelatih, Admin) -->
          <div class="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 mt-3 mb-4">
            <button
              type="button"
              @click="pilihPeran('MEMBER')"
              class="py-2 px-1 text-center rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
              :class="peranAktif === 'MEMBER'
                ? 'bg-white text-rose-600 shadow-xs border border-rose-200/60'
                : 'text-slate-600 hover:text-slate-900'"
            >
              <span>👤</span>
              <span>Member</span>
            </button>
            <button
              type="button"
              @click="pilihPeran('PELATIH')"
              class="py-2 px-1 text-center rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
              :class="peranAktif === 'PELATIH'
                ? 'bg-white text-purple-600 shadow-xs border border-purple-200/60'
                : 'text-slate-600 hover:text-slate-900'"
            >
              <span>🏋️</span>
              <span>Pelatih</span>
            </button>
            <button
              type="button"
              @click="pilihPeran('ADMIN')"
              class="py-2 px-1 text-center rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
              :class="peranAktif === 'ADMIN'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'"
            >
              <span>🔐</span>
              <span>Admin</span>
            </button>
          </div>

          <!-- Informasi Peran yang Dipilih -->
          <div class="space-y-1">
            <div
              v-if="peranAktif === 'MEMBER'"
              class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black uppercase tracking-wider"
            >
              <span>📱</span>
              <span>Mode Seluler Member</span>
            </div>
            <div
              v-else-if="peranAktif === 'PELATIH'"
              class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black uppercase tracking-wider"
            >
              <span>📱</span>
              <span>Mode Seluler Pelatih</span>
            </div>
            <div
              v-else
              class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider"
            >
              <span>🔐</span>
              <span>Portal Administrator</span>
            </div>

            <h1 class="text-xl font-black text-slate-900 tracking-tight">
              {{ peranAktif === 'MEMBER' ? 'Masuk Akun Member' : (peranAktif === 'PELATIH' ? 'Masuk Akun Pelatih' : 'Masuk Dasbor Admin') }}
            </h1>
            <p class="text-xs text-slate-500 font-medium">
              {{
                peranAktif === 'MEMBER'
                  ? 'Akses Jadwal Kelas, Presensi QR & Keanggotaan'
                  : (peranAktif === 'PELATIH' ? 'Kelola Kelas, Sesi Latihan & Presensi Klien' : 'Sistem Operasional, Keuangan & Manajemen Studio')
              }}
            </p>
          </div>
        </div>

        <!-- Alert Notifikasi Sukses Masuk -->
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform -translate-y-2 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div v-if="pesanSukses" class="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-3 shadow-xs">
            <div class="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 font-black text-sm shrink-0">
              ✓
            </div>
            <div>
              <p class="font-bold text-emerald-900 text-xs">Otorisasi Berhasil!</p>
              <p class="text-[11px] text-emerald-700 mt-0.5 font-medium">{{ pesanSukses }}</p>
            </div>
          </div>
        </Transition>

        <!-- Alert Peringatan Pesan Kesalahan -->
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform -translate-y-2 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div v-if="pesanKesalahan" class="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5">
            <svg class="w-4 h-4 mt-0.5 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-medium">{{ pesanKesalahan }}</span>
          </div>
        </Transition>

        <!-- Formulir Masuk -->
        <form @submit.prevent="tanganiMasuk" class="space-y-4">
          <!-- Input Email -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              {{ peranAktif === 'ADMIN' ? 'Email Administrator' : 'Email Akun' }}
            </label>
            <div class="relative">
              <input
                v-model="surel"
                type="email"
                required
                :placeholder="
                  peranAktif === 'MEMBER'
                    ? 'member@mezonastudio.com'
                    : (peranAktif === 'PELATIH' ? 'pelatih@mezonastudio.com' : 'admin@mezonastudio.com')
                "
                class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition duration-200"
              />
              <span class="absolute right-3.5 top-3.5 text-slate-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </span>
            </div>
          </div>

          <!-- Input Kata Sandi -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Kata Sandi
              </label>
            </div>
            <div class="relative">
              <input
                v-model="kataSandi"
                :type="tampilkanSandi ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition duration-200"
              />
              <button
                type="button"
                @click="tampilkanSandi = !tampilkanSandi"
                class="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition"
              >
                <svg v-if="!tampilkanSandi" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Tombol Masuk Utama Sesuai Peran -->
          <button
            type="submit"
            :disabled="sedangMemuat"
            class="w-full mt-2 py-3.5 px-4 rounded-xl font-black text-sm tracking-wide shadow-md active:scale-[0.99] transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="{
              'bg-gradient-to-r from-neon-magenta via-pink-600 to-neon-fuchsia text-white hover:brightness-110': peranAktif === 'MEMBER',
              'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white hover:brightness-110': peranAktif === 'PELATIH',
              'bg-slate-900 hover:bg-slate-800 text-white': peranAktif === 'ADMIN'
            }"
          >
            <svg v-if="sedangMemuat" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>
              {{
                sedangMemuat
                  ? 'Memverifikasi Otorisasi...'
                  : (peranAktif === 'MEMBER'
                      ? 'Masuk Dasbor Member (Mode Seluler) →'
                      : (peranAktif === 'PELATIH' ? 'Masuk Dasbor Pelatih (Mode Seluler) →' : 'Masuk Portal Administrator →'))
              }}
            </span>
          </button>
        </form>

        <!-- Tombol Cepat Pengujian Peran (Demo Helper) -->
        <div class="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <p class="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2 flex items-center justify-center space-x-1">
            <span>⚡</span>
            <span>Uji Coba Cepat (Akun Demo)</span>
          </p>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              @click="setelUjiCoba('MEMBER')"
              type="button"
              class="px-2 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs border border-slate-200 shadow-2xs transition active:scale-95 flex flex-col items-center justify-center"
              title="Isi Akun Super Member"
            >
              <span class="text-sm">👤</span>
              <span class="text-[11px] mt-0.5">Super Member</span>
            </button>
            <button
              @click="setelUjiCoba('PELATIH')"
              type="button"
              class="px-2 py-2 rounded-xl bg-white hover:bg-purple-50 text-purple-700 font-bold text-xs border border-slate-200 shadow-2xs transition active:scale-95 flex flex-col items-center justify-center"
              title="Isi Akun Pelatih"
            >
              <span class="text-sm">🏋️</span>
              <span class="text-[11px] mt-0.5">Pelatih</span>
            </button>
            <button
              @click="setelUjiCoba('ADMIN')"
              type="button"
              class="px-2 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs transition active:scale-95 flex flex-col items-center justify-center"
              title="Isi Akun Super Administrator"
            >
              <span class="text-sm">🔑</span>
              <span class="text-[11px] mt-0.5">Super Admin</span>
            </button>
          </div>
        </div>

        <!-- Garis Pemisah / Tautan Bantuan / Pendaftaran Baru -->
        <div class="mt-5 pt-4 border-t border-slate-200 text-center">
          <p class="text-xs text-slate-600">
            Belum punya akun member?
            <NuxtLink to="/daftar" class="text-rose-600 font-bold hover:underline ml-1">
              Daftar Member Baru →
            </NuxtLink>
          </p>
        </div>
      </div>

      <!-- Tautan Bawah ke Beranda -->
      <div v-if="!isNative" class="mt-4 text-center">
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
