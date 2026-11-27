<script setup>
import { watch } from 'vue';
import { ChevronDown } from 'lucide-vue-next';
const model = defineModel({ required:true });
const props = defineProps({ breeds:{type:Array,default:()=>[]}, houses:{type:Array,default:()=>[]}, disabled:Boolean });
watch(() => props.breeds, breeds => {
  model.value.breedId = breeds[0]?.breedId ?? '';
}, { immediate:true });
const today = new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'});
</script>
<template>
  <fieldset class="flock-fields" :disabled="disabled">
    <h2>ข้อมูลฝูงไก่</h2>
    <label>รหัสฝูง <em>*</em><input v-model="model.flockCode" required maxlength="50" pattern="[A-Za-z0-9._\-]+" placeholder="เช่น F69-01" /></label>
    <label>สายพันธุ์และที่มา <em>*</em><input value="Hy-Line Brown (ไฮไลน์บราวน์)" readonly aria-readonly="true" /></label>
    <label>ผู้จำหน่ายไก่ <em>*</em><input v-model="model.supplier" required maxlength="255" placeholder="เช่น ฟาร์มแม่ไก่สาว นครปฐม" /></label>
    <label>เลขที่ใบรับรองสุขภาพ<input v-model="model.healthCertificate" maxlength="100" /></label>
    <label>ราคาต่อตัว (บาท) <em>*</em><input v-model="model.pricePerBird" type="number" required min="0" max="9999999999.99" step="0.01" inputmode="decimal" /></label>
    <label>โรงเรือนที่นำเข้า <em>*</em><span class="select-control"><select v-model.number="model.houseId" required><option disabled value="">เลือกโรงเรือน</option><option v-for="house in houses" :key="house.houseId" :value="house.houseId">{{ house.houseName }} (ความจุ {{ Number(house.capacity).toLocaleString() }} ตัว)</option></select><ChevronDown class="select-chevron" :size="18" aria-hidden="true" /></span></label>
    <label>วันที่รับเข้า <em>*</em><input v-model="model.receivedDate" type="date" required :max="today" /></label>
    <label>อายุตอนรับเข้ามา (สัปดาห์) <em>*</em><input v-model.number="model.initialAgeWeeks" type="number" required min="0" max="2147483647" step="1" placeholder="เช่น 10" /></label>
    <label>จำนวนที่รับเข้า (ตัว) <em>*</em><input v-model.number="model.initialCount" type="number" required min="1" max="2147483647" step="1" placeholder="เช่น 1500" /></label>
    <label>น้ำหนักเฉลี่ยแรกรับต่อตัว (กรัม) <em>*</em><input v-model="model.initialAverageWeightG" type="number" required min="0.01" max="9999999999.99" step="0.01" placeholder="เช่น 1059" /></label>
    <label>โปรแกรมวัคซีน <em>*</em><span class="select-control"><select v-model="model.vaccinated" required><option disabled value="">เลือกสถานะวัคซีน</option><option :value="true">ได้รับวัคซีน</option><option :value="false">ยังไม่ได้รับวัคซีน</option></select><ChevronDown class="select-chevron" :size="18" aria-hidden="true" /></span></label>
  </fieldset>
</template>
<style scoped>
.flock-fields{min-width:0;border:0;padding:0;margin:0;display:flex;flex-direction:column;gap:22px;color:#293823}h2{font-size:19px;font-weight:800;margin:0 0 8px}label{display:block;font-size:14px;font-weight:600}em{color:#bf4435;font-style:normal}input,select{display:block;width:100%;box-sizing:border-box;font:inherit;font-weight:400;color:#293823;background:white;border:1px solid #e1d6bd;border-radius:10px;padding:13px 15px;margin-top:9px;min-height:48px;font-size:15px;line-height:1.5}input::placeholder{color:#9a9e8b}input:focus,select:focus{outline:2px solid #e7c67d;outline-offset:2px}fieldset:disabled{opacity:.65}
.select-control{display:block;position:relative;margin-top:9px}.select-control select{margin-top:0;appearance:none;-webkit-appearance:none;padding-right:48px}.select-chevron{position:absolute;right:17px;top:50%;transform:translateY(-50%);pointer-events:none;color:#66755a}input[readonly]{background:#faf8f2;color:#435536;cursor:default}@media(max-width:650px){input,select{font-size:16px}}
</style>
