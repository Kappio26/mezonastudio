<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'seluler'
})

const { dataPengguna } = useOtentikasi()

const sedangMemuat = ref(true)
const daftarKelas = ref<any[]>([])

const muatJadwal = async () => {
  sedangMemuat.value = true
  try {
    const params = new URLSearchParams()
    if (dataPengguna.value?.id) params.append('id', dataPengguna.value.id)
    if (dataPengguna.value?.email) params.append('email', dataPengguna.value.email)

    const res: any = await $fetch(`/api/pelatih/dasbor?${params.toString()}`)
    if (res.sukses && res.data) {
      daftarKelas.value = res.data.kelas_diajar || []
    }
  } catch (err) {
    console.error('Gagal mengambil jadwal pelatih:', err)
  } finally {
    sedangMemuat.value = false
  }
}

onMounted(() => {
  muatJadwal()
})
</script>

<template>
  <div class="space-y-4 pb-6">
    <div>
      <h2 class="text-xl font-black text-white">Jadwal Mengajar Anda</h2>
      <p class="text-xs text-slate-400">Jadwal sesi kelas studio resmi yang ditugaskan kepada Anda</p>
    </div>

    <div v-if="sedangMemuat" class="efek-kaca rounded-2xl p-8 text-center text-slate-400 text-xs">
      <div class="inline-block animate-spin text-xl mb-1">🔄</div>
      <p>Memuat kalender mengajar dari database...</p>
    </div>

    <div v-else-if="daftarKelas.length === 0" class="efek-kaca rounded-2xl p-6 text-center text-slate-400 text-xs">
      Belum ada jadwal kelas yang tersedia.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="sesi in daftarKelas"
        :key="sesi.id"
        class="efek-kaca rounded-2xl p-4 border border-rose-500/20 hover:border-rose-500/40 transition"
      >
        <div class="flex justify-between items-center mb-1">
          <h3 class="text-sm font-black text-white">{{ sesi.nama_kelas }}</h3>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Kapasitas: {{ sesi.kapasitas }} Peserta
          </span>
        </div>
        <p class="text-xs text-neon-pink font-semibold">🕒 {{ sesi.hari }} • {{ sesi.jam }}</p>
        <p class="text-xs text-slate-400 mt-1">📍 {{ sesi.ruang }}</p>
        <div class="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-[11px] text-slate-300">
          <span>Terdaftar: <strong>{{ sesi.terdaftar }} Peserta</strong></span>
          <span class="text-neon-pink font-semibold">{{ sesi.status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
