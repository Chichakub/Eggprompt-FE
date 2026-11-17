<script setup>
import BaseInput from '../form/BaseInput.vue';


defineProps({
  idPrefix: { type: String, required: true },
  errors: { type: Object, default: () => ({}) },
  showStatus: { type: Boolean, default: false }, 
});
const form = defineModel({ type: Object, required: true });
</script>

<template>
  <div class="space-y-5">
    <BaseInput :id="`${idPrefix}-name`" v-model="form.houseName" label="ชื่อโรงเรือน" placeholder="เช่น โรงเรือน 1" required :error="errors.houseName" />
    <BaseInput :id="`${idPrefix}-type`" v-model="form.houseType" label="ประเภทโรงเรือน" placeholder="เช่น ระบบกรงตึก" required :error="errors.houseType" />
    <BaseInput :id="`${idPrefix}-date`" v-model="form.openingDate" type="date" label="วันที่เปิดใช้โรงเรือน" required :error="errors.openingDate" />

    <div v-if="showStatus">
      <label :for="`${idPrefix}-status`" class="mb-2 block text-[11px] font-medium">สถานะ</label>
      <select :id="`${idPrefix}-status`" v-model="form.status" class="min-h-10 w-full rounded-[9px] border border-[#e9dfd0] bg-[#fffdfa] px-3 py-2 text-xs outline-none focus:border-[#8b9a74] focus:ring-2 focus:ring-[#8b9a74]/20">
        <option value="ACTIVE">เลี้ยงอยู่</option>
        <option value="INACTIVE">พักเล้า</option>
      </select>
    </div>

    <h3 class="border-b border-[#efe6d2] pb-3 pt-2 text-sm font-bold">ขนาดและความจุ</h3>
    <BaseInput :id="`${idPrefix}-w`" v-model="form.widthM" label="กว้าง (ม.)" placeholder="เช่น 15" required :error="errors.widthM" />
    <BaseInput :id="`${idPrefix}-l`" v-model="form.lengthM" label="ยาว (ม.)" placeholder="เช่น 120" required :error="errors.lengthM" />
    <BaseInput :id="`${idPrefix}-cap`" v-model="form.capacity" label="ความจุ (ตัว)" placeholder="เช่น 2000" required :error="errors.capacity" />

    <h3 class="border-b border-[#efe6d2] pb-3 pt-2 text-sm font-bold">ระบบและอุปกรณ์ <span class="text-[11px] font-normal text-[#7d8378]">(ไม่บังคับ)</span></h3>
    <BaseInput :id="`${idPrefix}-fan`" v-model="form.ventilationFanCount" label="พัดลมระบายอากาศ (ตัว)" placeholder="เช่น 14" :error="errors.ventilationFanCount" />
    <BaseInput :id="`${idPrefix}-water`" v-model="form.waterSystem" label="ระบบน้ำ" placeholder="เช่น นิปเปิลอัตโนมัติ" :error="errors.waterSystem" />
    <BaseInput :id="`${idPrefix}-feed`" v-model="form.feedingSystem" label="ระบบให้อาหาร" placeholder="เช่น สายพานลำเลียงอาหาร" :error="errors.feedingSystem" />
    <BaseInput :id="`${idPrefix}-egg`" v-model="form.eggCollectionSystem" label="การเก็บไข่" placeholder="เช่น สายพานเก็บไข่" :error="errors.eggCollectionSystem" />
    <BaseInput :id="`${idPrefix}-light`" v-model="form.lightingProgram" label="โปรแกรมแสง" placeholder="เช่น 16 ชม. ไฟ LED" :error="errors.lightingProgram" />
    <BaseInput :id="`${idPrefix}-built`" v-model="form.lastBuiltOrRenovatedDate" type="date" label="สร้างหรือปรับปรุงล่าสุด" :error="errors.lastBuiltOrRenovatedDate" />
  </div>
</template>
