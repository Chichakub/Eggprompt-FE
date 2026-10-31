<script setup>
import AppSidebar from '@/components/layout/AppSidebar.vue';
</script>

<template>
  <div class="main-layout">
    <AppSidebar />
    <main class="page-content"><RouterView /></main>
  </div>
</template>

<style scoped>
.main-layout { display: flex; min-height: 100vh; }
.page-content { flex: 1; min-width: 0; padding: 24px; background-color: var(--app-bg, #f7f2e7); }
</style>
