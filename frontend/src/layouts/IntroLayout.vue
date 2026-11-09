<script setup>
import ChatBubbleWidget from '@/components/chat/ChatBubbleWidget.vue'
</script>

<template>
  <div class="min-h-screen">
    <slot />
    <!-- Bot chat ngoài — khách trên landing -->
    <ChatBubbleWidget variant="public" />
  </div>
</template>
