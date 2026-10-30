<script setup>
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

    <button
      type="submit"
      :disabled="loading"
      :aria-busy="loading"
      class="flex min-h-10 w-full items-center justify-center gap-2 rounded-[9px] bg-[#f6d390] px-3 py-2 text-xs font-semibold transition hover:bg-[#efc36c] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a76a00]"
    >
      <slot v-if="!loading" name="submit-icon" />
      {{ loading ? loadingText : submitText }}
    </button>

    <slot name="status" />
  </form>
</template>