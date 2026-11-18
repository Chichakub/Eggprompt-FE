<script setup>
import { emptyHouseForm, fromHouse, toPayload, validateHouse } from "@/composables/houseUtils";
import { nextTick, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Check, Plus, X } from "lucide-vue-next";
import { useAuthStore } from "@/stores/authStore";
import BaseButton from "@/components/form/BaseButton.vue";
import HouseFormFields from "@/components/houses/HouseFormFields.vue";

import { houseApi } from "@/services/api";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const houses = ref([]);
const status = ref("");
const errorMessage = ref("");
const isSubmitting = ref(false);
const loading = ref(true);
const loadFailed = ref(false);
let nextId = 1;

function addHouse() {
  houses.value.push({
    id: nextId++,
    data: emptyHouseForm(),
    errors: {},
    saved: false,
  });
  status.value = "";
}

function removeHouse(id) {
  houses.value = houses.value.filter((house) => house.id !== id);
  status.value = "";
}

async function submit(event) {
  if (isSubmitting.value || loading.value || loadFailed.value) return;
  const form = event.currentTarget;
  errorMessage.value = "";
  status.value = "";
  const pending = houses.value.filter((entry) => !entry.saved);
  for (const entry of pending) entry.errors = validateHouse(entry.data);
  if (houses.value.some(({ errors }) => Object.values(errors).some(Boolean))) {
    await nextTick();
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  const farmId = auth.isSuperAdmin ? route.query.farmId : auth.effectiveFarmId;
  if (typeof farmId !== "string" || !farmId.trim()) {
    errorMessage.value = "กรุณาเลือกฟาร์มก่อนเพิ่มโรงเรือน";
    return;
  }

  isSubmitting.value = true;
  try {
    for (const entry of pending) {
      const { data } = entry;
      try {
        const payload = toPayload(data, { farmId: auth.isSuperAdmin ? farmId : undefined });
        if (entry.houseId) {
          await houseApi.update(entry.houseId, payload);
        } else {
          const { data: created } = await houseApi.create(payload);
          entry.houseId = created.houseId;
        }
        entry.saved = true;
      } catch (error) {
        const index = houses.value.indexOf(entry) + 1;
        const message = error.response?.data?.message || "บันทึกไม่สำเร็จ กรุณาลองใหม่";
        errorMessage.value = `โรงเรือนที่ ${index} (${data.houseName.trim()}): ${message}`;
        return;
      }
    }

    status.value = `บันทึกโรงเรือนสำเร็จ ${houses.value.length} รายการ`;
    try {
      const failure = await router.push({ name: auth.isFarmAdmin ? "farm-flocks" : "new-flock", query: auth.isFarmAdmin ? {} : { farmId } });
      if (failure || !["new-flock", "farm-flocks"].includes(router.currentRoute.value.name)) {
        errorMessage.value = "เปิดหน้าเพิ่มฝูงไก่ไม่สำเร็จ กรุณากดถัดไปอีกครั้ง";
      }
    } catch {
      errorMessage.value = "เปิดหน้าเพิ่มฝูงไก่ไม่สำเร็จ กรุณากดถัดไปอีกครั้ง";
    }
  } finally {
    isSubmitting.value = false;
  }
}

async function loadHouses() {
  loading.value = true;
  loadFailed.value = false;
  errorMessage.value = "";
  try {
    const farmId = route.query.farmId;
    if (auth.isSuperAdmin && (typeof farmId !== "string" || !farmId.trim())) {
      throw new Error("กรุณาเลือกฟาร์มก่อนเพิ่มโรงเรือน");
    }
    const { data } = await houseApi.list(auth.isSuperAdmin ? { farmId } : undefined);
    houses.value = data.map((house) => ({
      id: nextId++,
      houseId: house.houseId,
      data: fromHouse(house),
      errors: {},
      saved: false,
    }));
    if (!houses.value.length) addHouse();
  } catch (error) {
    loadFailed.value = true;
    errorMessage.value = error.response?.data?.message || error.message || "โหลดข้อมูลโรงเรือนไม่สำเร็จ";
  } finally {
    loading.value = false;
  }
}

onMounted(loadHouses);
</script>

<template>
  <section class="text-[#24321d]">
    <h1 class="mb-5 text-2xl font-bold">เพิ่มโรงเรือน</h1>

    <p v-if="loading" role="status" class="mb-4 text-sm">กำลังโหลดโรงเรือน...</p>
    <BaseButton v-if="loadFailed" class="mb-4" @click="loadHouses">ลองโหลดอีกครั้ง</BaseButton>
    <form class="space-y-5" novalidate @submit.prevent="submit" @input="status = ''">
      <fieldset
        v-for="(entry, index) in houses"
        :key="entry.id"
        :disabled="isSubmitting || loading || loadFailed || entry.saved"
        class="space-y-4 rounded-2xl border border-[#e9dfd0] bg-white p-5"
      >
        <div class="flex items-center justify-between">
          <h2 class="font-bold">ข้อมูลโรงเรือน{{ index ? ` ${index + 1}` : "" }}</h2>
          <button
            v-if="index > 0 && !entry.saved && !entry.houseId"
            type="button"
            :aria-label="`ลบโรงเรือนที่ ${index + 1}`"
            class="grid size-9 place-items-center rounded-lg hover:bg-red-50 hover:text-red-700"
            @click="removeHouse(entry.id)"
          >
            <X :size="18" aria-hidden="true" />
          </button>
        </div>

        <HouseFormFields v-model="entry.data" :errors="entry.errors" :id-prefix="`house-${entry.id}`" />
        <p v-if="entry.saved" class="text-xs text-[#435638]">บันทึกแล้ว</p>
      </fieldset>

      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#c5c6b3] px-4 py-3 text-sm font-semibold hover:bg-[#ede9db]"
        :disabled="isSubmitting || loading || loadFailed"
        @click="addHouse"
      >
        <span class="grid size-6 place-items-center rounded-full bg-[#354a27] text-white">
          <Plus :size="15" aria-hidden="true" />
        </span>
        เพิ่มโรงเรือน
      </button>

      <p v-if="errorMessage" role="alert" class="text-sm text-red-700">{{ errorMessage }}</p>
      <p v-if="status" role="status" class="text-center text-sm text-[#435638]">{{ status }}</p>

      <div class="flex justify-center gap-3">
        <BaseButton
          variant="secondary"
          :disabled="isSubmitting || loading || loadFailed"
          @click="router.push({
            name: auth.isSuperAdmin ? 'new-farm' : 'farm-info',
            query: auth.isSuperAdmin ? { farmId: route.query.farmId } : {},
          })"
        >
          ย้อนกลับ
        </BaseButton>
        <BaseButton type="submit" :loading="isSubmitting" :disabled="loading || loadFailed">
          <template #icon><Check :size="16" aria-hidden="true" /></template>
          ถัดไป
        </BaseButton>
      </div>
    </form>
  </section>
</template>
