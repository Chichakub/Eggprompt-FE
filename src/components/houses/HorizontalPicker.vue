<script setup>
import { nextTick, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

defineProps({ label: { type: String, default: 'เลือกโรงเรือน' } });
const track = ref(null);
const overflow = ref(false), atStart = ref(true), atEnd = ref(true);
let observer;
function update() {
  const el = track.value;
  if (!el) return;
  overflow.value = el.scrollWidth > el.clientWidth + 2;
  atStart.value = el.scrollLeft <= 2;
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
}
function move(direction) {
  track.value?.scrollBy({ left: direction * Math.max(220, track.value.clientWidth * .75), behavior: 'smooth' });
}
onMounted(async () => {
  await nextTick();
  observer = new ResizeObserver(update);
  observer.observe(track.value);
  // Slot contents can arrive after the houses request finishes.
  observer.observe(track.value.firstElementChild || track.value);
  update();
});
onUpdated(update);
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div class="horizontal-picker">
    <button v-if="overflow" type="button" class="scroll-arrow" aria-label="เลื่อนโรงเรือนไปทางซ้าย" :disabled="atStart" @click="move(-1)"><ChevronLeft :size="19" /></button>
    <div ref="track" class="picker-track" :aria-label="label" tabindex="0" @scroll.passive="update" @focusin="update">
      <slot />
    </div>
    <button v-if="overflow" type="button" class="scroll-arrow" aria-label="เลื่อนโรงเรือนไปทางขวา" :disabled="atEnd" @click="move(1)"><ChevronRight :size="19" /></button>
  </div>
</template>

<style scoped>
.horizontal-picker{display:flex;align-items:center;gap:8px;min-width:0;max-width:100%}
.picker-track{display:flex;flex:1;gap:12px;min-width:0;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x proximity;scrollbar-width:thin;scrollbar-color:#9ba788 #eee9dd;padding:4px 2px 12px}
.picker-track:deep(>label),.picker-track:deep(>button){flex:0 0 clamp(220px,27vw,280px);min-width:0;scroll-snap-align:start;overflow-wrap:anywhere}
.picker-track:focus-visible{outline:2px solid #8b9a74;outline-offset:3px;border-radius:10px}
.scroll-arrow{flex:none;display:grid;place-items:center;width:34px;height:42px;border:1px solid #ded8c8;background:#fffdf7;color:#405329;border-radius:10px;cursor:pointer}
.scroll-arrow:disabled{opacity:.35;cursor:default}
@media(max-width:600px){.picker-track:deep(>label),.picker-track:deep(>button){flex-basis:220px}.scroll-arrow{width:28px}.horizontal-picker{gap:4px}}
</style>
