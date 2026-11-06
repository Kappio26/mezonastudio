// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  // Mengatur port server pengembangan menjadi 3012
  devServer: {
    port: 3012
  },

  // ssr diatur false agar Nuxt 3 beroperasi dalam mode SPA (Single Page Application)
  // yang siap dikompilasi menjadi aset statis untuk WebView Capacitor di Android.
  ssr: false,

  // Nonaktifkan appManifest agar Vite tidak mencari virtual module #app-manifest saat mode SPA
  experimental: {
    appManifest: false
  },

  router: {
    options: {
      hashMode: true
    }
  },

  ignore: [
    'android/**',
    'dist/**',
    '.output/**'
  ],

  vite: {
    server: {
      watch: {
        ignored: ['**/android/**', '**/dist/**', '**/.output/**']
      }
    }
  },

  modules: [
    '@nuxtjs/tailwindcss'
  ],

  app: {
    head: {
      title: 'Mezona Studio - Fitness & Gym Management',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'description', content: 'Sistem manajemen gym modern Mezona Studio' },
        { name: 'theme-color', content: '#0d1117' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap' },
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    }
  },

  css: [
    '~/assets/css/utama.css'
  ],

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/']
    }
  },

  runtimeConfig: {
    kunciRahasiaJwt: process.env.JWT_SECRET || 'kunci_rahasia_super_aman_mezona_studio_2026',
    public: {
      namaAplikasi: 'Mezona Studio',
      urlApi: process.env.API_BASE_URL || '/api'
    }
  }
})
