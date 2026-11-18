<script setup>
import { useAuthStore } from '@/stores/authStore';
import FlockCreateView from './FlockCreateView.vue';
import FlocksView from '@/views/flocks/FlocksView.vue';
const auth=useAuthStore();
</script>
<template><FlockCreateView v-if="auth.isFarmAdmin && auth.setupStep===3" /><FlocksView v-else /></template>
