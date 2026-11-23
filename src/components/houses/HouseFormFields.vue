<script setup>
import { ref } from 'vue';
import BaseInput from '../form/BaseInput.vue';
import { STATUS_LABEL, todayInBangkok } from '@/composables/houseUtils';

defineProps({
  idPrefix: { type: String, required: true },
  errors: { type: Object, default: () => ({}) },
  showStatus: { type: Boolean, default: false },
});
const form = defineModel({ type: Object, required: true });
const maxDate = ref(todayInBangkok());
</script>

<template>
  <div class="space-y-5">
    <BaseInput :id="`${idPrefix}-name`" v-model="form.houseName" label="ชื่อโรงเรือน" placeholder="เช่น โรงเรือน 1" :maxlength="100" required :error="errors.houseName" />

    <div v-if="showStatus">
      <label :for="`${idPrefix}-status`" class="mb-2 block text-[11px] font-medium">สถานะ</label>
      <select :id="`${idPrefix}-status`" v-model="form.status" class="min-h-10 w-full rounded-[9px] border border-[#e9dfd0] bg-[#fffdfa] px-3 py-2 text-xs outline-none focus:border-[#8b9a74] focus:ring-2 focus:ring-[#8b9a74]/20">
        <option v-for="(label, value) in STATUS_LABEL" :key="value" :value="value">{{ label }}</option>
      </select>
    </div>
    <h3 class="border-b border-[#efe6d2] pb-3 pt-2 text-sm font-bold">ขนาดและความจุ</h3>
    <BaseInput :id="`${idPrefix}-w`" v-model="form.widthM" label="กว้าง (ม.)" placeholder="เช่น 15" required :error="errors.widthM" />
    <BaseInput :id="`${idPrefix}-l`" v-model="form.lengthM" label="ยาว (ม.)" placeholder="เช่น 120" required :error="errors.lengthM" />
    <BaseInput :id="`${idPrefix}-cap`" v-model="form.capacity" label="ความจุ (ตัว)" placeholder="เช่น 2000" required :error="errors.capacity" />

    <BaseInput
      :id="`${idPrefix}-built`"
      v-model="form.lastBuiltOrRenovatedDate"
      type="date"
      label="สร้างหรือปรับปรุงล่าสุด"
      :max="maxDate"
      :error="errors.lastBuiltOrRenovatedDate"
      @focusin="maxDate = todayInBangkok()"
    />
  </div>
</template>
