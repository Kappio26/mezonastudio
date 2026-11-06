<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'admin'
})

const { tampilkanNotifikasi } = useOtentikasi()

interface KelasItem {
  id: string
  nama: string
  nama_kelas: string
  kategori: string
  harga: number
  harga_rupiah: string
  deskripsi: string
  id_pelatih: string
  pelatih: string
  tanggal?: string | null
  tanggal_teks?: string | null
  hari: string
  jam_mulai: string
  jam_selesai: string
  jam: string
  ruang: string
  terisi: number
  kapasitas: number
  aktif: boolean
  status: string
}

interface PelatihOption {
  id: string
  nama: string
}

const sedangMemuat = ref(true)
const sedangMenyimpan = ref(false)
const daftarKelas = ref<KelasItem[]>([])
const daftarPelatihOpsi = ref<PelatihOption[]>([])

// Filter Tanggal & Kalender di List Utama
const filterTanggal = ref<string>('')
const tabFilter = ref<'SEMUA' | 'HARI_INI' | 'MENDATANG'>('SEMUA')

// State Modal Form Tambah / Edit
const modalFormTerbuka = ref(false)
const modeEdit = ref(false)

// Inisialisasi tanggal default hari ini (format YYYY-MM-DD)
const dapatkanTanggalHariIni = () => {
  const d = new Date()
  const tahun = d.getFullYear()
  const bulan = String(d.getMonth() + 1).padStart(2, '0')
  const hari = String(d.getDate()).padStart(2, '0')
  return `${tahun}-${bulan}-${hari}`
}

const formKelas = reactive({
  id: '',
  nama_kelas: '',
  kategori: 'Zumba',
  harga: 50000,
  deskripsi: '',
  id_pelatih: '',
  tanggal: dapatkanTanggalHariIni(),
  hari: 'Senin',
  jam_mulai: '18:30',
  jam_selesai: '19:30',
  kapasitas_maksimal: 20,
  lokasi_ruangan: 'Studio Alpha (Lt. 2)',
  aktif: true
})

// State Modal Hapus
const modalHapusTerbuka = ref(false)
const kelasAkanDihapus = ref<KelasItem | null>(null)

// Format tanggal ke bahasa Indonesia
const formatTanggalIndonesia = (tglStr: string | null | undefined) => {
  if (!tglStr) return ''
  const tgl = new Date(tglStr)
  if (isNaN(tgl.getTime())) return ''
  return tgl.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Saat tanggal kalender dipilih, otomatis update teks hari
const saatTanggalBerubah = () => {
  if (!formKelas.tanggal) return
  const tgl = new Date(formKelas.tanggal)
  if (!isNaN(tgl.getTime())) {
    const namaHari = tgl.toLocaleDateString('id-ID', { weekday: 'long' })
    formKelas.hari = namaHari
  }
}

// Preset cepat tombol tanggal
const pilihPresetTanggal = (offsetHari: number) => {
  const t = new Date()
  t.setDate(t.getDate() + offsetHari)
  const tahun = t.getFullYear()
  const bulan = String(t.getMonth() + 1).padStart(2, '0')
  const hari = String(t.getDate()).padStart(2, '0')
  formKelas.tanggal = `${tahun}-${bulan}-${hari}`
  saatTanggalBerubah()
}

const muatData = async () => {
  sedangMemuat.value = true
  try {
    const [resKelas, resPelatih]: [any, any] = await Promise.all([
      $fetch('/api/admin/kelas'),
      $fetch('/api/admin/pelatih')
    ])

    if (resKelas.sukses && resKelas.data) {
      daftarKelas.value = resKelas.data
    }
    if (resPelatih.sukses && resPelatih.data) {
      daftarPelatihOpsi.value = resPelatih.data.map((p: any) => ({
        id: p.id,
        nama: p.nama
      }))
    }
  } catch (e: any) {
    tampilkanNotifikasi(e.data?.statusMessage || 'Gagal memuat data kelas', 'kesalahan')
  } finally {
    sedangMemuat.value = false
  }
}

const bukaModalTambah = () => {
  modeEdit.value = false
  formKelas.id = ''
  formKelas.nama_kelas = ''
  formKelas.kategori = 'Zumba'
  formKelas.harga = 50000
  formKelas.deskripsi = ''
  formKelas.id_pelatih = daftarPelatihOpsi.value[0]?.id || ''
  formKelas.tanggal = dapatkanTanggalHariIni()
  saatTanggalBerubah()
  formKelas.jam_mulai = '18:30'
  formKelas.jam_selesai = '19:30'
  formKelas.kapasitas_maksimal = 20
  formKelas.lokasi_ruangan = 'Studio Alpha (Lt. 2)'
  formKelas.aktif = true
  modalFormTerbuka.value = true
}

const bukaModalEdit = (k: KelasItem) => {
  modeEdit.value = true
  formKelas.id = k.id
  formKelas.nama_kelas = k.nama
  formKelas.kategori = k.kategori || 'Zumba'
  formKelas.harga = k.harga || 50000
  formKelas.deskripsi = k.deskripsi
  formKelas.id_pelatih = k.id_pelatih
  formKelas.tanggal = k.tanggal || dapatkanTanggalHariIni()
  formKelas.hari = k.hari
  formKelas.jam_mulai = k.jam_mulai
  formKelas.jam_selesai = k.jam_selesai
  formKelas.kapasitas_maksimal = k.kapasitas
  formKelas.lokasi_ruangan = k.ruang
  formKelas.aktif = k.aktif
  modalFormTerbuka.value = true
}

const simpanKelas = async () => {
  if (!formKelas.nama_kelas || !formKelas.id_pelatih || !formKelas.jam_mulai || !formKelas.jam_selesai) {
    tampilkanNotifikasi('Mohon lengkapi nama kelas, pelatih, dan jam sesi.', 'kesalahan')
    return
  }

  sedangMenyimpan.value = true
  try {
    if (modeEdit.value) {
      const res: any = await $fetch('/api/admin/kelas', {
        method: 'PUT',
        body: formKelas
      })
      tampilkanNotifikasi(res.pesan || 'Jadwal kelas berhasil diperbarui!', 'sukses')
    } else {
      const res: any = await $fetch('/api/admin/kelas', {
        method: 'POST',
        body: formKelas
      })
      tampilkanNotifikasi(res.pesan || 'Jadwal kelas baru berhasil ditambahkan!', 'sukses')
    }

    modalFormTerbuka.value = false
    await muatData()
  } catch (e: any) {
    tampilkanNotifikasi(e.data?.statusMessage || 'Gagal menyimpan jadwal kelas', 'kesalahan')
  } finally {
    sedangMenyimpan.value = false
  }
}

const bukaModalKonfirmasiHapus = (k: KelasItem) => {
  kelasAkanDihapus.value = k
  modalHapusTerbuka.value = true
}

const hapusKelas = async () => {
  if (!kelasAkanDihapus.value) return
  sedangMenyimpan.value = true
  try {
    const res: any = await $fetch(`/api/admin/kelas?id=${kelasAkanDihapus.value.id}`, {
      method: 'DELETE'
    })
    tampilkanNotifikasi(res.pesan || 'Kelas berhasil dihapus', 'sukses')
    modalHapusTerbuka.value = false
    kelasAkanDihapus.value = null
    await muatData()
  } catch (e: any) {
    tampilkanNotifikasi(e.data?.statusMessage || 'Gagal menghapus kelas', 'kesalahan')
  } finally {
    sedangMenyimpan.value = false
  }
}

// Daftar kelas yang disaring berdasarkan kalender & tab
const daftarKelasDisaring = computed(() => {
  const hariIniStr = dapatkanTanggalHariIni()

  return daftarKelas.value.filter((k) => {
    // Saring berdasarkan input kalender spesifik
    if (filterTanggal.value) {
      return k.tanggal === filterTanggal.value
    }

    // Saring berdasarkan tab cepat
    if (tabFilter.value === 'HARI_INI') {
      return k.tanggal === hariIniStr
    }

    if (tabFilter.value === 'MENDATANG') {
      if (!k.tanggal) return true
      return k.tanggal >= hariIniStr
    }

    return true
  })
})

onMounted(() => {
  muatData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Halaman Jadwal Kelas -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2">
          <span class="w-2.5 h-2.5 rounded-full bg-neon-zamrud animate-pulse"></span>
          <span class="text-xs font-bold uppercase tracking-widest text-neon-zamrud">Manajemen Jadwal Studio</span>
        </div>
        <h2 class="text-2xl sm:text-3xl font-black text-white mt-1">Jadwal Kelas Mezona Studio</h2>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Atur tanggal, bulan, tahun, jam latihan, dan kuota instruktur secara presisi dengan kalender studio.
        </p>
      </div>

      <div class="flex items-center space-x-3">
        <button
          @click="muatData"
          class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
        >
          🔄 Refresh
        </button>
        <button
          @click="bukaModalTambah"
          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-zamrud to-neon-teal text-slate-950 font-bold text-xs shadow-glow-zamrud hover:brightness-110 active:scale-95 transition flex items-center space-x-1.5"
        >
          <span>🗓️ + Tambah Jadwal Kelas</span>
        </button>
      </div>
    </div>

    <!-- Bar Filter Kalender & Tab Waktu -->
    <div class="efek-kaca p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <!-- Tabs Filter Cepat -->
      <div class="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
        <button
          @click="tabFilter = 'SEMUA'; filterTanggal = ''"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap"
          :class="tabFilter === 'SEMUA' && !filterTanggal
            ? 'bg-gradient-to-r from-neon-zamrud to-neon-teal text-slate-950 font-black shadow-glow-zamrud'
            : 'bg-slate-800/80 text-slate-400 hover:text-white'"
        >
          Semua Jadwal ({{ daftarKelas.length }})
        </button>
        <button
          @click="tabFilter = 'HARI_INI'; filterTanggal = ''"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap"
          :class="tabFilter === 'HARI_INI' && !filterTanggal
            ? 'bg-gradient-to-r from-neon-zamrud to-neon-teal text-slate-950 font-black shadow-glow-zamrud'
            : 'bg-slate-800/80 text-slate-400 hover:text-white'"
        >
          ⚡ Jadwal Hari Ini
        </button>
        <button
          @click="tabFilter = 'MENDATANG'; filterTanggal = ''"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap"
          :class="tabFilter === 'MENDATANG' && !filterTanggal
            ? 'bg-gradient-to-r from-neon-zamrud to-neon-teal text-slate-950 font-black shadow-glow-zamrud'
            : 'bg-slate-800/80 text-slate-400 hover:text-white'"
        >
          🗓️ Sesi Mendatang
        </button>
      </div>

      <!-- Filter Tanggal Kalender Langsung -->
      <div class="flex items-center space-x-2">
        <div class="flex items-center space-x-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5">
          <span class="text-xs text-slate-400 font-medium">Filter Tanggal:</span>
          <input
            v-model="filterTanggal"
            type="date"
            class="bg-transparent text-white text-xs focus:outline-none cursor-pointer [color-scheme:dark]"
          />
        </div>
        <button
          v-if="filterTanggal"
          @click="filterTanggal = ''"
          class="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold"
          title="Reset filter tanggal"
        >
          ✕ Reset
        </button>
      </div>
    </div>

    <!-- Tampilan Loading -->
    <div v-if="sedangMemuat" class="py-16 text-center text-xs text-slate-400">
      <div class="w-8 h-8 rounded-full border-2 border-neon-zamrud border-t-transparent animate-spin mx-auto mb-3"></div>
      <span>Memuat data kelas dari basis data...</span>
    </div>

    <!-- Tampilan Jika Kosong -->
    <div v-else-if="daftarKelasDisaring.length === 0" class="efek-kaca p-12 rounded-2xl border border-slate-800 text-center space-y-3">
      <div class="text-3xl">📅</div>
      <h3 class="text-sm font-bold text-white">Tidak ada jadwal kelas pada tanggal ini</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        Belum ada sesi kelas yang dijadwalkan. Klik tombol Tambah Jadwal Kelas untuk membuat sesi baru.
      </p>
      <button
        @click="filterTanggal = ''; tabFilter = 'SEMUA'"
        class="mt-2 px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 font-bold hover:bg-slate-700"
      >
        Tampilkan Semua Jadwal
      </button>
    </div>

    <!-- Daftar Kelas -->
    <div v-else class="grid grid-cols-1 gap-4">
      <div
        v-for="k in daftarKelasDisaring"
        :key="k.id"
        class="efek-kaca p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="font-bold text-white text-base">{{ k.nama }}</h3>
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded-md border"
              :class="k.aktif ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-red-500/15 text-red-300 border-red-500/30'"
            >
              {{ k.status }}
            </span>
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30"
            >
              {{ k.kategori || 'Studio' }}
            </span>
            <span
              class="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30"
            >
              🏷️ {{ k.harga_rupiah }} / Sesi
            </span>
            <span
              v-if="k.tanggal_teks"
              class="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono"
            >
              {{ k.tanggal }}
            </span>
          </div>

          <p class="text-xs text-slate-400 mt-1">
            Instruktur: <strong class="text-emerald-400">{{ k.pelatih }}</strong> • {{ k.ruang }}
          </p>

          <!-- Tampilan Tanggal, Hari, dan Jam Kalender -->
          <div class="flex flex-wrap items-center gap-2 mt-2">
            <span class="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-teal-300 font-bold flex items-center space-x-1.5">
              <span>🗓️</span>
              <span>{{ k.tanggal_teks || k.hari }}</span>
            </span>
            <span class="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-mono flex items-center space-x-1.5">
              <span>🕒</span>
              <span>{{ k.jam }}</span>
            </span>
          </div>

          <p v-if="k.deskripsi" class="text-xs text-slate-400 mt-2 line-clamp-2">
            {{ k.deskripsi }}
          </p>
        </div>

        <div class="flex items-center space-x-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <div class="text-right">
            <span class="text-xs font-semibold text-slate-300 block">
              👥 {{ k.terisi }}/{{ k.kapasitas }} Peserta
            </span>
            <span class="text-[10px] text-slate-500">Kapasitas Maksimal</span>
          </div>

          <div class="flex items-center space-x-2">
            <button
              @click="bukaModalEdit(k)"
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1"
            >
              <span>✏️ Edit</span>
            </button>
            <button
              @click="bukaModalKonfirmasiHapus(k)"
              class="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-bold border border-red-500/20 transition flex items-center space-x-1"
            >
              <span>🗑️ Hapus</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL FORM TAMBAH / EDIT KELAS DENGAN KALENDER -->
    <div
      v-if="modalFormTerbuka"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-lg efek-kaca rounded-3xl p-6 border border-emerald-500/30 shadow-2xl bg-gelap-kartu/95 max-h-[92vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-widest text-neon-zamrud">Kalender Jadwal Studio</span>
            <h3 class="text-lg font-black text-white mt-0.5">
              {{ modeEdit ? 'Edit Jadwal Kelas' : 'Tambah Jadwal Kelas Baru' }}
            </h3>
          </div>
          <button @click="modalFormTerbuka = false" class="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        <form @submit.prevent="simpanKelas" class="space-y-4">
          <!-- Nama Kelas -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Nama Kelas *</label>
            <input
              v-model="formKelas.nama_kelas"
              type="text"
              required
              placeholder="Contoh: Zumba Dance Cardio / Vinyasa Yoga / Pomfit"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
            />
          </div>

          <!-- Kategori & Tarif Harga Kelas Per Sesi -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Kategori Spesialisasi *</label>
              <select
                v-model="formKelas.kategori"
                required
                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
              >
                <option value="Zumba">Zumba (Dance Cardio)</option>
                <option value="Yoga">Yoga (Fleksibilitas & Meditasi)</option>
                <option value="Poundfit">Poundfit (Ripstix Drumming)</option>
                <option value="Pilates">Pilates (Core & Balance)</option>
                <option value="Studio Fitness">Studio Fitness Umum</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Tarif Kelas Per Sesi (Rp) *</label>
              <div class="relative">
                <span class="absolute left-3 top-2.5 text-xs font-bold text-slate-500">Rp</span>
                <input
                  v-model.number="formKelas.harga"
                  type="number"
                  min="0"
                  step="5000"
                  required
                  placeholder="50000"
                  class="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-rose-300 font-bold text-xs focus:border-neon-zamrud focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Instruktur Pelatih -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Instruktur / Pelatih *</label>
            <select
              v-model="formKelas.id_pelatih"
              required
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
            >
              <option value="" disabled>-- Pilih Instruktur Pelatih --</option>
              <option v-for="p in daftarPelatihOpsi" :key="p.id" :value="p.id">
                {{ p.nama }}
              </option>
            </select>
          </div>

          <!-- PENGATURAN TANGGAL & KALENDER (TANGGAL, BULAN, TAHUN) -->
          <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-neon-zamrud">
                🗓️ Tanggal Sesi Kelas (Kalender) *
              </label>
              <!-- Preset Cepat -->
              <div class="flex items-center space-x-1.5">
                <button
                  type="button"
                  @click="pilihPresetTanggal(0)"
                  class="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  @click="pilihPresetTanggal(1)"
                  class="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700"
                >
                  Besok
                </button>
                <button
                  type="button"
                  @click="pilihPresetTanggal(2)"
                  class="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700"
                >
                  Lusa
                </button>
              </div>
            </div>

            <!-- Input Date Kalender -->
            <div class="relative">
              <input
                v-model="formKelas.tanggal"
                type="date"
                required
                @change="saatTanggalBerubah"
                class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none [color-scheme:dark] cursor-pointer"
              />
            </div>

            <!-- Teks Format Tanggal Terpilih -->
            <div class="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 flex items-center justify-between text-xs">
              <span class="text-slate-400 text-[11px]">Terpilih di Kalender:</span>
              <span class="font-bold text-teal-300 font-mono text-[11px]">
                {{ formatTanggalIndonesia(formKelas.tanggal) || 'Belum dipilih' }}
              </span>
            </div>
          </div>

          <!-- Hari, Jam Mulai, Jam Selesai -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">
                Hari Sesi
                <span class="text-[10px] text-slate-400 font-normal">(Otomatis)</span>
              </label>
              <input
                v-model="formKelas.hari"
                type="text"
                required
                placeholder="Senin"
                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Jam Mulai *</label>
              <input
                v-model="formKelas.jam_mulai"
                type="time"
                required
                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none [color-scheme:dark]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Jam Selesai *</label>
              <input
                v-model="formKelas.jam_selesai"
                type="time"
                required
                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          <!-- Kapasitas & Lokasi Ruangan -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Kapasitas Maksimal</label>
              <input
                v-model="formKelas.kapasitas_maksimal"
                type="number"
                min="1"
                required
                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Lokasi Ruangan</label>
              <input
                v-model="formKelas.lokasi_ruangan"
                type="text"
                required
                placeholder="Studio Alpha (Lt. 2)"
                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
              />
            </div>
          </div>

          <!-- Deskripsi Kelas -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Deskripsi Kelas</label>
            <textarea
              v-model="formKelas.deskripsi"
              rows="2"
              placeholder="Jelaskan jenis latihan, target pembakaran kalori, atau peralatan yang dibawa."
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
            ></textarea>
          </div>

          <!-- Status Aktif (Mode Edit) -->
          <div v-if="modeEdit" class="flex items-center space-x-2 pt-1">
            <input
              id="kelas_aktif"
              v-model="formKelas.aktif"
              type="checkbox"
              class="w-4 h-4 rounded text-neon-zamrud focus:ring-neon-zamrud bg-slate-900 border-slate-700"
            />
            <label for="kelas_aktif" class="text-xs text-slate-300 font-medium">Kelas Aktif Dapat Dipesan Member</label>
          </div>

          <!-- Tombol Aksi -->
          <div class="mt-6 pt-3 border-t border-white/5 grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="modalFormTerbuka = false"
              class="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="sedangMenyimpan"
              class="py-2.5 rounded-xl bg-gradient-to-r from-neon-zamrud to-neon-teal text-slate-950 font-black text-xs shadow-glow-zamrud hover:brightness-110 disabled:opacity-50 transition"
            >
              {{ sedangMenyimpan ? 'Menyimpan...' : (modeEdit ? 'Simpan Perubahan' : '✓ Tambah Jadwal Kelas') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL KONFIRMASI HAPUS KELAS -->
    <div
      v-if="modalHapusTerbuka && kelasAkanDihapus"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div class="w-full max-w-sm efek-kaca rounded-3xl p-6 border border-red-500/30 shadow-2xl bg-gelap-kartu text-center">
        <div class="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center font-bold text-xl mb-3">
          🗑️
        </div>
        <h3 class="text-base font-bold text-white">Hapus Jadwal Kelas?</h3>
        <p class="text-xs text-slate-400 mt-2">
          Apakah Anda yakin ingin menghapus kelas <strong>{{ kelasAkanDihapus.nama }}</strong>? Seluruh pemesanan sesi member pada kelas ini akan ikut terhapus.
        </p>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <button
            @click="modalHapusTerbuka = false"
            class="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
          >
            Batal
          </button>
          <button
            @click="hapusKelas"
            :disabled="sedangMenyimpan"
            class="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs disabled:opacity-50 transition"
          >
            {{ sedangMenyimpan ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
