<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'seluler'
})

const { dataPengguna } = useOtentikasi()

const sedangMemuat = ref(true)
const daftarKlien = ref<any[]>([])

const muatKlien = async () => {
  sedangMemuat.value = true
  try {
    const params = new URLSearchParams()
    if (dataPengguna.value?.id) params.append('id', dataPengguna.value.id)
    if (dataPengguna.value?.email) params.append('email', dataPengguna.value.email)

    const res: any = await $fetch(`/api/pelatih/klien?${params.toString()}`)
    if (res.sukses && res.data) {
      daftarKlien.value = res.data
    }
  } catch (err) {
    console.error('Gagal mengambil daftar klien:', err)
  } finally {
    sedangMemuat.value = false
  }
}

onMounted(() => {
  muatKlien()
})
</script>

<template>
  <div class="space-y-4 pb-6">
    <div>
      <h2 class="text-xl font-black text-white">Daftar Member di Kelas Anda</h2>
      <p class="text-xs text-slate-400">Anggota aktif yang terdaftar dalam sesi kelas yang Anda ajar</p>
    </div>

    <div v-if="sedangMemuat" class="efek-kaca rounded-2xl p-8 text-center text-slate-400 text-xs">
      <div class="inline-block animate-spin text-xl mb-1">🔄</div>
      <p>Memuat data member klien dari database...</p>
    </div>

    <div v-else-if="daftarKlien.length === 0" class="efek-kaca rounded-2xl p-6 text-center text-slate-400 text-xs">
      Belum ada member yang terdaftar pada kelas Anda.
    </div>

    <div v-else class="space-y-2.5">
      <div
        v-for="klien in daftarKlien"
        :key="klien.id"
        class="efek-kaca rounded-2xl p-4 border border-rose-500/20 flex items-center justify-between"
      >
        <div>
          <h4 class="text-sm font-bold text-white">{{ klien.nama }}</h4>
          <p class="text-[11px] text-slate-400">{{ klien.email }}</p>
          <div class="flex items-center space-x-1.5 mt-1.5">
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-semibold">
              {{ klien.paket }}
            </span>
            <span class="text-[10px] text-slate-400">
              Kelas: {{ klien.kelas_diikuti.join(', ') }}
            </span>
          </div>
        </div>

        <div class="text-right">
          <span class="text-xs font-bold text-neon-pink bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20 block">
            {{ klien.total_kehadiran }} Sesi Hadir
          </span>
          <span class="text-[10px] text-slate-500 block mt-1">WA: {{ klien.nomor_telepon }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
