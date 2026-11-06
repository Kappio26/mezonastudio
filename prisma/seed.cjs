const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function utama() {
  console.log('--- Pembersihan Data Dummy & Penyiapan Akun Tunggal Resmi Mezona Studio ---')

  // 1. Bersihkan seluruh transaksi, presensi/pemesanan dummy, kelas, profil, pengguna, dan paket
  await prisma.pemesananKelas.deleteMany({})
  await prisma.pembayaran.deleteMany({})
  await prisma.kelas.deleteMany({})
  await prisma.profil.deleteMany({})
  await prisma.pengguna.deleteMany({})
  await prisma.paketKeanggotaan.deleteMany({})
  console.log('✓ Seluruh data transaksi, presensi, dan data dummy berhasil dihapus bersih.')

  // 2. Buat Paket Keanggotaan Master Resmi
  const paketVip = await prisma.paketKeanggotaan.create({
    data: {
      nama_paket: 'VIP All Access',
      deskripsi: 'Akses penuh seluruh fasilitas gym, sauna, dan BEBAS mengikuti SEMUA kelas studio (Zumba, Yoga, Poundfit) tanpa biaya tambahan.',
      harga: 750000,
      durasi_hari: 30,
      keuntungan: [
        'Semua Kelas Studio Tanpa Batas (Zumba, Yoga, Poundfit)',
        'Akses Sauna & Locker VIP',
        'Handuk & Minuman Gratis',
        'Konsultasi Nutrisi Bulanan'
      ],
      aktif: true
    }
  })

  const paketStudio = await prisma.paketKeanggotaan.create({
    data: {
      nama_paket: 'Paket Kelas Studio',
      deskripsi: 'Termasuk akses ke 1 jenis kelas studio pilihan (Zumba, Yoga, atau Poundfit) selama 30 hari.',
      harga: 450000,
      durasi_hari: 30,
      keuntungan: [
        '1 Pilihan Kelas Studio Utama (Zumba/Yoga/Poundfit)',
        'Akses Locker Room & Shower',
        'Pesan Kelas Tambahan Sesuai Tarif'
      ],
      aktif: true
    }
  })

  const paketHarian = await prisma.paketKeanggotaan.create({
    data: {
      nama_paket: 'Daily Pass (Paket Harian)',
      deskripsi: 'Akses 1 hari penuh seluruh fasilitas gym & bebas pilih 1 sesi kelas hari ini.',
      harga: 50000,
      durasi_hari: 1,
      keuntungan: [
        'Akses Gym & Alat Fitness 1 Hari Penuh',
        'Bebas Ikut 1 Sesi Kelas Hari Ini',
        'Akses Locker & Shower Room',
        'Minuman Mineral Gratis'
      ],
      aktif: true
    }
  })
  console.log('✓ 3 Paket Keanggotaan Master Resmi berhasil dibuat (VIP All Access, Studio, Harian).')

  // 3. Tepat 1 Akun Super Administrator (ADMIN)
  const sandiAdminHash = await bcrypt.hash('AdminMezona2026!', 10)
  const superAdmin = await prisma.pengguna.create({
    data: {
      email: 'admin@mezonastudio.com',
      kata_sandi: sandiAdminHash,
      peran: 'ADMIN',
      aktif: true,
      profil: {
        create: {
          nama_lengkap: 'Super Administrator',
          nomor_telepon: '081122334455',
          status_keanggotaan: 'AKTIF'
        }
      }
    }
  })
  console.log('✓ Akun Super Administrator siap: admin@mezonastudio.com (sandi: AdminMezona2026!)')

  // 4. Tepat 1 Akun Pelatih Resmi (PELATIH)
  const sandiPelatihHash = await bcrypt.hash('PelatihMezona2026!', 10)
  const pelatihTania = await prisma.pengguna.create({
    data: {
      email: 'pelatih@mezonastudio.com',
      kata_sandi: sandiPelatihHash,
      peran: 'PELATIH',
      aktif: true,
      profil: {
        create: {
          nama_lengkap: 'Coach Tania Putri',
          nomor_telepon: '081299887766',
          status_keanggotaan: 'AKTIF'
        }
      }
    }
  })
  console.log('✓ Akun Pelatih Resmi siap: pelatih@mezonastudio.com (sandi: PelatihMezona2026!)')

  // 5. Buat 3 Kelas Studio Resmi yang diasuh oleh Pelatih Resmi
  await prisma.kelas.create({
    data: {
      nama_kelas: 'Zumba Dance Cardio',
      deskripsi: 'Kardio tarian berenergi tinggi dengan irama ritmik Latin & lagu hits untuk membakar lemak dengan seru.',
      id_pelatih: pelatihTania.id,
      hari: 'Selasa & Kamis',
      jam_mulai: '18:30',
      jam_selesai: '19:30',
      kapasitas_maksimal: 25,
      lokasi_ruangan: 'Studio Beta (Lt. 1)',
      aktif: true
    }
  })

  await prisma.kelas.create({
    data: {
      nama_kelas: 'Vinyasa Flow Yoga',
      deskripsi: 'Latihan fleksibilitas tubuh, teknik pernapasan mendalam, dan meditasi untuk ketenangan pikiran.',
      id_pelatih: pelatihTania.id,
      hari: 'Rabu & Sabtu',
      jam_mulai: '07:30',
      jam_selesai: '08:45',
      kapasitas_maksimal: 15,
      lokasi_ruangan: 'Studio Zen (Lt. 2)',
      aktif: true
    }
  })

  await prisma.kelas.create({
    data: {
      nama_kelas: 'Poundfit (Pomfit) Rockout',
      deskripsi: 'Kardio intensif seluruh tubuh menggunakan stik Ripstix dengan ketukan musik energik yang memacu adrenalin.',
      id_pelatih: pelatihTania.id,
      hari: 'Senin & Jumat',
      jam_mulai: '19:00',
      jam_selesai: '20:00',
      kapasitas_maksimal: 20,
      lokasi_ruangan: 'Studio Alpha (Lt. 2)',
      aktif: true
    }
  })
  console.log('✓ 3 Kelas Studio Resmi siap diasuh oleh Coach Tania Putri (Zumba, Yoga, Poundfit).')

  // 6. Tepat 1 Akun Super Member (MEMBER dengan Paket VIP All Access Aktif)
  const sandiMemberHash = await bcrypt.hash('MemberMezona2026!', 10)
  const masaAktif30Hari = new Date()
  masaAktif30Hari.setDate(masaAktif30Hari.getDate() + 30)

  await prisma.pengguna.create({
    data: {
      email: 'member@mezonastudio.com',
      kata_sandi: sandiMemberHash,
      peran: 'MEMBER',
      aktif: true,
      profil: {
        create: {
          nama_lengkap: 'Super Member Mezona',
          nomor_telepon: '085712345678',
          status_keanggotaan: 'AKTIF',
          tanggal_kadaluwarsa: masaAktif30Hari,
          id_paket_keanggotaan: paketVip.id
        }
      }
    }
  })
  console.log('✓ Akun Super Member siap: member@mezonastudio.com (sandi: MemberMezona2026!)')

  console.log('\n=== RANGKUMAN STATUS SISTEM MEZONA STUDIO ===')
  console.log('1. Super Administrator: admin@mezonastudio.com (Sandi: AdminMezona2026!)')
  console.log('2. Pelatih Resmi      : pelatih@mezonastudio.com (Sandi: PelatihMezona2026!)')
  console.log('3. Super Member (VIP) : member@mezonastudio.com (Sandi: MemberMezona2026!)')
  console.log('Semua data dummy telah dibersihkan. Sistem siap digunakan sepenuhnya!')
}

utama()
  .catch((e) => {
    console.error('Kesalahan eksekusi seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
