<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'admin'
})

const { tampilkanNotifikasi } = useOtentikasi()

interface PelatihItem {
  id: string
  nama: string
  email: string
  nomor_telepon: string
  spesialisasi: string
  total_kelas: number
  aktif: boolean
  status: string
}

const sedangMemuat = ref(true)
const sedangMenyimpan = ref(false)
const pelatihList = ref<PelatihItem[]>([])

// State Modal Tambah / Edit
const modalFormTerbuka = ref(false)
const modeEdit = ref(false)
const formPelatih = reactive({
  id: '',
  nama_lengkap: '',
  email: '',
  kata_sandi: '',
  nomor_telepon: '',
  spesialisasi: '',
  aktif: true
})

// State Modal Hapus
const modalHapusTerbuka = ref(false)
const pelatihAkanDihapus = ref<PelatihItem | null>(null)

const muatPelatih = async () => {
  sedangMemuat.value = true
  try {
    const respon: any = await $fetch('/api/admin/pelatih')
    if (respon.sukses && respon.data) {
      pelatihList.value = respon.data
    }
  } catch (e: any) {
    tampilkanNotifikasi(e.data?.statusMessage || 'Gagal mengambil data pelatih', 'kesalahan')
  } finally {
    sedangMemuat.value = false
  }
}

const bukaModalTambah = () => {
  modeEdit.value = false
  formPelatih.id = ''
  formPelatih.nama_lengkap = ''
  formPelatih.email = ''
  formPelatih.kata_sandi = ''
  formPelatih.nomor_telepon = ''
  formPelatih.spesialisasi = ''
  formPelatih.aktif = true
  modalFormTerbuka.value = true
}

const bukaModalEdit = (p: PelatihItem) => {
  modeEdit.value = true
  formPelatih.id = p.id
  formPelatih.nama_lengkap = p.nama
  formPelatih.email = p.email
  formPelatih.kata_sandi = ''
  formPelatih.nomor_telepon = p.nomor_telepon
  formPelatih.spesialisasi = p.spesialisasi
  formPelatih.aktif = p.aktif
  modalFormTerbuka.value = true
}

const simpanPelatih = async () => {
  if (!formPelatih.nama_lengkap) {
    tampilkanNotifikasi('Nama lengkap pelatih wajib diisi', 'kesalahan')
    return
  }

  if (!modeEdit.value && (!formPelatih.email || !formPelatih.kata_sandi)) {
    tampilkanNotifikasi('Email dan kata sandi wajib diisi untuk pelatih baru', 'kesalahan')
    return
  }

  sedangMenyimpan.value = true
  try {
    if (modeEdit.value) {
      const res: any = await $fetch('/api/admin/pelatih', {
        method: 'PUT',
        body: {
          id: formPelatih.id,
          nama_lengkap: formPelatih.nama_lengkap,
          nomor_telepon: formPelatih.nomor_telepon,
          spesialisasi: formPelatih.spesialisasi,
          aktif: formPelatih.aktif
        }
      })
      tampilkanNotifikasi(res.pesan || 'Data pelatih berhasil diperbarui!', 'sukses')
    } else {
      const res: any = await $fetch('/api/admin/pelatih', {
        method: 'POST',
        body: {
          nama_lengkap: formPelatih.nama_lengkap,
          email: formPelatih.email,
          kata_sandi: formPelatih.kata_sandi,
          nomor_telepon: formPelatih.nomor_telepon,
          spesialisasi: formPelatih.spesialisasi
        }
      })
      tampilkanNotifikasi(res.pesan || 'Pelatih baru berhasil ditambahkan!', 'sukses')
    }

    modalFormTerbuka.value = false
    await muatPelatih()
  } catch (e: any) {
    tampilkanNotifikasi(e.data?.statusMessage || 'Gagal menyimpan data pelatih', 'kesalahan')
  } finally {
    sedangMenyimpan.value = false
  }
}

const bukaModalKonfirmasiHapus = (p: PelatihItem) => {
  pelatihAkanDihapus.value = p
  modalHapusTerbuka.value = true
}

const hapusPelatih = async () => {
  if (!pelatihAkanDihapus.value) return
  sedangMenyimpan.value = true
  try {
    const res: any = await $fetch(`/api/admin/pelatih?id=${pelatihAkanDihapus.value.id}`, {
      method: 'DELETE'
    })
    tampilkanNotifikasi(res.pesan || 'Pelatih berhasil dihapus', 'sukses')
    modalHapusTerbuka.value = false
    pelatihAkanDihapus.value = null
    await muatPelatih()
  } catch (e: any) {
    tampilkanNotifikasi(e.data?.statusMessage || 'Gagal menghapus pelatih', 'kesalahan')
  } finally {
    sedangMenyimpan.value = false
  }
}

onMounted(() => {
  muatPelatih()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Halaman Pelatih -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-white">Instruktur & Pelatih Studio</h2>
        <p class="text-xs text-slate-400 mt-1">
          Kelola data pelatih resmi Mezona Studio ({{ pelatihList.length }} Instruktur)
        </p>
      </div>

      <div class="flex items-center space-x-3">
        <button
          @click="muatPelatih"
          class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
        >
          🔄 Refresh
        </button>
        <button
          @click="bukaModalTambah"
          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-teal to-neon-zamrud text-slate-950 font-bold text-xs shadow-glow-teal hover:brightness-110 active:scale-95 transition flex items-center space-x-1.5"
        >
          <span>+ Tambah Pelatih Baru</span>
        </button>
      </div>
    </div>

    <!-- Tampilan Loading Skeleton -->
    <div v-if="sedangMemuat" class="py-16 text-center text-xs text-slate-400">
      <div class="w-8 h-8 rounded-full border-2 border-neon-teal border-t-transparent animate-spin mx-auto mb-3"></div>
      <span>Memuat data instruktur dari basis data...</span>
    </div>

    <!-- Daftar Kartu Pelatih -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="p in pelatihList"
        :key="p.id"
        class="efek-kaca p-5 rounded-2xl border border-slate-800 hover:border-teal-500/30 transition flex flex-col justify-between"
      >
        <div>
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-neon-teal to-neon-zamrud p-0.5 shadow-glow-teal">
                <div class="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-neon-teal text-sm">
                  {{ p.nama.substring(0, 2).toUpperCase() }}
                </div>
              </div>
              <div>
                <h3 class="text-base font-bold text-white">{{ p.nama }}</h3>
                <p class="text-xs text-neon-teal font-semibold">{{ p.spesialisasi }}</p>
              </div>
            </div>

            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded-full border"
              :class="p.aktif ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'"
            >
              {{ p.status }}
            </span>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-800/80 space-y-1 text-xs text-slate-400">
            <p>✉️ {{ p.email }}</p>
            <p>📱 {{ p.nomor_telepon || 'Tidak ada nomor telepon' }}</p>
            <p>📋 Mengajar: <strong class="text-slate-200">{{ p.total_kelas }} Kelas Aktif</strong></p>
          </div>
        </div>

        <!-- Tombol Aksi Edit & Hapus -->
        <div class="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
          <button
            @click="bukaModalEdit(p)"
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1"
          >
            <span>✏️ Edit</span>
          </button>
          <button
            @click="bukaModalKonfirmasiHapus(p)"
            class="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-bold border border-red-500/20 transition flex items-center space-x-1"
          >
            <span>🗑️ Hapus</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL FORM TAMBAH / EDIT PELATIH -->
    <div
      v-if="modalFormTerbuka"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-md efek-kaca rounded-3xl p-6 border border-emerald-500/20 shadow-2xl bg-gelap-kartu/95">
        <div class="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
          <h3 class="text-lg font-bold text-white">
            {{ modeEdit ? 'Edit Data Pelatih' : 'Tambah Pelatih Baru' }}
          </h3>
          <button @click="modalFormTerbuka = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <form @submit.prevent="simpanPelatih" class="space-y-3.5">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap *</label>
            <input
              v-model="formPelatih.nama_lengkap"
              type="text"
              required
              placeholder="Contoh: Coach Tania Putri"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-teal focus:outline-none"
            />
          </div>

          <div v-if="!modeEdit">
            <label class="block text-xs font-semibold text-slate-300 mb-1">Alamat Email *</label>
            <input
              v-model="formPelatih.email"
              type="email"
              required
              placeholder="pelatih@mezonastudio.com"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-teal focus:outline-none"
            />
          </div>

          <div v-if="!modeEdit">
            <label class="block text-xs font-semibold text-slate-300 mb-1">Kata Sandi Akun *</label>
            <input
              v-model="formPelatih.kata_sandi"
              type="password"
              required
              placeholder="Minimal 6 karakter"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-teal focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Nomor WhatsApp / HP</label>
            <input
              v-model="formPelatih.nomor_telepon"
              type="text"
              placeholder="081234567890"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-teal focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Spesialisasi Latihan</label>
            <input
              v-model="formPelatih.spesialisasi"
              type="text"
              placeholder="Contoh: Zumba, Yoga, Pomfit"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-teal focus:outline-none"
            />
          </div>

          <div v-if="modeEdit" class="flex items-center space-x-2 pt-1">
            <input
              id="aktif"
              v-model="formPelatih.aktif"
              type="checkbox"
              class="w-4 h-4 rounded text-neon-teal focus:ring-neon-teal bg-slate-900 border-slate-700"
            />
            <label for="aktif" class="text-xs text-slate-300 font-medium">Status Pelatih Aktif Bertugas</label>
          </div>

          <div class="mt-6 pt-3 border-t border-white/5 grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="modalFormTerbuka = false"
              class="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="sedangMenyimpan"
              class="py-2.5 rounded-xl bg-gradient-to-r from-neon-teal to-neon-zamrud text-slate-950 font-bold text-xs shadow-glow-teal hover:brightness-110 disabled:opacity-50"
            >
              {{ sedangMenyimpan ? 'Menyimpan...' : (modeEdit ? 'Simpan Perubahan' : 'Tambah Pelatih') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL KONFIRMASI HAPUS PELATIH -->
    <div
      v-if="modalHapusTerbuka && pelatihAkanDihapus"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div class="w-full max-w-sm efek-kaca rounded-3xl p-6 border border-red-500/30 shadow-2xl bg-gelap-kartu text-center">
        <div class="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center font-bold text-xl mb-3">
          🗑️
        </div>
        <h3 class="text-base font-bold text-white">Hapus Pelatih?</h3>
        <p class="text-xs text-slate-400 mt-2">
          Apakah Anda yakin ingin menghapus pelatih <strong>{{ pelatihAkanDihapus.nama }}</strong>? Jadwal kelas yang diajar oleh pelatih ini juga akan terhapus.
        </p>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <button
            @click="modalHapusTerbuka = false"
            class="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
          >
            Batal
          </button>
          <button
            @click="hapusPelatih"
            :disabled="sedangMenyimpan"
            class="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs disabled:opacity-50"
          >
            {{ sedangMenyimpan ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
