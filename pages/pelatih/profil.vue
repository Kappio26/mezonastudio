<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'seluler'
})

const { dataPengguna, bukaKonfirmasiKeluar } = useOtentikasi()

const inisialPelatih = computed(() => {
  const nama = (dataPengguna.value?.nama_lengkap || 'Pelatih').replace(/^Coach\s+/i, '').split(' ')
  return ((nama[0]?.[0] || 'P') + (nama[1]?.[0] || (nama[0]?.[1] || 'T'))).toUpperCase()
})

const namaTampil = computed(() => {
  const raw = dataPengguna.value?.nama_lengkap || 'Coach Mezona'
  return raw.startsWith('Coach') ? raw : `Coach ${raw}`
})
</script>

<template>
  <div class="space-y-5 pb-6">
    <div class="text-center py-4">
      <div class="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-neon-magenta to-neon-fuchsia p-1 shadow-glow-magenta mb-3">
        <div class="w-full h-full bg-slate-900 rounded-[20px] flex items-center justify-center font-black text-2xl text-neon-pink">
          {{ inisialPelatih }}
        </div>
      </div>
      <h2 class="text-lg font-extrabold text-white">{{ namaTampil }}</h2>
      <p class="text-xs text-slate-400">{{ dataPengguna?.email }}</p>
      <span class="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-200 border border-rose-500/30">
        INSTRUKTUR RESMI MEZONA STUDIO
      </span>
    </div>

    <div class="efek-kaca rounded-2xl p-4 border border-rose-500/20 space-y-3">
      <div class="flex justify-between items-center py-2 border-b border-white/5 text-xs">
        <span class="text-slate-400">ID Akun Pelatih</span>
        <span class="font-mono text-slate-200">{{ dataPengguna?.id?.substring(0, 8) }}...</span>
      </div>
      <div class="flex justify-between items-center py-2 border-b border-white/5 text-xs">
        <span class="text-slate-400">Peran Sistem</span>
        <span class="font-bold text-neon-pink">PELATIH / INSTRUKTUR</span>
      </div>
      <div class="flex justify-between items-center py-2 text-xs">
        <span class="text-slate-400">Pusat Informasi Studio</span>
        <span class="text-slate-200">Mezona Studio Management</span>
      </div>
    </div>

    <button
      @click="bukaKonfirmasiKeluar"
      class="w-full py-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 font-bold text-xs transition duration-200"
    >
      Keluar dari Akun Pelatih
    </button>
  </div>
</template>
