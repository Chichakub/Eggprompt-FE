<script setup>
import { computed } from 'vue';
import { Check } from 'lucide-vue-next';

const props = defineProps({
  password: { type: String, default: '' },
});

const rules = computed(() => {
  const password = props.password;

  return [
    { label: 'ความยาวอย่างน้อย 8 ตัวอักษร', passed: password.length >= 8 },
    {
      label: 'พิมพ์ใหญ่และพิมพ์เล็ก (A-Z, a-z)',
      passed: /[A-Z]/.test(password) && /[a-z]/.test(password),
    },
    { label: 'มีตัวเลขอย่างน้อย 1 ตัว (0-9)', passed: /[0-9]/.test(password) },
    { label: 'มีอักขระพิเศษอย่างน้อย 1 ตัว', passed: /[!-/:-@[-`{-~]/.test(password) },
  ];
});

const progress = computed(() => rules.value.filter((rule) => rule.passed).length * 25);
</script>

<template>
  <div class="space-y-3">
    <div class="h-1.5 overflow-hidden rounded-full bg-[#e9e5da]" aria-hidden="true">
      <div
        class="h-full rounded-full bg-green-600 transition-[width]"
        :style="{ width: `${progress}%` }"
      />
    </div>

    <ul class="grid gap-2 text-xs sm:grid-cols-2" aria-label="เงื่อนไขรหัสผ่าน">
      <li
        v-for="rule in rules"
        :key="rule.label"
        class="flex items-center gap-2"
        :class="rule.passed ? 'text-green-700' : 'text-slate-500'"
      >
        <span
          class="flex size-3.5 shrink-0 items-center justify-center rounded-full border"
          :class="rule.passed ? 'border-green-700 bg-green-700 text-white' : 'border-slate-400'"
          aria-hidden="true"
        >
          <Check v-if="rule.passed" :size="10" />
        </span>
        <span>
          {{ rule.label }}
          <span class="sr-only">{{ rule.passed ? 'ผ่านแล้ว' : 'ยังไม่ผ่าน' }}</span>
        </span>
      </li>
    </ul>
  </div>
</template>