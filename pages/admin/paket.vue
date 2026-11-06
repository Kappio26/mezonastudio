<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'admin'
})

const { tampilkanNotifikasi } = useOtentikasi()

interface PaketItem {
  id: string
  nama: string
  deskripsi: string
  harga: number
  harga_rupiah: string
  durasi: string
  keuntungan: string[]
  total_pengguna: number
  aktif: boolean
}

const sedangMemuat = ref(true)
const sedangMenyimpan = ref(false)
const daftarPaket = ref<PaketItem[]>([])

// State Modal Form
const modalFormTerbuka = ref(false)
const modeEdit = ref(false)
const formPaket = reactive({
  id: '',
  nama_paket: '',
  deskripsi: '',
  harga: 500000,
  durasi_hari: 30,
  keuntungan_teks: '',
  aktif: true
})

// State Modal Hapus
const modalHapusTerbuka = ref(false)
const paketAkanDihapus = ref<PaketItem | null>(null)

const muatPaket = async () => {
  sedangMemuat.value = true
  try {
    const respon: any = await $fetch('/api/admin/paket')
    if (respon.sukses && respon.data) {
      daftarPaket.value = respon.data
    }
  } catch (e: any) {
    tampilkanNotifikasi(e.data?.statusMessage || 'Gagal mengambil data paket', 'kesalahan')
  } finally {
    sedangMemuat.value = false
  }
}

const bukaModalTambah = () => {
  modeEdit.value = false
  formPaket.id = ''
  formPaket.nama_paket = ''
  formPaket.deskripsi = ''
  formPaket.harga = 500000
  formPaket.durasi_hari = 30
  formPaket.keuntungan_teks = 'Semua Kelas Studio (Zumba, Yoga, Poundfit)\nLocker Room & Shower'
  formPaket.aktif = true
  modalFormTerbuka.value = true
}

const bukaModalEdit = (p: PaketItem) => {
  modeEdit.value = true
  formPaket.id = p.id
  formPaket.nama_paket = p.nama
  formPaket.deskripsi = p.deskripsi || ''
  formPaket.harga = p.harga
  formPaket.durasi_hari = parseInt(p.durasi) || 30
  formPaket.keuntungan_teks = p.keuntungan ? p.keuntungan.join('\n') : ''
  formPaket.aktif = p.aktif
  modalFormTerbuka.value = true
}

const simpanPaket = async () => {
  if (!formPaket.nama_paket || formPaket.harga === undefined) {
    tampilkanNotifikasi('Nama paket dan harga wajib diisi.', 'kesalahan')
    return
  }

  const keuntunganArray = formPaket.keuntungan_teks
    .split('\n')
    .map((k) => k.trim())
    .filter((k) => k.length > 0)

  sedangMenyimpan.value = true
  try {
    if (modeEdit.value) {
      const res: any = await $fetch('/api/admin/paket', {
        method: 'PUT',
        body: {
          id: formPaket.id,
          nama_paket: formPaket.nama_paket,
          deskripsi: formPaket.deskripsi,
          harga: formPaket.harga,
          durasi_hari: formPaket.durasi_hari,
          keuntungan: keuntunganArray,
          aktif: formPaket.aktif
        }
      })
      tampilkanNotifikasi(res.pesan || 'Paket berhasil diperbarui!', 'sukses')
    } else {
      const res: any = await $fetch('/api/admin/paket', {
        method: 'POST',
        body: {
          nama_paket: formPaket.nama_paket,
          deskripsi: formPaket.deskripsi,
          harga: formPaket.harga,
          durasi_hari: formPaket.durasi_hari,
          keuntungan: keuntunganArray
        }
      })
      tampilkanNotifikasi(res.pesan || 'Paket baru berhasil ditambahkan!', 'sukses')
    }

    modalFormTerbuka.value = false
    await muatPaket()
  } catch (e: any) {
    tampilkanNotifikasi(e.data?.statusMessage || 'Gagal menyimpan paket', 'kesalahan')
  } finally {
    sedangMenyimpan.value = false
  }
}

const bukaModalKonfirmasiHapus = (p: PaketItem) => {
  paketAkanDihapus.value = p
  modalHapusTerbuka.value = true
}

const hapusPaket = async () => {
  if (!paketAkanDihapus.value) return
  sedangMenyimpan.value = true
  try {
    const res: any = await $fetch(`/api/admin/paket?id=${paketAkanDihapus.value.id}`, {
      method: 'DELETE'
    })
    tampilkanNotifikasi(res.pesan || 'Paket berhasil dihapus', 'sukses')
    modalHapusTerbuka.value = false
    paketAkanDihapus.value = null
    await muatPaket()
  } catch (e: any) {
    tampilkanNotifikasi(e.data?.statusMessage || 'Gagal menghapus paket', 'kesalahan')
  } finally {
    sedangMenyimpan.value = false
  }
}

onMounted(() => {
  muatPaket()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-white">Paket Keanggotaan</h2>
        <p class="text-xs text-slate-400 mt-1">
          Kelola harga dan durasi membership studio ({{ daftarPaket.length }} Paket Aktif)
        </p>
      </div>

      <div class="flex items-center space-x-3">
        <button
          @click="muatPaket"
          class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
        >
          🔄 Refresh
        </button>
        <button
          @click="bukaModalTambah"
          class="px-4 py-2.5 rounded-xl bg-neon-zamrud text-slate-950 font-bold text-xs shadow-glow-zamrud hover:brightness-110 active:scale-95 transition flex items-center space-x-1.5"
        >
          <span>+ Buat Paket Baru</span>
        </button>
      </div>
    </div>

    <div v-if="sedangMemuat" class="py-16 text-center text-xs text-slate-400">
      <div class="w-8 h-8 rounded-full border-2 border-neon-zamrud border-t-transparent animate-spin mx-auto mb-3"></div>
      <span>Memuat data paket keanggotaan...</span>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div
        v-for="paket in daftarPaket"
        :key="paket.id"
        class="efek-kaca p-6 rounded-2xl border border-emerald-500/20 flex flex-col justify-between"
      >
        <div>
          <div class="flex justify-between items-start">
            <h3 class="text-lg font-bold text-white">{{ paket.nama }}</h3>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              {{ paket.total_pengguna }} Member Aktif
            </span>
          </div>
          <p class="text-2xl font-black text-neon-zamrud mt-2">
            {{ paket.harga_rupiah }} <span class="text-xs text-slate-400 font-normal">/ {{ paket.durasi }}</span>
          </p>
          <p class="text-xs text-slate-300 mt-3">{{ paket.deskripsi }}</p>

          <div class="mt-4 pt-3 border-t border-white/5 space-y-1.5">
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Keuntungan:</p>
            <ul class="text-xs text-slate-300 space-y-1">
              <li v-for="(k, idx) in paket.keuntungan" :key="idx" class="flex items-center space-x-1.5">
                <span class="text-neon-zamrud font-bold">✓</span>
                <span>{{ k }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-6 pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
          <button
            @click="bukaModalEdit(paket)"
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1"
          >
            <span>✏️ Edit</span>
          </button>
          <button
            @click="bukaModalKonfirmasiHapus(paket)"
            class="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-bold border border-red-500/20 transition flex items-center space-x-1"
          >
            <span>🗑️ Hapus</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL FORM TAMBAH / EDIT PAKET -->
    <div
      v-if="modalFormTerbuka"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-md efek-kaca rounded-3xl p-6 border border-emerald-500/20 shadow-2xl bg-gelap-kartu/95">
        <div class="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
          <h3 class="text-lg font-bold text-white">
            {{ modeEdit ? 'Edit Paket Membership' : 'Tambah Paket Baru' }}
          </h3>
          <button @click="modalFormTerbuka = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <form @submit.prevent="simpanPaket" class="space-y-3.5">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Nama Paket *</label>
            <input
              v-model="formPaket.nama_paket"
              type="text"
              required
              placeholder="Contoh: VIP All Access / Paket Kelas Studio"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Harga (Rupiah) *</label>
              <input
                v-model="formPaket.harga"
                type="number"
                min="0"
                required
                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Durasi (Hari) *</label>
              <input
                v-model="formPaket.durasi_hari"
                type="number"
                min="1"
                required
                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Deskripsi Singkat</label>
            <input
              v-model="formPaket.deskripsi"
              type="text"
              placeholder="Akses seluruh kelas Zumba, Yoga, dan Pomfit."
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Daftar Keuntungan (1 per baris)</label>
            <textarea
              v-model="formPaket.keuntungan_teks"
              rows="3"
              placeholder="Semua Kelas Studio (Zumba, Yoga, Pomfit)&#10;Locker & Sauna"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
            ></textarea>
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
              class="py-2.5 rounded-xl bg-gradient-to-r from-neon-zamrud to-neon-teal text-slate-950 font-bold text-xs shadow-glow-zamrud hover:brightness-110 disabled:opacity-50"
            >
              {{ sedangMenyimpan ? 'Menyimpan...' : (modeEdit ? 'Simpan Perubahan' : 'Buat Paket') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL KONFIRMASI HAPUS PAKET -->
    <div
      v-if="modalHapusTerbuka && paketAkanDihapus"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div class="w-full max-w-sm efek-kaca rounded-3xl p-6 border border-red-500/30 shadow-2xl bg-gelap-kartu text-center">
        <div class="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center font-bold text-xl mb-3">
          🗑️
        </div>
        <h3 class="text-base font-bold text-white">Hapus Paket?</h3>
        <p class="text-xs text-slate-400 mt-2">
          Apakah Anda yakin ingin menghapus paket <strong>{{ paketAkanDihapus.nama }}</strong>?
        </p>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <button
            @click="modalHapusTerbuka = false"
            class="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
          >
            Batal
          </button>
          <button
            @click="hapusPaket"
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
