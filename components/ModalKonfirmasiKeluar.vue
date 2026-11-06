<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

const { modalKeluarTerbuka, tutupKonfirmasiKeluar, konfirmasiDanKeluar } = useOtentikasi()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modalKeluarTerbuka"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      >
        <!-- Backdrop klik luar untuk menutup -->
        <div class="absolute inset-0" @click="tutupKonfirmasiKeluar"></div>

        <!-- Kartu Modal Glassmorphism -->
        <div class="relative w-full max-w-sm rounded-3xl p-6 border border-slate-200 shadow-2xl overflow-hidden bg-white z-10 text-center">
          <!-- Dekorasi Aksen Header -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500"></div>

          <!-- Ikon Peringatan Keluar -->
          <div class="w-14 h-14 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-4 shadow-sm">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>

          <!-- Judul & Deskripsi -->
          <h3 class="text-lg font-black text-slate-900 tracking-wide">
            Keluar dari Mezona Studio?
          </h3>
          <p class="text-xs text-slate-500 mt-2 leading-relaxed">
            Apakah Anda yakin ingin mengakhiri sesi ini? Anda perlu memasukkan email dan kata sandi kembali untuk masuk.
          </p>

          <!-- Tombol Aksi Batal & Ya Keluar -->
          <div class="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="tutupKonfirmasiKeluar"
              class="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition active:scale-95"
            >
              Batal
            </button>
            <button
              type="button"
              @click="konfirmasiDanKeluar"
              class="py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition active:scale-95"
            >
              Ya, Keluar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
