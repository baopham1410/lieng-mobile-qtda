<template>
  <div class="relative min-h-screen w-full overflow-hidden bg-[#f4f5f9] flex items-center justify-center p-4 sm:p-6 lg:p-8">
    <!-- Top-Left Decorative Red Circle (matches Photoshop template) -->
    <div
      class="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-gradient-to-br from-[#dc2626] to-[#b91c1c] opacity-95 shadow-2xl sm:-left-36 sm:-top-36 sm:h-[420px] sm:w-[420px]"
      aria-hidden="true"
    />
    <!-- Bottom-Right Decorative Red Organic Arc / Circle -->
    <div
      class="pointer-events-none absolute -bottom-36 -right-36 h-80 w-80 rounded-full bg-gradient-to-tl from-[#991b1b] via-[#dc2626] to-[#ef4444] opacity-95 shadow-2xl sm:-bottom-44 sm:-right-44 sm:h-[480px] sm:w-[480px]"
      aria-hidden="true"
    />

    <!-- Centered Card Container -->
    <div class="relative z-10 w-full max-w-4xl">
      <slot />
    </div>
  </div>
</template>
