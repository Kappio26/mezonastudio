<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

definePageMeta({
  layout: 'seluler'
})

const { dataPengguna, inisialisasiSesi, perbaruiDataSesi, bukaKonfirmasiKeluar, tampilkanNotifikasi } = useOtentikasi()

interface DataProfilLengkap {
  id: string
  email: string
  nama_lengkap: string
  nomor_telepon: string
  foto_profil: string | null
  jenis_kelamin: 'PRIA' | 'WANITA' | null
  tanggal_lahir: string | null
  alamat: string
  paket: string
  id_paket: string | null
  durasi_hari: number
  status: string
  apakah_aktif: boolean
  sisa_hari: number
  keterangan_sisa: string
  tanggal_kadaluwarsa_teks: string
}

const sedangMemuat = ref(true)
const sedangMenyimpan = ref(false)
const modeEdit = ref(false)
const inputFotoRef = ref<HTMLInputElement | null>(null)
const profilMember = ref<DataProfilLengkap | null>(null)

// Form edit profil
const formProfil = reactive({
  nama_lengkap: '',
  nomor_telepon: '',
  jenis_kelamin: '' as 'PRIA' | 'WANITA' | '',
  tanggal_lahir: '',
  alamat: '',
  foto_profil: '' as string | null,
  ubah_sandi: false,
  kata_sandi_baru: ''
})

// Avatar preset studio pilihan cepat
const avatarPilihan = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80'
]

// Muat data profil lengkap dari server
const muatProfil = async () => {
  inisialisasiSesi()
  sedangMemuat.value = true
  try {
    const params = new URLSearchParams()
    if (dataPengguna.value?.id) params.append('id', dataPengguna.value.id)
    if (dataPengguna.value?.email) params.append('email', dataPengguna.value.email)

    const res: any = await $fetch(`/api/member/profil?${params.toString()}`)
    if (res.sukses && res.data) {
      profilMember.value = res.data
      isiFormDariData(res.data)

      // Sinkronkan data sesi
      perbaruiDataSesi({
        nama_lengkap: res.data.nama_lengkap,
        foto_profil: res.data.foto_profil,
        status_keanggotaan: res.data.status,
        apakah_aktif: res.data.apakah_aktif,
        nama_paket: res.data.paket
      })
    }
  } catch (err: any) {
    console.error('Gagal mengambil data profil:', err)
    tampilkanNotifikasi(err.data?.statusMessage || 'Gagal memuat profil', 'kesalahan')
  } finally {
    sedangMemuat.value = false
  }
}

// Salin data ke form
const isiFormDariData = (data: DataProfilLengkap) => {
  formProfil.nama_lengkap = data.nama_lengkap || ''
  formProfil.nomor_telepon = data.nomor_telepon === '-' ? '' : data.nomor_telepon
  formProfil.jenis_kelamin = (data.jenis_kelamin as 'PRIA' | 'WANITA') || ''
  formProfil.tanggal_lahir = data.tanggal_lahir || ''
  formProfil.alamat = data.alamat || ''
  formProfil.foto_profil = data.foto_profil || null
  formProfil.ubah_sandi = false
  formProfil.kata_sandi_baru = ''
}

// Buka dialog pemilihan file foto
const triggerPilihFoto = () => {
  if (inputFotoRef.value) {
    inputFotoRef.value.click()
  }
}

// Kompresi dan ubah ukuran foto di sisi klien (Canvas)
const kompresFotoKeBase64 = (file: File, batasDimensi = 450): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > height) {
          if (width > batasDimensi) {
            height = Math.round((height * batasDimensi) / width)
            width = batasDimensi
          }
        } else {
          if (height > batasDimensi) {
            width = Math.round((width * batasDimensi) / height)
            height = batasDimensi
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        // Kualitas 88% JPEG menghasilkan gambar jernih berukuran ringan (~30-50KB)
        resolve(canvas.toDataURL('image/jpeg', 0.88))
      }
      img.onerror = () => reject(new Error('Gagal memproses file gambar.'))
      img.src = event.target?.result as string
    }
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'))
    reader.readAsDataURL(file)
  })
}

// Tangani upload foto dari galeri/kamera
const tanganiUnggahFoto = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Validasi tipe file
  if (!file.type.startsWith('image/')) {
    tampilkanNotifikasi('Mohon pilih file gambar yang valid (JPG, PNG, atau WEBP).', 'kesalahan')
    return
  }

  try {
    const base64Foto = await kompresFotoKeBase64(file)
    formProfil.foto_profil = base64Foto

    // Jika sedang tidak dalam mode edit form, simpan foto langsung ke database
    if (!modeEdit.value) {
      await simpanFotoLangsung(base64Foto)
    } else {
      tampilkanNotifikasi('Foto profil dipilih! Klik "Simpan Perubahan" untuk menyimpan.', 'info')
    }
  } catch (err: any) {
    tampilkanNotifikasi('Gagal memproses foto profil: ' + err.message, 'kesalahan')
  } finally {
    // Reset nilai input agar dapat memilih file yang sama jika diperlukan
    target.value = ''
  }
}

// Simpan foto langsung jika user mengklik ubah foto di tampilan utama
const simpanFotoLangsung = async (fotoBaru: string | null) => {
  sedangMenyimpan.value = true
  try {
    const res: any = await $fetch('/api/member/profil', {
      method: 'PUT',
      body: {
        id_pengguna: dataPengguna.value?.id,
        email: dataPengguna.value?.email,
        nama_lengkap: profilMember.value?.nama_lengkap || dataPengguna.value?.nama_lengkap,
        nomor_telepon: profilMember.value?.nomor_telepon,
        foto_profil: fotoBaru,
        jenis_kelamin: profilMember.value?.jenis_kelamin,
        tanggal_lahir: profilMember.value?.tanggal_lahir,
        alamat: profilMember.value?.alamat
      }
    })

    if (res.sukses) {
      tampilkanNotifikasi(fotoBaru ? 'Foto profil berhasil diperbarui!' : 'Foto profil dihapus.', 'sukses')
      if (profilMember.value) {
        profilMember.value.foto_profil = fotoBaru
      }
      perbaruiDataSesi({ foto_profil: fotoBaru })
    }
  } catch (err: any) {
    tampilkanNotifikasi(err.data?.statusMessage || 'Gagal menyimpan foto profil', 'kesalahan')
  } finally {
    sedangMenyimpan.value = false
  }
}

// Pilih salah satu avatar preset studio
const pilihAvatarPreset = (url: string) => {
  formProfil.foto_profil = url
  if (!modeEdit.value) {
    simpanFotoLangsung(url)
  }
}

// Hapus foto profil
const hapusFoto = async () => {
  if (!confirm('Apakah Anda ingin menghapus foto profil dan kembali menggunakan inisial nama?')) return
  formProfil.foto_profil = null
  if (!modeEdit.value) {
    await simpanFotoLangsung(null)
  }
}

// Simpan keseluruhan formulir profil
const simpanPerubahanProfil = async () => {
  if (!formProfil.nama_lengkap.trim()) {
    tampilkanNotifikasi('Nama lengkap wajib diisi!', 'kesalahan')
    return
  }

  if (formProfil.ubah_sandi && formProfil.kata_sandi_baru.trim().length < 6) {
    tampilkanNotifikasi('Kata sandi baru minimal harus 6 karakter!', 'kesalahan')
    return
  }

  sedangMenyimpan.value = true
  try {
    const res: any = await $fetch('/api/member/profil', {
      method: 'PUT',
      body: {
        id_pengguna: dataPengguna.value?.id,
        email: dataPengguna.value?.email,
        nama_lengkap: formProfil.nama_lengkap.trim(),
        nomor_telepon: formProfil.nomor_telepon.trim(),
        foto_profil: formProfil.foto_profil,
        jenis_kelamin: formProfil.jenis_kelamin || null,
        tanggal_lahir: formProfil.tanggal_lahir || null,
        alamat: formProfil.alamat.trim(),
        kata_sandi_baru: formProfil.ubah_sandi ? formProfil.kata_sandi_baru : undefined
      }
    })

    if (res.sukses) {
      tampilkanNotifikasi(res.pesan || 'Profil berhasil diperbarui!', 'sukses')
      if (res.data) {
        profilMember.value = {
          ...profilMember.value!,
          ...res.data
        }
        perbaruiDataSesi({
          nama_lengkap: res.data.nama_lengkap,
          foto_profil: res.data.foto_profil
        })
      }
      modeEdit.value = false
    }
  } catch (err: any) {
    tampilkanNotifikasi(err.data?.statusMessage || 'Gagal menyimpan data profil', 'kesalahan')
  } finally {
    sedangMenyimpan.value = false
  }
}

// Batal edit
const batalkanEdit = () => {
  if (profilMember.value) {
    isiFormDariData(profilMember.value)
  }
  modeEdit.value = false
}

// Salin ID Member
const salinIdMember = () => {
  if (profilMember.value?.id) {
    navigator.clipboard.writeText(profilMember.value.id)
    tampilkanNotifikasi('ID Member berhasil disalin ke clipboard!', 'info')
  }
}

onMounted(() => {
  muatProfil()
})
</script>

<template>
  <div class="space-y-4 pb-8">
    <!-- Input File Tersembunyi untuk Upload Foto -->
    <input
      ref="inputFotoRef"
      type="file"
      accept="image/png, image/jpeg, image/webp"
      class="hidden"
      @change="tanganiUnggahFoto"
    />

    <!-- Header & Kartu Avatar Profil Interaktif -->
    <div class="text-center py-2 relative">
      <!-- Wadah Foto Profil / Avatar -->
      <div class="relative inline-block mb-3">
        <div class="w-24 h-24 rounded-3xl bg-gradient-to-tr from-neon-magenta via-rose-500 to-neon-fuchsia p-1 shadow-glow-magenta group transition-all duration-300">
          <div class="w-full h-full bg-slate-900 rounded-[22px] overflow-hidden flex items-center justify-center relative">
            <!-- Jika memiliki foto profil -->
            <img
              v-if="formProfil.foto_profil || profilMember?.foto_profil"
              :src="formProfil.foto_profil || profilMember?.foto_profil || ''"
              alt="Foto Profil Member"
              class="w-full h-full object-cover"
            />
            <!-- Jika tidak memiliki foto profil, tampilkan inisial nama -->
            <span
              v-else
              class="font-black text-3xl text-neon-pink tracking-tight"
            >
              {{ (formProfil.nama_lengkap || dataPengguna?.nama_lengkap || 'M').substring(0, 2).toUpperCase() }}
            </span>

            <!-- Overlay hover kamera jika sedang loading simpan foto -->
            <div
              v-if="sedangMenyimpan"
              class="absolute inset-0 bg-black/70 flex items-center justify-center"
            >
              <div class="animate-spin text-xl text-white">🔄</div>
            </div>
          </div>
        </div>

        <!-- Tombol Tambah / Ubah Foto (Kamera Mengambang) -->
        <button
          type="button"
          @click="triggerPilihFoto"
          :disabled="sedangMenyimpan"
          class="absolute -bottom-1 -right-1 p-2 rounded-2xl bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white shadow-glow-magenta hover:scale-105 active:scale-95 transition border-2 border-slate-950"
          title="Ubah Foto Profil"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <!-- Opsi Cepat Foto Profil -->
      <div class="flex items-center justify-center space-x-2 mb-2">
        <button
          type="button"
          @click="triggerPilihFoto"
          class="text-[11px] font-bold text-neon-pink hover:text-pink-300 underline underline-offset-2 flex items-center space-x-1"
        >
          <span>📷 Unggah Foto</span>
        </button>
        <span v-if="formProfil.foto_profil || profilMember?.foto_profil" class="text-slate-600">•</span>
        <button
          v-if="formProfil.foto_profil || profilMember?.foto_profil"
          type="button"
          @click="hapusFoto"
          class="text-[11px] font-bold text-slate-400 hover:text-red-400"
        >
          Hapus
        </button>
      </div>

      <!-- Pilihan Avatar Studio Cepat -->
      <div v-if="modeEdit" class="max-w-xs mx-auto mb-4 p-2.5 rounded-2xl bg-slate-900/80 border border-white/5">
        <p class="text-[10px] text-slate-400 font-semibold mb-2">Atau pilih avatar studio:</p>
        <div class="flex items-center justify-center space-x-2">
          <button
            v-for="(ava, idx) in avatarPilihan"
            :key="idx"
            type="button"
            @click="pilihAvatarPreset(ava)"
            class="w-9 h-9 rounded-xl overflow-hidden border-2 transition"
            :class="formProfil.foto_profil === ava ? 'border-neon-pink scale-110 shadow-glow-magenta' : 'border-transparent hover:border-white/30'"
          >
            <img :src="ava" alt="Avatar Preset" class="w-full h-full object-cover" />
          </button>
        </div>
      </div>

      <!-- Nama & Email Member -->
      <h2 class="text-xl font-black text-white">
        {{ formProfil.nama_lengkap || dataPengguna?.nama_lengkap || 'Member Mezona' }}
      </h2>
      <p class="text-xs text-slate-400 font-mono mt-0.5">
        {{ dataPengguna?.email }}
      </p>

      <!-- Badge Status Keanggotaan -->
      <div class="mt-2.5 inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-200 border border-rose-500/30">
        <span class="w-2 h-2 rounded-full bg-neon-pink animate-pulse"></span>
        <span>{{ dataPengguna?.peran || 'MEMBER' }} • STATUS {{ profilMember?.status || dataPengguna?.status_keanggotaan || 'AKTIF' }}</span>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODE TAMPILAN PROFIL -->
    <!-- ======================================================== -->
    <div v-if="!modeEdit" class="space-y-4">
      <!-- Tombol Aksi Edit Utama -->
      <button
        @click="modeEdit = true"
        class="w-full py-3 rounded-2xl bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white font-extrabold text-xs shadow-glow-magenta hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center space-x-2"
      >
        <span>✏️</span>
        <span>Edit Informasi Profil</span>
      </button>

      <!-- Kartu Data Pribadi -->
      <div class="efek-kaca rounded-2xl p-4 border border-rose-500/20 space-y-3">
        <h3 class="text-xs font-black uppercase tracking-wider text-neon-pink flex items-center space-x-1.5">
          <span>👤</span>
          <span>Informasi Pribadi</span>
        </h3>

        <div class="space-y-2.5 pt-1 text-xs">
          <div class="flex justify-between items-center py-1.5 border-b border-white/5">
            <span class="text-slate-400">Nama Lengkap</span>
            <span class="font-bold text-white">{{ profilMember?.nama_lengkap || '-' }}</span>
          </div>

          <div class="flex justify-between items-center py-1.5 border-b border-white/5">
            <span class="text-slate-400">Nomor WhatsApp / HP</span>
            <span class="font-medium text-slate-200">{{ profilMember?.nomor_telepon || 'Belum diisi' }}</span>
          </div>

          <div class="flex justify-between items-center py-1.5 border-b border-white/5">
            <span class="text-slate-400">Jenis Kelamin</span>
            <span class="font-medium text-slate-200">
              {{ profilMember?.jenis_kelamin === 'PRIA' ? 'Laki-laki 👨' : profilMember?.jenis_kelamin === 'WANITA' ? 'Perempuan 👩' : 'Belum ditentukan' }}
            </span>
          </div>

          <div class="flex justify-between items-center py-1.5 border-b border-white/5">
            <span class="text-slate-400">Tanggal Lahir</span>
            <span class="font-medium text-slate-200">{{ profilMember?.tanggal_lahir || 'Belum diisi' }}</span>
          </div>

          <div class="flex justify-between items-start py-1.5">
            <span class="text-slate-400">Domisili / Alamat</span>
            <span class="font-medium text-slate-200 text-right max-w-[200px]">{{ profilMember?.alamat || 'Belum diisi' }}</span>
          </div>
        </div>
      </div>

      <!-- Kartu Detail Keanggotaan Studio -->
      <div class="efek-kaca rounded-2xl p-4 border border-white/5 space-y-3">
        <h3 class="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
          <span>💳</span>
          <span>Status Keanggotaan Studio</span>
        </h3>

        <div class="space-y-2.5 pt-1 text-xs">
          <div class="flex justify-between items-center py-1.5 border-b border-white/5">
            <span class="text-slate-400">ID Member</span>
            <div class="flex items-center space-x-1.5">
              <span class="font-mono text-slate-300">{{ (profilMember?.id || dataPengguna?.id || '').substring(0, 10) }}...</span>
              <button
                @click="salinIdMember"
                class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-neon-pink hover:bg-slate-700"
                title="Salin ID"
              >
                Salin
              </button>
            </div>
          </div>

          <div class="flex justify-between items-center py-1.5 border-b border-white/5">
            <span class="text-slate-400">Paket Keanggotaan</span>
            <span class="font-extrabold text-neon-pink">{{ profilMember?.paket || dataPengguna?.nama_paket || 'VIP All Access' }}</span>
          </div>

          <div class="flex justify-between items-center py-1.5 border-b border-white/5">
            <span class="text-slate-400">Masa Berlaku</span>
            <span class="font-bold text-white">{{ profilMember?.tanggal_kadaluwarsa_teks || 'Aktif 1 Bulan' }}</span>
          </div>

          <div class="flex justify-between items-center py-1.5">
            <span class="text-slate-400">Pusat Layanan & CS</span>
            <span class="text-slate-200 font-mono">0812-3456-7890</span>
          </div>
        </div>
      </div>

      <!-- Tombol Keluar dari Akun -->
      <button
        @click="bukaKonfirmasiKeluar"
        class="w-full py-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 font-bold text-xs transition duration-200 flex items-center justify-center space-x-2"
      >
        <span>🚪 Keluar dari Akun</span>
      </button>
    </div>

    <!-- ======================================================== -->
    <!-- MODE EDIT FORMULIR PROFIL -->
    <!-- ======================================================== -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between pb-1">
        <h3 class="text-sm font-black text-white flex items-center space-x-1.5">
          <span>✏️</span>
          <span>Edit Profil Pengguna</span>
        </h3>
        <button
          @click="batalkanEdit"
          class="text-xs font-bold text-slate-400 hover:text-white"
        >
          ✕ Batal
        </button>
      </div>

      <form @submit.prevent="simpanPerubahanProfil" class="space-y-3.5">
        <!-- Nama Lengkap -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">
            Nama Lengkap *
          </label>
          <input
            v-model="formProfil.nama_lengkap"
            type="text"
            required
            placeholder="Masukkan nama lengkap Anda"
            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-neon-pink rounded-xl text-white text-xs outline-none transition"
          />
        </div>

        <!-- Nomor Telepon / WhatsApp -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">
            Nomor Telepon / WhatsApp
          </label>
          <input
            v-model="formProfil.nomor_telepon"
            type="tel"
            placeholder="Contoh: 081234567890"
            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-neon-pink rounded-xl text-white text-xs outline-none transition"
          />
        </div>

        <!-- Jenis Kelamin -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">
            Jenis Kelamin
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="formProfil.jenis_kelamin = 'PRIA'"
              class="py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition"
              :class="formProfil.jenis_kelamin === 'PRIA'
                ? 'bg-rose-500/25 border-rose-500 text-neon-pink shadow-glow-magenta'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'"
            >
              <span>👨</span>
              <span>Laki-laki</span>
            </button>
            <button
              type="button"
              @click="formProfil.jenis_kelamin = 'WANITA'"
              class="py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition"
              :class="formProfil.jenis_kelamin === 'WANITA'
                ? 'bg-rose-500/25 border-rose-500 text-neon-pink shadow-glow-magenta'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'"
            >
              <span>👩</span>
              <span>Perempuan</span>
            </button>
          </div>
        </div>

        <!-- Tanggal Lahir -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">
            Tanggal Lahir
          </label>
          <input
            v-model="formProfil.tanggal_lahir"
            type="date"
            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-neon-pink rounded-xl text-white text-xs outline-none transition"
          />
        </div>

        <!-- Alamat Domisili -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">
            Alamat Tempat Tinggal
          </label>
          <textarea
            v-model="formProfil.alamat"
            rows="2"
            placeholder="Alamat domisili saat ini"
            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-neon-pink rounded-xl text-white text-xs outline-none transition resize-none"
          ></textarea>
        </div>

        <!-- Opsi Ganti Kata Sandi -->
        <div class="pt-2 border-t border-white/5">
          <label class="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-300 mb-2">
            <input
              type="checkbox"
              v-model="formProfil.ubah_sandi"
              class="rounded bg-slate-900 border-slate-700 text-neon-pink focus:ring-0"
            />
            <span>Ganti Kata Sandi Akun</span>
          </label>

          <div v-if="formProfil.ubah_sandi" class="space-y-2 mt-2">
            <input
              v-model="formProfil.kata_sandi_baru"
              type="password"
              placeholder="Masukkan kata sandi baru (min 6 karakter)"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-neon-pink rounded-xl text-white text-xs outline-none transition"
            />
          </div>
        </div>

        <!-- Tombol Aksi Simpan & Batal -->
        <div class="grid grid-cols-2 gap-2.5 pt-3">
          <button
            type="button"
            @click="batalkanEdit"
            :disabled="sedangMenyimpan"
            class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="sedangMenyimpan"
            class="w-full py-3 rounded-xl bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white font-extrabold text-xs shadow-glow-magenta hover:brightness-110 active:scale-95 transition flex items-center justify-center space-x-1"
          >
            <span v-if="sedangMenyimpan" class="animate-spin inline-block mr-1">🔄</span>
            <span>{{ sedangMenyimpan ? 'Menyimpan...' : 'Simpan Perubahan' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
