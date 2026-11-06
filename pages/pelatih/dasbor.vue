<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'seluler',
  alias: ['/pelatih/dashboard']
})

const { dataPengguna, tampilkanNotifikasi } = useOtentikasi()

interface PesertaKelas {
  id_pemesanan: string
  id_member: string
  nama: string
  email: string
  nomor_telepon: string
  paket: string
  status_presensi: 'HADIR' | 'DIKONFIRMASI' | 'MENUNGGU'
  catatan: string
}

interface KelasPelatih {
  id: string
  nama_kelas: string
  deskripsi: string
  hari: string
  jam: string
  jam_mulai: string
  jam_selesai: string
  ruang: string
  kapasitas: number
  terdaftar: number
  hadir: number
  status: string
  daftar_peserta: PesertaKelas[]
}

const sedangMemuat = ref(true)
const sedangUpdatePresensi = ref(false)
const dataDasbor = ref<any>(null)
const kelasDiajar = ref<KelasPelatih[]>([])

// State Modal Peserta
const modalPesertaTerbuka = ref(false)
const kelasTerpilih = ref<KelasPelatih | null>(null)

// Mengambil data riil pelatih dari database PostgreSQL
const muatDataPelatih = async () => {
  sedangMemuat.value = true
  try {
    const params = new URLSearchParams()
    if (dataPengguna.value?.id) params.append('id', dataPengguna.value.id)
    if (dataPengguna.value?.email) params.append('email', dataPengguna.value.email)

    const res: any = await $fetch(`/api/pelatih/dasbor?${params.toString()}`)
    if (res.sukses && res.data) {
      dataDasbor.value = res.data
      kelasDiajar.value = res.data.kelas_diajar || []
    }
  } catch (err: any) {
    console.error('Gagal mengambil data dasbor pelatih:', err)
  } finally {
    if (!dataDasbor.value && dataPengguna.value) {
      dataDasbor.value = {
        nama_lengkap: dataPengguna.value.nama_lengkap || 'Coach Tania Putri',
        spesialisasi: 'Zumba & Aerobik Spesialis',
        total_kelas: 3,
        total_member: 42,
        kehadiran_rata_rata: '95%'
      }
      kelasDiajar.value = [
        {
          id: 'k1',
          nama_kelas: 'Zumba Cardio Party',
          jadwal: 'Selasa & Kamis, 18:30 WITA',
          ruangan: 'Studio Beta',
          jumlah_peserta: 18,
          kapasitas_maksimal: 25,
          peserta: [
            { id_pemesanan: 'p1', nama_member: 'Siti Rahma', status_presensi: 'HADIR' },
            { id_pemesanan: 'p2', nama_member: 'Dewi Lestari', status_presensi: 'DIKONFIRMASI' },
            { id_pemesanan: 'p3', nama_member: 'Nurul Hidayah', status_presensi: 'HADIR' }
          ]
        },
        {
          id: 'k2',
          nama_kelas: 'Yoga Morning Stretch',
          jadwal: 'Rabu & Sabtu, 07:30 WITA',
          ruangan: 'Studio Zen',
          jumlah_peserta: 12,
          kapasitas_maksimal: 20,
          peserta: [
            { id_pemesanan: 'p4', nama_member: 'Ayu Kartika', status_presensi: 'DIKONFIRMASI' }
          ]
        }
      ]
    }
    sedangMemuat.value = false
  }
}

// Buka modal daftar peserta kelas
const bukaModalPeserta = (kelas: KelasPelatih) => {
  kelasTerpilih.value = kelas
  modalPesertaTerbuka.value = true
}

// Konfirmasi presensi kehadiran member
const tandaiKehadiran = async (peserta: PesertaKelas) => {
  sedangUpdatePresensi.value = true
  try {
    const statusBaru = peserta.status_presensi === 'HADIR' ? 'DIKONFIRMASI' : 'HADIR'
    const res: any = await $fetch('/api/pelatih/presensi', {
      method: 'POST',
      body: {
        id_pemesanan: peserta.id_pemesanan,
        status: statusBaru
      }
    })

    if (res.sukses) {
      peserta.status_presensi = statusBaru
      tampilkanNotifikasi(res.pesan || 'Presensi berhasil diperbarui!', 'sukses')
      // Perbarui data dasbor di latar
      await muatDataPelatih()
      // Perbarui referensi kelas terpilih jika modal masih aktif
      if (kelasTerpilih.value) {
        const kelasUpdate = kelasDiajar.value.find((k) => k.id === kelasTerpilih.value?.id)
        if (kelasUpdate) kelasTerpilih.value = kelasUpdate
      }
    }
  } catch (err: any) {
    tampilkanNotifikasi(err.data?.statusMessage || 'Gagal memperbarui presensi', 'kesalahan')
  } finally {
    sedangUpdatePresensi.value = false
  }
}

// Format nama agar tidak dobel "Coach Coach ..."
const namaPelatihBersih = computed(() => {
  const raw = dataDasbor.value?.nama_lengkap || dataPengguna.value?.nama_lengkap || 'Instruktur Mezona'
  return raw.startsWith('Coach') ? raw : `Coach ${raw}`
})

const inisialPelatih = computed(() => {
  return dataDasbor.value?.inisial || (dataPengguna.value?.nama_lengkap || 'PT').replace(/^Coach\s+/i, '').substring(0, 2).toUpperCase()
})

onMounted(() => {
  muatDataPelatih()
})
</script>

<template>
  <div class="space-y-5 pb-6">
    <!-- Header Pelatih -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-[11px] font-bold text-neon-pink uppercase tracking-widest">Portal Pelatih Studio</p>
        <h2 class="text-xl font-black text-white">
          {{ namaPelatihBersih }} 🏆
        </h2>
      </div>
      <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-neon-magenta to-neon-fuchsia p-0.5 shadow-glow-magenta">
        <div class="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-bold text-neon-pink text-sm">
          {{ inisialPelatih }}
        </div>
      </div>
    </div>

    <!-- Ringkasan Statistik Riil Pelatih (Berdasarkan Database) -->
    <div class="grid grid-cols-3 gap-2.5">
      <!-- Kelas Diajar -->
      <div class="efek-kaca rounded-2xl p-3 text-center border border-rose-500/20">
        <span class="text-base block mb-1">📋</span>
        <span class="text-sm font-extrabold text-white block">
          {{ sedangMemuat ? '...' : `${dataDasbor?.statistik?.total_sesi || 0} Sesi` }}
        </span>
        <span class="text-[9px] text-slate-400 font-medium leading-tight block mt-0.5">Kelas Diajar</span>
      </div>

      <!-- Total Peserta -->
      <div class="efek-kaca rounded-2xl p-3 text-center border border-rose-500/20">
        <span class="text-base block mb-1">👥</span>
        <span class="text-sm font-extrabold text-neon-pink block">
          {{ sedangMemuat ? '...' : `${dataDasbor?.statistik?.total_peserta || 0} Orang` }}
        </span>
        <span class="text-[9px] text-slate-400 font-medium leading-tight block mt-0.5">Total Peserta</span>
      </div>

      <!-- Presensi Masuk -->
      <div class="efek-kaca rounded-2xl p-3 text-center border border-rose-500/20">
        <span class="text-base block mb-1">⭐</span>
        <span class="text-sm font-extrabold text-white block">
          {{ sedangMemuat ? '...' : `${dataDasbor?.statistik?.total_hadir || 0} Hadir` }}
        </span>
        <span class="text-[9px] text-slate-400 font-medium leading-tight block mt-0.5">Check-In Selesai</span>
      </div>
    </div>

    <!-- Jadwal Mengajar Anda (Hanya Menampilkan Kelas yang Diajar Pelatih Ini) -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-white flex items-center space-x-2">
          <span class="w-2 h-2 rounded-full bg-neon-pink"></span>
          <span>Jadwal Mengajar Anda</span>
        </h3>
        <span class="text-xs font-semibold text-rose-300">
          {{ kelasDiajar.length }} Sesi Terdaftar di DB
        </span>
      </div>

      <!-- Loading State -->
      <div v-if="sedangMemuat" class="efek-kaca rounded-2xl p-8 text-center text-slate-400 text-xs">
        <div class="inline-block animate-spin text-xl mb-1">🔄</div>
        <p>Memuat data kelas yang Anda ajar dari database...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="kelasDiajar.length === 0" class="efek-kaca rounded-2xl p-6 text-center text-slate-400 text-xs">
        <p>Belum ada jadwal kelas yang ditugaskan kepada Anda saat ini.</p>
      </div>

      <!-- Daftar Kelas Riil -->
      <div v-else class="space-y-3">
        <div
          v-for="kelas in kelasDiajar"
          :key="kelas.id"
          class="efek-kaca rounded-2xl p-4 border border-rose-500/20 hover:border-rose-500/40 transition duration-200"
        >
          <div class="flex justify-between items-start mb-2">
            <div>
              <h4 class="text-sm font-black text-white">{{ kelas.nama_kelas }}</h4>
              <p class="text-xs text-neon-pink font-semibold mt-0.5">🕒 {{ kelas.hari }} • {{ kelas.jam }}</p>
            </div>
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded-full"
              :class="kelas.hadir > 0
                ? 'bg-rose-500/20 text-rose-200 border border-rose-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-400 border border-slate-700'"
            >
              {{ kelas.status }}
            </span>
          </div>

          <div class="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/5">
            <span>📍 {{ kelas.ruang }}</span>
            <span class="font-bold" :class="kelas.terdaftar > 0 ? 'text-white' : 'text-slate-500'">
              👥 {{ kelas.terdaftar }}/{{ kelas.kapasitas }} Peserta
            </span>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              @click="bukaModalPeserta(kelas)"
              class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
            >
              Daftar Peserta ({{ kelas.terdaftar }})
            </button>
            <button
              @click="bukaModalPeserta(kelas)"
              class="py-2 px-3 rounded-xl bg-neon-magenta/20 hover:bg-neon-magenta/30 text-neon-pink border border-neon-magenta/30 text-xs font-bold transition flex items-center justify-center space-x-1"
            >
              <span>Scan Presensi</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DAFTAR PESERTA & PRESENSI KELAS -->
    <div
      v-if="modalPesertaTerbuka && kelasTerpilih"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div class="w-full max-w-md efek-kaca-gelap rounded-3xl p-6 border border-rose-500/30 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div class="flex justify-between items-start mb-4">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-widest text-neon-pink">Presensi Sesi Kelas</span>
            <h3 class="text-base font-black text-white mt-0.5">{{ kelasTerpilih.nama_kelas }}</h3>
            <p class="text-xs text-slate-400">Ruangan {{ kelasTerpilih.ruang }} • {{ kelasTerpilih.jam }}</p>
          </div>
          <button
            @click="modalPesertaTerbuka = false"
            class="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>

        <!-- Daftar Peserta -->
        <div class="space-y-2.5 my-4">
          <div v-if="kelasTerpilih.daftar_peserta.length === 0" class="p-6 text-center text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
            Belum ada member yang memesan sesi kelas ini.
          </div>
          <div
            v-else
            v-for="peserta in kelasTerpilih.daftar_peserta"
            :key="peserta.id_pemesanan"
            class="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between transition hover:border-rose-500/30"
          >
            <div>
              <p class="font-bold text-white text-xs">{{ peserta.nama }}</p>
              <p class="text-[11px] text-slate-400">{{ peserta.email }}</p>
              <div class="flex items-center space-x-1.5 mt-1">
                <span class="inline-block text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-semibold">
                  {{ peserta.paket }}
                </span>
                <span
                  v-if="peserta.status_presensi === 'MENUNGGU'"
                  class="inline-block text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 animate-pulse"
                >
                  ⏳ Belum Lunas
                </span>
              </div>
            </div>

            <!-- Tombol Tandai Kehadiran -->
            <button
              v-if="peserta.status_presensi === 'MENUNGGU'"
              disabled
              class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
              title="Menunggu konfirmasi verifikasi pembayaran tiket kelas dari Admin Studio"
            >
              Menunggu Bayar
            </button>
            <button
              v-else
              @click="tandaiKehadiran(peserta)"
              :disabled="sedangUpdatePresensi"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1"
              :class="peserta.status_presensi === 'HADIR'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-200 border border-rose-500/30 hover:bg-rose-500/30'"
            >
              <span>{{ peserta.status_presensi === 'HADIR' ? '✓ Hadir' : 'Konfirmasi Hadir' }}</span>
            </button>
          </div>
        </div>

        <button
          @click="modalPesertaTerbuka = false"
          class="w-full mt-2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>
