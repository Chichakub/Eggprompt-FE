<script setup>
import { Warehouse } from 'lucide-vue-next'

defineProps({
  houses: { type: Array, required: true },
})

const selectedId = defineModel({ type: Number, default: null })
</script>

<template>
  <fieldset>
    <legend class="mb-2 text-sm font-semibold text-[#202b21]">
      เลือกโรงเรือนที่ต้องการบันทึก
    </legend>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label v-for="house in houses" :key="house.houseId" class="cursor-pointer">
        <input
          v-model="selectedId"
          type="radio"
          name="feed-house"
          :value="house.houseId"
          class="peer sr-only"
        />

        <span
          class="flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl
                 border border-[#ded8c8] bg-[#f8f5eb] p-3 text-[#202b21]
                 peer-checked:border-[#405329] peer-checked:bg-[#405329]
                 peer-checked:text-white peer-focus-visible:outline-2
                 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#405329]"
        >
          <Warehouse :size="18" aria-hidden="true" />
          <span class="text-sm font-semibold">{{ house.houseName }}</span>
          <slot name="house-detail" :house="house" />
        </span>
      </label>
    </div>
  </fieldset>
</template>