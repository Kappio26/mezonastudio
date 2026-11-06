export default defineNuxtRouteMiddleware((to) => {
  const jalur = to.path

  // Rute publik yang bebas diakses tanpa perlu login
  const rutePublik = ['/', '/masuk', '/pendaftaran', '/daftar']
  if (rutePublik.includes(jalur)) {
    return
  }

  // Tentukan apakah rute ini memerlukan otentikasi peran tertentu
  const butuhAdmin = jalur.startsWith('/admin')
  const butuhPelatih = jalur.startsWith('/pelatih')
  const butuhMember = jalur.startsWith('/member')

  // Jika bukan rute privat studio, biarkan lewat
  if (!butuhAdmin && !butuhPelatih && !butuhMember) {
    return
  }

  // Cek token & data pengguna dari cookie (tersedia di SSR & Klien)
  const tokenCookie = useCookie<string | null>('mezona_token')
  const penggunaCookie = useCookie<any>('mezona_pengguna')

  let token = tokenCookie.value
  let pengguna = penggunaCookie.value

  // Fallback ke localStorage saat berada di browser klien
  if (import.meta.client && (!token || !pengguna)) {
    const tokenLocal = localStorage.getItem('mezona_token')
    const penggunaLocal = localStorage.getItem('mezona_pengguna')
    if (tokenLocal && penggunaLocal) {
      try {
        token = tokenLocal
        pengguna = JSON.parse(penggunaLocal)
      } catch {
        token = null
        pengguna = null
      }
    }
  }

  // Jika tidak memiliki sesi login aktif (karena belum login atau sudah logout),
  // paksa tetap berada/kembali ke halaman login dengan replace state
  if (!token || !pengguna) {
    return navigateTo('/masuk', { replace: true })
  }

  // Validasi peran untuk mencegah pelanggaran otorisasi antarrute
  if (butuhAdmin && pengguna.peran !== 'ADMIN') {
    return navigateTo('/masuk', { replace: true })
  }
  if (butuhPelatih && pengguna.peran !== 'PELATIH') {
    return navigateTo('/masuk', { replace: true })
  }
  if (butuhMember && pengguna.peran !== 'MEMBER') {
    return navigateTo('/masuk', { replace: true })
  }
})
