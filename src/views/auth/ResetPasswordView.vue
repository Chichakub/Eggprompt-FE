<script setup>
import { ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { RotateCcwKey, ChevronLeft } from 'lucide-vue-next';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm.vue';
import { useModalStore } from '@/stores/modalStore';
import { authApi } from '@/services/api';

const statusMessage = ref('');
const modalStore = useModalStore();
const route = useRoute();
const errorMessage = ref('');
const isSubmitting = ref(false);

  async function submit(payload) {
    if (isSubmitting.value) return;

    errorMessage.value = '';
    statusMessage.value = '';

    const token = route.query.token;

    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      errorMessage.value =
        'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง กรุณาขอลิงก์ใหม่';
      return;
    }

    isSubmitting.value = true;

    try {
      await authApi.resetPassword({
        token,
        password: payload.password,
        confirmPassword: payload.confirmPassword,
      });

      modalStore.openSuccess({
        title: 'ตั้งรหัสผ่านสำเร็จ',
        message: 'เปลี่ยนรหัสผ่านใหม่แล้ว กรุณาเข้าสู่ระบบ',
        confirmText: 'ตกลง',
        confirmTo: '/login',
      });
    } catch (error) {
      if ([400, 403, 404, 410].includes(error.response?.status)) {
        errorMessage.value =
          error.response.data?.message ||
          'ลิงก์ไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage.value =
          'รอการตอบกลับนานเกินไป กรุณาลองเข้าสู่ระบบด้วยรหัสผ่านใหม่ก่อนขอลิงก์อีกครั้ง';
      } else {
        errorMessage.value =
          'ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่อีกครั้งภายหลัง';
      }
    } finally {
      isSubmitting.value = false;
    }
  }
</script>

<template>
  <section aria-labelledby="reset-password-title"
    class="w-full max-w-[400px] rounded-[18px] border border-[#e9e3d8] bg-white px-7 py-8 shadow-[0_8px_24px_rgb(35_49_30_/_5%)]">
    <div
      class="mx-auto flex h-11 w-11 items-center justify-center rounded-[13px] border border-[#ffe292] bg-[#fff8e6] text-[#e68b00]"
      aria-hidden="true">
      <RotateCcwKey :size="22" />
    </div>
    <h1 id="reset-password-title" class="mt-4 text-center text-xl font-bold">ตั้งค่ารหัสผ่านใหม่</h1>
    <p class="mt-2 text-center text-[11px] leading-relaxed text-[#7d8378]">
      กรุณากำหนดรหัสผ่านใหม่สำหรับบัญชีของคุณ<br />เพื่อความปลอดภัยในการเข้าใช้งานระบบ
    </p>
    <ResetPasswordForm :loading="isSubmitting" @submit="submit" @change="errorMessage = ''; statusMessage = ''" />
    <p v-if="errorMessage" role="alert" class="mt-3 text-[11px] leading-relaxed text-red-700">
      {{ errorMessage }}
    </p>
    <p v-if="statusMessage" role="status" class="mt-3 text-[11px] leading-relaxed text-[#758066]">{{ statusMessage }}
    </p>
    <div class="mt-5 text-center">
      <RouterLink to="/login"
        class="inline-flex min-h-8 items-center justify-center gap-1 text-[10px] text-[#758066] hover:underline focus-visible:outline-2 focus-visible:outline-[#a76a00]">
        <ChevronLeft :size="13" aria-hidden="true" />
        ยกเลิก และกลับสู่หน้าเข้าสู่ระบบ
      </RouterLink>
    </div>
  </section>
</template>
