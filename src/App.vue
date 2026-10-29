<script setup>
import { RouterView } from 'vue-router';
import { useModalStore } from '@/stores/modalStore';
import SuccessModal from '@/components/modals/SuccessModal.vue';
import ErrorModal from '@/components/modals/ErrorModal.vue';

const modalStore = useModalStore();
</script>

<template>
  <RouterView />
  <SuccessModal v-if="modalStore.activeModal === 'success'" />
   <ErrorModal v-if="modalStore.activeModal === 'error'" />
</template>