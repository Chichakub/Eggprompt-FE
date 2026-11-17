<script setup>
import { onMounted, ref } from 'vue';
import { Trash2, TriangleAlert } from 'lucide-vue-next';

defineProps({ loading: { type: Boolean, default: false } });
const emit = defineEmits(['cancel', 'confirm']);
const dialog = ref(null);
onMounted(() => dialog.value?.showModal());
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="confirm-modal" aria-labelledby="del-title" aria-describedby="del-desc" @cancel.prevent="emit('cancel')">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-200 bg-red-100 text-red-600" aria-hidden="true">
        <Trash2 :size="24" />
      </div>
      <h2 id="del-title" class="mt-3 text-xl font-bold text-[#202b21]">ลบโรงเรือนนี้ใช่ไหม?</h2>
      <p id="del-desc" class="mt-2 flex items-center justify-center gap-1 text-xs text-red-700">
        <TriangleAlert :size="14" aria-hidden="true" /> การลบไม่สามารถย้อนกลับได้
      </p>
      <div class="mt-5 grid grid-cols-2 gap-3">
        <button type="button" autofocus :disabled="loading" class="min-h-10 rounded-xl border border-[#e2d9c9] bg-[#f7f3ea] px-4 py-2 text-xs font-semibold text-[#202b21] hover:bg-[#efe9da] disabled:opacity-60" @click="emit('cancel')">ยกเลิก</button>
        <button type="button" :disabled="loading" :aria-busy="loading" class="min-h-10 rounded-xl bg-[#c94b4b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#b53f3f] disabled:opacity-60" @click="emit('confirm')">
          {{ loading ? 'กำลังลบ...' : 'ยืนยัน' }}
        </button>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.confirm-modal { position: fixed; inset: 0; width: calc(100% - 40px); max-width: 420px; margin: auto; padding: 28px 24px 24px; border: 0; border-radius: 22px; background: #faf7f2; text-align: center; box-shadow: 0 16px 28px rgb(35 40 24 / 28%); }
.confirm-modal::backdrop { background: rgb(247 242 231 / 75%); backdrop-filter: blur(3px); }
</style>
