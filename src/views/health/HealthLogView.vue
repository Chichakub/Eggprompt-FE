<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { ClipboardCheck, Info, Plus } from 'lucide-vue-next';
import HealthCountField from '@/components/health/HealthCountField.vue';
import HealthCaseList from '@/components/health/HealthCaseList.vue';
import { flockApi, healthCaseApi, healthLogApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';

const displayToday = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeZone: 'Asia/Bangkok' }).format(new Date());

const auth = useAuthStore();
const modal = useModalStore();
const modes = [
  { id: 'dead', label: 'ไก่ตาย' },
  { id: 'cull', label: 'ไก่คัดทิ้ง' },
  { id: 'vaccine', label: 'ให้วัคซีน' },
  { id: 'medicine', label: 'ให้ยา' },
];
const unknownCause = 'ไม่ทราบสาเหตุ';
const incidentCauses = [unknownCause, 'เจ็บป่วย', 'บาดเจ็บ', 'สภาพแวดล้อม', 'อื่น ๆ'];
const lossCauses = {
  dead: ['เจ็บป่วย', 'บาดเจ็บหรืออุบัติเหตุ', 'ถูกจิกทำร้าย', 'ปัจจัยจากสภาพแวดล้อม', 'อื่น ๆ'],
  cull: ['เจ็บป่วย', 'บาดเจ็บ', 'อ่อนแอหรือสภาพร่างกายไม่เหมาะสม', 'ผลผลิตต่ำตามเกณฑ์ฟาร์ม', 'อื่น ๆ'],
};
const severities = { LOW: 'เล็กน้อย', MEDIUM: 'ปานกลาง', HIGH: 'เฝ้าระวังพิเศษ' };
const number = new Intl.NumberFormat('th-TH');
const dateParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' });
const flocks = ref([]);
const selectedId = ref(null);
const mode = ref('dead');
const form = reactive({ count: 0, cause: '', treatment: '', remark: '' });
const incident = reactive({ flockId: null, cause: '', count: '', severity: 'MEDIUM', note: '' });
const loading = ref(false);
const saving = ref(false);
const loadError = ref('');
const saveError = ref('');
const confirmation = ref(null);
const dialog = ref(null);
const incidentDialog = ref(null);
const incidentError = ref('');
const caseList = ref(null);
let generation = 0;

const selected = computed(() => flocks.value.find((flock) => flock.flockId === selectedId.value));
const activeModeLabel = computed(() => modes.find((tab) => tab.id === mode.value).label);
const isLoss = computed(() => mode.value === 'dead' || mode.value === 'cull');
const incidentFlock = computed(() => flocks.value.find((flock) => flock.flockId === incident.flockId));
const remaining = computed(() => (selected.value?.currentCount ?? 0)
  - (isLoss.value ? Number(form.count) : 0));
const validCount = (value) => Number.isSafeInteger(value) && value >= 0;
const canReview = computed(() => {
  if (!selected.value || loading.value || saving.value || loadError.value) return false;
  if (isLoss.value) return validCount(form.count) && form.count > 0 && remaining.value >= 0;
  return Boolean(form.treatment.trim()) && selected.value.currentCount > 0;
});

function resetForm() {
  Object.assign(form, { count: 0, cause: '', treatment: '', remark: '' });
  saveError.value = '';
}

async function loadFlocks(reset = false) {
  const version = ++generation;
  if (reset) {
    dialog.value?.close();
    incidentDialog.value?.close();
    confirmation.value = null;
    flocks.value = [];
    selectedId.value = null;
    resetForm();
  }
  loadError.value = '';
  loading.value = false;
  if (!auth.isAuthenticated || !auth.effectiveFarmId) return;
  loading.value = true;
  try {
    const { data } = await flockApi.list(auth.isSuperAdmin ? { farmId: auth.effectiveFarmId } : {});
    if (version !== generation) return;
    flocks.value = data.filter((flock) => flock.status !== 'RETIRED')
      .sort((left, right) => left.houseId - right.houseId || left.flockId - right.flockId);
    if (!selected.value) selectedId.value = flocks.value[0]?.flockId ?? null;
  } catch (error) {
    if (version === generation) loadError.value = error.response?.data?.message || 'โหลดข้อมูลฝูงไก่ไม่สำเร็จ';
  } finally {
    if (version === generation) loading.value = false;
  }
}

function pickFlock(id) {
  if (id === selectedId.value) return;
  selectedId.value = id;
  resetForm();
}

function pickMode(id) {
  if (id === mode.value) return;
  mode.value = id;
  resetForm();
}

function recordDate() {
  const date = Object.fromEntries(dateParts.formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${date.year}-${date.month}-${date.day}`;
}

function openIncident() {
  Object.assign(incident, { flockId: selectedId.value, cause: '', count: '', severity: 'MEDIUM', note: '' });
  incidentError.value = '';
  incidentDialog.value.showModal();
}

async function saveIncident() {
  if (saving.value) return;
  const flock = incidentFlock.value;
  if (!flock || !incident.cause || !validCount(incident.count) || incident.count < 1
    || incident.count > flock.currentCount) {
    incidentError.value = 'กรุณาเลือกโรงเรือนและสาเหตุ แล้วระบุจำนวนไก่ที่ได้รับผลกระทบให้ถูกต้อง';
    return;
  }
  const version = generation;
  saving.value = true;
  incidentError.value = '';
  try {
    await healthCaseApi.create({
      flockId: flock.flockId, cause: incident.cause, affectedCount: incident.count,
      severity: incident.severity, note: incident.note.trim() || null,
    });
    if (version !== generation) return;
    incidentDialog.value?.close();
    caseList.value?.loadCases();
    modal.openSuccess({ title: 'บันทึกสำเร็จ', message: 'เพิ่มเคสสุขภาพแล้ว' });
  } catch (error) {
    if (version === generation) incidentError.value = error.response?.data?.message || 'บันทึกเคสสุขภาพไม่สำเร็จ';
  } finally {
    saving.value = false;
  }
}

function review() {
  if (!canReview.value) return;
  const cause = form.cause || unknownCause;
  confirmation.value = {
    houseName: selected.value.houseName,
    mode: activeModeLabel.value,
    cause: isLoss.value ? cause : null,
    treatment: form.treatment.trim(),
    payload: {
      flockId: selected.value.flockId,
      recordDate: recordDate(),
      liveHenCount: remaining.value,
      deadCount: mode.value === 'dead' ? form.count : 0,
      cullCount: mode.value === 'cull' ? form.count : 0,
      deathCause: mode.value === 'dead' ? cause : null,
      cullCause: mode.value === 'cull' ? cause : null,
      treatmentNote: !isLoss.value ? `${activeModeLabel.value} ${form.treatment.trim()}` : null,
      remark: form.remark.trim() || null,
    },
  };
  dialog.value.showModal();
}

async function submitHealthLog(payload) {
  if (saving.value) return;
  const version = generation;
  saving.value = true;
  saveError.value = '';
  try {
    const { data } = await healthLogApi.create(payload);
    if (version !== generation) return;
    const flock = flocks.value.find((item) => item.flockId === payload.flockId);
    if (Number.isSafeInteger(data.currentCount)) {
      flock.currentCount = data.currentCount;
    } else {
      await loadFlocks();
    }
    dialog.value?.close();
    resetForm();
    if (payload.deadCount || payload.cullCount) caseList.value?.loadLossHistory(true);
    modal.openSuccess({ title: 'บันทึกสำเร็จ', message: 'บันทึกข้อมูลสุขภาพไก่แล้ว' });
  } catch (error) {
    if (version !== generation) return;
    dialog.value?.close();
    if (error.response?.status === 409) await loadFlocks();
    saveError.value = error.response?.data?.message || 'ยืนยันผลการบันทึกไม่ได้ กรุณาตรวจสอบข้อมูลก่อนส่งอีกครั้ง';
  } finally {
    saving.value = false;
  }
}

watch([() => auth.isAuthenticated, () => auth.effectiveFarmId], () => loadFlocks(true), { immediate: true });
onBeforeUnmount(() => { generation++; });
</script>

<template>
  <section class="health-page" :aria-busy="loading">
    <header class="page-header">
      <div><h1>ข้อมูลสุขภาพไก่</h1><p>บันทึกสุขภาพและจำนวนไก่ตายหรือคัดทิ้งประจำวัน</p></div>
      <span class="date-chip">วันนี้ {{ displayToday }}</span>
    </header>
    <p v-if="loading" role="status">กำลังโหลดข้อมูลฝูงไก่…</p>
    <p v-if="loadError" class="error" role="alert">{{ loadError }} <button type="button" @click="loadFlocks()">ลองใหม่</button></p>
    <p v-if="!loading && !loadError && !flocks.length">ยังไม่มีโรงเรือนที่มีฝูงไก่สำหรับบันทึก</p>

    <fieldset v-if="flocks.length" class="house-picker" :disabled="loading || saving">
      <legend>เลือกโรงเรือนที่ต้องการบันทึก</legend>
      <div class="house-cards">
        <label v-for="flock in flocks" :key="flock.flockId" class="choice">
          <input type="radio" name="health-flock" :checked="selectedId === flock.flockId" @change="pickFlock(flock.flockId)" />
          <span class="house-card">
            <strong>{{ flock.houseName }}</strong>
            <small>ฝูง {{ flock.flockCode }}</small>
            <small>คงเหลือ <strong>{{ number.format(flock.currentCount) }}</strong> ตัว</small>
          </span>
        </label>
      </div>
    </fieldset>

    <form v-if="selected" class="record-panel" @submit.prevent="review">
      <div class="record-header">
        <h2>บันทึกข้อมูล {{ selected.houseName }}</h2>
        <button type="button" class="primary new-event" :disabled="loading || saving"
          aria-haspopup="dialog" @click="openIncident">
          <Plus :size="18" aria-hidden="true" /> บันทึกเหตุการณ์ใหม่
        </button>
      </div>
      <fieldset class="modes" :disabled="saving">
        <legend class="sr-only">ประเภทการบันทึก</legend>
        <label v-for="tab in modes" :key="tab.id" class="choice">
          <input type="radio" name="health-mode" :checked="mode === tab.id" @change="pickMode(tab.id)" />
          <span>{{ tab.label }}</span>
        </label>
      </fieldset>
      <fieldset class="fields" :disabled="saving">
        <HealthCountField v-if="isLoss" v-model="form.count" :label="activeModeLabel" :max="selected.currentCount" />
        <label v-else class="field">{{ mode === 'vaccine' ? 'ชื่อวัคซีน' : 'ชื่อยา/เวชภัณฑ์' }}
          <input v-model="form.treatment" maxlength="1980" required />
        </label>
        <label v-if="isLoss" class="field">{{ mode === 'dead' ? 'สาเหตุการตาย' : 'เหตุผลที่คัดทิ้ง' }} (ไม่บังคับ)
          <select v-model="form.cause">
            <option value="">{{ unknownCause }}</option>
            <option v-for="cause in lossCauses[mode]" :key="cause">{{ cause }}</option>
          </select>
        </label>
        <label class="field">หมายเหตุ (ไม่บังคับ)
          <input v-model="form.remark" maxlength="2000" />
        </label>
      </fieldset>
      <p v-if="remaining < 0" class="error" role="alert">จำนวน{{ activeModeLabel }}เกินยอดไก่คงเหลือ</p>
      <div class="balance" aria-live="polite">
        <span>ไก่คงเหลือหลังบันทึก</span><strong>{{ remaining >= 0 ? number.format(remaining) + ' ตัว' : '—' }}</strong>
      </div>
      <p v-if="saveError" class="error" role="alert">{{ saveError }}</p>
      <button class="primary submit" type="submit" :disabled="!canReview">ตรวจสอบก่อนบันทึก</button>
    </form>

    <HealthCaseList v-if="auth.isAuthenticated && auth.effectiveFarmId" :key="auth.effectiveFarmId" ref="caseList" :severity-labels="severities"
      @flock-count-changed="loadFlocks()" />

    <dialog ref="dialog" class="review daily-review" aria-labelledby="health-review-title" @cancel="saving && $event.preventDefault()">
      <template v-if="confirmation">
        <div class="review-emblem"><ClipboardCheck :size="25" aria-hidden="true" /></div>
        <h2 id="health-review-title">ตรวจสอบก่อนบันทึก</h2>
        <p>{{ confirmation.houseName }} · สุขภาพไก่ประจำวัน</p>
        <dl class="review-summary">
          <div><dt>โรงเรือน</dt><dd>{{ confirmation.houseName }}</dd></div>
          <template v-if="confirmation.cause">
            <div><dt>{{ confirmation.mode }}</dt><dd class="review-number">{{ number.format(confirmation.payload.deadCount + confirmation.payload.cullCount) }} ตัว</dd></div>
            <div><dt>{{ confirmation.payload.deadCount > 0 ? 'สาเหตุการตาย' : 'เหตุผลที่คัดทิ้ง' }}</dt><dd>{{ confirmation.cause }}</dd></div>
          </template>
          <div v-if="confirmation.treatment"><dt>{{ confirmation.mode }}</dt><dd>{{ confirmation.treatment }}</dd></div>
          <div><dt>หมายเหตุ</dt><dd>{{ confirmation.payload.remark || '—' }}</dd></div>
          <div><dt>ไก่คงเหลือ</dt><dd class="review-number">{{ number.format(confirmation.payload.liveHenCount) }} ตัว</dd></div>
        </dl>
        <p class="review-help"><Info :size="15" aria-hidden="true" /> หากต้องการแก้ไขข้อมูลหลังบันทึก โปรดติดต่อ Farm Admin</p>
        <div class="review-actions">
          <button type="button" class="secondary" :disabled="saving" @click="dialog.close()">ยกเลิก</button>
          <button type="button" class="primary" :disabled="saving" @click="submitHealthLog(confirmation.payload)">{{ saving ? 'กำลังบันทึก…' : 'ยืนยันและบันทึก' }}</button>
        </div>
      </template>
    </dialog>
    <dialog ref="incidentDialog" class="review incident" aria-labelledby="health-incident-title"
      @cancel="saving && $event.preventDefault()">
      <Plus class="review-icon" :size="30" aria-hidden="true" />
      <h2 id="health-incident-title">บันทึกเหตุการณ์ใหม่</h2>
      <p>แจ้งเหตุไก่ป่วย บาดเจ็บ หรือผิดปกติ</p>
      <form @submit.prevent="saveIncident">
        <fieldset class="incident-fields fields" :disabled="saving">
          <label class="field">ผู้บันทึกข้อมูล <input :value="auth.user?.username" readonly /></label>
          <label class="field">โรงเรือนต้นทาง
            <select v-model="incident.flockId" required>
              <option :value="null" disabled>เลือกโรงเรือน</option>
              <option v-for="flock in flocks" :key="flock.flockId" :value="flock.flockId">
                {{ flock.houseName }} · {{ flock.flockCode }}
              </option>
            </select>
          </label>
          <label class="field">สาเหตุหลัก
            <select v-model="incident.cause" required>
              <option value="" disabled>เลือกสาเหตุหลัก</option>
              <option v-for="cause in incidentCauses" :key="cause">{{ cause }}</option>
            </select>
          </label>
          <label class="field">จำนวนไก่ (ตัว)
            <input v-model.number="incident.count" type="number" min="1" :max="incidentFlock?.currentCount" step="1" required />
          </label>
          <fieldset class="severity">
            <legend>ระดับความรุนแรง</legend>
            <label v-for="(label, severity) in severities" :key="severity" class="choice">
              <input v-model="incident.severity" type="radio" name="incident-severity" :value="severity" /><span>{{ label }}</span>
            </label>
          </fieldset>
          <label class="field">รายละเอียดเพิ่มเติม / หมายเหตุ
            <textarea v-model="incident.note" rows="3" maxlength="2000" placeholder="ระบุอาการที่พบหรือสิ่งที่สังเกตเห็น" />
          </label>
        </fieldset>
        <p v-if="incidentError" class="error" role="alert">{{ incidentError }}</p>
        <div class="review-actions incident-actions">
          <button type="button" class="secondary" :disabled="saving" @click="incidentDialog.close()">ยกเลิก</button>
          <button type="submit" class="primary" :disabled="saving">{{ saving ? 'กำลังบันทึก…' : 'บันทึกเหตุการณ์' }}</button>
        </div>
      </form>
    </dialog>
  </section>
</template>

<style scoped>
.health-page { max-width: 68rem; margin: 0 auto; color: #292b20; }
.date-chip { border-radius: 999px; background: #dbe7ce; padding: .25rem .75rem; font-size: .75rem; color: #405329; white-space: nowrap; }
.page-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.35rem; }
h1 { font-size: 1.65rem; font-weight: 700; }
h2 { font-size: 1.25rem; font-weight: 700; }
.page-header p, .review p { color: #605e50; margin-top: .3rem; }
.record-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .65rem; }
.record-header .new-event { margin-inline-start: auto; }
.new-event { display: inline-flex; align-items: center; gap: .4rem; }
.house-picker { min-width: 0; margin-bottom: 1.25rem; }
.house-picker legend { margin-bottom: .65rem; font-weight: 600; }
.house-cards {
  display: flex;
  gap: .75rem;
  overflow-x: auto;
  padding: .25rem .25rem .6rem;
}
.house-cards .choice { flex: 0 0 min(13.5rem, 80%); }
.choice { position: relative; display: block; cursor: pointer; }
.choice input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.choice input:focus-visible + span { outline: 2px solid #475830; outline-offset: 2px; }
.choice span { display: block; }
.house-card {
  height: 100%;
  min-height: 5.5rem;
  padding: .8rem .9rem;
  border: 1px solid #dfd5bf;
  border-radius: .9rem;
  background: #fffcf6;
  overflow-wrap: anywhere;
}
.house-card small { display: block; margin-top: .25rem; }
.house-picker input:checked + .house-card,
.modes input:checked + span { background: #465831; border-color: #465831; color: white; }
.record-panel {
  border-radius: 1.25rem;
  background: #eee9da;
  padding: clamp(1rem, 3vw, 1.5rem);
}
.modes { display: flex; flex-wrap: wrap; gap: .5rem; margin: 1rem 0; }
.modes span { padding: .45rem .8rem; border-radius: 2rem; }
.fields { display: grid; gap: .75rem; }
.field { display: grid; align-content: start; gap: .5rem; padding: 1rem; background: #fffcf6; border-radius: 1rem; font-weight: 600; }
.field input, .field select { width: 100%; min-width: 0; padding: .6rem .75rem; border: 1px solid #ded3bc; border-radius: .65rem; background: white; font-weight: 400; }
.balance { display: flex; justify-content: space-between; gap: .75rem; padding: .85rem 1rem; margin-top: 1rem; border-radius: .75rem; background: #fbefcb; }
.primary, .secondary { padding: .75rem 1rem; border-radius: .75rem; font-weight: 600; cursor: pointer; }
.primary { background: #f3cc85; color: #302617; }
.secondary { background: #f0ebdf; color: #302617; }
.submit { display: block; width: min(100%, 22rem); margin: 1rem auto 0; box-shadow: 0 2px #ae772b; }
button:disabled { opacity: .55; cursor: default; }
.error { margin: .65rem 0; color: #9a2626; }
.error button { text-decoration: underline; }
.review { position: fixed; inset: 0; margin: auto; width: min(27rem, calc(100% - 2rem)); max-height: calc(100dvh - 2rem); overflow: auto; padding: 1.5rem; border-radius: 1.25rem; background: #fffcf6; color: inherit; box-shadow: 0 16px 40px #231d1638; text-align: center; }
.review::backdrop { background: #292b2050; }
.review-icon { margin: 0 auto .75rem; color: #77572b; }
.daily-review { width: min(24rem, calc(100% - 2rem)); padding: clamp(1.1rem, 5vw, 1.8rem); background: #faf7f0; }
.daily-review::backdrop { background: #292b202c; }
.review-emblem {
  display: grid; place-items: center; width: 3.75rem; height: 3.75rem;
  margin: 0 auto .9rem; border-radius: 50%; border: .35rem solid #eee1c1;
  background: #f3dca9; color: #74501f;
}
.review-summary { margin: 1.2rem 0 .65rem; padding: .25rem .9rem; border: 1px solid #e1d7c2; border-radius: .8rem; background: #f4efdf; }
.review-summary > div {
  display: grid; grid-template-columns: minmax(5rem, 1fr) minmax(0, 1.6fr);
  align-items: center; gap: .65rem; padding: .75rem 0;
}
.review-summary > div + div { border-top: 1px solid #e1d7c2; }
.review-summary dt { text-align: left; color: #605e50; font-size: .88rem; }
.review-summary dd { text-align: right; font-weight: 600; overflow-wrap: anywhere; }
.review-summary .review-number { font-size: 1.25rem; font-weight: 700; }
.daily-review .review-help { display: flex; align-items: flex-start; gap: .4rem; text-align: left; font-size: .75rem; margin: .65rem 0 1rem; }
.review-help svg { flex: none; margin-top: .1rem; }
.daily-review .secondary { border: 1px solid #dbd0bd; }
.review-actions { display: flex; flex-wrap: wrap; gap: .65rem; }
.review-actions button { flex: 1; }
.incident { width: min(32rem, calc(100% - 2rem)); }
.incident-fields { margin: 1.15rem 0; text-align: left; }
.incident .field { padding: 0; background: transparent; }
.incident input[readonly] { background: #f0ebdf; }
.incident textarea { width: 100%; padding: .6rem .75rem; border: 1px solid #ded3bc; border-radius: .65rem; background: white; font-weight: 400; }
.incident .error { color: #9a2626; }
.severity { display: flex; flex-wrap: wrap; gap: .4rem; }
.severity legend { margin-bottom: .45rem; font-weight: 600; }
.severity .choice { flex: 1; text-align: center; }
.severity span { padding: .45rem .55rem; border: 1px solid #ded3bc; border-radius: .65rem; }
.severity input:checked + span { background: #f3cc85; border-color: #f3cc85; }
</style>
