<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

definePageMeta({
  layout: 'admin'
})

const { tampilkanNotifikasi } = useOtentikasi()

interface RingkasanKeuangan {
  total_omset: number
  total_omset_rupiah: string
  total_transaksi: number
  rata_rata: number
  rata_rata_rupiah: string
  periode: string
}

interface RincianPaket {
  id: string
  nama: string
  harga: number
  durasi: string
  total_pembeli: number
  total_pendapatan: number
  total_pendapatan_rupiah: string
}

interface TransaksiItem {
  id: string
  nomor_invoice: string
  nama_member: string
  email: string
  nomor_telepon: string
  paket: string
  durasi: string
  nominal: number
  nominal_rupiah: string
  metode_pembayaran: string
  status: string
  tanggal: string
  tanggal_format?: string
  jam?: string
  tanggal_iso: string
}

const sedangMemuat = ref(true)
const sedangEksporPdf = ref(false)
const sedangEksporHarianPdf = ref(false)

// Fungsi tanggal hari ini format YYYY-MM-DD
const dapatkanTanggalHariIni = () => {
  const d = new Date()
  const thn = d.getFullYear()
  const bln = String(d.getMonth() + 1).padStart(2, '0')
  const hri = String(d.getDate()).padStart(2, '0')
  return `${thn}-${bln}-${hri}`
}

// State Laporan Harian
const tanggalLaporanHarian = ref<string>(dapatkanTanggalHariIni())
const tabTampilanTransaksi = ref<'SEMUA' | 'HARIAN'>('SEMUA')

const ringkasan = ref<RingkasanKeuangan>({
  total_omset: 0,
  total_omset_rupiah: 'Rp 0',
  total_transaksi: 0,
  rata_rata: 0,
  rata_rata_rupiah: 'Rp 0',
  periode: ''
})

const rincianPaket = ref<RincianPaket[]>([])
const daftarTransaksi = ref<TransaksiItem[]>([])

// Format tanggal lengkap bahasa Indonesia
const formatTanggalLengkap = (tglStr: string) => {
  if (!tglStr) return ''
  const t = new Date(tglStr)
  if (isNaN(t.getTime())) return ''
  return t.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Preset tanggal cepat
const pilihPresetHarian = (offsetHari: number) => {
  const t = new Date()
  t.setDate(t.getDate() + offsetHari)
  const thn = t.getFullYear()
  const bln = String(t.getMonth() + 1).padStart(2, '0')
  const hri = String(t.getDate()).padStart(2, '0')
  tanggalLaporanHarian.value = `${thn}-${bln}-${hri}`
}

// Filter transaksi berdasarkan tanggal yang dipilih
const daftarTransaksiHarian = computed(() => {
  const tglTarget = tanggalLaporanHarian.value
  if (!tglTarget) return []
  return daftarTransaksi.value.filter((t) => {
    const tglIso = t.tanggal_format || (t.tanggal_iso ? t.tanggal_iso.split('T')[0] : '')
    return tglIso === tglTarget
  })
})

// Ringkasan transaksi harian
const ringkasanHarian = computed(() => {
  const list = daftarTransaksiHarian.value
  const totalOmset = list.reduce((acc, t) => acc + t.nominal, 0)
  const totalTransaksi = list.length
  const rataRata = totalTransaksi > 0 ? Math.round(totalOmset / totalTransaksi) : 0

  return {
    tanggal: tanggalLaporanHarian.value,
    tanggal_teks: formatTanggalLengkap(tanggalLaporanHarian.value),
    total_omset: totalOmset,
    total_omset_rupiah: new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(totalOmset),
    total_transaksi: totalTransaksi,
    rata_rata: rataRata,
    rata_rata_rupiah: new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(rataRata)
  }
})

// Daftar transaksi yang tampil di tabel berdasarkan tab
const daftarTransaksiTampil = computed(() => {
  if (tabTampilanTransaksi.value === 'HARIAN') {
    return daftarTransaksiHarian.value
  }
  return daftarTransaksi.value
})

const muatDataKeuangan = async () => {
  sedangMemuat.value = true
  try {
    const respon: any = await $fetch('/api/admin/keuangan')
    if (respon.sukses && respon.data) {
      ringkasan.value = respon.data.ringkasan
      rincianPaket.value = respon.data.rincian_paket
      daftarTransaksi.value = respon.data.transaksi
    }
  } catch (error: any) {
    tampilkanNotifikasi(error.data?.statusMessage || 'Gagal memuat laporan keuangan', 'kesalahan')
  } finally {
    sedangMemuat.value = false
  }
}

// -------------------------------------------------------------
// 1. FUNGSI UNDUH LAPORAN HARIAN (DAILY REPORT PDF)
// -------------------------------------------------------------
const unduhLaporanHarianPdf = () => {
  sedangEksporHarianPdf.value = true

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const tanggalCetak = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const infoHarian = ringkasanHarian.value

    // Header Laporan Harian
    doc.setFillColor(13, 17, 23) // #0d1117
    doc.rect(0, 0, 210, 42, 'F')

    // Aksen Garis Emas / Amber
    doc.setFillColor(245, 158, 11) // #F59E0B Amber
    doc.rect(0, 41, 210, 1.5, 'F')

    // Brand & Judul
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('MEZONA STUDIO FITNESS', 14, 16)

    doc.setTextColor(245, 158, 11)
    doc.setFontSize(10)
    doc.text('LAPORAN KEUANGAN & OPERASIONAL HARIAN', 14, 23)

    doc.setTextColor(156, 163, 175)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Rekapitulasi transaksi kas, pembayaran paket, dan daily pass harian', 14, 30)

    // Tanggal Laporan di Kanan
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`Tanggal: ${infoHarian.tanggal_teks}`, 196, 16, { align: 'right' })

    doc.setTextColor(156, 163, 175)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Dicetak: ${tanggalCetak} WIB`, 196, 23, { align: 'right' })
    doc.text('Status: Lunas & Terverifikasi', 196, 30, { align: 'right' })

    // Kotak Ringkasan Metrik Harian
    doc.setDrawColor(229, 231, 235)
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(14, 48, 182, 22, 2, 2, 'FD')

    // Metrik 1: Total Omset Harian
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(7)
    doc.text('TOTAL OMSET HARIAN', 20, 54)
    doc.setTextColor(16, 185, 129)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(infoHarian.total_omset_rupiah, 20, 63)

    // Metrik 2: Total Transaksi Harian
    doc.setTextColor(107, 114, 128)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text('TOTAL TRANSAKSI HARI INI', 85, 54)
    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(`${infoHarian.total_transaksi} Transaksi`, 85, 63)

    // Metrik 3: Rata-Rata
    doc.setTextColor(107, 114, 128)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text('RATA-RATA NILAI BAYAR', 140, 54)
    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(infoHarian.rata_rata_rupiah, 140, 63)

    // Judul Tabel Harian
    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`Daftar Transaksi Tanggal: ${infoHarian.tanggal_teks}`, 14, 78)

    // Data Tabel
    let isiTabel: any[] = []
    if (daftarTransaksiHarian.value.length === 0) {
      isiTabel = [
        ['-', '-', '-', 'Tidak ada transaksi membership atau daily pass tercatat pada tanggal ini.', '-', '-', 'Rp 0', '-']
      ]
    } else {
      isiTabel = daftarTransaksiHarian.value.map((t, idx) => [
        String(idx + 1),
        t.nomor_invoice,
        t.jam || '-',
        t.nama_member,
        t.paket,
        t.metode_pembayaran,
        t.nominal_rupiah,
        t.status
      ])
    }

    autoTable(doc, {
      startY: 82,
      head: [['No', 'No. Invoice', 'Waktu', 'Nama Member', 'Paket Gym', 'Metode Bayar', 'Nominal', 'Status']],
      body: isiTabel,
      theme: 'grid',
      headStyles: {
        fillColor: [13, 17, 23],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        valign: 'middle'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { fontStyle: 'bold', cellWidth: 26 },
        2: { cellWidth: 18 },
        3: { cellWidth: 32 },
        4: { cellWidth: 28 },
        5: { cellWidth: 26 },
        6: { halign: 'right', fontStyle: 'bold', cellWidth: 24 },
        7: { halign: 'center', cellWidth: 16 }
      },
      foot: [
        [
          { content: 'TOTAL OMSET HARIAN', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: infoHarian.total_omset_rupiah, styles: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] } },
          { content: 'LUNAS', styles: { halign: 'center', fontStyle: 'bold' } }
        ]
      ],
      footStyles: {
        fillColor: [243, 244, 246],
        textColor: [17, 24, 39]
      }
    })

    // Bagian Tanda Tangan Kasir di Bawah
    const posisiAkhirY = (doc as any).lastAutoTable.finalY + 12
    if (posisiAkhirY < 260) {
      doc.setTextColor(107, 114, 128)
      doc.setFontSize(8)
      doc.text('Petugas Kasir & Verifikator Admin:', 135, posisiAkhirY)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(17, 24, 39)
      doc.text('Super Administrator Mezona Studio', 135, posisiAkhirY + 18)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(156, 163, 175)
      doc.text('Laporan harian sah dan digenerate otomatis melalui sistem', 135, posisiAkhirY + 22)
    }

    const namaBerkas = `Laporan_Harian_Mezona_Studio_${infoHarian.tanggal}.pdf`
    doc.save(namaBerkas)

    tampilkanNotifikasi(`Laporan Harian PDF "${namaBerkas}" berhasil diunduh!`, 'sukses')
  } catch (error: any) {
    console.error('Gagal generate PDF harian:', error)
    tampilkanNotifikasi('Terjadi kesalahan saat membuat berkas PDF harian.', 'kesalahan')
  } finally {
    sedangEksporHarianPdf.value = false
  }
}

// -------------------------------------------------------------
// 2. FUNGSI UNDUH LAPORAN BULANAN (MONTHLY GENERAL REPORT PDF)
// -------------------------------------------------------------
const unduhLaporanPdf = () => {
  if (daftarTransaksi.value.length === 0) {
    tampilkanNotifikasi('Tidak ada data transaksi untuk diekspor.', 'kesalahan')
    return
  }

  sedangEksporPdf.value = true

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const tanggalCetak = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Header Laporan Gym
    doc.setFillColor(13, 17, 23)
    doc.rect(0, 0, 210, 40, 'F')

    // Aksen Garis Neon Emerald
    doc.setFillColor(16, 185, 129)
    doc.rect(0, 39, 210, 1.5, 'F')

    // Teks Brand
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('MEZONA STUDIO', 14, 18)

    doc.setTextColor(16, 185, 129)
    doc.setFontSize(10)
    doc.text('FITNESS & GYM MANAGEMENT SYSTEM', 14, 25)

    doc.setTextColor(156, 163, 175)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Laporan Resmi Keuangan & Transaksi Membership Bulanan', 14, 32)

    // Tanggal Cetak & Info Periode di Kanan
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`Periode: ${ringkasan.value.periode}`, 196, 18, { align: 'right' })

    doc.setTextColor(156, 163, 175)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Dicetak: ${tanggalCetak} WIB`, 196, 25, { align: 'right' })
    doc.text('Status: Lunas & Terverifikasi', 196, 32, { align: 'right' })

    // Kotak Ringkasan Metrik
    doc.setDrawColor(229, 231, 235)
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(14, 46, 182, 22, 2, 2, 'FD')

    // Metrik 1: Total Omset
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(7)
    doc.text('TOTAL PENDAPATAN / OMSET', 20, 52)
    doc.setTextColor(16, 185, 129)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(ringkasan.value.total_omset_rupiah, 20, 61)

    // Metrik 2: Total Transaksi
    doc.setTextColor(107, 114, 128)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text('TOTAL TRANSAKSI', 85, 52)
    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(`${ringkasan.value.total_transaksi} Transaksi`, 85, 61)

    // Metrik 3: Rata-Rata
    doc.setTextColor(107, 114, 128)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text('RATA-RATA PEMBAYARAN', 140, 52)
    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(ringkasan.value.rata_rata_rupiah, 140, 61)

    // Judul Tabel
    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Rincian Transaksi Membership Member', 14, 76)

    // Data Tabel
    const isiTabel = daftarTransaksi.value.map((t, idx) => [
      String(idx + 1),
      t.nomor_invoice,
      t.tanggal,
      t.nama_member,
      t.paket,
      t.metode_pembayaran,
      t.nominal_rupiah,
      t.status
    ])

    autoTable(doc, {
      startY: 80,
      head: [['No', 'No. Invoice', 'Tanggal', 'Nama Member', 'Paket Gym', 'Metode Bayar', 'Nominal', 'Status']],
      body: isiTabel,
      theme: 'grid',
      headStyles: {
        fillColor: [13, 17, 23],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        valign: 'middle'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { fontStyle: 'bold', cellWidth: 28 },
        2: { cellWidth: 20 },
        3: { cellWidth: 32 },
        4: { cellWidth: 28 },
        5: { cellWidth: 26 },
        6: { halign: 'right', fontStyle: 'bold', cellWidth: 24 },
        7: { halign: 'center', cellWidth: 16 }
      },
      foot: [
        [
          { content: 'TOTAL KESELURUHAN OMSET', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: ringkasan.value.total_omset_rupiah, styles: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] } },
          { content: 'LUNAS', styles: { halign: 'center', fontStyle: 'bold' } }
        ]
      ],
      footStyles: {
        fillColor: [243, 244, 246],
        textColor: [17, 24, 39]
      }
    })

    const posisiAkhirY = (doc as any).lastAutoTable.finalY + 12
    if (posisiAkhirY < 260) {
      doc.setTextColor(107, 114, 128)
      doc.setFontSize(8)
      doc.text('Diverifikasi & Disahkan oleh:', 140, posisiAkhirY)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(17, 24, 39)
      doc.text('Super Administrator Mezona Studio', 140, posisiAkhirY + 18)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(156, 163, 175)
      doc.text('Dokumen digenerate otomatis melalui sistem', 140, posisiAkhirY + 22)
    }

    const namaBerkas = `Laporan_Keuangan_Mezona_Studio_${ringkasan.value.periode.replace(/\s+/g, '_')}.pdf`
    doc.save(namaBerkas)

    tampilkanNotifikasi(`Laporan Bulanan PDF "${namaBerkas}" berhasil diunduh!`, 'sukses')
  } catch (error: any) {
    console.error('Gagal generate PDF:', error)
    tampilkanNotifikasi('Terjadi kesalahan saat membuat berkas PDF.', 'kesalahan')
  } finally {
    sedangEksporPdf.value = false
  }
}

onMounted(() => {
  muatDataKeuangan()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Halaman Laporan Keuangan -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2">
          <span class="w-2.5 h-2.5 rounded-full bg-neon-zamrud animate-pulse"></span>
          <span class="text-xs font-bold uppercase tracking-widest text-neon-zamrud">Audit & Kas Studio</span>
        </div>
        <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
          Laporan Keuangan & Kas Gym
        </h2>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Pantau omset harian dan bulanan membership, paket harian (daily pass), dan unduh dokumen resmi PDF.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <button
          @click="muatDataKeuangan"
          :disabled="sedangMemuat"
          class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center space-x-1.5"
        >
          <span :class="{ 'animate-spin': sedangMemuat }">🔄</span>
          <span>Refresh</span>
        </button>

        <!-- Tombol Download Laporan Harian PDF -->
        <button
          @click="unduhLaporanHarianPdf"
          :disabled="sedangEksporHarianPdf || sedangMemuat"
          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition flex items-center space-x-1.5 disabled:opacity-50"
        >
          <span>📄</span>
          <span>{{ sedangEksporHarianPdf ? 'Membuat PDF...' : 'Unduh Laporan Harian (PDF)' }}</span>
        </button>

        <!-- Tombol Download Laporan Bulanan PDF -->
        <button
          @click="unduhLaporanPdf"
          :disabled="sedangEksporPdf || sedangMemuat"
          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-magenta to-neon-fuchsia text-white font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition flex items-center space-x-1.5 disabled:opacity-50"
        >
          <span>📥</span>
          <span>{{ sedangEksporPdf ? 'Membuat PDF...' : 'Unduh Laporan Bulanan (PDF)' }}</span>
        </button>
      </div>
    </div>

    <!-- KARTU PUSAT KONTROL & UNDUH LAPORAN HARIAN (KALENDER HARIAN) -->
    <div class="bg-amber-50/70 p-5 sm:p-6 rounded-3xl border border-amber-200 shadow-xs relative overflow-hidden space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-amber-200/80">
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-base">📅</span>
            <span class="text-xs font-black text-amber-800 uppercase tracking-wider">Pusat Laporan Harian Studio</span>
          </div>
          <h3 class="text-lg font-black text-slate-900 mt-0.5">
            Laporan Kas & Omset: <span class="text-amber-800 font-mono">{{ ringkasanHarian.tanggal_teks }}</span>
          </h3>
          <p class="text-xs text-slate-600 mt-0.5">
            Pilih tanggal di bawah untuk meninjau transaksi dan mengunduh laporan PDF harian resmi.
          </p>
        </div>

        <!-- Pemilih Tanggal Kalender Harian -->
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center space-x-2 bg-white border border-amber-300 rounded-xl px-3 py-2 shadow-2xs">
            <span class="text-xs text-amber-800 font-bold">Pilih Tanggal:</span>
            <input
              v-model="tanggalLaporanHarian"
              type="date"
              class="bg-transparent text-slate-900 text-xs font-bold focus:outline-none cursor-pointer [color-scheme:light]"
            />
          </div>

          <!-- Preset Cepat -->
          <button
            @click="pilihPresetHarian(0)"
            class="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition"
          >
            Hari Ini
          </button>
          <button
            @click="pilihPresetHarian(-1)"
            class="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition"
          >
            Kemarin
          </button>
          <button
            @click="unduhLaporanHarianPdf"
            :disabled="sedangEksporHarianPdf"
            class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition flex items-center space-x-1 shadow-md shadow-amber-500/20"
          >
            <span>📥 Cetak PDF</span>
          </button>
        </div>
      </div>

      <!-- 3 Kartu Metrik Harian untuk Tanggal Terpilih -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        <!-- Omset Hari Terpilih -->
        <div class="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs">
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pemasukan Tanggal Ini</span>
          <span class="text-xl sm:text-2xl font-black text-emerald-700 block mt-1">
            {{ ringkasanHarian.total_omset_rupiah }}
          </span>
          <span class="text-[10px] text-slate-500 mt-1 block">Total dana sah terverifikasi</span>
        </div>

        <!-- Transaksi Hari Terpilih -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Jumlah Transaksi</span>
          <span class="text-xl sm:text-2xl font-black text-slate-900 block mt-1">
            {{ ringkasanHarian.total_transaksi }} Transaksi
          </span>
          <span class="text-[10px] text-slate-500 mt-1 block">Paket bulanan & paket harian</span>
        </div>

        <!-- Rata-Rata Transaksi Hari Terpilih -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rata-Rata Transaksi</span>
          <span class="text-xl sm:text-2xl font-black text-rose-600 block mt-1">
            {{ ringkasanHarian.rata_rata_rupiah }}
          </span>
          <span class="text-[10px] text-slate-500 mt-1 block">Nilai belanja per member</span>
        </div>
      </div>
    </div>

    <!-- Kartu Metrik Ringkasan Keuangan Bulanan -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <!-- Total Omset Bulanan -->
      <div class="efek-kaca p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition">
        <div class="flex justify-between items-center mb-2">
          <p class="text-xs text-slate-400 uppercase font-semibold">Total Omset Bulan Ini</p>
          <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold">
            {{ ringkasan.periode }}
          </span>
        </div>
        <p class="text-2xl font-black text-neon-zamrud mt-1">
          {{ sedangMemuat ? '...' : ringkasan.total_omset_rupiah }}
        </p>
        <p class="text-[11px] text-slate-400 mt-2">Dihitung dari seluruh paket aktif terdaftar</p>
      </div>

      <!-- Transaksi Berhasil -->
      <div class="efek-kaca p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition">
        <p class="text-xs text-slate-400 uppercase font-semibold">Transaksi Membership Berhasil</p>
        <p class="text-2xl font-black text-white mt-2">
          {{ sedangMemuat ? '...' : `${ringkasan.total_transaksi} Transaksi` }}
        </p>
        <p class="text-[11px] text-emerald-400 mt-2 font-medium">✓ 100% Pembayaran Terverifikasi</p>
      </div>

      <!-- Rata-rata Nilai Transaksi -->
      <div class="efek-kaca p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition">
        <p class="text-xs text-slate-400 uppercase font-semibold">Rata-Rata Transaksi Member</p>
        <p class="text-2xl font-black text-neon-teal mt-2">
          {{ sedangMemuat ? '...' : ringkasan.rata_rata_rupiah }}
        </p>
        <p class="text-[11px] text-slate-400 mt-2">Nilai per pelanggan aktif studio</p>
      </div>
    </div>

    <!-- Analisis Pendapatan Berdasarkan Kategori Paket Termasuk Paket Harian -->
    <div class="efek-kaca rounded-2xl border border-slate-800 p-5">
      <div class="flex justify-between items-center mb-1">
        <h3 class="font-bold text-white text-base">Rincian Performa Paket Membership & Daily Pass</h3>
        <span class="text-[11px] font-bold text-slate-400">Total {{ rincianPaket.length }} Kategori</span>
      </div>
      <p class="text-xs text-slate-400 mb-4">Kontribusi pendapatan dari masing-masing paket studio</p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="pkt in rincianPaket"
          :key="pkt.id"
          class="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
          :class="{ 'border-amber-500/40 bg-amber-500/5': pkt.durasi.includes('1 Hari') }"
        >
          <div>
            <div class="flex items-center space-x-1.5">
              <h4 class="text-sm font-bold text-white">{{ pkt.nama }}</h4>
              <span v-if="pkt.durasi.includes('1 Hari')" class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                Harian
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              {{ pkt.total_pembeli }} Member • {{ pkt.durasi }}
            </p>
          </div>
          <div class="text-right">
            <span class="text-sm font-black text-neon-zamrud block">
              {{ pkt.total_pendapatan_rupiah }}
            </span>
            <span class="text-[10px] text-slate-500">Subtotal Pendapatan</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabel Buku Besar Transaksi (Dengan Tab Filter Harian & Semua) -->
    <div class="efek-kaca rounded-2xl border border-slate-800 overflow-hidden">
      <div class="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="font-bold text-white text-base">Rincian Riwayat Transaksi Member</h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Daftar transaksi pembayaran membership & daily pass yang tercatat di basis data
          </p>
        </div>

        <!-- Filter Tab Antara Semua Transaksi vs Transaksi Harian -->
        <div class="flex items-center space-x-2">
          <button
            @click="tabTampilanTransaksi = 'SEMUA'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition"
            :class="tabTampilanTransaksi === 'SEMUA'
              ? 'bg-slate-700 text-white font-black'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'"
          >
            Semua ({{ daftarTransaksi.length }})
          </button>
          <button
            @click="tabTampilanTransaksi = 'HARIAN'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1"
            :class="tabTampilanTransaksi === 'HARIAN'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-amber-300/80 hover:text-amber-200 border border-amber-500/30'"
          >
            <span>Tanggal Terpilih</span>
            <span class="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px]">
              {{ daftarTransaksiHarian.length }}
            </span>
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th class="px-6 py-3.5">No. Invoice</th>
              <th class="px-6 py-3.5">Tanggal & Jam</th>
              <th class="px-6 py-3.5">Nama Member</th>
              <th class="px-6 py-3.5">Paket Gym</th>
              <th class="px-6 py-3.5">Metode Bayar</th>
              <th class="px-6 py-3.5 text-right">Nominal</th>
              <th class="px-6 py-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-200">
            <tr v-if="sedangMemuat">
              <td colspan="7" class="px-6 py-8 text-center text-slate-400 text-xs">
                Memuat data transaksi dari basis data...
              </td>
            </tr>
            <tr v-else-if="daftarTransaksiTampil.length === 0">
              <td colspan="7" class="px-6 py-8 text-center text-slate-400 text-xs space-y-1">
                <span class="block text-base">🔍</span>
                <span class="block font-medium">Tidak ada transaksi tercatat pada filter ini.</span>
                <button
                  v-if="tabTampilanTransaksi === 'HARIAN'"
                  @click="tabTampilanTransaksi = 'SEMUA'"
                  class="mt-2 text-xs text-amber-400 underline font-bold"
                >
                  Tampilkan Semua Transaksi
                </button>
              </td>
            </tr>
            <tr
              v-else
              v-for="item in daftarTransaksiTampil"
              :key="item.id"
              class="hover:bg-slate-800/30 transition"
            >
              <td class="px-6 py-4 font-mono text-xs font-bold text-slate-300">
                {{ item.nomor_invoice }}
              </td>
              <td class="px-6 py-4 text-xs">
                <span class="text-white block font-medium">{{ item.tanggal }}</span>
                <span v-if="item.jam" class="text-[10px] text-slate-400 block font-mono">{{ item.jam }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="font-bold text-white block">{{ item.nama_member }}</span>
                <span class="text-[11px] text-slate-500">{{ item.email }}</span>
              </td>
              <td class="px-6 py-4 text-xs">
                <span
                  class="px-2 py-0.5 rounded-md border font-semibold inline-block"
                  :class="item.durasi.includes('1 Hari')
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300'"
                >
                  {{ item.paket }}
                </span>
                <span class="text-[10px] text-slate-400 block mt-0.5">Durasi: {{ item.durasi }}</span>
              </td>
              <td class="px-6 py-4 text-xs text-slate-400">{{ item.metode_pembayaran }}</td>
              <td class="px-6 py-4 text-right font-bold text-emerald-400 text-xs font-mono">
                {{ item.nominal_rupiah }}
              </td>
              <td class="px-6 py-4 text-center">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {{ item.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
