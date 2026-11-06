<script setup lang="ts">
import { useOtentikasi } from '~/composables/useOtentikasi'

const { notifikasiGlobal } = useOtentikasi()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-4 opacity-0"
    >
      <div
        v-if="notifikasiGlobal"
        class="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] pointer-events-none"
      >
        <div
          class="rounded-2xl p-4 shadow-xl border flex items-center space-x-3 pointer-events-auto bg-white"
          :class="notifikasiGlobal.tipe === 'sukses'
            ? 'border-emerald-200 text-emerald-800'
            : notifikasiGlobal.tipe === 'kesalahan'
              ? 'border-red-200 text-red-800'
              : 'border-rose-200 text-slate-800'"
        >
          <div
            class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
            :class="notifikasiGlobal.tipe === 'sukses'
              ? 'bg-emerald-100 text-emerald-700'
              : notifikasiGlobal.tipe === 'kesalahan'
                ? 'bg-red-100 text-red-700'
                : 'bg-rose-100 text-rose-700'"
          >
            <span v-if="notifikasiGlobal.tipe === 'sukses'">✓</span>
            <span v-else-if="notifikasiGlobal.tipe === 'kesalahan'">✕</span>
            <span v-else>ℹ</span>
          </div>

          <p class="text-xs font-semibold leading-snug text-slate-900">
            {{ notifikasiGlobal.pesan }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
