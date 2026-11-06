<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'seluler'
})

const { dataPengguna, inisialisasiSesi, tampilkanNotifikasi } = useOtentikasi()

interface JadwalSayaItem {
  id: string
  id_kelas: string
  nama_kelas: string
  deskripsi: string
  pelatih: string
  hari: string
  jam: string
  ruangan: string
  hari_tanggal: string
  tanggal_sesi_teks: string
  status: 'DIKONFIRMASI' | 'HADIR' | 'DIBATALKAN' | string
  catatan?: string | null
}

const sedangMemuat = ref(true)
const sedangMembatalkan = ref(false)
const daftarJadwal = ref<JadwalSayaItem[]>([])

const muatJadwal = async () => {
  inisialisasiSesi()
  sedangMemuat.value = true
  try {
    const params = new URLSearchParams()
    if (dataPengguna.value?.id) params.append('id', dataPengguna.value.id)
    if (dataPengguna.value?.email) params.append('email', dataPengguna.value.email)

    const res: any = await $fetch(`/api/member/jadwal-saya?${params.toString()}`)
    if (res.sukses && Array.isArray(res.data)) {
      daftarJadwal.value = res.data
    }
  } catch (err: any) {
    console.error('Gagal mengambil jadwal member:', err)
    tampilkanNotifikasi(err.data?.statusMessage || 'Gagal memuat jadwal sesi', 'kesalahan')
  } finally {
    sedangMemuat.value = false
  }
}

const batalkanKursi = async (item: JadwalSayaItem) => {
  if (!confirm(`Apakah Anda yakin ingin membatalkan pendaftaran kelas ${item.nama_kelas}? Kursi Anda akan dibuka kembali untuk member lain.`)) {
    return
  }

  sedangMembatalkan.value = true
  try {
    const res: any = await $fetch('/api/member/batal-kelas', {
      method: 'POST',
      body: {
        id_pemesanan: item.id,
        id_pengguna: dataPengguna.value?.id
      }
    })

    if (res.sukses) {
      tampilkanNotifikasi(res.pesan || 'Pemesanan kelas berhasil dibatalkan', 'info')
      await muatJadwal()
    }
  } catch (err: any) {
    tampilkanNotifikasi(err.data?.statusMessage || 'Gagal membatalkan pemesanan', 'kesalahan')
  } finally {
    sedangMembatalkan.value = false
  }
}

onMounted(() => {
  muatJadwal()
})
</script>

<template>
  <div class="space-y-4 pb-6">
    <!-- Header Halaman -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black text-white">Jadwal Sesi Anda</h2>
        <p class="text-xs text-slate-400">Daftar kelas studio yang Anda ikuti</p>
      </div>
      <button
        @click="muatJadwal"
        :disabled="sedangMemuat"
        class="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 text-xs transition active:scale-95"
        title="Muat Ulang Jadwal"
      >
        <span :class="{ 'animate-spin inline-block': sedangMemuat }">🔄</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="sedangMemuat" class="efek-kaca rounded-2xl p-10 text-center text-slate-400 text-xs">
      <div class="inline-block animate-spin text-2xl mb-2">🔄</div>
      <p>Mengambil jadwal pemesanan kelas Anda dari database...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="daftarJadwal.length === 0" class="efek-kaca rounded-2xl p-8 text-center space-y-3 border border-white/5">
      <div class="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-2xl">
        📅
      </div>
      <div>
        <h3 class="text-sm font-bold text-white">Belum Ada Sesi Kelas Terdaftar</h3>
        <p class="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Anda belum memesan sesi kelas latihan studio. Pilih sesi favorit Anda sekarang!
        </p>
      </div>
      <NuxtLink
        to="/member/kelas"
        class="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white font-bold text-xs shadow-glow-magenta hover:brightness-110 active:scale-95 transition"
      >
        <span>Eksplorasi Kelas Sekarang</span>
        <span>→</span>
      </NuxtLink>
    </div>

    <!-- Daftar Sesi Riil Terhubung ke Database -->
    <div v-else class="space-y-3">
      <div
        v-for="item in daftarJadwal"
        :key="item.id"
        class="efek-kaca rounded-2xl p-4 border transition duration-200"
        :class="item.status === 'DIKONFIRMASI'
          ? 'border-rose-500/30 bg-rose-950/20'
          : item.status === 'HADIR'
          ? 'border-emerald-500/30 bg-emerald-950/20'
          : item.status === 'MENUNGGU'
          ? 'border-amber-500/40 bg-amber-950/20'
          : 'border-white/5 bg-slate-900/40 opacity-70'"
      >
        <div class="flex justify-between items-start mb-1.5">
          <div>
            <h3 class="text-sm font-black text-white">{{ item.nama_kelas }}</h3>
            <p class="text-xs text-slate-400 mt-0.5">{{ item.pelatih }} • {{ item.ruangan }}</p>
          </div>
          <!-- Badge Status -->
          <span
            class="text-[10px] font-bold px-2 py-0.5 rounded-full"
            :class="item.status === 'DIKONFIRMASI'
              ? 'bg-rose-500/20 text-neon-pink border border-rose-500/30'
              : item.status === 'HADIR'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : item.status === 'MENUNGGU'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
              : 'bg-slate-800 text-slate-400 border border-slate-700'"
          >
            {{ item.status === 'DIKONFIRMASI' ? '✓ Terdaftar' : item.status === 'HADIR' ? '✓ Hadir' : item.status === 'MENUNGGU' ? '⏳ Menunggu Verifikasi Admin' : item.status }}
          </span>
        </div>

        <div class="flex items-center justify-between text-xs text-slate-300 pt-2.5 mt-2 border-t border-white/5">
          <span class="flex items-center space-x-1.5">
            <span>🕒</span>
            <span class="font-medium">{{ item.hari_tanggal }}</span>
          </span>

          <!-- Aksi Batalkan jika masih DIKONFIRMASI atau MENUNGGU -->
          <button
            v-if="item.status === 'DIKONFIRMASI' || item.status === 'MENUNGGU'"
            @click="batalkanKursi(item)"
            :disabled="sedangMembatalkan"
            class="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-red-950/60 text-slate-400 hover:text-red-400 text-[10px] font-semibold border border-white/5 transition"
          >
            Batalkan
          </button>
        </div>
      </div>

      <!-- Tombol Tambah Kelas Baru -->
      <div class="pt-2">
        <NuxtLink
          to="/member/kelas"
          class="w-full py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-rose-200 border border-rose-500/30 font-bold text-xs flex items-center justify-center space-x-2 transition"
        >
          <span>+ Pesan Sesi Kelas Lainnya</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
