<script setup>
import { computed, reactive } from 'vue';
import { Check } from 'lucide-vue-next';
import BaseForm from '@/components/form/BaseForm.vue';
import PasswordField from '@/components/form/PasswordField.vue';

defineProps({
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'change']);
const form = reactive({
  password: '',
  confirmPassword: '',
});

const errors = reactive({
  password: '',
  confirmPassword: '',
});

const passwordRules = computed(() => [
  {
    label: 'มีความยาวอย่างน้อย 8 ตัวอักษร',
    passed: form.password.length >= 8,
  },
  {
    label: 'มีตัวพิมพ์ใหญ่และตัวพิมพ์เล็ก (A-Z, a-z)',
    passed: /[A-Z]/.test(form.password) && /[a-z]/.test(form.password),
  },
  {
    label: 'มีตัวเลขอย่างน้อย 1 ตัว (0-9)',
    passed: /[0-9]/.test(form.password),
  },
  {
    label: 'มีอักขระพิเศษอย่างน้อย 1 ตัว',
    passed: /[!-/:-@[-`{-~]/.test(form.password),
  },
]);

function submit() {
  errors.password = '';
  errors.confirmPassword = '';

  if (!form.password) {
    errors.password = 'กรุณากรอกรหัสผ่านใหม่';
  } else if (!passwordRules.value.every((rule) => rule.passed)) {
    errors.password = 'รหัสผ่านยังไม่ผ่านเงื่อนไขทั้งหมด';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'กรุณายืนยันรหัสผ่านใหม่';
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
  }

  if (errors.password || errors.confirmPassword) return;

  emit('submit', {
    password: form.password,
    confirmPassword: form.confirmPassword,
  });
}
</script>

<template>
  <BaseForm submit-text="บันทึกรหัสผ่านใหม่" loading-text="กำลังบันทึก..." :loading="loading" @submit="submit">
    <PasswordField id="new-password" v-model="form.password" label="รหัสผ่านใหม่ (New Password)"
      placeholder="ระบุรหัสผ่านใหม่" required :error="errors.password"
      @update:model-value="errors.password = ''; errors.confirmPassword = ''; emit('change')" />

    <ul class="grid grid-cols-1 gap-2 text-[10px] sm:grid-cols-2" aria-label="เงื่อนไขรหัสผ่าน">
      <li v-for="rule in passwordRules" :key="rule.label" class="flex items-start gap-1.5"
        :class="rule.passed ? 'text-green-700' : 'text-slate-400'">
        <span class="mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border"
          :class="rule.passed ? 'border-green-700 bg-green-700 text-white' : 'border-slate-400'" aria-hidden="true">
          <Check v-if="rule.passed" :size="9" />
        </span>

        <span>
          {{ rule.label }}
          <span class="sr-only">
            {{ rule.passed ? 'ผ่านแล้ว' : 'ยังไม่ผ่าน' }}
          </span>
        </span>
      </li>
    </ul>

    <PasswordField id="confirm-password" v-model="form.confirmPassword"
      label="ยืนยันรหัสผ่านใหม่ (Confirm New Password)" placeholder="ระบุรหัสผ่านใหม่อีกครั้งเพื่อยืนยัน" required
      :error="errors.confirmPassword" @update:model-value="errors.confirmPassword = ''; emit('change')" />

    <template #submit-icon>
      <Check :size="15" aria-hidden="true" />
    </template>
  </BaseForm>
</template>