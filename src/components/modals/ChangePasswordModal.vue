<script setup>
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import { Check, KeyRound, X } from "lucide-vue-next";
import BaseButton from "@/components/form/BaseButton.vue";
import PasswordField from "@/components/form/PasswordField.vue";
import { authApi } from "@/services/api";
import { useModalStore } from "@/stores/modalStore";

const emit = defineEmits(["close"]);
const modalStore = useModalStore();

const dialog = ref(null);
const loading = ref(false);
const apiError = ref("");

const form = reactive({
  currentPassword: "",
  password: "",
  confirmPassword: "",
});

const errors = reactive({
  currentPassword: "",
  password: "",
  confirmPassword: "",
});

const rules = computed(() => [
  {
    label: "มีความยาวอย่างน้อย 8 ตัวอักษร",
    passed: form.password.length >= 8,
  },
  {
    label: "มีตัวพิมพ์ใหญ่และตัวพิมพ์เล็ก (A-Z, a-z)",
    passed: /[A-Z]/.test(form.password) && /[a-z]/.test(form.password),
  },
  {
    label: "มีตัวเลขอย่างน้อย 1 ตัว (0-9)",
    passed: /[0-9]/.test(form.password),
  },
  {
    label: "มีอักขระพิเศษอย่างน้อย 1 ตัว",
    passed: /[!-/:-@[-`{-~]/.test(form.password),
  },
]);

onMounted(() => {
  dialog.value?.showModal();
});

function close() {
  if (loading.value) return;

  emit("close");
}

function clearError(field) {
  errors[field] = "";
  apiError.value = "";

  if (field === "password") {
    errors.confirmPassword = "";
  }
}

async function submit() {
  if (loading.value) return;

  apiError.value = "";
  errors.currentPassword = "";
  errors.password = "";
  errors.confirmPassword = "";

  if (!form.currentPassword.trim()) {
    errors.currentPassword = "กรุณากรอกรหัสผ่านเดิม";
  } else if (new TextEncoder().encode(form.currentPassword).length > 72) {
    errors.currentPassword = "รหัสผ่านเดิมต้องไม่เกิน 72 bytes";
  }

  if (!form.password) {
    errors.password = "กรุณากรอกรหัสผ่านใหม่";
  } else if (!rules.value.every((rule) => rule.passed)) {
    errors.password = "รหัสผ่านยังไม่ผ่านเงื่อนไขทั้งหมด";
  } else if (new TextEncoder().encode(form.password).length > 72) {
    errors.password = "รหัสผ่านใหม่ต้องมีความยาวไม่เกิน 72 bytes";
  } else if (form.password === form.currentPassword) {
    errors.password = "รหัสผ่านใหม่ต้องต่างจากรหัสผ่านเดิม";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "กรุณายืนยันรหัสผ่านใหม่";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "รหัสผ่านทั้งสองช่องไม่ตรงกัน";
  }

  if (Object.values(errors).some(Boolean)) return;

  loading.value = true;

  try {
    await authApi.changePassword({
      currentPassword: form.currentPassword,
      password: form.password,
      confirmPassword: form.confirmPassword,
    });
  } catch (err) {
    const message = err.response?.data?.message;

    if (err.response?.status === 400 && message === "รหัสผ่านเดิมไม่ถูกต้อง") {
      errors.currentPassword = message;
    } else {
      apiError.value =
        message || "ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง";
    }

    return;
  } finally {
    loading.value = false;
  }

  // ทำงานเฉพาะเมื่อ API เปลี่ยนรหัสผ่านสำเร็จ
  emit("close");
  await nextTick();

  modalStore.openSuccess({
    title: "เปลี่ยนรหัสสำเร็จ",
    message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
    confirmText: "ตกลง",
  });
}
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      aria-labelledby="change-password-title"
      class="fixed inset-0 m-auto max-h-[calc(100dvh_-_32px)] w-[calc(100%_-_32px)] max-w-[400px] overflow-y-auto rounded-[18px] border border-[#e9dfd0] bg-white px-5 pb-8 pt-6 text-[#243319] backdrop:bg-[#f7f2e7]/60"
      @cancel.prevent="close"
    >
      <h2
        id="change-password-title"
        class="mb-6 flex items-center gap-2 text-sm font-bold"
      >
        <KeyRound :size="16" aria-hidden="true" />
        เปลี่ยนรหัสผ่าน
      </h2>

      <form novalidate :aria-busy="loading" @submit.prevent="submit">
        <fieldset
          :disabled="loading"
          class="m-0 min-w-0 space-y-5 border-0 p-0"
        >
          <PasswordField
            id="change-current-password"
            v-model="form.currentPassword"
            label="รหัสผ่านเดิม (Current Password)"
            placeholder="ระบุรหัสผ่านเดิม"
            autocomplete="current-password"
            required
            :error="errors.currentPassword"
            @update:model-value="clearError('currentPassword')"
          />

          <PasswordField
            id="change-new-password"
            v-model="form.password"
            label="รหัสผ่านใหม่ (New Password)"
            placeholder="ระบุรหัสผ่านใหม่"
            autocomplete="new-password"
            required
            :error="errors.password"
            @update:model-value="clearError('password')"
          />

          <ul
            class="grid grid-cols-1 gap-2 text-[10px] sm:grid-cols-2"
            aria-label="เงื่อนไขรหัสผ่านใหม่"
          >
            <li
              v-for="rule in rules"
              :key="rule.label"
              class="flex items-start gap-1.5"
              :class="rule.passed ? 'text-green-700' : 'text-slate-400'"
            >
              <span
                class="mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border"
                :class="
                  rule.passed
                    ? 'border-green-700 bg-green-700 text-white'
                    : 'border-slate-400'
                "
                aria-hidden="true"
              >
                <Check v-if="rule.passed" :size="9" />
              </span>

              <span>
                {{ rule.label }}
                <span class="sr-only">
                  {{ rule.passed ? "ผ่านแล้ว" : "ยังไม่ผ่าน" }}
                </span>
              </span>
            </li>
          </ul>

          <PasswordField
            id="change-confirm-password"
            v-model="form.confirmPassword"
            label="ยืนยันรหัสผ่านใหม่ (Confirm New Password)"
            placeholder="ระบุรหัสผ่านใหม่อีกครั้งเพื่อยืนยัน"
            autocomplete="new-password"
            required
            :error="errors.confirmPassword"
            @update:model-value="clearError('confirmPassword')"
          />
        </fieldset>

        <p
          v-if="apiError"
          role="alert"
          class="mt-3 text-[11px] leading-relaxed text-red-700"
        >
          {{ apiError }}
        </p>

        <div class="mt-7 flex items-center justify-between gap-4">
          <BaseButton variant="secondary" :disabled="loading" @click="close">
            <template #icon>
              <X :size="14" aria-hidden="true" />
            </template>

            ยกเลิก
          </BaseButton>

          <BaseButton
            type="submit"
            :loading="loading"
            loading-text="กำลังบันทึก..."
          >
            <template #icon>
              <Check :size="14" aria-hidden="true" />
            </template>

            ยืนยัน
          </BaseButton>
        </div>
      </form>
    </dialog>
  </Teleport>
</template>
