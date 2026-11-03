<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { Check, ChevronLeft, ChevronRight, Eye, EyeOff, Pencil, Plus, Search, Trash2, UserPlus, X } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/authStore';
import { userManagementApi as api } from '@/services/api';

const auth = useAuthStore();
const roles = ['Super Admin', 'Farm Admin', 'Farm Staff', 'Finance Staff'];
const roleDescriptions = ['ดูแลทุกฟาร์ม ผู้ใช้ และการตั้งค่าระบบ', 'จัดการข้อมูลฟาร์ม คลังสินค้า และผู้ใช้ของฟาร์ม', 'บันทึกงานประจำวัน เช่น ไข่ อาหาร และการตาย', 'จัดการรายรับ รายจ่าย และใบสั่งซื้อ'];
const assignableRoles = computed(() => auth.isSuperAdmin ? roles : roles.slice(2));
const rows = ref([]), counts = ref({}), total = ref(0), totalPages = ref(0);
const search = ref(''), role = ref(''), page = ref(0), size = ref(10);
const loading = ref(false), busy = ref(false), error = ref(''), formError = ref('');
const creating = ref(false), editing = ref(null), deleting = ref(null), success = ref('');
const editDialog = ref(null), deleteDialog = ref(null), successDialog = ref(null);
const showPassword = ref(false);
const form = reactive({ username: '', password: '', role: '', farmId: '', active: true });
const rules = computed(() => [form.password.length >= 8, /[A-Z]/.test(form.password) && /[a-z]/.test(form.password), /\d/.test(form.password), /[^A-Za-z0-9\s]/.test(form.password)]);
const ruleLabels = ['ความยาวอย่างน้อย 8 ตัวอักษร', 'มีพิมพ์ใหญ่และพิมพ์เล็ก (A-Z, a-z)', 'มีตัวเลขอย่างน้อย 1 ตัว (0-9)', 'มีอักขระพิเศษ (@, #, $, % ฯลฯ)'];
const canCreate = computed(() => /^[A-Za-z0-9._-]{4,24}$/.test(form.username) && form.role && rules.value.every(Boolean) && (form.role === 'Super Admin' || !auth.isSuperAdmin || form.farmId.trim()));
const cards = computed(() => [{ key: '', label: 'ผู้ใช้ทั้งหมด', count: counts.value.all || 0 }, ...roles.slice(1).map(r => ({ key: r, label: r, count: counts.value[r] || 0 }))]);
let sequence = 0, debounce;
const message = e => e.response?.data?.message || 'ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง';
const own = u => Number(u.userId) === Number(auth.user?.user_id);
const manageable = u => !own(u) && (auth.isSuperAdmin || ['Farm Staff', 'Finance Staff'].includes(u.role));
const roleClass = r => ({ 'Super Admin': 'super', 'Farm Admin': 'admin', 'Farm Staff': 'staff', 'Finance Staff': 'finance' }[r]);
function date(value, time = false) {
  return value ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', ...(time ? { timeStyle: 'short' } : {}) }).format(new Date(value)) : 'ยังไม่เคยเข้าสู่ระบบ';
}
async function load() {
  const id = ++sequence;
  loading.value = true; error.value = '';
  try {
    const { data } = await api.list({ search: search.value.trim(), role: role.value, page: page.value, size: size.value });
    if (id !== sequence) return;
    if (page.value > 0 && !data.content.length) { page.value--; return; }
    rows.value = data.content; total.value = data.totalElements; totalPages.value = data.totalPages; counts.value = data.counts;
  } catch (e) { if (id === sequence) error.value = message(e); }
  finally { if (id === sequence) loading.value = false; }
}
watch(search, () => { clearTimeout(debounce); debounce = setTimeout(() => { page.value === 0 ? load() : page.value = 0; }, 300); });
watch([role, size], () => { clearTimeout(debounce); page.value === 0 ? load() : page.value = 0; });
watch(page, load);
onMounted(load);
onBeforeUnmount(() => { clearTimeout(debounce); sequence++; });
function startCreate() {
  formError.value = ''; showPassword.value = false;
  Object.assign(form, { username: '', password: '', role: '', farmId: auth.user?.farm_id || '', active: true });
  creating.value = true;
}
async function startEdit(user) {
  formError.value = ''; editing.value = user;
  Object.assign(form, { username: user.username, role: user.role, active: user.active });
  await nextTick(); editDialog.value.showModal();
}
function closeEdit() { if (busy.value) return; editDialog.value?.close(); editing.value = null; formError.value = ''; }
async function notify(text) { success.value = text; await nextTick(); successDialog.value.showModal(); }
async function save() {
  if (busy.value) return;
  busy.value = true; formError.value = '';
  const isNew = creating.value;
  try {
    if (isNew) await api.create({ username: form.username, password: form.password, role: form.role, farmId: form.farmId || null });
    else await api.update(editing.value.userId, { username: form.username, role: form.role, active: form.active });
    creating.value = false; form.password = '';
    editDialog.value?.close(); editing.value = null;
    await load(); await notify(isNew ? 'เพิ่มผู้ใช้งานสำเร็จ' : 'แก้ไขผู้ใช้งานสำเร็จ');
  } catch (e) { formError.value = message(e); }
  finally { busy.value = false; }
}
async function toggle(user) {
  if (busy.value) return;
  busy.value = true; error.value = '';
  try { await api.update(user.userId, { username: user.username, role: user.role, active: !user.active }); await load(); }
  catch (e) { error.value = message(e); }
  finally { busy.value = false; }
}
async function confirmDelete(user) { deleting.value = user; formError.value = ''; await nextTick(); deleteDialog.value.showModal(); }
function closeDelete() { if (!busy.value) { deleteDialog.value?.close(); deleting.value = null; } }
async function remove() {
  if (busy.value) return;
  busy.value = true; formError.value = '';
  try { await api.remove(deleting.value.userId); deleteDialog.value.close(); deleting.value = null; await load(); await notify('ลบผู้ใช้งานสำเร็จ'); }
  catch (e) { formError.value = message(e); }
  finally { busy.value = false; }
}
</script>

<template>
  <section class="user-management">
    <template v-if="!creating">
      <header class="page-heading"><div><h1>จัดการผู้ใช้งาน</h1><p>กำหนดสิทธิ์และดูแลบัญชีของทุกคนที่เข้าใช้งานระบบ</p></div><button class="primary" @click="startCreate"><Plus :size="16" /> เพิ่มผู้ใช้งาน</button></header>
      <div class="summary-cards"><button v-for="card in cards" :key="card.key" class="summary" :class="{ selected: role === card.key }" :aria-pressed="role === card.key" @click="role = card.key"><span>{{ card.label }}</span><strong>{{ card.count }}</strong></button></div>
      <div class="table-toolbar"><span>แสดง {{ rows.length }} จาก {{ total }} คน</span><label class="search"><Search :size="16" /><input v-model="search" aria-label="ค้นหา Username" placeholder="ค้นหา Username" maxlength="100" /></label></div>
      <p v-if="error" class="error" role="alert">{{ error }} <button @click="load">ลองใหม่</button></p>
      <div class="table-container" :aria-busy="loading"><table><thead><tr><th>ผู้ใช้งาน</th><th>สิทธิ์</th><th>สร้างเมื่อ</th><th>เข้าสู่ระบบล่าสุด</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>
        <tr v-if="loading"><td colspan="6" class="empty">กำลังโหลดข้อมูล…</td></tr>
        <tr v-else-if="!rows.length"><td colspan="6" class="empty">{{ error ? 'โหลดข้อมูลไม่สำเร็จ' : 'ไม่พบผู้ใช้งาน' }}</td></tr>
        <tr v-for="u in loading ? [] : rows" :key="u.userId">
          <td><div class="user-cell"><span class="avatar" :class="roleClass(u.role)">{{ u.username.charAt(0).toUpperCase() }}</span><div><strong>{{ u.username }}</strong><small v-if="own(u)">บัญชีของคุณ</small></div></div></td>
          <td><span class="badge" :class="roleClass(u.role)">{{ u.role }}</span></td><td>{{ date(u.createdAt) }}</td><td>{{ date(u.lastLoginAt, true) }}</td>
          <td><div class="status"><button class="switch" :class="{ on: u.active }" role="switch" :aria-checked="u.active" :aria-label="`สถานะ ${u.username}`" :disabled="busy || !manageable(u)" @click="toggle(u)"><span /></button><span class="status-label" :class="{ inactive: !u.active }">{{ u.active ? 'ใช้งานอยู่' : 'ระงับการใช้งาน' }}</span></div></td>
          <td><div class="actions"><button class="icon-button" :aria-label="`แก้ไข ${u.username}`" :disabled="busy || !manageable(u)" @click="startEdit(u)"><Pencil :size="15" /></button><button class="icon-button" :aria-label="`ลบ ${u.username}`" :disabled="busy || !manageable(u)" @click="confirmDelete(u)"><Trash2 :size="15" /></button></div></td>
        </tr>
      </tbody></table></div>
      <footer class="pagination"><label>แสดง <select v-model.number="size" aria-label="จำนวนรายการต่อหน้า"><option :value="10">10</option><option :value="20">20</option><option :value="50">50</option></select> รายการต่อหน้า</label><div><button class="icon-button" aria-label="หน้าก่อนหน้า" :disabled="page === 0 || loading" @click="page--"><ChevronLeft :size="16" /></button><span>หน้า {{ page + 1 }} / {{ Math.max(1, totalPages) }}</span><button class="icon-button" aria-label="หน้าถัดไป" :disabled="page + 1 >= totalPages || loading" @click="page++"><ChevronRight :size="16" /></button></div></footer>
    </template>
    <form v-else class="create-card" @submit.prevent="save">
      <div class="create-icon"><UserPlus :size="24" /></div><h1>เพิ่มผู้ใช้ใหม่</h1><p>กรุณากำหนดข้อมูลสำหรับสร้างบัญชีผู้ใช้ใหม่<br />เพื่อให้ผู้ใช้สามารถเข้าถึงระบบตามสิทธิ์ที่กำหนด</p>
      <label>กำหนดสิทธิ์ผู้ใช้ (User Role) <em>*</em><select v-model="form.role" required :disabled="busy"><option disabled value="">เลือกสิทธิ์ผู้ใช้</option><option v-for="r in assignableRoles" :key="r">{{ r }}</option></select></label>
      <label v-if="auth.isSuperAdmin && form.role && form.role !== 'Super Admin'">รหัสฟาร์ม <em>*</em><input v-model="form.farmId" required maxlength="100" :disabled="busy" placeholder="เช่น FARM-001" /><small>ระบุรหัสฟาร์มที่มีอยู่ในระบบ</small></label>
      <label>ชื่อผู้ใช้ (Username) <em>*</em><input v-model="form.username" required pattern="[A-Za-z0-9._\-]{4,24}" minlength="4" maxlength="24" autocomplete="off" :disabled="busy" /><small>ตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง ยาว 4–24 ตัว</small></label>
      <label>รหัสผ่านเริ่มต้น (Temporary Password) <em>*</em><span class="password-field"><input v-model="form.password" :type="showPassword ? 'text' : 'password'" required autocomplete="new-password" :disabled="busy" placeholder="ระบุรหัสผ่านอย่างน้อย 8 ตัวอักษร" /><button type="button" :aria-label="showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'" @click="showPassword = !showPassword"><component :is="showPassword ? EyeOff : Eye" :size="17" /></button></span></label>
      <div class="strength"><span :style="{ width: `${rules.filter(Boolean).length * 25}%` }" /></div><div class="password-rules"><span v-for="(text, i) in ruleLabels" :key="text" :class="{ met: rules[i] }">{{ rules[i] ? '✓' : '○' }} {{ text }}</span></div>
      <p v-if="formError" class="error" role="alert">{{ formError }}</p><button class="primary full" :disabled="busy || !canCreate"><Check :size="17" />{{ busy ? 'กำลังบันทึก…' : 'สร้างผู้ใช้ใหม่' }}</button><button type="button" class="text-button" :disabled="busy" @click="creating = false; form.password = ''">ยกเลิก</button>
    </form>
    <Teleport to="body">
      <dialog ref="editDialog" class="edit-drawer" aria-labelledby="edit-title" @cancel.prevent="closeEdit"><form @submit.prevent="save"><header><div><h2 id="edit-title">แก้ไขผู้ใช้งาน</h2><p>{{ editing?.username }}</p></div><button type="button" class="icon-button" aria-label="ปิด" :disabled="busy" @click="closeEdit"><X :size="18" /></button></header><div class="drawer-content"><label>กำหนดสิทธิ์ผู้ใช้ <em>*</em></label><label v-for="r in assignableRoles" :key="r" class="role-option" :class="{ chosen: form.role === r }"><input v-model="form.role" type="radio" :value="r" :disabled="busy" /><div><strong>{{ r }}</strong><small>{{ roleDescriptions[roles.indexOf(r)] }}</small></div></label><label>Username <em>*</em><input v-model="form.username" required pattern="[A-Za-z0-9._\-]{4,24}" minlength="4" maxlength="24" :disabled="busy" /></label><small>ตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง ยาว 4–24 ตัว</small><label>Password<input type="password" value="********" disabled /></label><small>ไม่สามารถแก้ไขรหัสผ่านในหน้านี้</small><div class="status-box"><div><strong>สถานะการใช้งาน</strong><small>เปิดเพื่ออนุญาตให้เข้าสู่ระบบได้ตามปกติ</small></div><button type="button" class="switch" :class="{ on: form.active }" role="switch" :aria-checked="form.active" aria-label="สถานะการใช้งาน" :disabled="busy" @click="form.active = !form.active"><span /></button></div><p v-if="formError" class="error" role="alert">{{ formError }}</p></div><footer><button type="button" class="secondary" :disabled="busy" @click="closeEdit">ยกเลิก</button><button class="primary" :disabled="busy">{{ busy ? 'กำลังบันทึก…' : 'บันทึก' }}</button></footer></form></dialog>
      <dialog ref="deleteDialog" class="confirm-dialog" aria-labelledby="delete-title" @cancel.prevent="closeDelete"><div class="delete-icon"><Trash2 :size="28" /></div><h2 id="delete-title">ลบผู้ใช้งานนี้ใช่ไหม?</h2><p>{{ deleting?.username }} จะเข้าสู่ระบบไม่ได้หลังจากลบ</p><p class="delete-note">บัญชีนี้จะถูกนำออกจากรายการผู้ใช้งาน</p><p v-if="formError" class="error" role="alert">{{ formError }}</p><div class="confirm-actions"><button class="secondary" :disabled="busy" @click="closeDelete">ยกเลิก</button><button class="danger" :disabled="busy" @click="remove">{{ busy ? 'กำลังลบ…' : 'ยืนยัน' }}</button></div></dialog>
      <dialog ref="successDialog" class="confirm-dialog" aria-labelledby="success-title" @close="success = ''"><div class="success-icon"><Check :size="32" /></div><h2 id="success-title">{{ success }}</h2><p>บันทึกข้อมูลเรียบร้อยแล้ว</p><button class="primary full" autofocus @click="successDialog.close()">ตกลง</button></dialog>
    </Teleport>
  </section>
</template>

<style scoped>
.user-management{color:#292b24;max-width:1600px;margin:0 auto;font-size:13px}h1,h2,p{margin:0}h1{font-size:24px;font-weight:800}h2{font-size:21px;font-weight:800}p,small{color:#817e70}small{display:block;font-size:11px;line-height:1.6}button,input,select{font:inherit}button{cursor:pointer;transition:background .15s}button:disabled{opacity:.45;cursor:not-allowed}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #b8791f;outline-offset:3px}button{border:0}input,select{border:1px solid #ded7c8;border-radius:10px;padding:11px 12px;background:white;color:#292b24;min-width:0}label>input,label>select{display:block;width:100%;box-sizing:border-box;margin-top:8px}label{font-weight:600}em{color:#c34b42;font-style:normal}.page-heading{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:8px 0 25px}.page-heading p{font-size:12px;margin-top:4px}.primary,.secondary,.danger{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:11px 18px;border-radius:11px;font-weight:700}.primary{background:#f6d390;color:#29301f}.primary:hover{background:#efc36c}.secondary{background:#f4efe5;border:1px solid #ded7c8}.danger{background:#cc4747;color:white}.full{width:100%;box-sizing:border-box;margin-top:25px}.summary-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.summary{background:white;border:1px solid #e6dfd3;border-radius:15px;padding:19px;text-align:left;box-shadow:0 1px 2px #30281708}.summary.selected{border-color:#e68b1c;box-shadow:0 0 0 1px #e68b1c}.summary span{display:block;color:#777367;font-size:12px}.summary strong{display:block;font-size:29px;margin-top:10px}.table-toolbar{display:flex;justify-content:space-between;align-items:center;margin:25px 0 12px;color:#8b8679;font-size:12px}.search{display:flex;align-items:center;gap:8px;background:white;border:1px solid #e6dfd3;border-radius:11px;padding:0 11px}.search input{border:0;padding:9px 0;width:210px;font-weight:400}.table-container{overflow-x:auto;border:1px solid #e6dfd3;border-radius:15px;background:white;min-height:150px}table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}th{font-size:11px;color:#8a867a;font-weight:400;padding:15px 20px}td{padding:15px 20px;border-top:1px solid #f1ede5;font-size:12px}.user-cell{display:flex;align-items:center;gap:12px}.user-cell strong{font-size:13px}.avatar{height:33px;width:33px;border-radius:50%;display:grid;place-items:center;font-weight:700}.badge{display:inline-block;border-radius:20px;padding:5px 10px;font-size:11px}.super{background:#ffb3c0;color:#8c2d46}.admin{background:#efdcb8;color:#875719}.staff{background:#dce7d2;color:#366234}.finance{background:#dce3f0;color:#435a83}.status{display:flex;align-items:center;gap:8px}.switch{width:37px;height:21px;border-radius:15px;background:#ddd6c1;padding:3px;display:flex;align-items:center;flex-shrink:0}.switch span{height:15px;width:15px;border-radius:50%;background:white;box-shadow:0 1px 3px #0002}.switch.on{background:#304c37;justify-content:flex-end}.status-label{font-size:10px;padding:3px 7px;border-radius:12px;background:#dce7d2;color:#304c37}.status-label.inactive{background:#eee9dd;color:#8d8674}.actions{display:flex;gap:7px}.icon-button{border:1px solid #e7dcbc;background:#f8f4e9;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;padding:6px;color:#716c5d}.pagination,.pagination>div{display:flex;align-items:center;gap:12px}.pagination{justify-content:space-between;margin-top:18px;color:#817e70;font-size:12px}.pagination label{display:flex;align-items:center;gap:7px}.pagination label>select{display:inline-block;width:auto;margin:0;padding:5px}.empty{text-align:center;padding:50px;color:#817e70}.error{background:#fff0ec;color:#a7322f;border:1px solid #edc1b9;border-radius:9px;padding:12px;margin:12px 0;white-space:normal}.error button{background:transparent;text-decoration:underline;color:inherit}.create-card{max-width:450px;margin:45px auto;background:white;border:1px solid #e5dfd4;border-radius:17px;padding:36px;box-shadow:0 10px 20px #3028170a}.create-icon{display:grid;place-items:center;width:58px;height:58px;margin:0 auto 25px;border:1px solid #f3d58b;border-radius:15px;color:#e59416;background:#fbf6e9}.create-card h1,.create-card>p{text-align:center}.create-card>p{line-height:1.8;margin:20px 0 30px}.create-card>label{display:block;margin-top:23px}.password-field{display:flex;align-items:center;border:1px solid #ded7c8;border-radius:10px;margin-top:8px}.password-field input{width:100%;border:0}.password-field button{background:transparent;color:#898475;padding:10px}.strength{height:5px;background:#eae7de;border-radius:4px;margin:10px 0}.strength span{display:block;height:100%;background:#749c61;border-radius:4px}.password-rules{display:grid;grid-template-columns:1fr 1fr;gap:9px;font-size:10px;color:#8c94a7}.password-rules .met{color:#3d743b}.text-button{display:block;margin:17px auto 0;background:transparent;color:#696b65}.edit-drawer,.confirm-dialog{color:#292b24;border:1px solid #e8e0d3;box-shadow:0 22px 35px #292f2733}.edit-drawer::backdrop,.confirm-dialog::backdrop{background:#f8f4e5aa}.edit-drawer{position:fixed;inset:0 0 0 auto;margin:0;width:min(470px,100vw);height:100dvh;max-height:100dvh;max-width:100vw;padding:0;box-sizing:border-box;background:white}.edit-drawer form{display:flex;flex-direction:column;height:100%}.edit-drawer header{display:flex;justify-content:space-between;padding:27px}.edit-drawer header p{font-size:12px;margin-top:5px}.drawer-content{overflow-y:auto;flex:1;padding:0 27px 25px}.drawer-content>label{display:block;margin-top:22px;font-size:12px}.drawer-content>.role-option{display:flex;gap:12px;align-items:flex-start;padding:15px;border:1px solid #e3dac8;border-radius:15px;margin-top:10px;cursor:pointer}.role-option input{accent-color:#e58a1c;margin:2px 0}.role-option.chosen{border-color:#e58a1c;background:#fcf7ed;box-shadow:0 0 0 1px #e58a1c}.role-option small{margin-top:3px;font-weight:400}.status-box{display:flex;justify-content:space-between;align-items:center;gap:15px;border:1px solid #e3dac8;padding:16px;border-radius:13px;margin-top:25px;font-size:12px}.edit-drawer footer{display:flex;justify-content:flex-end;gap:10px;padding:18px 27px;border-top:1px solid #ece7dc}.confirm-dialog{position:fixed;inset:0;margin:auto;max-height:calc(100dvh - 40px);overflow-y:auto;width:360px;max-width:calc(100vw - 40px);box-sizing:border-box;border-radius:25px;padding:33px 28px;background:#faf7f2;text-align:center}.confirm-dialog p{font-size:13px;line-height:1.7;margin-top:12px}.success-icon,.delete-icon{display:grid;place-items:center;width:75px;height:75px;border-radius:50%;margin:0 auto 22px}.success-icon{background:#dff5e4;color:#2f8339;border:1px solid #bde8c7}.delete-icon{background:#fce5df;color:#b53c2d;border:1px solid #f7d5cd}.delete-note{color:#ad392c!important}.confirm-actions{display:flex;gap:12px;margin-top:25px}.confirm-actions button{flex:1}@media(max-width:1000px){.summary-cards{grid-template-columns:repeat(2,1fr)}td,th{padding:13px}.page-heading{align-items:flex-start}}@media(max-width:600px){.page-heading{flex-direction:column}.table-toolbar{align-items:flex-start;gap:12px;flex-direction:column}.search{width:100%;box-sizing:border-box}.search input{width:100%}.create-card{margin:10px auto;padding:24px}.pagination{flex-wrap:wrap}.password-rules{grid-template-columns:1fr}.summary{padding:14px}}
</style>
