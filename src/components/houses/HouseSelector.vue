<script setup>
import { computed, ref, useId, watch } from 'vue';
import { Warehouse } from 'lucide-vue-next';
import HorizontalPicker from './HorizontalPicker.vue';

const props = defineProps({
  houses: { type: Array, required: true },
  flocks: { type: Array, default: () => [] },
  statusReady: { type: Boolean, default: true },
  disabled: Boolean,
});
const selectedId = defineModel({ type: Number, default: null });
const group = useId();
const filter = ref('all');
const active = computed(() => new Map(props.flocks.filter(f => f.status !== 'RETIRED').map(f => [f.houseId, f])));
const occupied = computed(() => props.houses.filter(h => active.value.has(h.houseId)).length);
const filters = computed(() => [
  { value: 'all', label: 'ทั้งหมด', count: props.houses.length },
  { value: 'occupied', label: 'เลี้ยงอยู่', count: occupied.value },
  { value: 'empty', label: 'ว่าง', count: props.houses.length - occupied.value },
]);
const visible = computed(() => props.houses.filter(h => filter.value === 'all' || (filter.value === 'occupied') === active.value.has(h.houseId)));
const number = n => Number(n || 0).toLocaleString('th-TH');
watch([visible, () => props.statusReady, () => props.disabled], ([houses, ready, disabled]) => {
  if (ready && !disabled && !houses.some(h => h.houseId === selectedId.value)) selectedId.value = houses[0]?.houseId ?? null;
}, { immediate: true });
</script>

<template>
  <fieldset class="house-selector" :disabled="disabled">
    <legend>เลือกโรงเรือนที่ต้องการบันทึก</legend>
    <div class="house-filters" aria-label="กรองสถานะโรงเรือน">
      <button v-for="item in filters" :key="item.value" type="button" :aria-pressed="filter === item.value" :disabled="!statusReady" @click="filter = item.value">
        {{ item.label }} <span>{{ statusReady ? number(item.count) : '—' }}</span>
      </button>
    </div>
    <HorizontalPicker>
      <label v-for="house in visible" :key="house.houseId" class="house-option" :data-occupancy="statusReady ? (active.has(house.houseId) ? 'occupied' : 'empty') : 'loading'">
        <input v-model="selectedId" type="radio" :name="`house-${group}`" :value="house.houseId" />
        <span class="house-card">
          <span class="card-top"><Warehouse :size="19" aria-hidden="true" /><span class="occupancy" :class="{ occupied: active.has(house.houseId) }">{{ !statusReady ? 'กำลังโหลด' : active.has(house.houseId) ? 'เลี้ยงอยู่' : 'ว่าง' }}</span></span>
          <strong class="house-name">{{ house.houseName }}</strong>
          <span class="flock-name">{{ active.get(house.houseId)?.flockCode ? 'ฝูง ' + active.get(house.houseId).flockCode : 'ยังไม่มีฝูงไก่' }}</span>
          <span class="bird-count">{{ active.has(house.houseId) ? 'ไก่ ' + number(active.get(house.houseId).currentCount) + ' ตัว' : 'พร้อมรับฝูงใหม่' }}</span>
        </span>
      </label>
    </HorizontalPicker>
    <p v-if="!visible.length" class="empty-houses">ไม่มีโรงเรือนในสถานะที่เลือก</p>
  </fieldset>
</template>

<style scoped>
.house-selector{min-inline-size:0;width:100%;max-width:100%;box-sizing:border-box;border:0;padding:0;margin:0 0 20px;color:#293426}
legend{font-size:14px;font-weight:700;margin-bottom:12px}
.house-filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.house-filters button{display:flex;align-items:center;gap:8px;border:1px solid #dcd5c5;background:#fffdf7;border-radius:20px;padding:7px 13px;font:inherit;font-size:12px;font-weight:600;cursor:pointer}
.house-filters button[aria-pressed=true]{background:#405329;border-color:#405329;color:white}
.house-filters button span{font-size:11px;opacity:.8}
.house-filters button:disabled{opacity:.55;cursor:default}
.house-option{position:relative;cursor:pointer;display:block}
.house-option input{position:absolute;width:1px;height:1px;opacity:0}
.house-card{display:flex;flex-direction:column;gap:5px;height:100%;min-height:140px;box-sizing:border-box;padding:14px 16px;border:1px solid #ded8c8;border-radius:14px;background:#fffdf7;text-align:left}
.card-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:3px}
.occupancy{font-size:11px;font-weight:600;line-height:1.4;padding:3px 9px;border-radius:20px;background:#eee6d8;color:#67543c;white-space:nowrap}
.occupancy.occupied{background:#dcefd8;color:#2f6b2a}
.house-name{font-size:14px;line-height:1.45;overflow-wrap:anywhere}
.flock-name{font-size:12px;opacity:.75;overflow-wrap:anywhere}
.bird-count{font-size:12px;font-weight:600;margin-top:auto}
input:checked + .house-card{background:#405329;border-color:#405329;color:#fff}
input:focus-visible + .house-card{outline:2px solid #9aa96e;outline-offset:3px}
fieldset:disabled .house-option{opacity:.65;cursor:default}
.empty-houses{padding:16px;color:#777665;font-size:13px}
</style>
