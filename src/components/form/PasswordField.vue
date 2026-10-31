<script setup>
import { ref } from 'vue';
import { KeyRound, Eye, EyeOff } from 'lucide-vue-next';
import BaseInput from './BaseInput.vue';

defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  autocomplete: { type: String, default: 'new-password' },
});

const model = defineModel({ type: String, default: '' });
const visible = ref(false);
</script>

<template>
  <BaseInput
    :id="id"
    v-model="model"
    :label="label"
    :type="visible ? 'text' : 'password'"
    :placeholder="placeholder"
    :error="error"
    :required="required"
    :autocomplete="autocomplete"
  >
    <template #icon>
      <KeyRound :size="15" />
    </template>

    <template #trailing>
      <button
        type="button"
        :aria-label="(visible ? 'ซ่อน' : 'แสดง') + label"
        :aria-pressed="visible"
        class="flex min-h-10 w-10 items-center justify-center rounded-lg text-[#8b9a74] focus-visible:outline-2 focus-visible:outline-[#a76a00]"
        @click="visible = !visible"
      >
        <EyeOff v-if="visible" :size="16" aria-hidden="true" />
        <Eye v-else :size="16" aria-hidden="true" />
      </button>
    </template>
  </BaseInput>
</template>