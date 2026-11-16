<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Eye, Search, Warehouse, Users, Ban, Network, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { adminFarmApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
const router = useRouter(), route = useRoute(), auth = useAuthStore();
const rows = ref([]), summary = ref(null), search = ref(''), status = ref('all'), page = ref(0), total = ref(0), pages = ref(0);
const loading = ref(false), error = ref(''), opening = ref(null);
const format = value => Number(value || 0).toLocaleString('th-TH');
const filters = [{ value:'all', label:'ทั้งหมด' }, { value:'active', label:'ใช้งานอยู่' }, { value:'suspended', label:'ระงับบริการ' }];
const cards = computed(() => [
  { title:'ฟาร์มที่ลงทะเบียน', value:`${format(summary.value?.farms)} ฟาร์ม`, detail:'ฟาร์มทั้งหมดในเครือข่ายระบบกลาง', icon:Network, color:'blue' },
  { title:'โรงเรือนรวมทุกฟาร์ม', value:`${format(summary.value?.houses)} หลัง`, detail:`ความจุไก่ ${format(summary.value?.capacity)} ตัว`, icon:Warehouse, color:'green' },
  { title:'ผู้ใช้งานในระบบ', value:`${format(summary.value?.users)} บัญชี`, detail:summary.value ? ['Super Admin','Farm Admin','Farm Staff','Finance Staff'].map((r,i) => `${['Super','Admin','Staff','Finance'][i]} ${format(summary.value.usersByRole?.[r])}`).join(' / ') : 'กำลังโหลดข้อมูล', icon:Users, color:'orange' },
  { title:'ฟาร์มที่ถูกระงับสิทธิ์', value:`${format(summary.value?.suspended)} ฟาร์ม`, detail:'จำนวนฟาร์มที่อยู่ในสถานะระงับบริการ', icon:Ban, color:'red' },
]);
let timer, requestId = 0;
async function load() {
  const id = ++requestId; loading.value = true; error.value = '';
  try {
    const { data } = await adminFarmApi.list({ search:search.value.trim(), status:status.value, page:page.value, size:10 });
    if (id !== requestId) return;
    rows.value = data.content; total.value = data.totalElements; pages.value = data.totalPages;
  } catch (e) { if (id === requestId) error.value = e.response?.data?.message || 'โหลดรายการฟาร์มไม่สำเร็จ กรุณาลองใหม่'; }
  finally { if (id === requestId) loading.value = false; }
}
async function refresh() {
  await Promise.all([load(), adminFarmApi.summary().then(({data}) => summary.value = data).catch(() => error.value = 'โหลดสถิติไม่สำเร็จ กรุณาลองใหม่')]);
}
async function inspect(farm) {
  opening.value = farm.farmId; error.value = '';
  try {
    const {data} = await adminFarmApi.detail(farm.farmId);
    auth.inspectFarm(data);
    await router.push({ name:'farm-info', query:{ farmId:farm.farmId } });
  } catch (e) { error.value = e.response?.data?.message || 'ไม่สามารถเปิดฟาร์มนี้ได้ กรุณาลองใหม่'; }
  finally { opening.value = null; }
}
watch(search, () => { clearTimeout(timer); timer = setTimeout(() => { page.value === 0 ? load() : page.value = 0; },300); });
watch(status, () => { clearTimeout(timer); page.value === 0 ? load() : page.value = 0; });
watch(page, load);
onMounted(() => { auth.leaveInspection(); refresh(); });
onBeforeUnmount(() => { clearTimeout(timer); requestId++; });
</script>
<template>
  <section class="all-farms"><h1>ฟาร์มทั้งหมดในเครือข่ายระบบกลาง</h1>
    <div class="stat-grid"><article v-for="card in cards" :key="card.title" class="stat-card"><span class="stat-icon" :class="card.color"><component :is="card.icon" :size="20" /></span><p>{{ card.title }}</p><strong>{{ summary ? card.value : '—' }}</strong><small>{{ card.detail }}</small></article></div>
    <div class="farm-panel"><div class="toolbar"><label class="search"><Search :size="18" /><input v-model="search" placeholder="ค้นหาชื่อฟาร์ม เจ้าของ หรือรหัสฟาร์ม" aria-label="ค้นหาฟาร์ม" maxlength="100" /></label><div class="filters"><button v-for="filter in filters" :key="filter.value" :class="{ selected:status === filter.value }" :aria-pressed="status === filter.value" @click="status = filter.value">{{ filter.label }}</button></div></div>
      <p v-if="route.query.error && !error" role="alert" class="error">ไม่สามารถเข้าถึงฟาร์มที่เลือกได้ กรุณาเลือกฟาร์มอีกครั้ง</p><p v-if="error" class="error" role="alert">{{ error }} <button @click="refresh">ลองใหม่</button></p>
      <div class="table-wrap" :aria-busy="loading"><table><thead><tr><th>รหัสฟาร์ม</th><th>ชื่อฟาร์ม</th><th>เจ้าของฟาร์ม / ADMIN</th><th>โรงเรือน</th><th>บัญชีพนักงาน</th><th>สถานะ</th><th><span class="sr-only">ตรวจสอบฟาร์ม</span></th></tr></thead><tbody><tr v-if="loading"><td colspan="7" class="empty">กำลังโหลดข้อมูล…</td></tr><tr v-else-if="!rows.length"><td colspan="7" class="empty">{{ error ? 'โหลดข้อมูลไม่สำเร็จ' : 'ไม่พบฟาร์มที่ตรงกับการค้นหา' }}</td></tr><tr v-for="farm in loading ? [] : rows" :key="farm.farmId"><td class="farm-id">{{ farm.farmId }}</td><td><strong>{{ farm.farmName }}</strong></td><td><div class="owner"><Users :size="14" />{{ farm.ownerName || farm.adminName || '—' }}</div><small v-if="farm.adminName && farm.adminName !== farm.ownerName">Admin: {{ farm.adminName }}</small></td><td>{{ format(farm.houseCount) }} โรงเรือน</td><td>{{ format(farm.userCount) }} บัญชี</td><td><span class="status" :class="{ suspended: !farm.active }">{{ farm.active ? 'ใช้งานอยู่' : 'ระงับบริการ' }}</span></td><td><button class="inspect" :aria-label="`ตรวจสอบ ${farm.farmName}`" :disabled="opening !== null" @click="inspect(farm)"><Eye :size="14" />{{ opening === farm.farmId ? 'กำลังเปิด…' : 'ตรวจสอบ' }}</button></td></tr></tbody></table></div>
      <footer><span>ทั้งหมด {{ format(total) }} ฟาร์ม</span><div><button aria-label="หน้าก่อนหน้า" :disabled="page === 0 || loading" @click="page--"><ChevronLeft :size="16" /></button><span>หน้า {{ page + 1 }} / {{ Math.max(1,pages) }}</span><button aria-label="หน้าถัดไป" :disabled="page + 1 >= pages || loading" @click="page++"><ChevronRight :size="16" /></button></div></footer>
    </div>
  </section>
</template>
<style scoped>
.all-farms{max-width:1600px;margin:auto;color:#24321d}h1{font-size:25px;font-weight:800;margin:8px 0 30px}.stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-bottom:25px}.stat-card{background:#fff;border:1px solid #e9e2d6;border-radius:20px;padding:22px 17px;position:relative;box-shadow:0 2px 2px #26301a04}.stat-card p{font-size:12px;color:#748060;margin:0 35px 30px 0}.stat-card strong{font-size:25px;display:block}.stat-card small{display:block;color:#7f896f;font-size:11px;margin-top:6px;line-height:1.7}.stat-icon{position:absolute;right:15px;top:18px;display:grid;place-items:center;padding:9px;border-radius:12px}.blue{background:#e0f0fa;color:#2b9ac8}.green{background:#e3efd9;color:#5c863e}.orange{background:#ffeadf;color:#d37b4b}.red{background:#fce3e3;color:#d74c4c}.farm-panel{background:#fff;border:1px solid #e7dfd1;border-radius:22px;padding:30px 24px;min-height:330px}.toolbar{display:flex;align-items:center;gap:14px;margin:15px 0 24px}.search{display:flex;flex:1;max-width:650px;border:1px solid #70815d;border-radius:12px;padding:8px 13px;gap:10px;align-items:center}.search input{border:0;background:transparent;min-width:0;width:100%;font:inherit;font-size:12px;outline-offset:4px}.filters{display:flex;gap:9px;flex-wrap:wrap}button{font:inherit;cursor:pointer}button:disabled{opacity:.5;cursor:wait}.filters button,.inspect{border:1px solid #526344;border-radius:22px;background:white;color:#344525;padding:5px 13px;font-size:11px;font-weight:700}.filters .selected{background:#344525;color:white}.table-wrap{border:1px solid #e9e0d2;border-radius:14px;overflow:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:12px}th{background:#faf7ef;color:#788168;font-size:11px;font-weight:700;padding:17px}td{border-top:1px solid #eee7da;padding:20px 17px}tbody tr:nth-child(odd){background:#fcfbf8}.owner{display:flex;align-items:center;gap:7px}.farm-id{font-size:11px;max-width:165px;overflow-wrap:anywhere}td small{display:block;font-size:10px;color:#829173;margin-top:5px}.inspect{display:flex;align-items:center;gap:7px;white-space:nowrap}.status{font-size:10px;color:#47743e;white-space:nowrap}.status.suspended{color:#b84436}.empty{text-align:center;padding:45px;color:#8e8b7e}.error{background:#fff0e9;color:#a63828;padding:13px;border-radius:9px}.error button{border:0;background:transparent;color:inherit;text-decoration:underline}footer,footer>div{display:flex;align-items:center;gap:14px}footer{justify-content:space-between;font-size:11px;color:#85866f;margin-top:20px}footer button{display:flex;border:1px solid #e5dece;border-radius:7px;padding:5px;background:#fcfaf5}button:focus-visible{outline:2px solid #bd8b2e;outline-offset:3px}@media(max-width:1100px){.stat-grid{grid-template-columns:repeat(2,1fr)}.toolbar{flex-wrap:wrap}.search{flex-basis:100%;max-width:none}}@media(max-width:600px){.stat-grid{grid-template-columns:1fr}.farm-panel{padding:16px}h1{font-size:21px}}
</style>
