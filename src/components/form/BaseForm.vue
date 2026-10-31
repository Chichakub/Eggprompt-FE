<script setup>
import BaseButton from './BaseButton.vue';

defineProps({
  submitText: { type: String, default: 'บันทึก' },
  loadingText: { type: String, default: 'กำลังดำเนินการ...' },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['submit']);

function submit() {
  emit('submit');
}
</script>

<template>
  <form class="mt-6 space-y-5" novalidate @submit.prevent="!loading && submit()">
    <slot />

    <BaseButton type="submit" class="w-full" :loading="loading" :loading-text="loadingText">
      <template #icon>
        <slot name="submit-icon" />
      </template>

      {{ submitText }}
    </BaseButton>

    <slot name="status" />
  </form>
</template>