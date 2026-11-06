import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      colors: {
        'gelap-dasar': '#f8fafc',
        'gelap-kartu': '#ffffff',
        'gelap-aksen': '#f1f5f9',
        // Warna Identitas Resmi Mezona Studio (Magenta, Pink & Perak Metalik Platinum)
        'neon-magenta': '#e11d48',
        'neon-magenta-terang': '#f43f5e',
        'neon-fuchsia': '#ec4899',
        'neon-pink': '#e11d48',
        'perak-metalik': '#475569',
        'perak-terang': '#0f172a',
        'perak-gelap': '#64748b',
        // Alias tema terintegrasi agar komponen yang ada selaras dengan palet Mezona Studio
        'neon-zamrud': '#e11d48',
        'neon-zamrud-terang': '#f43f5e',
        'neon-teal': '#ec4899',
        'neon-teal-terang': '#e11d48'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif']
      },
      boxShadow: {
        'glow-zamrud': '0 4px 16px -2px rgba(225, 29, 72, 0.35)',
        'glow-teal': '0 4px 16px -2px rgba(236, 72, 153, 0.35)',
        'glow-magenta': '0 4px 16px -2px rgba(225, 29, 72, 0.35)',
        'glow-fuchsia': '0 4px 16px -2px rgba(236, 72, 153, 0.35)',
        'glow-perak': '0 2px 10px -2px rgba(100, 116, 139, 0.2)',
        'kartu-kaca': '0 4px 20px -2px rgba(15, 23, 42, 0.06)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
}
