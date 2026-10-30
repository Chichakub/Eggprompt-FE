<script setup>
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  required: { type: Boolean, default: false },
  error: { type: String, default: '' },
});

const model = defineModel({ type: String, default: '' });
</script>

<template>
  <div>
    <label :for="id" class="mb-2 block text-[11px] font-medium">
      {{ label }}
      <span v-if="required" class="text-red-600" aria-hidden="true">*</span>
    </label>

    <div class="relative">
      <div
        v-if="$slots.icon"
        class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#8b9a74]"
        aria-hidden="true"
      >
        <slot name="icon" />
      </div>

      <input
        :id="id"
        v-model="model"
        :name="id"
        :type="type"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : undefined"
        class="min-h-10 w-full rounded-[9px] border bg-[#fffdfa] py-2 text-xs outline-none placeholder:text-[#929789] focus:ring-2 focus:ring-[#8b9a74]/20"
        :class="[
          error ? 'border-red-500' : 'border-[#e9dfd0] focus:border-[#8b9a74]',
          $slots.icon ? 'pl-10' : 'pl-3',
          $slots.trailing ? 'pr-11' : 'pr-3',
        ]"
      />

      <div
        v-if="$slots.trailing"
        class="absolute inset-y-0 right-0 flex items-center"
      >
        <slot name="trailing" />
      </div>
    </div>

    <p
      v-if="error"
      :id="`${id}-error`"
      role="alert"
      class="mt-2 text-[11px] text-red-700"
    >
      {{ error }}
    </p>
  </div>
</template>