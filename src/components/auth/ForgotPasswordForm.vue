<script setup>
import { ref } from 'vue';
import { UserRound, Info, Send } from 'lucide-vue-next';
import BaseForm from '@/components/form/BaseForm.vue';
import BaseInput from '@/components/form/BaseInput.vue';

const emit = defineEmits(['submit']);
const username = ref('');
const errorMessage = ref('');

function submit() {
  errorMessage.value = '';

  const value = username.value.trim();

  if (!value) {
    errorMessage.value = 'กรุณากรอกชื่อผู้ใช้';
    return;
  }

  emit('submit', { username: value });
}
defineProps({
  loading: { type: Boolean, default: false },
});
</script>

<template>
  <BaseForm submit-text="ส่งลิงก์รีเซ็ตรหัสผ่าน" loading-text="กำลังส่งลิงก์..." :loading="loading" @submit="submit">
    <BaseInput id="recovery-username" v-model="username" label="ชื่อผู้ใช้ (Username)" placeholder="เช่น somchai_owner"
      autocomplete="username" :error="errorMessage" required @update:model-value="errorMessage = ''">
      <template #icon>
        <UserRound :size="16" />
      </template>
    </BaseInput>

    <div
      class="flex items-start gap-2 rounded-lg border border-[#eee5d1] bg-[#fcf8ed] p-3 text-[10px] leading-relaxed text-[#758066]">
      <Info :size="14" class="mt-0.5 shrink-0 text-[#d88b10]" aria-hidden="true" />
      <p>
        ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลที่ผูกกับบัญชี Farm Admin
        หากบัญชีไม่มีอีเมล กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน
      </p>
    </div>

    <template #submit-icon>
      <Send :size="14" aria-hidden="true" />
    </template>
  </BaseForm>
</template>