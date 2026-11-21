<script setup>
import { computed, onMounted, ref } from 'vue';
import { ChevronRight, ClipboardCheck, Search, X } from 'lucide-vue-next';
import { healthCaseApi, healthLogApi } from '@/services/api';

const statuses = {
  REPORTED: 'บันทึกเหตุการณ์', ASSESSED: 'ประเมินอาการ', ISOLATED: 'แยกกักกัน',
  TREATING: 'กำลังรักษา', FOLLOW_UP: 'รอตรวจติดตาม', RECOVERED: 'พร้อมกลับโรงเรือน',
};
// Older API responses do not include allowedStatuses.
const legacyStatusOptions = {
  REPORTED: ['REPORTED', 'ASSESSED', 'ISOLATED'],
  ASSESSED: ['ASSESSED', 'ISOLATED', 'TREATING', 'FOLLOW_UP', 'RECOVERED'],
  ISOLATED: ['ISOLATED', 'ASSESSED', 'TREATING', 'FOLLOW_UP', 'RECOVERED'],
  TREATING: ['TREATING', 'FOLLOW_UP', 'RECOVERED'],
  FOLLOW_UP: ['FOLLOW_UP', 'TREATING', 'RECOVERED'],
  RECOVERED: ['RECOVERED'],
};
const statusLabel = (status) => status === 'CLOSED' ? 'ปิดเคสแล้ว' : statuses[status];
const outcomeLabels = { recovered: 'ฟื้นตัว', dead: 'ตาย', culled: 'คัดทิ้ง' };
const emit = defineEmits(['flock-count-changed']);
defineProps({ severityLabels: { type: Object, required: true } });
const timestamp = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' });
const year = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Bangkok' });
const caseCode = (item) => `INC-${year.format(new Date(item.createdAt))}-${item.id.slice(0, 8).toUpperCase()}`;
const formatDate = (value) => timestamp.format(new Date(value));
const calendarDate = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeZone: 'Asia/Bangkok' });
const formatLossDate = (item) => {
  const day = calendarDate.format(new Date(`${item.recordDate}T00:00:00+07:00`));
  return item.recordedAt ? `${day} · บันทึก ${formatDate(item.recordedAt)}` : day;
};
const lossLabel = (item) => item.deadCount && item.cullCount ? 'ไก่ตายและคัดทิ้ง' : item.deadCount ? 'ไก่ตาย' : 'ไก่คัดทิ้ง';
const cases = ref([]);
const caseCodes = computed(() => new Map(cases.value.map((item) => [item.id.toLowerCase(), caseCode(item)])));
function lossRemark(remark) {
  const caseId = /^เคส ([\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12})$/i.exec(remark?.trim() || '')?.[1];
  if (!caseId) return remark;
  const code = caseCodes.value.get(caseId.toLowerCase());
  return code ? `เคส ${code}` : `เคสอ้างอิง ${caseId.slice(0, 8).toUpperCase()}`;
}
const losses = ref([]);
const loadingLosses = ref(false);
const lossError = ref('');
const loading = ref(false);
const listError = ref('');
const actionError = ref('');
const tab = ref('open');
const search = ref('');
const house = ref('');
const filterStatus = ref('');
const drawer = ref(null);
const closeDialog = ref(null);
const closingCaseId = ref(null);
const detail = ref(null);
const caseId = ref(null);
const detailLoading = ref(false);
const detailError = ref('');
const saving = ref(false);
const nextStatus = ref('');
const note = ref('');
const editing = ref(false);
const outcomes = ref({ recovered: 0, dead: 0, culled: 0 });
const closingCase = computed(() => cases.value.find((item) => item.id === closingCaseId.value));
const openCount = computed(() => cases.value.filter((item) => item.status !== 'CLOSED').length);
const closedCount = computed(() => cases.value.length - openCount.value + losses.value.length);
const history = computed(() => [...(detail.value?.history || [])].reverse());
const statusOptions = computed(() => {
  const allowed = detail.value?.allowedStatuses ?? legacyStatusOptions[detail.value?.healthCase.status] ?? [];
  return allowed.filter((status) => status !== 'CLOSED');
});
const immediateIsolation = computed(() => detail.value?.healthCase.status === 'REPORTED' && nextStatus.value === 'ISOLATED');
const canRecordRecovery = computed(() => detail.value?.canRecordRecovery
  ?? Boolean(detail.value?.history.some((entry) => ['ASSESSED', 'TREATING'].includes(entry.status))));
const visibleOutcomeLabels = computed(() => Object.entries(outcomeLabels)
  .filter(([key]) => key !== 'recovered' || canRecordRecovery.value));
const outcomeTotal = computed(() => Object.values(outcomes.value).reduce((total, count) => total + Number(count), 0));
const remaining = computed(() => (detail.value?.healthCase.remainingCount ?? 0) - outcomeTotal.value);
const noteRequired = computed(() => immediateIsolation.value
  || (detail.value?.healthCase.status === nextStatus.value && outcomeTotal.value === 0));
const canSave = computed(() => !saving.value && !detailLoading.value
  && (!noteRequired.value || Boolean(note.value.trim()))
  && statusOptions.value.includes(nextStatus.value)
  && (canRecordRecovery.value || outcomes.value.recovered === 0)
  && Object.values(outcomes.value).every((count) => Number.isSafeInteger(count) && count >= 0)
  && remaining.value >= 0 && (nextStatus.value !== 'RECOVERED' || remaining.value === 0));
const houses = computed(() => [...new Set([...cases.value, ...losses.value].map((item) => item.houseName))].sort());
const visibleRows = computed(() => {
  const query = search.value.trim().toLowerCase();
  const closed = tab.value === 'closed';
  const matchingCases = cases.value.filter((item) => (item.status === 'CLOSED') === closed
    && (!house.value || house.value === item.houseName)
    && (!filterStatus.value || filterStatus.value === item.status)
    && `${caseCode(item)} ${item.cause}`.toLowerCase().includes(query))
    .map((item) => ({ kind: 'case', item, sort: Date.parse(item.createdAt) }));
  if (!closed) return matchingCases;
  const matchingLosses = losses.value.filter((item) => (!house.value || house.value === item.houseName)
    && [item.flockCode, lossLabel(item), item.deathCause, item.cullCause, lossRemark(item.remark)].join(' ').toLowerCase().includes(query))
    .map((item) => ({ kind: 'loss', item, sort: Date.parse(`${item.recordDate}T23:59:59+07:00`) }));
  return [...matchingCases, ...matchingLosses].sort((left, right) => right.sort - left.sort);
});

let lossRequest = 0;
async function loadLossHistory(showHistory = false) {
  if (showHistory) selectTab('closed');
  const request = ++lossRequest;
  loadingLosses.value = true;
  lossError.value = '';
  try {
    const { data } = await healthLogApi.lossHistory();
    if (request === lossRequest) losses.value = data;
  } catch (error) {
    if (request === lossRequest) {
      lossError.value = error.response?.data?.message || 'โหลดประวัติไก่ตายและคัดทิ้งไม่สำเร็จ';
    }
  } finally {
    if (request === lossRequest) loadingLosses.value = false;
  }
}

async function loadCases() {
  loading.value = true;
  listError.value = '';
  try {
    const { data } = await healthCaseApi.list();
    cases.value = data;
  } catch (error) {
    listError.value = error.response?.data?.message || 'โหลดรายการเคสสุขภาพไม่สำเร็จ';
  } finally {
    loading.value = false;
  }
}

function showDetail(data) {
  detail.value = data;
  nextStatus.value = data.healthCase.status;
}

function selectTab(value) {
  tab.value = value;
  filterStatus.value = '';
}

function startEdit() {
  nextStatus.value = detail.value.healthCase.status;
  outcomes.value = { recovered: 0, dead: 0, culled: 0 };
  note.value = '';
  editing.value = true;
}

async function loadDetail() {
  detailLoading.value = true;
  detailError.value = '';
  try {
    const { data } = await healthCaseApi.detail(caseId.value);
    showDetail(data);
  } catch (error) {
    detailError.value = error.response?.data?.message || 'โหลดรายละเอียดเคสไม่สำเร็จ';
  } finally {
    detailLoading.value = false;
  }
}

function openDetail(id) {
  if (detailLoading.value || saving.value) return;
  caseId.value = id;
  detail.value = null;
  editing.value = false;
  note.value = '';
  drawer.value.showModal();
  loadDetail();
}

async function addHistory() {
  if (!canSave.value) return;
  saving.value = true;
  detailError.value = '';
  try {
    const { data } = await healthCaseApi.addHistory(caseId.value, {
      expectedStatus: detail.value.healthCase.status, expectedHistoryId: detail.value.history.at(-1).id,
      status: nextStatus.value, note: note.value.trim() || null, outcomes: outcomes.value,
    });
    showDetail(data);
    editing.value = false;
    cases.value = cases.value.map((item) => item.id === caseId.value ? data.healthCase : item);
    if (outcomes.value.dead || outcomes.value.culled) {
      emit('flock-count-changed');
      loadLossHistory();
    }
  } catch (error) {
    const message = error.response?.data?.message || 'บันทึกการติดตามไม่สำเร็จ';
    if (error.response?.status === 409) await loadDetail();
    detailError.value = message;
  } finally {
    saving.value = false;
  }
}

function openCloseDialog(item) {
  if (saving.value || item.status !== 'RECOVERED') return;
  closingCaseId.value = item.id;
  actionError.value = '';
  closeDialog.value.showModal();
}

async function closeCase() {
  const item = closingCase.value;
  if (saving.value || item?.status !== 'RECOVERED') return;
  saving.value = true;
  actionError.value = '';
  try {
    const { data: latest } = await healthCaseApi.detail(item.id);
    const { data } = await healthCaseApi.addHistory(item.id, {
      expectedStatus: 'RECOVERED', expectedHistoryId: latest.history.at(-1).id,
      status: 'CLOSED', note: 'ปิดเคส',
    });
    cases.value = cases.value.map((entry) => entry.id === item.id ? data.healthCase : entry);
    closeDialog.value?.close();
  } catch (error) {
    if (error.response?.status === 409) await loadCases();
    actionError.value = error.response?.data?.message || 'ปิดเคสไม่สำเร็จ';
  } finally {
    saving.value = false;
  }
}

defineExpose({ loadCases, loadLossHistory });
onMounted(() => {
  loadCases();
  loadLossHistory();
});
</script>

<template>
  <section class="cases" aria-labelledby="health-cases-title">
    <header class="cases-header">
      <h2 id="health-cases-title">รายการเคสสุขภาพและประวัติการติดตาม</h2>
      <div class="case-tabs" role="group" aria-label="ประเภทเคส">
        <button type="button" :aria-pressed="tab === 'open'" @click="selectTab('open')">เปิดอยู่ {{ openCount }}</button>
        <button type="button" :aria-pressed="tab === 'closed'" @click="selectTab('closed')">ปิดแล้ว {{ closedCount }}</button>
      </div>
    </header>
    <div class="filters">
      <label class="case-search">
        <Search :size="17" aria-hidden="true" />
        <input v-model="search" type="search" aria-label="ค้นหารหัสเคส ฝูง หรือสาเหตุ" placeholder="ค้นหารหัสเคส ฝูง หรือสาเหตุ" />
      </label>
        <select v-model="house" aria-label="กรองโรงเรือน">
          <option value="">ทุกโรงเรือน</option><option v-for="item in houses" :key="item">{{ item }}</option>
        </select>
        <select v-if="tab === 'open'" v-model="filterStatus" aria-label="กรองสถานะ">
          <option value="">ทุกสถานะ</option>
          <option v-for="(label, status) in statuses" :key="status" :value="status">{{ label }}</option>
        </select>
    </div>
    <div class="table-scroll">
      <table>
        <thead><tr><th>รายการ / วันที่</th><th>โรงเรือน</th><th>อาการ / สาเหตุ</th><th>{{ tab === 'open' ? 'ยังรักษา' : 'จำนวนไก่' }}</th><th>สถานะ</th><th class="management-heading">การจัดการ</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="6"><p role="status">กำลังโหลดเคสสุขภาพ…</p></td></tr>
          <tr v-else-if="listError"><td colspan="6">
            <p class="error" role="alert">{{ listError }} <button type="button" @click="loadCases">ลองใหม่</button></p>
          </td></tr>
          <tr v-if="tab === 'closed' && loadingLosses"><td colspan="6"><p role="status">กำลังโหลดประวัติไก่ตายและคัดทิ้ง…</p></td></tr>
          <tr v-if="tab === 'closed' && lossError"><td colspan="6">
            <p class="error" role="alert">{{ lossError }} <button type="button" @click="loadLossHistory()">ลองใหม่</button></p>
          </td></tr>
          <tr v-if="!loading && !listError && !visibleRows.length && !(tab === 'closed' && (loadingLosses || lossError))"><td colspan="6">ไม่พบรายการ</td></tr>
          <template v-for="{ kind, item } in visibleRows" :key="`${kind}-${item.id}`">
          <tr v-if="kind === 'case'">
            <td><strong>{{ caseCode(item) }}</strong><small>{{ formatDate(item.createdAt) }}</small></td>
            <td>{{ item.houseName }}</td><td>{{ item.cause }}</td><td>{{ tab === 'open' ? `${item.remainingCount} / ${item.affectedCount}` : `${item.affectedCount} ตัว` }}</td>
            <td><span class="status" :data-status="item.status">{{ statusLabel(item.status) }}</span></td>
            <td><div class="row-actions">
              <button type="button" class="details" @click="openDetail(item.id)">รายละเอียด <ChevronRight :size="15" /></button>
              <button v-if="tab === 'open'" type="button" class="close-case" aria-haspopup="dialog" :disabled="saving || item.status !== 'RECOVERED'" @click="openCloseDialog(item)">ปิดเคส</button>
            </div></td>
          </tr>
          <tr v-else>
            <td><strong>{{ lossLabel(item) }}</strong><small>{{ formatLossDate(item) }}</small></td>
            <td>{{ item.houseName }}<small>ฝูง {{ item.flockCode }}</small></td>
            <td>
              <p v-if="item.deadCount">ตาย · {{ item.deathCause || 'ไม่ระบุสาเหตุ' }}</p>
              <p v-if="item.cullCount">คัดทิ้ง · {{ item.cullCause || 'ไม่ระบุสาเหตุ' }}</p>
              <small v-if="item.remark">{{ lossRemark(item.remark) }}</small>
            </td>
            <td><p v-if="item.deadCount">ตาย {{ item.deadCount }} ตัว</p><p v-if="item.cullCount">คัดทิ้ง {{ item.cullCount }} ตัว</p></td>
            <td><span class="status" data-status="CLOSED">บันทึกแล้ว</span></td><td>—</td>
          </tr>
          </template>
        </tbody>
      </table>
    </div>
    <dialog ref="drawer" class="case-drawer" aria-labelledby="case-detail-title" @cancel="saving && $event.preventDefault()">
      <header class="drawer-header">
        <div><h2 id="case-detail-title">{{ detail ? caseCode(detail.healthCase) : 'รายละเอียดเคส' }}</h2>
          <template v-if="detail">
            <p>{{ detail.healthCase.houseName }} · {{ detail.healthCase.cause }}</p>
            <span v-if="severityLabels[detail.healthCase.severity]" class="case-severity" :data-severity="detail.healthCase.severity">
              ระดับความรุนแรง {{ severityLabels[detail.healthCase.severity] }}
            </span>
          </template>
        </div>
        <button type="button" class="details" aria-label="ปิดรายละเอียดเคส" :disabled="saving" @click="drawer.close()"><X :size="18" /></button>
      </header>
      <p v-if="detailLoading" role="status">กำลังโหลดรายละเอียด…</p>
      <p v-if="detailError" class="error" role="alert">{{ detailError }} <button v-if="!detail" type="button" @click="loadDetail">ลองใหม่</button></p>
      <template v-if="detail">
        <dl class="case-summary">
          <div><dt>ไก่ในเคส</dt><dd>{{ detail.healthCase.affectedCount }} ตัว</dd></div>
          <div><dt>ยังรักษาอยู่</dt><dd>{{ detail.healthCase.remainingCount }} ตัว</dd></div>
          <div><dt>สถานะ</dt><dd>{{ statusLabel(detail.healthCase.status) }}</dd></div>
        </dl>
        <h3>บันทึกประวัติย่อย</h3>
        <p v-if="!detail.history.length" class="history-empty">ยังไม่มีบันทึกการติดตาม</p>
        <ol v-else class="history">
          <li v-for="entry in history" :key="entry.id">
            <div><strong>{{ statusLabel(entry.status) }}</strong><time :datetime="entry.createdAt">{{ formatDate(entry.createdAt) }}</time></div>
            <p v-if="entry.note">{{ entry.note }}</p>
            <p v-if="entry.outcomes">ฟื้นตัว {{ entry.outcomes.recovered }} · ตาย {{ entry.outcomes.dead }} · คัดทิ้ง {{ entry.outcomes.culled }} ตัว</p>
            <small>บันทึกโดย {{ entry.recorder }}</small>
          </li>
        </ol>
        <button v-if="!editing && detail.healthCase.status !== 'CLOSED'" class="save edit-trigger" type="button" @click="startEdit">อัปเดตสถานะ</button>
        <form v-if="editing && detail.healthCase.status !== 'CLOSED'" class="follow-up" @submit.prevent="addHistory">
          <h3>บันทึกการติดตาม</h3>
          <label>สถานะ <select v-model="nextStatus" :disabled="saving">
            <option v-for="status in statusOptions" :key="status" :value="status">{{ statuses[status] }}</option>
          </select>
            <small v-if="detail.healthCase.status === 'REPORTED'">บันทึก «ประเมินอาการ» ก่อนเพื่อเลือก «กำลังรักษา» ในรอบถัดไป</small>
          </label>
          <fieldset class="outcomes" :disabled="saving">
            <legend>ผลของไก่ในเคส (ถ้ามี)</legend>
            <label v-for="[key, label] in visibleOutcomeLabels" :key="key">{{ label }}
              <input v-model.number="outcomes[key]" type="number" min="0" :max="detail.healthCase.remainingCount" step="1" required />
            </label>
            <p>ยังรักษาอยู่หลังบันทึก <strong>{{ remaining >= 0 ? remaining + ' ตัว' : '—' }}</strong></p>
            <p v-if="remaining < 0" class="error">จำนวนผลเกินยอดไก่ที่ยังรักษา</p>
            <p v-else-if="nextStatus === 'RECOVERED' && remaining > 0" class="error">ระบุผลของไก่ที่ยังรักษาให้ครบก่อนเลือกพร้อมกลับโรงเรือน</p>
          </fieldset>
          <label>{{ immediateIsolation ? 'เหตุผลที่ต้องแยกกักกันทันที' : noteRequired ? 'รายละเอียด (จำเป็น)' : 'รายละเอียด (ไม่บังคับ)' }}
            <textarea v-model="note" maxlength="2000" rows="3" :required="noteRequired" :disabled="saving" />
            <small v-if="noteRequired && !immediateIsolation">กรอกรายละเอียดเมื่อคงสถานะเดิมและไม่มีผลของไก่เพิ่ม</small>
          </label>
          <div class="row-actions">
            <button class="details" type="button" :disabled="saving" @click="editing = false">ยกเลิก</button>
            <button class="save" type="submit" :disabled="!canSave">{{ saving ? 'กำลังบันทึก…' : 'บันทึกการติดตาม' }}</button>
          </div>
        </form>
      </template>
    </dialog>
    <dialog ref="closeDialog" class="close-dialog" aria-labelledby="close-case-title"
      aria-describedby="close-case-description" @cancel="saving && $event.preventDefault()">
      <div class="close-emblem"><ClipboardCheck :size="25" aria-hidden="true" /></div>
      <h2 id="close-case-title">ยืนยันการปิดเคส</h2>
      <p id="close-case-description" class="close-description">
        เมื่อปิดเคสแล้ว จะยังสามารถเปิดดูประวัติได้
      </p>
      <dl v-if="closingCase" class="close-summary">
        <div><dt>รหัสเคส</dt><dd>{{ caseCode(closingCase) }}</dd></div>
        <div><dt>โรงเรือน</dt><dd>{{ closingCase.houseName }}</dd></div>
      </dl>
      <p v-if="actionError" class="error" role="alert">{{ actionError }}</p>
      <form class="row-actions close-actions" @submit.prevent="closeCase">
        <button type="button" class="details" autofocus :disabled="saving" @click="closeDialog.close()">ยกเลิก</button>
        <button type="submit" class="close-case" :disabled="saving || closingCase?.status !== 'RECOVERED'">
          {{ saving ? 'กำลังปิดเคส…' : 'ยืนยันปิดเคส' }}
        </button>
      </form>
    </dialog>
  </section>
</template>

<style scoped>
.cases { margin-top: 1.5rem; border: 1px solid #e4dfd2; border-radius: 1rem; background: #fffcf6; overflow: hidden; }
.cases-header, .drawer-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem; }
.cases-header { padding: 1rem 1.2rem; }
h2, h3 { font-weight: 700; }
.cases-header h2 { font-size: 1.05rem; }
.filters { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .6rem; padding: 0 1.2rem .8rem; }
.case-search { display: flex; position: relative; align-items: center; flex: 1 1 14rem; max-width: 19rem; }
.case-search svg { position: absolute; inset-inline-start: .65rem; color: #676956; pointer-events: none; }
.case-search input { width: 100%; padding-inline-start: 2rem; }
@media (max-width: 40rem) {
  .filters { justify-content: flex-start; }
  .case-search { flex-basis: 100%; max-width: none; }
}
.case-tabs, .row-actions { display: flex; flex-wrap: wrap; gap: .45rem; }
.case-tabs { margin-inline-start: auto; }
.management-heading { text-align: right; }
.case-tabs button { border: 1px solid #ddd5c5; border-radius: 2rem; padding: .45rem .8rem; cursor: pointer; }
.case-tabs button[aria-pressed="true"], .close-case { background: #405430; color: white; }
.close-case { padding: .45rem .65rem; border-radius: .6rem; white-space: nowrap; cursor: pointer; }
input, select, textarea { padding: .5rem .65rem; border: 1px solid #ddd5c5; border-radius: .55rem; background: white; }
.table-scroll { overflow-x: auto; }
table { width: 100%; min-width: 45rem; text-align: left; }
th, td { padding: .75rem; border-top: 1px solid #eee8dc; }
th { background: #f2eee2; font-size: .85rem; }
small, time { display: block; color: #666353; font-size: .8rem; }
.status { display: inline-block; white-space: nowrap; padding: .2rem .55rem; border-radius: 1rem; background: #fbefd2; color: #775319; }
.status[data-status="ASSESSED"] { background: #e6e9dd; color: #4b593c; }
.status[data-status="TREATING"] { background: #e0edf6; color: #285e8a; }
.status[data-status="RECOVERED"] { background: #d9ecd8; color: #2b6539; }
.status[data-status="ISOLATED"] { background: #f8e0df; color: #9a3734; }
.status[data-status="FOLLOW_UP"] { background: #eee3f7; color: #6a4189; }
.status[data-status="CLOSED"] { background: #e8e5dc; color: #555248; }
.details, .save { display: inline-flex; align-items: center; gap: .3rem; border-radius: .6rem; padding: .45rem .65rem; cursor: pointer; }
.details { white-space: nowrap; background: #f0ebdf; }
.save { justify-content: center; background: #f3cc85; font-weight: 600; }
button:disabled { opacity: .55; cursor: default; }
.error { color: #9a2626; }
.error button { text-decoration: underline; }
.case-drawer { position: fixed; inset: 0 0 0 auto; margin: 0; width: min(35rem, 100%); height: 100dvh; max-height: 100dvh; overflow: auto; padding: 1.25rem; background: #fffcf6; color: inherit; box-shadow: -12px 0 40px #231d1638; }
.case-drawer::backdrop { background: #292b2050; }
.close-dialog {
  position: fixed; inset: 0; margin: auto; width: min(24rem, calc(100% - 2rem));
  max-height: calc(100dvh - 2rem); overflow: auto;
  padding: clamp(1.1rem, 5vw, 1.75rem); border-radius: 1.25rem;
  background: #faf7f0; color: inherit; text-align: center;
  box-shadow: 0 16px 40px #231d1638;
}
.close-dialog::backdrop { background: #292b202c; }
.close-emblem {
  display: grid; place-items: center; width: 3.75rem; height: 3.75rem; margin: 0 auto .85rem;
  border-radius: 50%; border: .35rem solid #e1ead8; background: #d0e2c5; color: #405430;
}
.close-dialog h2 { font-size: 1.2rem; }
.close-description { margin: .5rem 0 1rem; color: #605e50; font-size: .9rem; }
.close-summary { padding: .15rem .8rem; border: 1px solid #e1d7c2; border-radius: .8rem; background: #f4efdf; }
.close-summary div { display: grid; grid-template-columns: 1fr 2fr; gap: .65rem; padding: .65rem 0; }
.close-summary div + div { border-top: 1px solid #e1d7c2; }
.close-summary dt { text-align: left; color: #605e50; }
.close-summary dd { text-align: right; font-weight: 600; overflow-wrap: anywhere; }
.close-dialog .error { margin-top: .75rem; }
.close-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 1rem; }
.close-actions button { justify-content: center; min-height: 2.75rem; padding-inline: .35rem; font-size: .9rem; font-weight: 600; }
.close-actions .details { border: 1px solid #dbd0bd; }
.drawer-header { align-items: flex-start; margin-bottom: 1rem; }
.case-severity { display: inline-block; margin-top: .45rem; padding: .22rem .6rem; border-radius: 1rem; font-size: .84rem; font-weight: 600; }
.case-severity[data-severity="LOW"] { background: #d9ecd8; color: #2b6539; }
.case-severity[data-severity="MEDIUM"] { background: #fbefd2; color: #775319; }
.case-severity[data-severity="HIGH"] { background: #f8e0df; color: #9a3734; }
.case-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr)); gap: .55rem; margin-bottom: 1rem; }
.case-summary div { background: #f2eee2; border-radius: .65rem; padding: .75rem; }
.case-summary dd { margin-top: .35rem; font-weight: 700; overflow-wrap: anywhere; }
.history, .follow-up { display: grid; gap: .65rem; margin-top: .65rem; }
.history li { padding: .75rem; border: 1px solid #e4dfd2; border-radius: .65rem; }
.history li > div { display: flex; justify-content: space-between; flex-wrap: wrap; gap: .35rem; }
.history-empty { margin-top: .5rem; color: #666353; }
.history p { margin: .4rem 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.follow-up { margin-top: 1.25rem; }
.follow-up label { display: grid; gap: .35rem; }
.edit-trigger { margin-top: 1rem; }
.outcomes { display: grid; gap: .55rem; }
.outcomes legend { font-weight: 600; margin-bottom: .4rem; }
.outcomes label { grid-template-columns: 1fr 6rem; align-items: center; }
.outcomes input { min-width: 0; }
</style>
