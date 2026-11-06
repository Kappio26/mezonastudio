import { inisialisasiPrisma } from '~/server/utils/prisma'
import { hitungStatusMember } from '~/server/utils/statusMember'

export default defineEventHandler(async (peristiwa) => {
  try {
    const dataTubuh = await readBody(peristiwa)
    const { id_pengguna, id_paket, metode_pembayaran } = dataTubuh

    if (!id_pengguna) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID member wajib disertakan.'
      })
    }

    const prisma = inisialisasiPrisma()

    // 1. Cari pengguna dan profilnya
    const pengguna = await prisma.pengguna.findUnique({
      where: { id: id_pengguna },
      include: {
        profil: {
          include: {
            paket_keanggotaan: true
          }
        }
      }
    })

    if (!pengguna || !pengguna.profil) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Data profil member tidak ditemukan.'
      })
    }

    // 2. Ambil paket yang dipilih atau gunakan paket yang sudah ada
    const targetPaketId = id_paket || pengguna.profil.id_paket_keanggotaan
    if (!targetPaketId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Silakan pilih paket membership yang akan diperpanjang.'
      })
    }

    const paket = await prisma.paketKeanggotaan.findUnique({
      where: { id: targetPaketId }
    })

    if (!paket) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Paket keanggotaan tidak ditemukan.'
      })
    }

    const durasiHari = paket.durasi_hari || 30
    const sekarang = new Date()

    // 3. Hitung tanggal kadaluwarsa baru:
    // Jika masih aktif, tambahkan durasi ke tanggal kadaluwarsa yang lama (akumulatif)
    // Jika sudah kadaluwarsa atau belum ada, hitung dari hari ini + durasiHari
    let tanggalKadaluwarsaBaru: Date

    if (pengguna.profil.tanggal_kadaluwarsa && new Date(pengguna.profil.tanggal_kadaluwarsa) > sekarang) {
      tanggalKadaluwarsaBaru = new Date(pengguna.profil.tanggal_kadaluwarsa)
      tanggalKadaluwarsaBaru.setDate(tanggalKadaluwarsaBaru.getDate() + durasiHari)
    } else {
      tanggalKadaluwarsaBaru = new Date(sekarang)
      tanggalKadaluwarsaBaru.setDate(tanggalKadaluwarsaBaru.getDate() + durasiHari)
    }

    // 4. Update data member di database & catat transaksi pembayaran kasir resmi
    const tgl = new Date()
    const tglStr = tgl.toISOString().slice(0, 10).replace(/-/g, '')
    const acak = Math.floor(1000 + Math.random() * 9000)
    const nomorInvoice = `INV-KASIR-${tglStr}-${acak}`

    await prisma.$transaction([
      prisma.pengguna.update({
        where: { id: id_pengguna },
        data: { aktif: true }
      }),
      prisma.profil.update({
        where: { id_pengguna: id_pengguna },
        data: {
          status_keanggotaan: 'AKTIF',
          tanggal_kadaluwarsa: tanggalKadaluwarsaBaru,
          id_paket_keanggotaan: paket.id
        }
      }),
      prisma.pembayaran.create({
        data: {
          id_pengguna: id_pengguna,
          id_paket: paket.id,
          tipe_transaksi: 'PAKET',
          nomor_invoice: nomorInvoice,
          jumlah_bayar: paket.harga,
          metode_pembayaran: metode_pembayaran || 'Kasir Studio (Tunai)',
          bukti_pembayaran: 'PEMBAYARAN_LANGSUNG_KASIR',
          status: 'DISETUJUI',
          catatan_admin: `Perpanjangan langsung oleh Admin via ${metode_pembayaran || 'Kasir Studio'}`
        }
      })
    ])

    const statusTerbaru = hitungStatusMember(tanggalKadaluwarsaBaru, 'AKTIF')

    return {
      sukses: true,
      pesan: `Membership untuk ${pengguna.profil.nama_lengkap} berhasil diperpanjang dengan ${paket.nama_paket} (+${durasiHari} hari)!`,
      data: {
        id_pengguna,
        nama: pengguna.profil.nama_lengkap,
        nama_paket: paket.nama_paket,
        durasi_hari: durasiHari,
        tanggal_kadaluwarsa: tanggalKadaluwarsaBaru.toISOString(),
        tanggal_kadaluwarsa_teks: statusTerbaru.tanggal_kadaluwarsa_teks,
        sisa_hari: statusTerbaru.sisa_hari,
        status: 'AKTIF',
        metode_pembayaran: metode_pembayaran || 'Kasir Studio'
      }
    }
  } catch (kesalahan: any) {
    if (kesalahan.statusCode) throw kesalahan
    console.error('Gagal memperpanjang membership member:', kesalahan)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memperpanjang membership: ${kesalahan.message}`
    })
  }
})
