import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const KUNCI_JWT_DEFAULT = 'kunci_rahasia_mezona_studio_gym_super_aman_2026'

/**
 * Mengenkripsi teks kata sandi menjadi hash aman menggunakan bcrypt
 */
export async function enkripsiKataSandi(kataSandiPolos: string): Promise<string> {
  const tingkatGaram = 10
  return await bcrypt.hash(kataSandiPolos, tingkatGaram)
}

/**
 * Mencocokkan kata sandi polos dari input pengguna dengan hash yang tersimpan di database
 */
export async function verifikasiKataSandi(
  kataSandiPolos: string,
  hashKataSandi: string
): Promise<boolean> {
  return await bcrypt.compare(kataSandiPolos, hashKataSandi)
}

/**
 * Membuat token JWT (JSON Web Token) dengan masa berlaku 7 hari
 */
export function buatTokenJwt(muatanPengguna: {
  id: string
  email: string
  peran: string
  nama_lengkap: string
}): string {
  const kunciRahasia = process.env.JWT_SECRET || KUNCI_JWT_DEFAULT
  return jwt.sign(muatanPengguna, kunciRahasia, {
    expiresIn: '7d'
  })
}

/**
 * Memverifikasi validitas token JWT
 */
export function verifikasiTokenJwt(token: string): any {
  const kunciRahasia = process.env.JWT_SECRET || KUNCI_JWT_DEFAULT
  try {
    return jwt.verify(token, kunciRahasia)
  } catch {
    return null
  }
}
