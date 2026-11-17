<script setup>
import { ref, watch, onBeforeUnmount } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { adminFarmApi, authApi } from '@/services/api';
const auth = useAuthStore();
const farm = ref(null), loading = ref(false), error = ref('');
let request = 0;
async function load() {
  if (auth.isSuperAdmin && !auth.effectiveFarmId) return;
  const id = ++request; farm.value = null; loading.value = true; error.value = '';
  try {
    const {data} = auth.isSuperAdmin ? await adminFarmApi.detail(auth.effectiveFarmId) : await authApi.myFarm();
    if (id !== request) return;
    farm.value = data;
    if (auth.isSuperAdmin) auth.inspectFarm(data);
  } catch (e) { if (id === request) error.value = e.response?.data?.message || 'ไม่สามารถโหลดข้อมูลฟาร์มได้'; }
  finally { if (id === request) loading.value = false; }
}
onBeforeUnmount(() => { request++; });
watch(() => auth.effectiveFarmId, load, { immediate:true });
function date(value) { return value ? new Intl.DateTimeFormat('th-TH',{dateStyle:'long',timeZone:'UTC'}).format(new Date(value)) : '—'; }
</script>
<template><section class="farm-info"><header><h1>ข้อมูลฟาร์ม</h1></header><p v-if="loading" class="notice">กำลังโหลดข้อมูลฟาร์ม…</p><div v-else-if="error" class="notice error" role="alert">{{ error }} <button @click="load">ลองใหม่</button></div><template v-else-if="farm"><article><h2>ข้อมูลทั่วไป</h2><dl><div><dt>ชื่อฟาร์ม</dt><dd>{{ farm.farmName }}</dd></div><div><dt>รหัสฟาร์ม</dt><dd>{{ farm.farmId }}</dd></div><div><dt>ทะเบียนฟาร์ม (กรมปศุสัตว์)</dt><dd>{{ farm.farmRegistrationNumber || '—' }}</dd></div><div><dt>วันที่เริ่มดำเนินการ</dt><dd>{{ date(farm.operationStartDate) }}</dd></div><div><dt>เจ้าของหรือผู้ประกอบการ</dt><dd>{{ farm.ownerName || '—' }}</dd></div><div><dt>เลขประจำตัวผู้เสียภาษี</dt><dd>{{ farm.taxId || '—' }}</dd></div><div><dt>โทรศัพท์ติดต่อ</dt><dd>{{ farm.contactPhone || '—' }}</dd></div><div><dt>อีเมล</dt><dd>{{ farm.email || '—' }}</dd></div></dl></article><article><h2>ที่ตั้งและสาธารณูปโภค</h2><dl><div><dt>ที่อยู่ฟาร์ม</dt><dd class="address">{{ farm.address || '—' }}</dd></div></dl></article><article><h2>ภาพรวมฟาร์ม</h2><dl><div><dt>โรงเรือน</dt><dd>{{ farm.houseCount }} โรงเรือน</dd></div><div><dt>ผู้ใช้ในฟาร์ม</dt><dd>{{ farm.userCount }} บัญชี</dd></div><div><dt>สถานะ</dt><dd>{{ farm.active ? 'ใช้งานอยู่' : 'ระงับบริการ' }}</dd></div></dl></article></template></section></template>
<style scoped>
.farm-info{max-width:1200px;margin:15px auto;color:#293426}header{margin-bottom:24px}h1{font-size:24px;font-weight:800;margin:0 0 7px}header p{font-size:12px;color:#8a887a;margin:0}article{background:white;border:1px solid #e5ddce;border-radius:13px;padding:21px 24px;margin:14px 0}h2{font-size:14px;font-weight:700;margin:0 0 18px}dl{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:22px 35px}dt{font-size:11px;color:#8b8679;margin-bottom:5px}dd{font-size:13px;margin:0;overflow-wrap:anywhere}.address{white-space:pre-line}.notice{background:white;border:1px solid #e5ddce;border-radius:13px;padding:24px;color:#817d6c}.error{background:#fff0e9;color:#a63828}button{cursor:pointer;color:inherit;background:transparent;border:0;text-decoration:underline}@media(max-width:650px){dl{grid-template-columns:1fr}}
</style>
