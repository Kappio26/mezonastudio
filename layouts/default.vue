<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
    <!-- Ambient Glow Background Lembut -->
    <div class="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-rose-200/25 blur-[150px] rounded-full pointer-events-none z-0"></div>
    <div class="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-200/20 blur-[150px] rounded-full pointer-events-none z-0"></div>

    <div class="relative z-10 flex-1 flex flex-col">
      <slot />
    </div>
  </div>
</template>
