<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Building2, Check, Plus, Trash2 } from 'lucide-vue-next';
import { houseApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';
import BaseButton from '@/components/form/BaseButton.vue';
import HouseFormFields from '@/components/houses/HouseFormFields.vue';
import { apiMessage, emptyHouseForm, toPayload, validateHouse } from '@/composables/houseUtils';

const router = useRouter();
const auth = useAuthStore();
const modal = useModalStore();

let uid = 0;
const blank = () => ({ key: ++uid, form: emptyHouseForm(), errors: {} });
const items = reactive([blank()]);
const submitting = ref(false);

const addForm = () => items.push(blank());
const removeForm = (i) => items.splice(i, 1);
const cancel = () => router.push({ name: 'farm-houses' });

async function submit() {
  let ok = true;
  items.forEach((it) => { it.errors = validateHouse(it.form); if (Object.keys(it.errors).length) ok = false; });
  if (!ok) return;

  // ชื่อซ้ำกันเองในหน้าเดียวกัน
  const names = items.map((it) => it.form.houseName.trim());
  const dup = names.findIndex((n, i) => names.indexOf(n) !== i);
  if (dup !== -1) { items[dup].errors = { houseName: 'ชื่อโรงเรือนซ้ำกับที่กรอกไว้ด้านบน' }; return; }

  submitting.value = true;
  try {
    while (items.length) {
      const it = items[0];
      try {
        await houseApi.create(toPayload(it.form, { farmId: auth.isSuperAdmin ? auth.effectiveFarmId : undefined }));
        items.shift();
      } catch (e) {
        modal.openError({ title: 'เพิ่มโรงเรือนไม่สำเร็จ', message: `${it.form.houseName}: ${apiMessage(e)}` });
        return;
      }
    }
    modal.openSuccess({ title: 'เพิ่มสำเร็จ', message: 'เพิ่มโรงเรือนแล้ว', confirmTo: { name: 'farm-houses' } });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1520px]">
    <h1 class="text-2xl font-bold text-[#202b21]">เพิ่มโรงเรือน</h1>

    <form class="mt-6" novalidate @submit.prevent="submit">
      <section v-for="(it, i) in items" :key="it.key" class="mb-5 rounded-3xl border border-[#efe6d2] bg-[#fffdfa] p-7">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="flex items-center gap-3 text-lg font-bold"><Building2 :size="20" aria-hidden="true" /> ข้อมูลโรงเรือน<span v-if="items.length > 1"> #{{ i + 1 }}</span></h2>
          <button v-if="items.length > 1" type="button" class="flex items-center gap-1 text-xs text-red-700" :aria-label="`ลบฟอร์มโรงเรือน #${i + 1}`" @click="removeForm(i)">
            <Trash2 :size="14" aria-hidden="true" /> ลบ
          </button>
        </div>
        <HouseFormFields v-model="it.form" :errors="it.errors" :id-prefix="`add-${it.key}`" />
      </section>

      <button type="button" class="flex w-full items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-[#d9cfb8] py-6 text-xs font-semibold text-[#23311e] hover:bg-[#f3ecda]" @click="addForm">
        <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[#23311e] text-white"><Plus :size="16" aria-hidden="true" /></span>
        เพิ่มโรงเรือน <span class="font-normal text-[#7d8378]">(กรอกข้อมูลและสร้างพร้อมกันหลายโรงเรือนได้)</span>
      </button>

      <div class="mt-6 flex justify-center gap-3">
        <BaseButton variant="secondary" :disabled="submitting" @click="cancel">ยกเลิก</BaseButton>
        <BaseButton type="submit" :loading="submitting" loading-text="กำลังบันทึก...">
          <template #icon><Check :size="14" /></template>บันทึก
        </BaseButton>
      </div>
    </form>
  </div>
</template>
