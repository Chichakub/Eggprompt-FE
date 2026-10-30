<script setup>
import { reactive, ref } from 'vue';
import { RouterLink, useRouter, useRoute } from 'vue-router';
import { UserRound, KeyRound, Eye, EyeOff, LogIn } from 'lucide-vue-next';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { defaultPathFor } from '@/constants/roles';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const form = reactive({ username: '', password: '', remember: false });
const showPassword = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);

const ERROR_BY_STATUS = {
    400: 'กรุณากรอกข้อมูลให้ครบถ้วน',
    401: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    403: 'บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
};

async function submit() {
    if (isSubmitting.value) return;
    errorMessage.value = '';

    if (!form.username.trim()) {
        errorMessage.value = 'กรุณากรอกชื่อผู้ใช้';
        return;
    }
    if (!form.password) {
        errorMessage.value = 'กรุณากรอกรหัสผ่าน';
        return;
    }

    isSubmitting.value = true;
    try {
        const res = await authApi.login({
            username: form.username.trim(),
            password: form.password,
        });
        const data = res.data;

        // เรียกใช้ setLoginSession ร่วมกับค่า Checkbox remember
        auth.setLoginSession(
            {
                token: data.accessToken,
                user: {
                    user_id: data.user.userId,
                    username: data.user.username,
                    user_role: data.user.role,
                    farm_id: data.user.farmId,
                },
            },
            form.remember
        );

       const targetPath = auth.isFarmSetupRequired
    ? '/farm/info'
    : route.query.redirect || defaultPathFor(data.user.role);
    router.push(targetPath);
    } catch (err) {
        errorMessage.value = err.response
            ? (ERROR_BY_STATUS[err.response.status] ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
            : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
    } finally {
        isSubmitting.value = false;
    }
}
</script>

<template>
    <section aria-labelledby="login-title" class="w-full max-w-[334px] rounded-[18px] bg-white px-[26px] py-7">
        <h1 id="login-title" class="text-[23px] font-bold leading-tight text-[#23311e]">
            เข้าสู่ระบบ
        </h1>

        <p class="mt-1 text-[10px] text-[#8b8580]">
            กรอกชื่อผู้ใช้และรหัสผ่าน
        </p>

        <nav aria-label="บัญชีผู้ใช้งาน" class="mt-4 grid grid-cols-2 rounded-xl bg-[#f5f5f4] p-1 text-center text-[10px]">
            <RouterLink to="/login" aria-current="page"
                class="rounded-lg bg-white px-1 py-1.5 font-semibold text-[#242424] shadow-sm">
                เข้าสู่ระบบ (Log In)
            </RouterLink>
            <RouterLink to="/register" class="rounded-lg px-1 py-1.5 text-[#78736e] hover:text-[#23311e]">
                ลงทะเบียน (Register)
            </RouterLink>
        </nav>

        <form class="mt-3 space-y-3" @submit.prevent="submit">
            <div>
                <label for="username" class="field-label">
                    <UserRound :size="11" aria-hidden="true" />
                    ชื่อผู้ใช้ (Username)
                </label>
                <input id="username" v-model="form.username" name="username" type="text"
                    autocomplete="username" placeholder="somchai_owner" maxlength="100" class="field-input" />
            </div>

            <div>
                <label for="password" class="field-label">
                    <KeyRound :size="11" aria-hidden="true" />
                    รหัสผ่าน (Password)
                </label>
                <div class="relative">
                    <input id="password" v-model="form.password" name="password"
                        :type="showPassword ? 'text' : 'password'" autocomplete="current-password"
                        placeholder="กรอกรหัสผ่าน" class="field-input password-input" />
                    <button type="button" :aria-label="showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
                        :aria-pressed="showPassword"
                        class="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-lg text-[#23311e] focus-visible:outline-2 focus-visible:outline-[#a76a00]"
                        @click="showPassword = !showPassword">
                        <Eye v-if="showPassword" :size="17" aria-hidden="true" />
                        <EyeOff v-else :size="17" aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div class="flex items-center justify-between pt-1 text-[9px] text-[#68615b]">
                <label for="remember" class="flex cursor-pointer items-center gap-1.5">
                    <input id="remember" v-model="form.remember" type="checkbox"
                        class="h-3.5 w-3.5 accent-[#2864eb]" />
                    จดจำบัญชี
                </label>
                <button type="button" class="hover:underline">ลืมรหัสผ่าน?</button>
            </div>

            <p v-if="errorMessage" role="alert" class="text-[10px] text-red-700">
                {{ errorMessage }}
            </p>

            <button type="submit" :disabled="isSubmitting" :aria-busy="isSubmitting"
                class="flex min-h-9 w-full items-center justify-center gap-2 rounded-[9px] bg-[#f6d390] px-2 py-2 text-[10px] font-semibold text-[#23311e] transition hover:bg-[#efc36c] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[#a76a00]">
                <LogIn v-if="!isSubmitting" :size="13" aria-hidden="true" />
                {{ isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
            </button>
        </form>
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