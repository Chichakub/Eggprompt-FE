<script setup>
import BaseButton from '@/components/form/BaseButton.vue'

const weight = defineModel({ type: [String, Number], default: '' })

function adjustWeight(change) {
  const current = Number(weight.value)
  const next = (Number.isFinite(current) ? current : 0) + change
  weight.value = Math.max(0, Number(next.toFixed(2)))
}
</script>

<template>
  <div class="rounded-xl border border-[#ded8c8] bg-[#f8f5eb] p-3">
    <label for="feed-weight" class="mb-2 block text-xs font-medium">
      น้ำหนักอาหารที่ให้รอบนี้ (กิโลกรัม)
    </label>

    <div class="flex items-center gap-2">
      <BaseButton
        variant="secondary"
        class="shrink-0"
        aria-label="ลดน้ำหนักอาหาร 10 กิโลกรัม"
        @click="adjustWeight(-10)"
      >
        −10
      </BaseButton>

      <input
        id="feed-weight"
        v-model="weight"
        type="number"
        inputmode="decimal"
        min="0"
        step="any"
        class="min-h-10 min-w-0 flex-1 rounded-lg border border-[#ded8c8]
               bg-white px-2 text-center text-lg font-bold"
      />

      <BaseButton
        variant="secondary"
        class="shrink-0"
        aria-label="เพิ่มน้ำหนักอาหาร 10 กิโลกรัม"
        @click="adjustWeight(10)"
      >
        +10
      </BaseButton>
    </div>
  </div>
</template>