<script setup>
import { nextTick, onMounted, reactive, ref } from "vue";
import { ChevronDown } from "lucide-vue-next";
import { useRoute, useRouter } from "vue-router";
import BaseButton from "@/components/form/BaseButton.vue";
import BaseInput from "@/components/form/BaseInput.vue";
import { flockApi, houseApi } from "@/services/api";
import { useModalStore } from "@/stores/modalStore";
import { useAuthStore } from "@/stores/authStore";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const modal = useModalStore();
const houses = ref([]);
const loading = ref(true);
const error = ref("");
const houseId = ref("");
const breeds = [{ id: 1, name: "Hy-Line Brown" }];
const breedId = ref("");
const selectClass = "min-h-10 w-full appearance-none rounded-[9px] border border-[#e9dfd0] bg-[#fffdfa] py-2 pl-3 pr-10 text-xs focus:border-[#8b9a74] focus:outline-none focus:ring-2 focus:ring-[#8b9a74]/20";
const chevronClass = "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#66755a]";
const fields = [
  { name: "supplier", label: "ผู้จำหน่ายไก่", maxlength: 255 },
  { name: "healthCertificate", label: "เลขที่ใบรับรองสุขภาพ", optional: true, maxlength: 100 },
  { name: "price", label: "ราคาต่อตัว (บาท)" },
  { name: "receivedDate", label: "วันที่รับเข้า", type: "date" },
  { name: "age", label: "อายุตอนรับเข้ามา (สัปดาห์)" },
  { name: "quantity", label: "จำนวนที่รับเข้า (ตัว)" },
  { name: "weight", label: "น้ำหนักเฉลี่ยแรกรับต่อตัว (กรัม)" },
];
const flock = reactive(Object.fromEntries(fields.map(({ name }) => [name, ""])));
const vaccination = ref("");
const errors = reactive({});
const saving = ref(false);
const saveError = ref("");
const savedFlock = ref(null);
const wholeNumber = /^[0-9]+$/;
const decimal = /^[0-9]{1,10}(\.[0-9]{1,2})?$/;

async function submit(event) {
  if (saving.value || savedFlock.value || loading.value || error.value) return;
  const form = event.currentTarget;
  saveError.value = "";

  for (const field of fields) {
    errors[field.name] = !field.optional && !flock[field.name].trim()
      ? `กรุณาระบุ${field.label}`
      : "";
  }
  errors.breed = breedId.value ? "" : "กรุณาเลือกสายพันธุ์";
  errors.house = houseId.value ? "" : "กรุณาเลือกโรงเรือน";
  errors.vaccination = vaccination.value ? "" : "กรุณาเลือกสถานะวัคซีน";

  for (const [name, minimum] of [["age", 0], ["quantity", 1]]) {
    const value = flock[name].trim();
    if (value && (!wholeNumber.test(value) || Number(value) < minimum || Number(value) > 2147483647)) {
      errors[name] = `กรุณากรอกจำนวนเต็มตั้งแต่ ${minimum} ถึง 2,147,483,647`;
    }
  }

  for (const name of ["price", "weight"]) {
    const value = flock[name].trim();
    if (value && (!decimal.test(value) || (name === "weight" && Number(value) <= 0))) {
      errors[name] = name === "weight"
        ? "กรุณากรอกน้ำหนักมากกว่า 0 และมีทศนิยมไม่เกิน 2 ตำแหน่ง"
        : "กรุณากรอกราคาเป็นตัวเลข และมีทศนิยมไม่เกิน 2 ตำแหน่ง";
    }
  }

  if (Object.values(errors).some(Boolean)) {
    await nextTick();
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  saving.value = true;
  try {
    const { data } = await flockApi.create({
      breedId: breedId.value,
      houseId: houseId.value,
      supplier: flock.supplier.trim(),
      healthCertificate: flock.healthCertificate.trim() || null,
      pricePerBird: flock.price.trim(),
      receivedDate: flock.receivedDate,
      initialAgeWeeks: Number(flock.age),
      initialCount: Number(flock.quantity),
      initialAverageWeightG: flock.weight.trim(),
      vaccinated: vaccination.value === "yes",
    });
    savedFlock.value = data;
    modal.openSuccess({
      title: auth.isSuperAdmin ? "สร้างฟาร์มสำเร็จ" : "ตั้งค่าฟาร์มสำเร็จ",
      message: auth.isSuperAdmin ? "สร้างฟาร์มใหม่แล้ว" : "พร้อมเริ่มใช้งานฟาร์มแล้ว",
      confirmText: "ตกลง",
      confirmTo: auth.isSuperAdmin ? "/farms" : "/dashboard",
    });
  } catch (requestError) {
    saveError.value = requestError.response?.data?.message || "บันทึกฝูงไก่ไม่สำเร็จ กรุณาลองใหม่";
  } finally {
    saving.value = false;
  }
}

async function loadHouses() {
  loading.value = true;
  error.value = "";
  const farmId = route.query.farmId;

  try {
    if (auth.isSuperAdmin && (typeof farmId !== "string" || !farmId.trim())) {
      error.value = "กรุณาเลือกฟาร์มก่อนเพิ่มฝูงไก่";
      return;
    }
    const { data } = await houseApi.list(auth.isSuperAdmin ? { farmId } : undefined);
    houses.value = data;
  } catch (requestError) {
    error.value = requestError.response?.data?.message || "โหลดโรงเรือนไม่สำเร็จ";
  } finally {
    loading.value = false;
  }
}

onMounted(loadHouses);
</script>

<template>
  <section class="space-y-5 text-[#24321d]">
    <h1 class="text-2xl font-bold">เพิ่มฝูงไก่</h1>

    <form class="space-y-5" novalidate @submit.prevent="submit">
      <fieldset :disabled="saving || !!savedFlock" class="min-w-0 space-y-4 rounded-2xl border border-[#e9dfd0] bg-white p-5">
        <h2 class="font-bold">ข้อมูลฝูงไก่</h2>

        <div>
          <label for="flock-breed" class="mb-2 block text-[11px] font-medium">
            สายพันธุ์และที่มา <span class="text-red-600" aria-hidden="true">*</span>
          </label>
          <div class="relative">
            <select id="flock-breed" v-model="breedId"
                :aria-invalid="!!errors.breed"
                :aria-describedby="errors.breed ? 'flock-breed-error' : undefined"
                @change="errors.breed = ''" :class="[selectClass, errors.breed && 'border-red-500']" required>
              <option disabled value="">เลือกสายพันธุ์</option>
              <option v-for="option in breeds" :key="option.id" :value="option.id">
                {{ option.name }}
              </option>
            </select>
            <ChevronDown :size="16" :class="chevronClass" aria-hidden="true" />
          </div>
            <p v-if="errors.breed" id="flock-breed-error" role="alert" class="mt-2 text-[11px] text-red-700">{{ errors.breed }}</p>
        </div>

        <template v-for="field in fields" :key="field.name">
          <div v-if="field.name === 'receivedDate'">
            <label for="flock-house" class="mb-2 block text-[11px] font-medium">
              โรงเรือนที่นำเข้า <span class="text-red-600" aria-hidden="true">*</span>
            </label>
            <div class="relative">
              <select
                id="flock-house"
                v-model="houseId"
                :aria-invalid="!!errors.house"
                :aria-describedby="errors.house ? 'flock-house-error' : undefined"
                @change="errors.house = ''"
                required
                :disabled="loading || !!error"
                :class="[selectClass, errors.house && 'border-red-500']"
              >
                <option disabled value="">{{ loading ? "กำลังโหลดโรงเรือน..." : "เลือกโรงเรือน" }}</option>
                <option v-for="house in houses" :key="house.houseId" :value="house.houseId">
                  {{ house.houseName }}
                </option>
              </select>
              <ChevronDown :size="16" :class="chevronClass" aria-hidden="true" />
            </div>
            <p v-if="errors.house" id="flock-house-error" role="alert" class="mt-2 text-[11px] text-red-700">{{ errors.house }}</p>
            <p v-if="error" role="alert" class="mt-2 text-xs text-red-700">{{ error }}</p>
            <p v-else-if="!loading && !houses.length" class="mt-2 text-xs">ยังไม่มีโรงเรือนในฟาร์มนี้</p>
          </div>

          <BaseInput
            :id="`flock-${field.name}`"
            v-model="flock[field.name]"
            :label="field.label"
            :type="field.type ?? 'text'"
            :required="!field.optional"
            :maxlength="field.maxlength"
            :error="errors[field.name]"
            @update:model-value="errors[field.name] = ''"
          />
        </template>

        <div>
          <label for="flock-vaccination" class="mb-2 block text-[11px] font-medium">
            โปรแกรมวัคซีน <span class="text-red-600" aria-hidden="true">*</span>
          </label>
          <div class="relative">
            <select
              id="flock-vaccination"
              v-model="vaccination"
                :aria-invalid="!!errors.vaccination"
                :aria-describedby="errors.vaccination ? 'flock-vaccination-error' : undefined"
                @change="errors.vaccination = ''"
              required
              :class="[selectClass, errors.vaccination && 'border-red-500']"
            >
              <option disabled value="">เลือกสถานะวัคซีน</option>
              <option value="yes">ได้รับวัคซีน</option>
              <option value="no">ยังไม่ได้รับวัคซีน</option>
            </select>
            <ChevronDown :size="16" :class="chevronClass" aria-hidden="true" />
          </div>
            <p v-if="errors.vaccination" id="flock-vaccination-error" role="alert" class="mt-2 text-[11px] text-red-700">{{ errors.vaccination }}</p>
        </div>
      </fieldset>

      <p v-if="saveError" role="alert" class="text-sm text-red-700">{{ saveError }}</p>

      <div class="flex justify-center gap-3">
        <BaseButton variant="secondary" :disabled="saving" @click="router.push({ name: auth.isFarmAdmin ? 'farm-houses' : 'new-house', query: route.query })">
          ย้อนกลับ
        </BaseButton>
        <BaseButton type="submit" :loading="saving" :disabled="loading || !!error || !!savedFlock">ยืนยัน</BaseButton>
      </div>
    </form>
  </section>
</template>
