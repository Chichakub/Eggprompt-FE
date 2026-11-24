<script setup>
import { reactive, ref, nextTick } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
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

import { registrationError, usernamePattern, usernameHelp } from '@/composables/registrationRules';
const router=useRouter();
const policyDialog=ref(null),policyType=ref('terms');
async function openPolicy(type){policyType.value=type;await nextTick();policyDialog.value.showModal();}
const modalStore = useModalStore();

const form = reactive({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    accepted: false,
});

const showPassword = ref(false);
const showConfirmPassword=ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);

async function submit() {
    if (isSubmitting.value) return;

    errorMessage.value = '';

    errorMessage.value=registrationError(form);
    if(errorMessage.value)return;

    isSubmitting.value = true;

    try {
        await authApi.register({
            username: form.username.trim(),
            password: form.password,
            email: form.email.trim(),
            accepted: form.accepted,
        });

        // Keep email out of the URL and never persist either password.
        sessionStorage.setItem('registrationEmail', form.email.trim());
        form.password='';form.confirmPassword='';
        await router.push({name:'verify-email',query:{registered:'1'}});
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
            กรอกข้อมูลเพื่อเริ่มต้นใช้งาน
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

        <form class="mt-3 space-y-3" novalidate @submit.prevent="submit">
            <!-- ชื่อผู้ใช้ -->
            <div>
                <label for="username" class="field-label">
                    <UserRound :size="11" aria-hidden="true" />
                    ชื่อผู้ใช้ (Username)
                </label>

                <input id="username" v-model="form.username" name="username" type="text" autocomplete="username"
                    placeholder="somchai_owner" :pattern="usernamePattern" minlength="4" maxlength="24" aria-describedby="username-help" required class="field-input" />
                <p id="username-help" class="field-hint" :title="usernameHelp">ชื่อผู้ใช้ 4–24 ตัว เช่น somchai_owner</p>
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


            </div>

            <p id="password-help" class="sr-only">รหัสผ่านอย่างน้อย 8 ตัวอักษร และไม่เกิน 72 ไบต์</p>
            <div>
                <label for="confirm-password" class="field-label"><KeyRound :size="11" aria-hidden="true" />ยืนยันรหัสผ่าน</label>
                <div class="relative">
                    <input id="confirm-password" v-model="form.confirmPassword" :type="showConfirmPassword?'text':'password'" autocomplete="new-password" required class="field-input password-input" placeholder="กรอกรหัสผ่านอีกครั้ง" aria-describedby="confirm-password-help" />
                    <button type="button" :aria-label="showConfirmPassword?'ซ่อนรหัสผ่านยืนยัน':'แสดงรหัสผ่านยืนยัน'" :aria-pressed="showConfirmPassword" class="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-lg text-[#23311e]" @click="showConfirmPassword=!showConfirmPassword"><Eye v-if="showConfirmPassword" :size="17" /><EyeOff v-else :size="17" /></button>
                </div>
                <p v-if="form.confirmPassword" id="confirm-password-help" class="field-hint" :class="form.password===form.confirmPassword?'text-green-700':'text-red-700'" aria-live="polite">{{ form.password===form.confirmPassword?'รหัสผ่านตรงกัน':'รหัสผ่านทั้งสองช่องยังไม่ตรงกัน' }}</p>
            </div>
            <!-- อีเมล -->
            <div>
                <label for="email" class="field-label">
                    <Mail :size="11" aria-hidden="true" />
                    อีเมล (Email Address)
                </label>

                <input id="email" v-model="form.email" name="email" type="email" autocomplete="email"
                    placeholder="somchaieggfarm@gmail.com" maxlength="255" required class="field-input" />
            </div>

            <div class="registration-consent">
                <input id="accepted" v-model="form.accepted" name="accepted" type="checkbox" required class="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#2864eb]" />
                <div><label for="accepted">ฉันยอมรับ</label> <button type="button" class="policy-link" @click="openPolicy('terms')">เงื่อนไขการใช้งาน</button> และ <button type="button" class="policy-link" @click="openPolicy('privacy')">นโยบายความเป็นส่วนตัว</button></div>
            </div>

            <p v-if="errorMessage" role="alert" class="text-[10px] text-red-700">
                {{ errorMessage }}
            </p>

            <p class="registration-note">สมัครเป็น Farm Admin · ต้องยืนยันอีเมลก่อนเข้าสู่ระบบ</p>
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
    <Teleport to="body"><dialog ref="policyDialog" aria-labelledby="registration-policy-title" class="registration-policy">
        <h2 id="registration-policy-title">{{ policyType==='terms'?'เงื่อนไขการใช้งาน':'นโยบายความเป็นส่วนตัว' }}</h2>
        <template v-if="policyType==='terms'"><p>การสมัครด้วยตนเองเป็นการสร้างบัญชี Farm Admin สำหรับดูแลฟาร์ม ผู้ใช้ต้องยืนยันอีเมลก่อนเข้าสู่ระบบ</p><p>กรอกข้อมูลบัญชีและฟาร์มให้ถูกต้อง ใช้งานตามสิทธิ์ที่ได้รับ และเก็บรหัสผ่านกับลิงก์ยืนยันเป็นส่วนตัว ไม่ใช้บัญชีเพื่อเข้าถึงข้อมูลฟาร์มที่ตนไม่มีสิทธิ์</p><p>ตั้งค่าฟาร์ม โรงเรือน และฝูงไก่ให้ครบก่อนเริ่มใช้งาน</p></template>
        <template v-else><p>ระบบใช้ชื่อผู้ใช้ อีเมล และรหัสผ่านเพื่อสร้างบัญชี ยืนยันอีเมล เข้าสู่ระบบ และกู้คืนการเข้าถึงบัญชี โดยจัดเก็บรหัสผ่านเป็นค่าแฮช</p><p>ข้อมูลบัญชีและข้อมูลการดำเนินงานฟาร์มจัดเก็บในฐานข้อมูลของโครงการ ผู้ดูแลระบบและผู้ดูแลฟาร์มเข้าถึงข้อมูลตามสิทธิ์ของตน ระบบส่งอีเมลยืนยันและกู้คืนบัญชีผ่านบริการอีเมลที่โครงการตั้งค่าไว้</p><p>เมื่อเลือกคงสถานะล็อกอิน ระบบจะเก็บ token ในเบราว์เซอร์จนกว่าจะหมดอายุหรือออกจากระบบ หากต้องการแก้ไขข้อมูลบัญชีหรือสอบถามการใช้ข้อมูล ให้ติดต่อผู้ดูแลโครงการ</p></template>
        <button type="button" @click="policyDialog.close()">ปิด</button>
    </dialog></Teleport>
</template>

<style scoped>
.field-hint{margin-top:5px;font-size:9px;font-weight:400;line-height:1.5;color:#8b8580}.registration-consent{display:flex;align-items:flex-start;gap:8px;padding-top:10px;font-size:8px;line-height:1.8;color:#68615b}.policy-link{display:inline;padding:0;border:0;background:none;color:#be5a08;font:inherit;font-weight:600;cursor:pointer}.policy-link:hover{text-decoration:underline}.policy-link:focus-visible{outline:2px solid #a76a00;outline-offset:3px;border-radius:2px}.registration-note{font-size:9px;font-weight:400;line-height:1.6;text-align:center;color:#8b8580}

.registration-policy{position:fixed;inset:0;margin:auto;width:520px;max-width:calc(100vw - 32px);max-height:calc(100dvh - 40px);overflow:auto;padding:28px;border:1px solid #e9dfd0;border-radius:20px;background:#fffdfa;color:#293823;box-sizing:border-box}.registration-policy::backdrop{background:#29382366}.registration-policy h2{font-size:20px;font-weight:700;margin-bottom:18px}.registration-policy p{text-wrap:pretty;font-size:14px;line-height:1.8;margin-bottom:14px}.registration-policy button{display:block;min-height:44px;padding:10px 30px;background:#f6d390;border-radius:10px;margin:24px auto 0;font-weight:700}

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