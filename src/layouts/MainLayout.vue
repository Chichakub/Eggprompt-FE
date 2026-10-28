<!--
  src/layouts/MainLayout.vue
  โครงหน้าหลังล็อกอิน: Sidebar ซ้าย + เนื้อหาขวา
-->
<script setup>
import AppSidebar from '@/components/layout/AppSidebar.vue';
</script>

<template>
  <div class="main-layout">
    <AppSidebar />

    <main class="content">
      <router-view />
    </main>

    <!-- GLOBAL MODALS (modalStore.activeModal) วาง BaseConfirmModal / SuccessModal ตรงนี้ -->
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
  background: #f8f4ec;
}
.content {
  flex: 1;
  min-width: 0;
  padding: 24px 32px;
  box-sizing: border-box;
}
</style>