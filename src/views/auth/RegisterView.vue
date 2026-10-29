<script setup>
import { reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
    UserRound,
    KeyRound,
    Mail,
    Eye,
    EyeOff,
    ArrowRight,
} from 'lucide-vue-next';
import { useModalStore } from '@/stores/modalStore';
import { authApi } from '@/services/api';

const modalStore = useModalStore();

const form = reactive({
    username: '',
    password: '',
    email: '',
    accepted: false,
});

const showPassword = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);

async function submit() {
    if (isSubmitting.value) return;

    errorMessage.value = '';

    if (!form.username.trim()) {
        errorMessage.value = 'กรุณากรอกชื่อผู้ใช้';
        return;
    }

    if (form.password.length < 8) {
        errorMessage.value = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
        return;
    }

    if (!form.email.trim()) {
        errorMessage.value = 'กรุณากรอกอีเมล';
        return;
    }

    if (!form.accepted) {
        errorMessage.value = 'กรุณายอมรับเงื่อนไขการใช้งาน';
        return;
    }

    isSubmitting.value = true;

    try {
        await authApi.register({
            username: form.username.trim(),
            password: form.password,
            email: form.email.trim(),
            accepted: form.accepted,
        });

        // ===== กรณีสำเร็จ =====
        modalStore.openSuccess({
            title: 'ลงทะเบียนสำเร็จ',
            message: 'กรุณาเข้าสู่ระบบเพื่อตั้งค่าฟาร์มและเริ่มต้นใช้งาน',
            confirmText: 'เข้าสู่ระบบ',
            confirmTo: '/login',
        });
    } catch (error) {
        // ===== กรณีไม่สำเร็จ =====
        let message = 'ไม่สามารถลงทะเบียนได้ กรุณาลองอีกครั้ง';

        const status = error.response?.status;
        const backendMessage = error.response?.data?.message;

        if (error.code === 'ECONNABORTED') {
            message = 'เซิร์ฟเวอร์ตอบกลับช้า บัญชีอาจถูกสร้างแล้ว กรุณาลองเข้าสู่ระบบก่อนสมัครซ้ำ';
        } else if (!error.response) {
            message = 'การเชื่อมต่อขัดข้อง กรุณาตรวจสอบก่อนลองอีกครั้ง';
        } else if (
            (status === 400 || status === 409) &&
            typeof backendMessage === 'string' &&
            backendMessage
        ) {
            message = backendMessage;
        }

        modalStore.openError({
            title: 'ลงทะเบียนไม่สำเร็จ',
            message,
            confirmText: 'ลองอีกครั้ง',
        });
    } finally {
        isSubmitting.value = false;
    }
}
</script>

<template>
    <section aria-labelledby="register-title" class="w-full max-w-[334px] rounded-[18px] bg-white px-[26px] py-7">
        <h1 id="register-title" class="text-[23px] font-bold leading-tight text-[#23311e]">
            ลงทะเบียน
        </h1>

        <p class="mt-1 text-[10px] text-[#8b8580]">
            กรอกข้อมูลฟาร์มเพื่อเริ่มต้นใช้งาน
        </p>

        <!-- สลับหน้า Login / Register -->
        <nav aria-label="บัญชีผู้ใช้งาน" class="mt-4 grid grid-cols-2 rounded-xl bg-[#f5f5f4] p-1
             text-center text-[10px]">
            <RouterLink to="/login" class="rounded-lg px-1 py-1.5 text-[#78736e]
               hover:text-[#23311e]">
                เข้าสู่ระบบ (Log In)
            </RouterLink>

            <RouterLink to="/register" aria-current="page" class="rounded-lg bg-white px-1 py-1.5
               font-semibold text-[#242424] shadow-sm">
                ลงทะเบียน (Register)
            </RouterLink>
        </nav>

        <form class="mt-3 space-y-3" @submit.prevent="submit">
            <!-- ชื่อผู้ใช้ -->
            <div>
                <label for="username" class="field-label">
                    <UserRound :size="11" aria-hidden="true" />
                    ชื่อผู้ใช้ (Username)
                </label>

                <input id="username" v-model="form.username" name="username" type="text" autocomplete="username"
                    placeholder="somchai_owner" maxlength="100" required class="field-input" />
            </div>

            <!-- รหัสผ่าน -->
            <div>
                <label for="password" class="field-label">
                    <KeyRound :size="11" aria-hidden="true" />
                    รหัสผ่าน (Password)
                </label>

                <div class="relative">
                    <input id="password" v-model="form.password" name="password"
                        :type="showPassword ? 'text' : 'password'" autocomplete="new-password"
                        placeholder="อย่างน้อย 8 ตัวอักษร" minlength="8" required aria-describedby="password-help"
                        class="field-input password-input" />

                    <button type="button" :aria-label="showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
                        :aria-pressed="showPassword" class="absolute inset-y-0 right-0 flex w-10
                   items-center justify-center rounded-lg
                   text-[#23311e] focus-visible:outline-2
                   focus-visible:outline-[#a76a00]" @click="showPassword = !showPassword">
                        <Eye v-if="showPassword" :size="17" aria-hidden="true" />
                        <EyeOff v-else :size="17" aria-hidden="true" />
                    </button>
                </div>

                <span id="password-help" class="sr-only">
                    รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
                </span>
            </div>

            <!-- อีเมล -->
            <div>
                <label for="email" class="field-label">
                    <Mail :size="11" aria-hidden="true" />
                    อีเมล (Email Address)
                </label>

                <input id="email" v-model="form.email" name="email" type="email" autocomplete="email"
                    placeholder="somchaieggfarm@gmail.com" required class="field-input" />
            </div>

            <!-- ยอมรับเงื่อนไข -->
            <label for="accepted" class="flex cursor-pointer items-start gap-2 pt-3
               text-[8px] leading-relaxed text-[#68615b]">
                <input id="accepted" v-model="form.accepted" name="accepted" type="checkbox" required
                    class="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#2864eb]" />

                <span>
                    ฉันยอมรับ
                    <span class="font-medium text-[#be5a08]">
                        เงื่อนไขการใช้งาน
                    </span>
                    และ
                    <span class="font-medium text-[#be5a08]">
                        นโยบายความเป็นส่วนตัว
                    </span>
                </span>
            </label>

            <p v-if="errorMessage" role="alert" class="text-[10px] text-red-700">
                {{ errorMessage }}
            </p>

            <!-- ลงทะเบียน -->
            <button type="submit" :disabled="isSubmitting" :aria-busy="isSubmitting" class="flex min-h-9 w-full items-center justify-center
         gap-2 rounded-[9px] bg-[#f6d390] px-2 py-2
         text-[10px] font-semibold text-[#23311e]
         transition hover:bg-[#efc36c]
         disabled:cursor-wait disabled:opacity-60
         focus-visible:outline-2 focus-visible:outline-offset-2
         focus-visible:outline-[#a76a00]">
                {{ isSubmitting ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนเปิดบัญชีฟาร์ม' }}

                <ArrowRight v-if="!isSubmitting" :size="13" aria-hidden="true" />
            </button>
        </form>

        <p class="mt-4 border-t border-[#f5f5f4] pt-3
             text-center text-[8px] text-[#8b8580]">
            มีบัญชีอยู่แล้ว?
            <RouterLink to="/login" class="ml-1 font-semibold text-[#23311e] hover:underline">
                เข้าสู่ระบบ
            </RouterLink>
        </p>
    </section>
</template>

<style scoped>
.field-label {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 6px;
    color: #23311e;
    font-size: 9px;
    font-weight: 500;
}

.field-input {
    width: 100%;
    min-height: 34px;
    padding: 8px 11px;
    border: 1px solid #e9dfd0;
    border-radius: 9px;
    background: #fffdfa;
    color: #23311e;
    font-size: 10px;
    outline: none;
}

.password-input {
    padding-right: 42px;
}

.field-input::placeholder {
    color: #787b71;
}

.field-input:focus {
    border-color: #8b9a74;
    box-shadow: 0 0 0 3px rgb(139 154 116 / 15%);
}
</style>