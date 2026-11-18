<script setup>
import { useAuthStore } from '@/stores/authStore';
import AppSidebar from '@/components/layout/AppSidebar.vue';
const auth = useAuthStore();
const steps = ['ข้อมูลฟาร์ม', 'ข้อมูลโรงเรือน', 'ข้อมูลฝูงไก่'];
</script>

<template>
  <div class="main-layout">
    <AppSidebar />
    <main class="page-content">
      <nav v-if="auth.isFarmSetupRequired && auth.setupStep > 0" class="setup-progress" aria-label="ขั้นตอนตั้งค่าฟาร์ม">
        <span v-for="(label, index) in steps" :key="label" :class="{ current: auth.setupStep === index + 1, completed: auth.setupStep > index + 1 }" :aria-current="auth.setupStep === index + 1 ? 'step' : undefined">{{ auth.setupStep > index + 1 ? '✓' : index + 1 }} {{ label }}</span>
      </nav>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.main-layout { display: flex; min-height: 100vh; }
.page-content { flex: 1; min-width: 0; padding: 24px; background-color: var(--app-bg, #f7f2e7); }
.setup-progress { display:flex; flex-wrap:wrap; gap:12px; margin-bottom:22px; padding:13px 17px; border:1px solid #ead6a5; border-radius:12px; background:#fcf7eb; font-size:13px; color:#96917f; }
.setup-progress span { padding:6px 12px; border-radius:8px; }.setup-progress .current { background:#f6d390; color:#3e422c; font-weight:700; }.setup-progress .completed { color:#4d743e; }
</style>
