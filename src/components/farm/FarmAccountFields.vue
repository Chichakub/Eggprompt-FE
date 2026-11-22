<script setup>
import { computed } from "vue";
import { ChevronDown, KeyRound } from "lucide-vue-next";
import BaseInput from "@/components/form/BaseInput.vue";
import PasswordField from "@/components/form/PasswordField.vue";
import PasswordRequirements from "@/components/form/PasswordRequirements.vue";
import { FARM_ADMIN, FARM_STAFF, FINANCE_STAFF } from "@/constants/roles";

const props = defineProps({
  allowFarmAdmin: { type: Boolean, default: true },
  id: { type: String, required: true },
  errors: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["clear-error"]);
const account = defineModel({ type: Object, required: true });
const roles = computed(() => props.allowFarmAdmin
  ? [FARM_ADMIN, FARM_STAFF, FINANCE_STAFF]
  : [FARM_STAFF, FINANCE_STAFF]);
</script>

<template>
  <fieldset class="min-w-0 space-y-4 rounded-2xl border border-[#e9dfd0] bg-white p-5">
    <legend class="sr-only">สร้างบัญชี</legend>

    <h2 class="flex items-center gap-2 font-bold">
      <KeyRound :size="16" aria-hidden="true" />
      สร้างบัญชี
    </h2>

    <div>
      <label :for="`${id}-role`" class="mb-2 block text-[11px] font-medium">
        กำหนดสิทธิ์ผู้ใช้ (User Role)
        <span class="text-red-600" aria-hidden="true">*</span>
      </label>

      <div class="relative">
        <select
          :id="`${id}-role`"
          v-model="account.role"
          required
          :aria-invalid="!!errors.role"
          :aria-describedby="errors.role ? `${id}-role-error` : undefined"
          class="min-h-10 w-full appearance-none rounded-[9px] border bg-[#fffdfa] py-2 pl-3 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-[#8b9a74]/20"
          :class="errors.role ? 'border-red-500' : 'border-[#e9dfd0] focus:border-[#8b9a74]'"
          @change="emit('clear-error', 'role')"
        >
          <option disabled value="">เลือกสิทธิ์ผู้ใช้</option>
          <option v-for="role in roles" :key="role" :value="role">
            {{ role }}
          </option>
        </select>

        <ChevronDown
          :size="16"
          aria-hidden="true"
          class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#66755a]"
        />
      </div>

      <p
        v-if="errors.role"
        :id="`${id}-role-error`"
        role="alert"
        class="mt-2 text-[11px] text-red-700"
      >
        {{ errors.role }}
      </p>
    </div>

    <BaseInput
      :id="`${id}-username`"
      v-model="account.username"
      label="ชื่อผู้ใช้ (Username)"
      placeholder="เช่น thawee_owner"
      :maxlength="24"
      :error="errors.username"
      required
      @update:model-value="emit('clear-error', 'username')"
    />

    <BaseInput
      :id="`${id}-email`"
      v-model="account.email"
      type="email"
      label="อีเมลผู้ใช้ (Email)"
      placeholder="เช่น owner@example.com"
      :maxlength="255"
      :error="errors.email"
      :required="account.role === FARM_ADMIN"
      @update:model-value="emit('clear-error', 'email')"
    />

    <PasswordField
      :id="`${id}-password`"
      v-model="account.temporaryPassword"
      label="รหัสผ่านเริ่มต้น (Temporary Password)"
      placeholder="ระบุรหัสผ่านอย่างน้อย 8 ตัวอักษร"
      :error="errors.temporaryPassword"
      required
      @update:model-value="emit('clear-error', 'temporaryPassword')"
    />

    <PasswordRequirements :password="account.temporaryPassword" />
  </fieldset>
</template>