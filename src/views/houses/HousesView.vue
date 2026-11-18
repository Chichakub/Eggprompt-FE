<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-vue-next';
import { houseApi } from '@/services/api';
import { useModalStore } from '@/stores/modalStore';
import { useRoleAccess } from '@/composables/useRoleAccess';
import BaseButton from '@/components/form/BaseButton.vue';
import ConfirmDeleteModal from '@/components/houses/ConfirmDeleteModal.vue';
import HouseFormFields from '@/components/houses/HouseFormFields.vue';
import { STATUS_LABEL, fmtDate, fmtNum, apiMessage, fromHouse, toPayload, validateHouse } from '@/composables/houseUtils';

const router = useRouter();
const modal = useModalStore();
const { canManageHouse } = useRoleAccess();

const houses = ref([]);
const loading = ref(true);
const loadError = ref('');
const selectedId = ref(null);

const editing = ref(false);
const saving = ref(false);
const form = ref(null);
const errors = ref({});

const showDelete = ref(false);
const deleting = ref(false);

const selected = computed(() => houses.value.find((h) => h.houseId === selectedId.value) ?? null);

async function load(keepId = selectedId.value) {
  loading.value = true;
  loadError.value = '';
  try {
    const { data } = await houseApi.list();
    houses.value = data;
    selectedId.value = data.some((h) => h.houseId === keepId) ? keepId : (data[0]?.houseId ?? null);
  } catch (e) {
    loadError.value = apiMessage(e, 'ไม่สามารถโหลดข้อมูลโรงเรือนได้');
  } finally {
    loading.value = false;
  }
}
onMounted(() => load());

const goAdd = () => router.push({ name: 'farm-houses-new' });

function startEdit() {
  form.value = fromHouse(selected.value);
  errors.value = {};
  editing.value = true;
}
function cancelEdit() {
  editing.value = false;
  errors.value = {};
}

async function saveEdit() {
  errors.value = validateHouse(form.value);
  if (Object.keys(errors.value).length) return;
  const id = selected.value.houseId;
  saving.value = true;
  try {
    await houseApi.update(id, toPayload(form.value, { withStatus: true }));
    editing.value = false;
    await load(id);
    modal.openSuccess({ title: 'แก้ไขสำเร็จ', message: 'แก้ไขแล้ว' });
  } catch (e) {
    modal.openError({ title: 'แก้ไขไม่สำเร็จ', message: apiMessage(e) });
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  deleting.value = true;
  try {
    await houseApi.remove(selected.value.houseId);
    showDelete.value = false;
    await load(null);
    modal.openSuccess({ title: 'ลบสำเร็จ', message: 'ลบโรงเรือนแล้ว' });
  } catch (e) {
    showDelete.value = false;
    modal.openError({ title: 'ลบไม่สำเร็จ', message: apiMessage(e), confirmText: 'ตกลง' }); // เช่น ยังมีฝูงเลี้ยงอยู่
  } finally {
    deleting.value = false;
  }
}

const specs = computed(() => {
  const h = selected.value;
  if (!h) return [];
  return [
    ['ขนาด', `${h.widthM} × ${h.lengthM} ม. (${fmtNum(h.areaSqm)} ตร.ม.)`],
    ['ความจุ', `${fmtNum(h.capacity)} ตัว`],
    ['สร้างหรือปรับปรุงล่าสุด', fmtDate(h.lastBuiltOrRenovatedDate)],
  ];
});
const badge = (s) => (s === 'ACTIVE' ? 'bg-[#dcefd8] text-[#2f6b2a]' : 'bg-[#dbeaf7] text-[#2c5f8a]');
</script>

<template>
  <div class="mx-auto max-w-[1280px]">
    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-[#202b21]">ข้อมูลโรงเรือน</h1>
        <p class="mt-1 text-xs text-[#7d8378]">ดูผังกรง สภาพอากาศ และประวัติการเลี้ยงของแต่ละโรงเรือน</p>
      </div>
      <!-- C2-147: Farm Staff ไม่เห็นปุ่มเพิ่ม/แก้ไข/ลบ -->
      <BaseButton v-if="canManageHouse" @click="goAdd">
        <template #icon><Plus :size="14" /></template>
        เพิ่มโรงเรือน
      </BaseButton>
    </header>

    <p v-if="loading" class="mt-10 text-center text-sm text-[#7d8378]">กำลังโหลด...</p>
    <div v-else-if="loadError" class="mt-10 text-center text-sm text-red-700" role="alert">
      {{ loadError }} <button class="underline" @click="load()">ลองอีกครั้ง</button>
    </div>
    <p v-else-if="!houses.length" class="mt-10 text-center text-sm text-[#7d8378]">ยังไม่มีโรงเรือนในฟาร์มนี้</p>

    <template v-else>
      <ul class="mt-5 flex gap-3 overflow-x-auto pb-1" role="listbox" aria-label="เลือกโรงเรือน">
        <li v-for="h in houses" :key="h.houseId" class="min-w-[200px] flex-1">
          <button type="button" role="option" :aria-selected="h.houseId === selectedId" :disabled="editing && h.houseId !== selectedId"
            class="w-full rounded-xl border-2 p-3 text-left transition disabled:opacity-60"
            :class="h.houseId === selectedId ? 'border-[#e08a2c] bg-white' : 'border-transparent bg-[#efe7d6] hover:bg-[#eadfca]'"
            @click="selectedId = h.houseId">
            <span class="flex items-center justify-between gap-2">
              <strong class="truncate text-xs text-[#202b21]">{{ h.houseName }}</strong>
              <span class="rounded-full px-2 py-0.5 text-[10px]" :class="badge(h.status)">{{ STATUS_LABEL[h.status] ?? h.status }}</span>
            </span>
            <span class="mt-2 block text-[11px] text-[#7d8378]">ความจุ <strong class="text-[#202b21]">{{ fmtNum(h.capacity) }}</strong> ตัว</span>
          </button>
        </li>
      </ul>

      <section v-if="selected" class="mt-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-bold text-[#202b21]">{{ selected.houseName }}</h2>
            <span class="rounded-full px-2 py-0.5 text-[10px]" :class="badge(selected.status)">{{ STATUS_LABEL[selected.status] ?? selected.status }}</span>
          </div>

          <div v-if="canManageHouse" class="flex gap-2">
            <template v-if="!editing">
              <BaseButton
                variant="secondary"
                class="border-[#d3c8b3]! bg-[#fdfcfa]! text-[#493f32]! hover:bg-[#f5f0e6]!"
                @click="startEdit"
              >
                <template #icon><Pencil :size="13" /></template>
                แก้ไขข้อมูล
              </BaseButton>
              <button type="button" class="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#c94b4b] px-4 text-xs font-semibold text-white hover:bg-[#b53f3f]" @click="showDelete = true">
                <Trash2 :size="13" aria-hidden="true" /> ลบโรงเรือน
              </button>
            </template>
            <template v-else>
              <BaseButton variant="secondary" :disabled="saving" @click="cancelEdit"><template #icon><X :size="14" /></template>ยกเลิก</BaseButton>
              <BaseButton :loading="saving" loading-text="กำลังบันทึก..." @click="saveEdit"><template #icon><Check :size="14" /></template>ยืนยัน</BaseButton>
            </template>
          </div>
        </div>

        <form v-if="editing" class="mt-4 rounded-2xl border border-[#efe6d2] bg-white p-7" novalidate @submit.prevent="saveEdit">
          <h3 class="mb-5 border-b border-[#efe6d2] pb-4 text-sm font-bold">ข้อมูลจำเพาะ</h3>
          <HouseFormFields v-model="form" :errors="errors" id-prefix="edit" show-status />
        </form>

        <div v-else class="mt-4 rounded-2xl border border-[#efe6d2] bg-white p-6">
          <h3 class="text-sm font-bold">ข้อมูลจำเพาะ</h3>
          <dl class="mt-4 space-y-2 text-xs">
            <div v-for="[k, v] in specs" :key="k" class="flex justify-between gap-4">
              <dt class="text-[#7d8378]">{{ k }}</dt><dd class="text-right font-medium">{{ v }}</dd>
            </div>
          </dl>
        </div>
      </section>
    </template>

    <ConfirmDeleteModal v-if="showDelete" :loading="deleting" @cancel="showDelete = false" @confirm="confirmDelete" />
  </div>
</template>
