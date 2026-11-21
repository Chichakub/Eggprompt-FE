<script setup>
import { computed, useId } from 'vue';

const value = defineModel({ type: [Number, String], required: true });
const props = defineProps({
  label: { type: String, required: true },
  max: { type: Number, required: true },
});
const id = useId();
const count = computed(() => Math.max(0, Math.trunc(Number(value.value) || 0)));

function change(delta) {
  value.value = Math.max(0, Math.min(props.max, count.value + delta));
}
</script>

<template>
  <div class="count-field">
    <label :for="id">{{ label }} (ตัว)</label>
    <div class="count-input">
      <button type="button" :aria-label="`ลด${label} 1 ตัว`" :disabled="count === 0" @click="change(-1)">−</button>
      <input :id="id" v-model.number="value" type="number" min="0" :max="max" step="1" required />
      <button type="button" :aria-label="`เพิ่ม${label} 1 ตัว`" :disabled="count >= max" @click="change(1)">+</button>
    </div>
    <button class="reset-count" type="button" :aria-label="`ล้างค่า${label}`" @click="value = 0">ล้างค่า</button>
  </div>
</template>

<style scoped>
.count-field { padding: 1rem; background: #fffcf6; border-radius: 1rem; }
label { display: block; margin-bottom: .55rem; font-weight: 600; }
.count-input { display: grid; gap: .5rem; grid-template-columns: 3rem minmax(0, 1fr) 3rem; }
button, input { border: 1px solid #ded3bc; border-radius: .65rem; background: white; text-align: center; min-width: 0; }
button { padding: .55rem .25rem; cursor: pointer; }
button:disabled { opacity: .45; cursor: default; }
input { font-size: 1.35rem; font-weight: 700; appearance: textfield; }
input::-webkit-inner-spin-button, input::-webkit-outer-spin-button { appearance: none; }
.count-input button { font-size: 1.2rem; }
.reset-count { display: block; margin: .5rem 0 0 auto; padding: .3rem .7rem; font-size: .8rem; background: #f8f4ea; }
</style>
