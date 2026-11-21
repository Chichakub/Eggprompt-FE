<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { ClipboardCheck, Info } from "lucide-vue-next";
import BaseButton from "@/components/form/BaseButton.vue";
import BaseInput from "@/components/form/BaseInput.vue";
import FeedWeightInput from "@/components/form/FeedWeightInput.vue";
import HouseSelector from "@/components/houses/HouseSelector.vue";
import ConfirmModal from "@/components/modals/ConfirmModal.vue";
import { apiMessage, fmtNum } from "@/composables/houseUtils";
import { feedLogApi, flockApi, houseApi } from "@/services/api";
import { useModalStore } from "@/stores/modalStore";

const modal = useModalStore();

const houses = ref([]);
const selectedId = ref(null);
const loading = ref(true);
const loadError = ref("");

const flocks = ref([]);
const flocksLoaded = ref(false);
const flockLoadError = ref("");

const weightKg = ref("");
const lotNumber = ref("");
const formError = ref("");
const pending = ref(null);
const saving = ref(false);

const today = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeZone: "Asia/Bangkok",
}).format(new Date());

const selectedHouse = computed(() =>
  houses.value.find((house) => house.houseId === selectedId.value),
);

const currentFlockByHouse = computed(() =>
  new Map(
    flocks.value
      .filter((flock) => flock.status !== "RETIRED")
      .map((flock) => [flock.houseId, flock]),
  ),
);

const selectedFlock = computed(() =>
  currentFlockByHouse.value.get(selectedId.value),
);

function houseDetail(houseId) {
  const flock = currentFlockByHouse.value.get(houseId);
  if (!flock) return "ยังไม่มีฝูงที่กำลังเลี้ยง";
  if (flock.currentCount == null) return "ยังไม่มีข้อมูลจำนวนไก่";

  return `ไก่ ${fmtNum(flock.currentCount)} ตัว`;
}

async function loadHouses() {
  loading.value = true;
  loadError.value = "";

  try {
    const { data } = await houseApi.list();
    houses.value = data;

    if (!data.some((house) => house.houseId === selectedId.value)) {
      selectedId.value = data[0]?.houseId ?? null;
    }
  } catch (error) {
    loadError.value = apiMessage(error, "ไม่สามารถโหลดข้อมูลโรงเรือนได้");
  } finally {
    loading.value = false;
  }
}

async function loadFlocks() {
  flockLoadError.value = "";
  flocksLoaded.value = false;

  try {
    const { data } = await flockApi.list();
    flocks.value = data;
    flocksLoaded.value = true;
  } catch (error) {
    flockLoadError.value = apiMessage(error, "ไม่สามารถโหลดข้อมูลฝูงไก่ได้");
  }
}

function clearForm() {
  weightKg.value = "";
  lotNumber.value = "";
  formError.value = "";
}

watch(selectedId, clearForm);

function reviewFeed() {
  if (saving.value || pending.value) return;

  formError.value = "";
  const house = selectedHouse.value;
  const weight = Number(weightKg.value);
  const lot = lotNumber.value.trim();

  if (!house || !selectedFlock.value) {
    formError.value = "เลือกโรงเรือนที่มีฝูงกำลังเลี้ยง";
    return;
  }

  if (!Number.isFinite(weight) || weight <= 0) {
    formError.value = "กรอกน้ำหนักอาหารมากกว่า 0 กิโลกรัม";
    return;
  }

  if (!lot) {
    formError.value = "กรอกเลขล็อตอาหาร";
    return;
  }

  pending.value = {
    houseName: house.houseName,
    payload: {
      houseId: house.houseId,
      weightKg: weight,
      lotNumber: lot,
    },
  };
}

async function saveFeed() {
  if (!pending.value || saving.value) return;

  saving.value = true;

  try {
    await feedLogApi.create(pending.value.payload);
    pending.value = null;
    clearForm();

    modal.openSuccess({
      title: "เพิ่มสำเร็จ",
      message: "เพิ่มบันทึกการให้อาหารแล้ว",
    });
  } catch (error) {
    pending.value = null;
    formError.value = apiMessage(error, "บันทึกการให้อาหารไม่สำเร็จ");
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadHouses();
  loadFlocks();
});
</script>

<template>
  <section class="mx-auto max-w-5xl p-4 sm:p-6">
    <header class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold text-[#202b21]">
        บันทึกการทำงานประจำวัน
      </h1>
      <span class="rounded-full bg-[#dbe7ce] px-3 py-1 text-xs text-[#405329]">
        วันนี้ {{ today }}
      </span>
    </header>

    <p v-if="loading" role="status">กำลังโหลดโรงเรือน…</p>

    <div v-else-if="loadError" class="space-y-3">
      <p role="alert" class="text-red-700">{{ loadError }}</p>
      <BaseButton @click="loadHouses">ลองอีกครั้ง</BaseButton>
    </div>

    <p v-else-if="!houses.length">ยังไม่มีโรงเรือนในฟาร์มนี้</p>

    <template v-else>
      <HouseSelector v-model="selectedId" :houses="houses">
        <template #house-detail="{ house }">
          <span v-if="flocksLoaded" class="text-xs opacity-80">
            {{ houseDetail(house.houseId) }}
          </span>
        </template>
      </HouseSelector>

      <section
        v-if="selectedHouse"
        class="mt-6 space-y-4 rounded-2xl bg-[#ede8d9] p-4"
      >
        <h2 class="font-bold text-[#202b21]">
          บันทึกข้อมูล: {{ selectedHouse.houseName }}
        </h2>

        <form
          v-if="selectedFlock"
          class="space-y-4"
          novalidate
          @submit.prevent="reviewFeed"
        >
          <FeedWeightInput v-model="weightKg" />

          <BaseInput
            id="feed-lot-number"
            v-model="lotNumber"
            label="เลขล็อตอาหาร (Lot Number)"
            placeholder="เช่น LOT-CP-9082"
            required
          />

          <p v-if="formError" role="alert" class="text-sm text-red-700">
            {{ formError }}
          </p>

          <div class="flex justify-center">
            <BaseButton type="submit" class="w-full sm:w-64" :disabled="saving">
              บันทึกข้อมูลโรงเรือนนี้
            </BaseButton>
          </div>
        </form>

        <div v-else-if="flockLoadError" class="space-y-3">
          <p role="alert" class="text-sm text-red-700">{{ flockLoadError }}</p>
          <BaseButton variant="secondary" @click="loadFlocks">
            โหลดข้อมูลฝูงอีกครั้ง
          </BaseButton>
        </div>

        <p v-else-if="flocksLoaded" class="text-sm text-[#59634f]">
          โรงเรือนนี้ยังไม่มีฝูงที่กำลังเลี้ยง จึงยังบันทึกอาหารไม่ได้
        </p>

        <p v-else role="status" class="text-sm text-[#59634f]">
          กำลังโหลดข้อมูลฝูง…
        </p>
      </section>
    </template>

    <ConfirmModal
      v-if="pending"
      title="ตรวจสอบก่อนบันทึก"
      confirm-text="ยืนยันและบันทึก"
      loading-text="กำลังบันทึก..."
      :loading="saving"
      @cancel="pending = null"
      @confirm="saveFeed"
    >
      <template #icon>
        <ClipboardCheck :size="25" :stroke-width="2.2" />
      </template>

      <p class="text-sm text-[#6b675e]">
        {{ pending.houseName }} · การให้อาหารประจำวัน
      </p>

      <dl
        class="mt-5 divide-y divide-[#e2d9c9] rounded-2xl border border-[#e2d9c9]
               bg-[#f5f0e4] px-4 text-sm"
      >
        <div class="flex items-center justify-between gap-3 py-3">
          <dt class="shrink-0 text-left text-[#6b675e]">โรงเรือน</dt>
          <dd class="min-w-0 break-words text-right font-bold text-[#202b21]">
            {{ pending.houseName }}
          </dd>
        </div>

        <div class="flex items-center justify-between gap-3 py-3">
          <dt class="text-left text-[#6b675e]">อาหารที่ให้ครั้งนี้</dt>
          <dd class="text-right text-xl font-bold text-[#202b21]">
            {{ pending.payload.weightKg }} กก.
          </dd>
        </div>

        <div class="flex items-center justify-between gap-3 py-3">
          <dt class="shrink-0 text-left text-[#6b675e]">เลขล็อต</dt>
          <dd class="min-w-0 break-all text-right font-mono font-bold text-[#202b21]">
            {{ pending.payload.lotNumber }}
          </dd>
        </div>
      </dl>

      <p class="mt-3 flex items-start gap-2 text-left text-xs text-[#6b675e]">
        <Info :size="14" class="mt-px shrink-0" aria-hidden="true" />
        กรุณาตรวจสอบข้อมูลให้ครบก่อนยืนยัน
      </p>
    </ConfirmModal>
  </section>
</template>