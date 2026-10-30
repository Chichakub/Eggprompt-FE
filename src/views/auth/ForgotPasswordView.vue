<script setup>
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { Mail, ChevronLeft } from 'lucide-vue-next';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm.vue';
import { authApi } from '@/services/api';

const statusMessage = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

async function submit(payload) {
  if (isSubmitting.value) return;

  statusMessage.value = '';
  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    const response = await authApi.forgotPassword(payload);

    statusMessage.value =
      response.data.message ||
      'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลที่ผูกกับบัญชีแล้ว';
  } catch (error) {
    if (error.response?.status === 404) {
      errorMessage.value =
        'ไม่พบชื่อผู้ใช้นี้ในระบบ กรุณาตรวจสอบชื่อผู้ใช้อีกครั้ง ระบบยังไม่ได้ส่งอีเมล';
    } else if ([400, 403, 429].includes(error.response?.status)) {
      errorMessage.value =
        error.response.data?.message ||
        'ไม่สามารถส่งลิงก์ได้ กรุณาติดต่อผู้ดูแลระบบ';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage.value =
        'รอการตอบกลับนานเกินไป กรุณาตรวจสอบอีเมลก่อนลองส่งอีกครั้ง';
    } else {
      errorMessage.value =
        'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้งภายหลัง';
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section aria-labelledby="forgot-password-title"
    class="w-full max-w-[360px] rounded-[18px] border border-[#e9e3d8] bg-white px-7 py-8 shadow-[0_8px_24px_rgb(35_49_30_/_5%)]">
    <div
      class="mx-auto flex h-11 w-11 items-center justify-center rounded-[13px] border border-[#ffe292] bg-[#fff5cb] text-[#e68b00]"
      aria-hidden="true">
      <Mail :size="22" />
    </div>
    <h1 id="forgot-password-title" class="mt-4 text-center text-xl font-bold">รีเซ็ตรหัสผ่าน</h1>
    <p class="mt-2 text-center text-[11px] leading-relaxed text-[#7d8378]">
      กรอกชื่อผู้ใช้ของคุณ เพื่อรับลิงก์สำหรับ<br />ตั้งรหัสผ่านใหม่ทางอีเมลที่ผูกกับบัญชี
    </p>
    <ForgotPasswordForm
  :loading="isSubmitting"
  @submit="submit"
/>
    <p v-if="errorMessage" role="alert" class="mt-3 text-[11px] leading-relaxed text-red-700">
      {{ errorMessage }}
    </p>
    <p v-if="statusMessage" role="status" class="mt-3 text-[11px] leading-relaxed text-[#758066]">{{ statusMessage }}
    </p>
    <div class="mt-5 border-t border-[#f1eee7] pt-4 text-center">
      <RouterLink to="/login"
        class="inline-flex min-h-8 items-center justify-center gap-1 text-[10px] text-[#758066] hover:underline focus-visible:outline-2 focus-visible:outline-[#a76a00]">
        <ChevronLeft :size="13" aria-hidden="true" />
        ยกเลิก และกลับสู่หน้าเข้าสู่ระบบ
      </RouterLink>
    </div>
  </section>
</template>
