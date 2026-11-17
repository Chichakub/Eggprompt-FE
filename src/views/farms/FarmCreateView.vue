<script setup>
import { isValidFormDate } from "@/composables/dateValidation";
import { nextTick, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Check, Plus, X } from "lucide-vue-next";
import BaseButton from "@/components/form/BaseButton.vue";
import BaseInput from "@/components/form/BaseInput.vue";
import FarmAccountFields from "@/components/farm/FarmAccountFields.vue";
import { FARM_ADMIN } from "@/constants/roles";

import { useAuthStore } from "@/stores/authStore";
import { adminFarmApi, authApi, farmApi } from "@/services/api";

import ConfirmModal from "@/components/modals/ConfirmModal.vue";

const props = defineProps({
  editExisting: { type: Boolean, default: false },
  saveOnly: { type: Boolean, default: false },
  farmId: { type: String, default: "" },
});
const emit = defineEmits(["saved", "cancel"]);
const loadingFarm = ref(false);
const farmLoadFailed = ref(false);
const router = useRouter();
const auth = useAuthStore();
const errorMessage = ref("");
const showPauseModal = ref(false);
const isLoggingOut = ref(false);
const isSubmitting = ref(false);
const createdFarmId = ref("");
const farmErrors = reactive({});

const fields = [
  {
    name: "farmName",
    label: "ชื่อฟาร์ม",
    maxlength: 255,
    placeholder: "เช่น ไข่ไก่วิโชค สมุทรสาคร",
  },
  {
    name: "address",
    label: "ที่อยู่",
    maxlength: 1000,
    placeholder: "เช่น เลขที่ หมู่ ซอย ถนน ตำบล อำเภอ จังหวัด และรหัสไปรษณีย์",
  },
  {
    name: "farmRegistrationNumber",
    label: "เลขทะเบียนฟาร์ม",
    maxlength: 100,
    placeholder: "เช่น 13-1-68-00124-5",
  },
  {
    name: "taxId",
    label: "เลขประจำตัวผู้เสียภาษี",
    maxlength: 20,
    placeholder: "เช่น 1723334444XXX",
  },
  {
    name: "operationStartDate",
    label: "วันที่เริ่มดำเนินการ",
    type: "date",
  },
  {
    name: "ownerName",
    label: "ชื่อ - สกุล เจ้าของฟาร์ม",
    maxlength: 255,
    placeholder: "เช่น คุณทวี สุวรรณภูมิ",
  },
  {
    name: "contactPhone",
    label: "เบอร์โทรศัพท์ติดต่อ",
    type: "tel",
    maxlength: 20,
    placeholder: "เช่น 08X-XXX-XXXX",
  },
];

const farm = reactive(
  Object.fromEntries(fields.map(({ name }) => [name, ""])),
);

const accounts = ref([]);
let nextAccountId = 1;

function cancelSetup() {
  if (props.saveOnly) {
    emit("cancel");
    return;
  }
  if (auth.isFarmAdmin) {
    showPauseModal.value = true;
  } else {
    router.push({ name: "all-farms" });
  }
}

async function pauseSetup() {
  if (isLoggingOut.value) return;
  isLoggingOut.value = true;
  try {
    await auth.logout();
    await router.replace({ name: "login" });
  } finally {
    isLoggingOut.value = false;
    showPauseModal.value = false;
  }
}

function isEmptyAccount(details) {
  return !details.role && !details.username.trim() && !details.temporaryPassword;
}

function clearError() {
  errorMessage.value = "";
}

function addAccount() {
  accounts.value.push({
    id: nextAccountId++,
    errors: {},
    details: {
      role: "",
      username: "",
      temporaryPassword: "",
    },
  });
  clearError();
}

function removeAccount(id) {
  accounts.value = accounts.value.filter((account) => account.id !== id);
  clearError();
}

async function submit(event) {
  if (isSubmitting.value || loadingFarm.value || farmLoadFailed.value) return;
  const form = event.currentTarget;
  clearError();

  if (createdFarmId.value) {
    await openHouseStep();
    return;
  }

  for (const field of fields) {
    farmErrors[field.name] = farm[field.name].trim()
      ? ""
      : `กรุณาระบุ${field.label}`;
  }

  if (!farmErrors.operationStartDate && !isValidFormDate(farm.operationStartDate)) {
    farmErrors.operationStartDate = "กรุณาระบุวันที่ให้ถูกต้อง โดยใช้ปี ค.ศ. 4 หลัก เช่น 2026";
  }

  if (!farmErrors.taxId && !/^[0-9]{13}$/.test(farm.taxId.trim())) {
    farmErrors.taxId = "กรุณากรอกเลขประจำตัวผู้เสียภาษีเป็นตัวเลข 13 หลัก";
  }

  if (!farmErrors.contactPhone && !/^0[0-9]{8,9}$/.test(farm.contactPhone.trim().replace(/[ -]/g, ""))) {
    farmErrors.contactPhone = "กรุณากรอกเบอร์โทรศัพท์ไทย 9–10 หลัก เช่น 081-234-5678";
  }

  const usernames = new Set();
  for (const { details, errors } of accounts.value) {
    if (auth.isFarmAdmin && isEmptyAccount(details)) {
      errors.role = "";
      errors.username = "";
      errors.temporaryPassword = "";
      continue;
    }
    const username = details.username.trim();
    const password = details.temporaryPassword;

    errors.role = details.role ? "" : "กรุณาเลือกสิทธิ์ผู้ใช้";
    errors.username = "";
    errors.temporaryPassword = "";

    if (!username) {
      errors.username = "กรุณากรอกชื่อผู้ใช้";
    } else if (!/^[A-Za-z0-9._-]{4,24}$/.test(username)) {
      errors.username =
        "ชื่อผู้ใช้ต้องมี 4–24 ตัว ใช้ตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง";
    }

    if (!errors.username) {
      if (usernames.has(username)) {
        errors.username = "ชื่อผู้ใช้นี้ซ้ำกับบัญชีในฟอร์ม";
      }
      usernames.add(username);
    }

    if (!password) {
      errors.temporaryPassword = "กรุณากรอกรหัสผ่านเริ่มต้น";
    } else if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[!-/:-@[-`{-~]/.test(password)
    ) {
      errors.temporaryPassword = "รหัสผ่านเริ่มต้นยังไม่ผ่านเงื่อนไข";
    } else if (new TextEncoder().encode(password).length > 72) {
      errors.temporaryPassword = "รหัสผ่านเริ่มต้นต้องยาวไม่เกิน 72 ไบต์";
    }
  }

  const hasFarmErrors = Object.values(farmErrors).some(Boolean);
  const hasAccountErrors = accounts.value.some(({ errors }) =>
    Object.values(errors).some(Boolean),
  );

  if (hasFarmErrors || hasAccountErrors) {
    await nextTick();
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  if (!props.editExisting && auth.isSuperAdmin && !accounts.value.some(({ details }) => details.role === FARM_ADMIN)) {
    errorMessage.value = "กรุณาเพิ่มบัญชี Farm Admin อย่างน้อย 1 บัญชี";
    return;
  }

  const payload = {
    ...Object.fromEntries(fields.map(({ name }) => [name, farm[name].trim()])),
    accounts: accounts.value
      .filter(({ details }) => !auth.isFarmAdmin || !isEmptyAccount(details))
      .map(({ details }) => ({
      role: details.role,
      username: details.username.trim(),
      temporaryPassword: details.temporaryPassword,
    })),
  };

  isSubmitting.value = true;
  try {
    let response;
    if (!props.editExisting) {
      response = await farmApi.create(payload);
    } else if (auth.isSuperAdmin) {
      response = await farmApi.updateAsAdmin(props.farmId, payload);
    } else {
      response = await farmApi.updateOwn(payload);
    }
    createdFarmId.value = response.data.farmId;
  } catch (error) {
    const response = error.response;
    const duplicateMessage = "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว";
    const username = response?.data?.username;
    let account;

    if (response?.status === 409) {
      if (username) {
        account = accounts.value.find(({ details }) => details.username.trim() === username);
      } else if (response.data?.message === duplicateMessage && accounts.value.length === 1) {
        account = accounts.value[0];
      }
    }

    if (account) {
      account.errors.username = response.data.message || duplicateMessage;
      isSubmitting.value = false;
      await nextTick();
      form.querySelector(`#farm-account-${account.id}-username`)?.focus();
    } else {
      errorMessage.value =
        response?.data?.message || "บันทึกฟาร์มไม่สำเร็จ กรุณาลองใหม่";
    }
  } finally {
    isSubmitting.value = false;
  }

  if (createdFarmId.value && props.saveOnly) {
    emit("saved");
    return;
  }
  if (createdFarmId.value) await openHouseStep();
}

async function openHouseStep() {
  isSubmitting.value = true;
  try {
    const failure = await router.push({
      name: auth.isFarmAdmin ? (auth.setupStep === 3 ? "farm-flocks" : "farm-houses") : "new-house",
      query: { farmId: createdFarmId.value },
    });
    if (!failure && ["new-house", "farm-houses", "farm-flocks"].includes(router.currentRoute.value.name)) return;
  } catch {
    // Keep the saved ID so a retry only opens the next step.
  } finally {
    isSubmitting.value = false;
  }

  errorMessage.value = "บันทึกฟาร์มแล้ว แต่เปิดหน้าเพิ่มโรงเรือนไม่สำเร็จ กรุณากดถัดไปอีกครั้ง";
}

if (!props.editExisting) addAccount();

async function loadFarm() {
  loadingFarm.value = true;
  farmLoadFailed.value = false;
  clearError();
  try {
    const { data } = auth.isSuperAdmin
      ? await adminFarmApi.detail(props.farmId)
      : await authApi.myFarm();
    for (const { name } of fields) farm[name] = data[name] ?? "";
  } catch (error) {
    farmLoadFailed.value = true;
    errorMessage.value = error.response?.data?.message || "โหลดข้อมูลฟาร์มไม่สำเร็จ กรุณาลองใหม่";
  } finally {
    loadingFarm.value = false;
  }
}

onMounted(() => {
  if (props.editExisting) loadFarm();
});
</script>

<template>
  <section class="text-[#24321d]">
    <h1 class="mb-5 text-2xl font-bold">{{ editExisting ? "แก้ไขข้อมูลฟาร์ม" : "สร้างฟาร์มและจัดการสิทธิ์" }}</h1>

    <p v-if="loadingFarm" role="status" class="mb-4 text-sm">กำลังโหลดข้อมูลฟาร์ม...</p>
    <BaseButton v-if="farmLoadFailed" class="mb-4" @click="loadFarm">ลองโหลดอีกครั้ง</BaseButton>

    <form
      class="space-y-5"
      novalidate
      @submit.prevent="submit"
      @input="clearError"
      @change="clearError"
    >
      <fieldset :disabled="isSubmitting || loadingFarm || farmLoadFailed || !!createdFarmId" class="min-w-0 space-y-5">
        <div class="space-y-4 rounded-2xl border border-[#e9dfd0] bg-white p-5">
          <h2 class="font-bold">ข้อมูลฟาร์ม</h2>

          <BaseInput
            v-for="field in fields"
            :id="field.name"
            :key="field.name"
            v-model="farm[field.name]"
            :label="field.label"
            :type="field.type ?? 'text'"
            :maxlength="field.maxlength"
            :placeholder="field.placeholder"
            :error="farmErrors[field.name]"
            required
            @update:model-value="farmErrors[field.name] = ''"
          />
        </div>

        <div v-if="!editExisting" class="space-y-5">
          <div
            v-for="(account, index) in accounts"
            :key="account.id"
            class="relative"
          >
            <FarmAccountFields
              :id="`farm-account-${account.id}`"
              v-model="account.details"
              :errors="account.errors"
              :allow-farm-admin="auth.isSuperAdmin"
              @clear-error="(field) => (account.errors[field] = '')"
            />

            <button
              v-if="index > 0 || auth.isFarmAdmin"
              type="button"
              :aria-label="`ลบบัญชีที่ ${index + 1}`"
              class="absolute right-4 top-3 flex size-9 items-center justify-center rounded-lg text-[#66755a] hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-700"
              @click="removeAccount(account.id)"
            >
              <X :size="18" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#c5c6b3] px-4 py-3 text-sm font-semibold hover:bg-[#ede9db] focus-visible:outline-2 focus-visible:outline-[#556b42]"
            @click="addAccount"
          >
            <span class="grid size-6 place-items-center rounded-full bg-[#354a27] text-white">
              <Plus :size="15" aria-hidden="true" />
            </span>
            เพิ่มบัญชีพนักงาน
          </button>
        </div>

      </fieldset>

      <p v-if="errorMessage" role="alert" class="text-[10px] text-red-700">
        {{ errorMessage }}
      </p>

      <div class="flex justify-center gap-3">
        <BaseButton
          type="button"
          variant="secondary"
          :disabled="isSubmitting"
          @click="cancelSetup"
        >
          ยกเลิก
        </BaseButton>

        <BaseButton type="submit" :loading="isSubmitting" :disabled="loadingFarm || farmLoadFailed">
          <template #icon>
            <Check :size="16" aria-hidden="true" />
          </template>
          {{ saveOnly ? "บันทึก" : "ถัดไป" }}
        </BaseButton>
      </div>
    </form>
    <ConfirmModal
      v-if="showPauseModal"
      title="พักการตั้งค่าฟาร์ม?"
      :message="'ข้อมูลที่ยังไม่ได้บันทึกจะถูกล้าง\nเมื่อเข้าสู่ระบบครั้งถัดไป คุณจะกลับมาตั้งค่าต่อ'"
      cancel-text="ตั้งค่าต่อ"
      confirm-text="ออกจากระบบ"
      :loading="isLoggingOut"
      @cancel="showPauseModal = false"
      @confirm="pauseSetup"
    />
  </section>
</template>