<script setup>
import { computed, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { ArrowLeft, ArrowRight, CircleCheck, Clock, Mail } from 'lucide-vue-next';
import BaseInput from '@/components/form/BaseInput.vue';
import { authApi } from '@/services/api';

const route = useRoute();
const token = computed(() => typeof route.query.token === 'string' ? route.query.token : '');
const status = ref('ready');
const email = ref('');
const busy = ref(false);
const message = ref('');
const error = ref('');
const heading = computed(() => {
    if (status.value === 'verified') return 'ยืนยันอีเมลสำเร็จ';
    if (status.value === 'expired') return 'ลิงก์ยืนยันใช้ไม่ได้';
    return token.value ? 'ยืนยันอีเมลของคุณ' : 'ขอลิงก์ยืนยันใหม่';
});
const buttonClass = 'flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f6d390] px-4 py-2 text-sm font-bold text-[#23311e] hover:bg-[#efc36c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#956b23] disabled:opacity-50';

async function verify() {
    busy.value = true;
    error.value = '';
    try {
        await authApi.verifyEmail({ token: token.value });
        status.value = 'verified';
    } catch (requestError) {
        if (requestError.response?.status === 400) {
            status.value = 'expired';
        } else {
            error.value = 'ยืนยันอีเมลไม่สำเร็จ กรุณาลองอีกครั้ง';
        }
    } finally {
        busy.value = false;
    }
}

async function resend() {
    busy.value = true;
    error.value = '';
    try {
        await authApi.resendVerification({ email: email.value.trim() });
        message.value = 'หากอีเมลนี้มีบัญชีที่รอยืนยัน ระบบจะส่งลิงก์ใหม่ให้';
    } catch {
        error.value = 'ส่งคำขอไม่สำเร็จ กรุณาลองอีกครั้ง';
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <section aria-labelledby="verification-title"
        class="w-full max-w-[400px] rounded-3xl border border-[#e9dfd0] bg-white p-6 shadow-[0_12px_40px_#23311e0d] sm:p-8">
        <header class="text-center" aria-live="polite">
            <div class="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border"
                :class="status === 'verified' || message
                    ? 'border-[#dce7cf] bg-[#eef4e6] text-[#436333]'
                    : 'border-[#f0dfb6] bg-[#fff5dc] text-[#8a5819]'"
                aria-hidden="true">
                <CircleCheck v-if="status === 'verified' || message" :size="26" />
                <Clock v-else-if="status === 'expired'" :size="26" />
                <Mail v-else :size="26" />
            </div>
            <h1 id="verification-title" class="text-2xl font-bold">{{ heading }}</h1>
            <p v-if="status === 'verified'" class="mt-2 text-sm leading-relaxed text-[#5a6553]">
                บัญชีพร้อมใช้งานแล้ว เข้าสู่ระบบเพื่อดำเนินการต่อได้เลย
            </p>
            <p v-else-if="message" class="mt-2 text-sm leading-relaxed text-[#5a6553]">{{ message }}</p>
            <p v-else-if="status === 'expired'" class="mt-2 text-sm leading-relaxed text-[#5a6553]">
                ลิงก์อาจหมดอายุหรือถูกใช้แล้ว กรอกอีเมลเดิมเพื่อขอลิงก์ใหม่
            </p>
            <p v-else-if="token" class="mt-2 text-sm leading-relaxed text-[#5a6553]">
                กดยืนยันเพื่อเปิดใช้งานบัญชีไข่พร้อม
            </p>
            <p v-else class="mt-2 text-sm leading-relaxed text-[#5a6553]">
                กรอกอีเมลที่ใช้สร้างบัญชีเพื่อรับลิงก์ใหม่
            </p>
        </header>

        <div class="mt-6 space-y-4">
            <RouterLink v-if="status === 'verified'" :to="{ name: 'login' }" :class="buttonClass">
                เข้าสู่ระบบ <ArrowRight :size="16" aria-hidden="true" />
            </RouterLink>
            <button v-else-if="token && status === 'ready'" type="button" :class="buttonClass"
                :disabled="busy" :aria-busy="busy" @click="verify">
                {{ busy ? 'กำลังยืนยัน…' : 'ยืนยันอีเมล' }}
                <ArrowRight v-if="!busy" :size="16" aria-hidden="true" />
            </button>
            <form v-else-if="!message" class="space-y-4" :aria-busy="busy" @submit.prevent="resend">
                <BaseInput id="verification-email" v-model="email" type="email" label="อีเมลที่ใช้สร้างบัญชี"
                    autocomplete="email" :maxlength="255" required />
                <button type="submit" :class="buttonClass" :disabled="busy">
                    {{ busy ? 'กำลังส่งคำขอ…' : 'ส่งอีเมลยืนยันอีกครั้ง' }}
                </button>
            </form>
            <p v-if="error" role="alert" class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{{ error }}</p>
        </div>

        <footer v-if="status !== 'verified'" class="mt-6 border-t border-[#eee6d9] pt-4 text-center">
            <RouterLink :to="{ name: 'login' }"
                class="inline-flex items-center gap-2 rounded text-xs font-semibold text-[#495840] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">
                <ArrowLeft :size="14" aria-hidden="true" /> กลับไปเข้าสู่ระบบ
            </RouterLink>
        </footer>
    </section>
</template>
