<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Check } from 'lucide-vue-next';
import FlockFormFields from '@/components/flocks/FlockFormFields.vue';
import { emptyFlock, flockPayload } from '@/composables/flockUtils';
import { flockApi, houseApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';
const route=useRoute(), router=useRouter(), auth=useAuthStore(), modal=useModalStore();
const form=ref(emptyFlock()), houses=ref([]), breeds=ref([]), loading=ref(true), saving=ref(false), error=ref(''), saved=ref(false);
const forced=computed(()=>auth.isFarmAdmin && auth.setupStep===3);
const newFarmFlow=computed(()=>route.name==='new-flock');
const farmId=computed(()=>typeof route.query.farmId==='string'?route.query.farmId:auth.effectiveFarmId);
async function load() {
  loading.value=true;error.value='';
  try {
    if(auth.isSuperAdmin && !farmId.value)throw new Error('กรุณาเลือกฟาร์มก่อนเพิ่มฝูงไก่');
    const [h,b,f]=await Promise.all([houseApi.list(auth.isSuperAdmin?{farmId:farmId.value}:{}),flockApi.breeds(),flockApi.list(auth.isSuperAdmin?{farmId:farmId.value}:{})]);
    const occupied=new Set(f.data.filter(x=>x.status!=='RETIRED').map(x=>x.houseId));
    houses.value=h.data.filter(x=>x.status==='ACTIVE' && !occupied.has(x.houseId));breeds.value=b.data;
    if(!houses.value.length)error.value='ยังไม่มีโรงเรือนที่ว่างและเปิดใช้งาน กรุณาเพิ่มโรงเรือนก่อน';
    else if(!breeds.value.length)error.value='ยังไม่มีสายพันธุ์ที่เปิดใช้งานในระบบ';
  }catch(e){error.value=e.response?.data?.message||e.message||'โหลดข้อมูลไม่สำเร็จ';}
  finally{loading.value=false;}
}
async function submit() {
  if(saving.value||loading.value||saved.value)return;
  saving.value=true;error.value='';
  try {
    await flockApi.create(flockPayload(form.value,forced.value||newFarmFlow.value));saved.value=true;
    const setup=forced.value;
    if(auth.isFarmAdmin) {
      try { await auth.fetchSetupStatus(); } catch { auth.profileLoaded = false; }
    }
    modal.openSuccess({title:'เพิ่มสำเร็จ',message:setup?'ตั้งค่าฟาร์มครบทั้ง 3 ขั้นตอนแล้ว':'เพิ่มฝูงไก่แล้ว',
      confirmTo: setup?'/dashboard':newFarmFlow.value?'/farms':{name:'farm-flocks',query:route.query}});
  }catch(e){error.value=e.response?.data?.message||'บันทึกไม่สำเร็จ กรุณาลองใหม่';}
  finally{saving.value=false;}
}
function back(){router.push({name:forced.value?'farm-houses':newFarmFlow.value?'new-house':'farm-flocks',query:route.query});}
onMounted(load);
</script>
<template><section class="flock-create"><h1>เพิ่มฝูงไก่</h1><p v-if="forced" class="setup-note">ขั้นตอนที่ 3 จาก 3: เพิ่มฝูงไก่แรกเพื่อเริ่มใช้งานฟาร์ม</p><p v-if="loading">กำลังโหลดข้อมูล…</p><form v-else @submit.prevent="submit"><div class="form-card"><FlockFormFields v-model="form" :houses="houses" :breeds="breeds" :disabled="saving||saved" :show-code="!forced&&!newFarmFlow" /></div><p v-if="error" role="alert" class="error">{{ error }} <button type="button" @click="load">โหลดข้อมูลใหม่</button></p><div class="buttons"><button type="button" class="secondary" :disabled="saving" @click="back">{{ forced||newFarmFlow ? 'ย้อนกลับ':'ยกเลิก' }}</button><button class="primary" :disabled="saving||saved||!houses.length||!breeds.length"><Check :size="16" />{{ saving?'กำลังบันทึก…':'ยืนยัน' }}</button></div></form></section></template>
<style scoped>
.flock-create{color:#283621;max-width:1250px;margin:auto}h1{font-size:25px;font-weight:800;margin:8px 0 22px}.form-card{background:white;border:1px solid #e8ddc8;border-radius:22px;padding:29px}.buttons{display:flex;justify-content:center;gap:12px;margin:25px 0}.primary,.secondary{font:inherit;border-radius:11px;padding:12px 22px;border:1px solid #e4d9c5;cursor:pointer;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:8px}.primary{background:#f6d390;border-color:#f6d390;color:#293823}.secondary{background:#faf7f0;color:#293823}button:disabled{opacity:.5;cursor:wait}.error{padding:14px;background:#fff0e9;color:#a73a30;border-radius:12px;font-size:13px}.error button{border:0;background:transparent;color:inherit;text-decoration:underline;cursor:pointer}.steps{display:flex;gap:14px;flex-wrap:wrap;padding:14px;background:#f6e6c0;border-radius:12px;margin-bottom:20px;font-size:13px}.steps strong{color:#845c10}.setup-note{font-size:13px;color:#88836e;margin-bottom:20px}
</style>
