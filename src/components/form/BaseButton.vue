<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'button',
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary'].includes(value),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loadingText: {
    type: String,
    default: 'กำลังบันทึก...',
  },
});

const variantClass = computed(() =>
  props.variant === 'secondary'
    ? 'border border-[#e2d9c9] bg-[#f7f3ea] hover:bg-[#efe9da]'
    : 'border border-transparent bg-[#f6d390] hover:bg-[#efc36c]'
);
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    class="inline-flex min-h-10 items-center justify-center gap-1.5
           rounded-lg px-6 py-2 text-xs font-semibold text-[#243319]
           disabled:cursor-not-allowed disabled:opacity-60
           focus-visible:outline-2 focus-visible:outline-offset-2
           focus-visible:outline-[#a76a00]"
    :class="variantClass"
  >
    <slot v-if="!loading" name="icon" />

    <template v-if="loading">
      {{ loadingText }}
    </template>
    <slot v-else />
  </button>
</template>