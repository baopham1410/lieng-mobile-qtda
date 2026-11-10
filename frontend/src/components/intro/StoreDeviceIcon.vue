<script setup>
defineProps({
  name: { type: String, required: true },
  sizeClass: { type: String, default: 'h-6 w-6' },
})
</script>

<template>
  <svg
    :class="[sizeClass, 'shrink-0 transition-transform']"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="1.8"
    aria-hidden="true"
  >
    <!-- All devices / Catalog -->
    <g v-if="name === 'all'">
      <rect x="3" y="3" width="7" height="7" rx="2" stroke-width="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="2" stroke-width="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="2" stroke-width="1.8" />
      <rect x="14" y="14" width="7" height="7" rx="2" stroke-width="1.8" />
    </g>

    <!-- Phone / iPhone -->
    <g v-else-if="name === 'phone'">
      <rect x="6" y="2" width="12" height="20" rx="3.5" stroke-width="1.8" />
      <line x1="10.5" y1="5.5" x2="13.5" y2="5.5" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="12" cy="18" r="0.8" fill="currentColor" />
    </g>

    <!-- Tablet / iPad -->
    <g v-else-if="name === 'tablet'">
      <rect x="4" y="2" width="16" height="20" rx="3" stroke-width="1.8" />
      <circle cx="12" cy="18" r="0.8" fill="currentColor" />
      <line x1="11" y1="4.5" x2="13" y2="4.5" stroke-width="1.5" stroke-linecap="round" />
    </g>

    <!-- Laptop / MacBook -->
    <g v-else-if="name === 'laptop'">
      <rect x="3.5" y="4" width="17" height="11.5" rx="2" stroke-width="1.8" />
      <path d="M2 19h20c-.5-1.5-1.5-2-3-2H5c-1.5 0-2.5.5-3 2z" stroke-width="1.8" stroke-linejoin="round" />
      <line x1="10.5" y1="17" x2="13.5" y2="17" stroke-width="1.5" stroke-linecap="round" />
    </g>

    <!-- Watch / Apple Watch -->
    <g v-else-if="name === 'watch'">
      <rect x="6.5" y="5.5" width="11" height="13" rx="3.5" stroke-width="1.8" />
      <path d="M9.5 5.5V2.5h5v3M9.5 18.5v3h5v-3" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="12" cy="12" r="2.5" stroke-width="1.5" />
      <line x1="12" y1="10.5" x2="12" y2="12" stroke-width="1.5" stroke-linecap="round" />
      <line x1="12" y1="12" x2="13.5" y2="12" stroke-width="1.5" stroke-linecap="round" />
    </g>

    <!-- Accessory / AirPods -->
    <g v-else-if="name === 'accessory'">
      <path d="M4 14.5a2.5 2.5 0 0 1 2.5-2.5h1a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1h-1A2.5 2.5 0 0 1 4 17v-2.5zm16 0a2.5 2.5 0 0 0-2.5-2.5h-1a1 1 0 0 0-1 1v5.5a1 1 0 0 0 1 1h1a2.5 2.5 0 0 0 2.5-2.5v-2.5z" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M6 12V9a6 6 0 0 1 12 0v3" stroke-width="1.8" stroke-linecap="round" />
    </g>

    <!-- Shipping / Fast Delivery -->
    <g v-else-if="name === 'delivery'">
      <rect x="1.5" y="4" width="13.5" height="11.5" rx="1.5" stroke-width="1.8" />
      <path d="M15 8h4.2a1 1 0 0 1 .8.4l2.5 3.3a1 1 0 0 1 .2.6V15.5H15V8z" stroke-width="1.8" stroke-linejoin="round" />
      <circle cx="6" cy="17.5" r="2" stroke-width="1.8" />
      <circle cx="18" cy="17.5" r="2" stroke-width="1.8" />
      <line x1="8" y1="17.5" x2="16" y2="17.5" stroke-width="1.8" stroke-linecap="round" />
    </g>

    <!-- Installment / Credit Card -->
    <g v-else-if="name === 'installment'">
      <rect x="2" y="5" width="20" height="14" rx="2.5" stroke-width="1.8" />
      <line x1="2" y1="9.5" x2="22" y2="9.5" stroke-width="1.8" />
      <line x1="5.5" y1="14.5" x2="10" y2="14.5" stroke-width="2" stroke-linecap="round" />
      <line x1="13.5" y1="14.5" x2="15.5" y2="14.5" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- Trade-in / Exchange -->
    <g v-else-if="name === 'trade-in'">
      <path d="M4 11h13.5l-3.5-4M20 13H6.5l3.5 4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- Warranty / Shield Check -->
    <g v-else-if="name === 'warranty'">
      <path d="M12 21.5s7.5-4 7.5-10V5.5l-7.5-3-7.5 3v6c0 6 7.5 10 7.5 10z" stroke-width="1.8" stroke-linejoin="round" />
      <path d="m9 11.5 2 2 4-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- Fire / Promo badge -->
    <g v-else-if="name === 'fire'">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- Phone call / Hotline -->
    <g v-else-if="name === 'phone-call'">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- Search -->
    <g v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="7" stroke-width="1.8" />
      <line x1="21" y1="21" x2="16.2" y2="16.2" stroke-width="1.8" stroke-linecap="round" />
    </g>

    <!-- Shopping Cart / Bag -->
    <g v-else-if="name === 'bag'">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </g>
  </svg>
</template>

