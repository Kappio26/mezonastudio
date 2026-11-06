<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'admin'
})

const { tampilkanNotifikasi } = useOtentikasi()

interface MemberItem {
  id: string
  nama: string
  email: string
  nomor_telepon: string
  paket: string
  id_paket: string | null
  kelas_pilihan: string | null
  durasi_hari_paket: number
  status: 'AKTIF' | 'KADALUWARSA' | 'NONAKTIF'
  apakah_aktif: boolean
  sisa_hari: number
  keterangan_sisa: string
  tanggal_kadaluwarsa: string | null
  tanggal_kadaluwarsa_teks: string
  tanggal_daftar: string
}

interface PaketItem {
  id: string
  nama_paket: string
  harga: number
  durasi_hari: number
}

const sedangMemuat = ref(true)
const sedangMenyimpan = ref(false)
const daftarMember = ref<MemberItem[]>([])
const daftarPaket = ref<PaketItem[]>([])
const ringkasan = ref({
  total_member: 0,
  total_aktif: 0,
  total_kadaluwarsa: 0
})

// Tab Filter
const tabAktif = ref<'SEMUA' | 'AKTIF' | 'KADALUWARSA'>('SEMUA')
const kataKunciCari = ref('')

// State Modal Edit Profil Member
const modalEditTerbuka = ref(false)
const formMember = reactive({
  id: '',
  nama: '',
  nomor_telepon: '',
  kelas_pilihan: '',
  status: 'AKTIF'
})

// State Modal Perpanjang Membership
const modalPerpanjangTerbuka = ref(false)
const memberDipilihPerpanjang = ref<MemberItem | null>(null)
const formPerpanjang = reactive({
  id_paket: '',
  metode_pembayaran: 'Kasir Studio (Tunai)'
})

// State Modal Hapus
const modalHapusTerbuka = ref(false)
const memberAkanDihapus = ref<MemberItem | null>(null)

const muatMember = async () => {
  sedangMemuat.value = true
  try {
    const respon: any = await $fetch('/api/admin/member')
    if (respon.sukses && respon.data) {
      daftarMember.value = respon.data
      if (respon.ringkasan) {
        ringkasan.value = respon.ringkasan
      }
    }
  } catch (e: any) {
    tampilkanNotifikasi(e.data?.statusMessage || 'Gagal mengambil data member', 'kesalahan')
  } finally {
    sedangMemuat.value = false
  }
}

const muatPaket = async () => {
  try {
    const respon: any = await $fetch('/api/admin/paket')
    if (respon.sukses && respon.data) {
      daftarPaket.value = respon.data
    }
  } catch (e) {
    console.error('Gagal mengambil paket:', e)
  }
}

// Buka Modal Perpanjangan Membership
const bukaModalPerpanjang = (m: MemberItem) => {
  memberDipilihPerpanjang.value = m
  formPerpanjang.id_paket = m.id_paket || (daftarPaket.value[0]?.id || '')
  formPerpanjang.metode_pembayaran = 'Kasir Studio (Tunai)'
  modalPerpanjangTerbuka.value = true
}

const prosesPerpanjangMember = async () => {
  if (!memberDipilihPerpanjang.value) return
  sedangMenyimpan.value = true
  try {
    const res: any = await $fetch('/api/admin/member/perpanjang', {
      method: 'POST',
      body: {
        id_pengguna: memberDipilihPerpanjang.value.id,
        id_paket: formPerpanjang.id_paket,
        metode_pembayaran: formPerpanjang.metode_pembayaran
      }
    })
    tampilkanNotifikasi(res.pesan || 'Membership berhasil diperpanjang!', 'sukses')
    modalPerpanjangTerbuka.value = false
    memberDipilihPerpanjang.value = null
    await muatMember()
  } catch (e: any) {
    tampilkanNotifikasi(e.data?.statusMessage || 'Gagal memperpanjang membership', 'kesalahan')
  } finally {
    sedangMenyimpan.value = false
  }
}

const bukaModalEdit = (m: MemberItem) => {
  formMember.id = m.id
  formMember.nama = m.nama
  formMember.nomor_telepon = m.nomor_telepon === '-' ? '' : m.nomor_telepon
  formMember.kelas_pilihan = m.kelas_pilihan || ''
  formMember.status = m.status
  modalEditTerbuka.value = true
}

const simpanMember = async () => {
  sedangMenyimpan.value = true
  try {
    const res: any = await $fetch('/api/admin/member', {
      method: 'PUT',
      body: {
        id: formMember.id,
        nama_lengkap: formMember.nama,
        nomor_telepon: formMember.nomor_telepon,
        kelas_pilihan: formMember.kelas_pilihan || null,
        status_keanggotaan: formMember.status
      }
    })
    tampilkanNotifikasi(res.pesan || 'Data member diperbarui', 'sukses')
    modalEditTerbuka.value = false
    await muatMember()
  } catch (e: any) {
    tampilkanNotifikasi(e.data?.statusMessage || 'Gagal memperbarui member', 'kesalahan')
  } finally {
    sedangMenyimpan.value = false
  }
}

const bukaModalKonfirmasiHapus = (m: MemberItem) => {
  memberAkanDihapus.value = m
  modalHapusTerbuka.value = true
}

const hapusMember = async () => {
  if (!memberAkanDihapus.value) return
  sedangMenyimpan.value = true
  try {
    const res: any = await $fetch(`/api/admin/member?id=${memberAkanDihapus.value.id}`, {
      method: 'DELETE'
    })
    tampilkanNotifikasi(res.pesan || 'Member berhasil dihapus', 'sukses')
    modalHapusTerbuka.value = false
    memberAkanDihapus.value = null
    await muatMember()
  } catch (e: any) {
    tampilkanNotifikasi(e.data?.statusMessage || 'Gagal menghapus member', 'kesalahan')
  } finally {
    sedangMenyimpan.value = false
  }
}

const daftarMemberTersaring = computed(() => {
  return daftarMember.value.filter((m) => {
    // Filter Tab Status
    if (tabAktif.value === 'AKTIF' && !m.apakah_aktif) return false
    if (tabAktif.value === 'KADALUWARSA' && m.apakah_aktif) return false

    // Filter Kata Kunci Cari
    if (kataKunciCari.value.trim()) {
      const q = kataKunciCari.value.toLowerCase()
      const cocokNama = m.nama.toLowerCase().includes(q)
      const cocokEmail = m.email.toLowerCase().includes(q)
      const cocokPaket = m.paket.toLowerCase().includes(q)
      if (!cocokNama && !cocokEmail && !cocokPaket) return false
    }

    return true
  })
})

onMounted(() => {
  muatMember()
  muatPaket()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Judul & Tombol Aksi -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-white tracking-tight">Manajemen Keanggotaan Member</h2>
        <p class="text-xs text-slate-400 mt-1">
          Pantau masa aktif paket bulanan (30 hari), status kadaluwarsa, dan perpanjangan keanggotaan studio.
        </p>
      </div>
      <button
        @click="muatMember"
        :disabled="sedangMemuat"
        class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center space-x-2"
      >
        <span :class="{ 'animate-spin': sedangMemuat }">🔄</span>
        <span>Perbarui Data</span>
      </button>
    </div>

    <!-- Kartu Statistik Cepat Status Member -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Total Member -->
      <div
        @click="tabAktif = 'SEMUA'"
        class="cursor-pointer efek-kaca rounded-2xl p-4 border transition duration-200"
        :class="tabAktif === 'SEMUA' ? 'border-neon-zamrud bg-emerald-950/20 shadow-glow-zamrud' : 'border-slate-800 hover:border-slate-700'"
      >
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Member</span>
          <span class="text-lg">👥</span>
        </div>
        <p class="text-2xl font-black text-white">{{ ringkasan.total_member }} <span class="text-xs text-slate-400 font-normal">Orang</span></p>
        <p class="text-[11px] text-slate-500 mt-1">Seluruh member terdaftar di database</p>
      </div>

      <!-- Member Aktif -->
      <div
        @click="tabAktif = 'AKTIF'"
        class="cursor-pointer efek-kaca rounded-2xl p-4 border transition duration-200"
        :class="tabAktif === 'AKTIF' ? 'border-emerald-500 bg-emerald-950/30 shadow-glow-zamrud' : 'border-slate-800 hover:border-emerald-500/40'"
      >
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Member Aktif</span>
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <p class="text-2xl font-black text-neon-zamrud">{{ ringkasan.total_aktif }} <span class="text-xs text-slate-400 font-normal">Orang</span></p>
        <p class="text-[11px] text-emerald-400/80 mt-1">Paket masih berlaku (&lt;= 30 hari berjalan)</p>
      </div>

      <!-- Member Kadaluwarsa / Habis -->
      <div
        @click="tabAktif = 'KADALUWARSA'"
        class="cursor-pointer efek-kaca rounded-2xl p-4 border transition duration-200"
        :class="tabAktif === 'KADALUWARSA' ? 'border-red-500 bg-red-950/30' : 'border-slate-800 hover:border-red-500/40'"
      >
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs text-red-400 font-semibold uppercase tracking-wider">Kadaluwarsa / Habis</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold">Perlu Perpanjang</span>
        </div>
        <p class="text-2xl font-black text-red-400">{{ ringkasan.total_kadaluwarsa }} <span class="text-xs text-slate-400 font-normal">Orang</span></p>
        <p class="text-[11px] text-red-400/70 mt-1">Masa berlaku 1 bulan telah berakhir</p>
      </div>
    </div>

    <!-- Filter & Pencarian -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <!-- Tab Pilihan -->
      <div class="flex items-center space-x-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 max-w-fit">
        <button
          @click="tabAktif = 'SEMUA'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition"
          :class="tabAktif === 'SEMUA' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'"
        >
          Semua ({{ ringkasan.total_member }})
        </button>
        <button
          @click="tabAktif = 'AKTIF'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
          :class="tabAktif === 'AKTIF' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-emerald-400'"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Aktif ({{ ringkasan.total_aktif }})</span>
        </button>
        <button
          @click="tabAktif = 'KADALUWARSA'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
          :class="tabAktif === 'KADALUWARSA' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-slate-400 hover:text-red-400'"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
          <span>Kadaluwarsa ({{ ringkasan.total_kadaluwarsa }})</span>
        </button>
      </div>

      <!-- Kotak Cari -->
      <div class="relative w-full sm:w-64">
        <input
          v-model="kataKunciCari"
          type="text"
          placeholder="Cari nama, email, paket..."
          class="w-full px-3.5 py-2 pl-9 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-zamrud transition"
        />
        <span class="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
      </div>
    </div>

    <!-- Tabel Data Member -->
    <div class="efek-kaca rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
          <tr>
            <th class="px-6 py-3.5">Nama & Kontak Member</th>
            <th class="px-6 py-3.5">Paket Membership</th>
            <th class="px-6 py-3.5">Masa Berlaku (1 Bulan)</th>
            <th class="px-6 py-3.5">Status</th>
            <th class="px-6 py-3.5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60 text-slate-200">
          <tr v-if="sedangMemuat">
            <td colspan="5" class="px-6 py-12 text-center text-slate-400 text-xs">
              <div class="inline-block animate-spin text-2xl mb-2">🔄</div>
              <p>Memuat data member dan masa berlaku dari database...</p>
            </td>
          </tr>
          <tr v-else-if="daftarMemberTersaring.length === 0">
            <td colspan="5" class="px-6 py-12 text-center text-slate-400 text-xs">
              Tidak ada data member yang cocok dengan filter yang dipilih.
            </td>
          </tr>
          <tr v-else v-for="m in daftarMemberTersaring" :key="m.id" class="hover:bg-slate-800/40 transition">
            <!-- Nama & Kontak -->
            <td class="px-6 py-4">
              <div class="flex items-center space-x-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs"
                     :class="m.apakah_aktif ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'">
                  {{ m.nama.substring(0, 2).toUpperCase() }}
                </div>
                <div>
                  <p class="font-bold text-white text-xs sm:text-sm">{{ m.nama }}</p>
                  <p class="text-[11px] text-slate-400">{{ m.email }}</p>
                  <p class="text-[10px] text-slate-500">WA: {{ m.nomor_telepon }}</p>
                </div>
              </div>
            </td>

            <!-- Paket -->
            <td class="px-6 py-4">
              <span class="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/90 border border-slate-700/80 text-emerald-300">
                {{ m.paket }}
              </span>
              <span v-if="m.kelas_pilihan" class="inline-block ml-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                🎯 {{ m.kelas_pilihan }}
              </span>
              <span class="block text-[10px] text-slate-500 mt-1">Durasi: {{ m.durasi_hari_paket }} Hari</span>
            </td>

            <!-- Masa Berlaku & Sisa Hari -->
            <td class="px-6 py-4">
              <div class="space-y-1">
                <span
                  class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  :class="m.apakah_aktif ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="m.apakah_aktif ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'"></span>
                  <span>{{ m.keterangan_sisa }}</span>
                </span>
                <p class="text-[11px] text-slate-400 font-mono">
                  s.d. {{ m.tanggal_kadaluwarsa_teks }}
                </p>
              </div>
            </td>

            <!-- Status -->
            <td class="px-6 py-4">
              <span
                class="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
                :class="m.apakah_aktif ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/30'"
              >
                {{ m.status }}
              </span>
            </td>

            <!-- Aksi -->
            <td class="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
              <!-- Tombol Perpanjang Membership -->
              <button
                @click="bukaModalPerpanjang(m)"
                class="px-3 py-1.5 rounded-xl bg-neon-zamrud/20 hover:bg-neon-zamrud/30 text-neon-zamrud border border-neon-zamrud/40 text-xs font-bold transition shadow-sm"
                title="Perpanjang paket membership member ini"
              >
                ⚡ Perpanjang
              </button>

              <!-- Tombol Edit -->
              <button
                @click="bukaModalEdit(m)"
                class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                title="Edit profil member"
              >
                ✏️ Edit
              </button>

              <!-- Tombol Hapus -->
              <button
                @click="bukaModalKonfirmasiHapus(m)"
                class="px-2.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-semibold border border-red-500/20 transition"
                title="Hapus member"
              >
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL PERPANJANG MEMBERSHIP -->
    <div
      v-if="modalPerpanjangTerbuka && memberDipilihPerpanjang"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-md efek-kaca rounded-3xl p-6 border border-emerald-500/40 shadow-2xl bg-gelap-kartu/95">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-10 h-10 rounded-2xl bg-neon-zamrud/20 border border-neon-zamrud/40 flex items-center justify-center text-neon-zamrud font-bold text-lg">
            ⚡
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Perpanjang Membership Member</h3>
            <p class="text-xs text-slate-400">Tambahkan masa aktif paket 1 bulan (30 hari)</p>
          </div>
        </div>

        <div class="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 mb-4 space-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-400">Nama Member:</span>
            <span class="font-bold text-white">{{ memberDipilihPerpanjang.nama }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Status Saat Ini:</span>
            <span :class="memberDipilihPerpanjang.apakah_aktif ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'">
              {{ memberDipilihPerpanjang.status }} ({{ memberDipilihPerpanjang.keterangan_sisa }})
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Berlaku s.d:</span>
            <span class="text-slate-300 font-mono">{{ memberDipilihPerpanjang.tanggal_kadaluwarsa_teks }}</span>
          </div>
        </div>

        <form @submit.prevent="prosesPerpanjangMember" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Pilih Paket Membership (30 Hari)</label>
            <select
              v-model="formPerpanjang.id_paket"
              required
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
            >
              <option v-for="pkt in daftarPaket" :key="pkt.id" :value="pkt.id">
                {{ pkt.nama_paket || (pkt as any).nama }} ({{ pkt.durasi_hari || parseInt((pkt as any).durasi) || 30 }} Hari) - Rp {{ Number(pkt.harga).toLocaleString('id-ID') }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Metode Pembayaran</label>
            <select
              v-model="formPerpanjang.metode_pembayaran"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
            >
              <option value="Kasir Studio (Tunai)">Kasir Studio (Tunai)</option>
              <option value="QRIS Kasir Studio">QRIS Kasir Studio</option>
              <option value="Transfer Bank BCA">Transfer Bank BCA</option>
              <option value="Kartu Debit Mandiri">Kartu Debit Mandiri</option>
            </select>
          </div>

          <div class="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/20 text-[11px] text-emerald-300">
            ℹ️ <strong>Aturan Perpanjangan:</strong> Jika member masih aktif, durasi 30 hari akan ditambahkan dari tanggal kadaluwarsa sebelumnya. Jika sudah habis, masa aktif baru dihitung 30 hari mulai hari ini.
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              @click="modalPerpanjangTerbuka = false"
              class="py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="sedangMenyimpan"
              class="py-2.5 rounded-xl bg-neon-zamrud hover:bg-neon-zamrud-terang text-slate-950 text-xs font-bold shadow-glow-zamrud transition flex items-center justify-center space-x-1.5"
            >
              <span>{{ sedangMenyimpan ? 'Memproses...' : '⚡ Perpanjang (+30 Hari)' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL EDIT DATA MEMBER -->
    <div
      v-if="modalEditTerbuka"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-sm efek-kaca rounded-3xl p-6 border border-emerald-500/20 shadow-2xl bg-gelap-kartu/95">
        <h3 class="text-base font-bold text-white mb-4">Edit Data Profil Member</h3>
        <form @submit.prevent="simpanMember" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap</label>
            <input
              v-model="formMember.nama"
              type="text"
              required
              class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Nomor WhatsApp</label>
            <input
              v-model="formMember.nomor_telepon"
              type="text"
              class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">
              Spesialisasi Kelas Studio
              <span class="text-[10px] text-slate-400 font-normal">(Khusus Paket Kelas Studio)</span>
            </label>
            <select
              v-model="formMember.kelas_pilihan"
              class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
            >
              <option value="">-- Belum Dipilih / Bukan Paket Studio --</option>
              <option value="Zumba">Zumba (Dance Cardio)</option>
              <option value="Yoga">Yoga (Fleksibilitas & Meditasi)</option>
              <option value="Poundfit">Poundfit (Ripstix Drums)</option>
              <option value="Pilates">Pilates (Core & Balance)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Status Keanggotaan Manual</label>
            <select
              v-model="formMember.status"
              class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-neon-zamrud focus:outline-none"
            >
              <option value="AKTIF">AKTIF</option>
              <option value="KADALUWARSA">KADALUWARSA</option>
              <option value="NONAKTIF">NONAKTIF</option>
            </select>
          </div>

          <div class="mt-5 grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              @click="modalEditTerbuka = false"
              class="py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="sedangMenyimpan"
              class="py-2.5 rounded-xl bg-neon-zamrud text-slate-950 text-xs font-bold shadow-glow-zamrud"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL KONFIRMASI HAPUS MEMBER -->
    <div
      v-if="modalHapusTerbuka && memberAkanDihapus"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div class="w-full max-w-sm efek-kaca rounded-3xl p-6 border border-red-500/30 shadow-2xl bg-gelap-kartu text-center">
        <div class="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center font-bold text-xl mb-3">
          🗑️
        </div>
        <h3 class="text-base font-bold text-white">Hapus Akun Member?</h3>
        <p class="text-xs text-slate-400 mt-2">
          Apakah Anda yakin ingin menghapus akun member <strong>{{ memberAkanDihapus.nama }}</strong>?
        </p>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <button
            @click="modalHapusTerbuka = false"
            class="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
          >
            Batal
          </button>
          <button
            @click="hapusMember"
            :disabled="sedangMenyimpan"
            class="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
          >
            {{ sedangMenyimpan ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
