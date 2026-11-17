<script setup>
import { onMounted, ref } from "vue";
import { Pause } from "lucide-vue-next";
import BaseButton from "@/components/form/BaseButton.vue";

defineProps({
  title: { type: String, required: true },
  message: { type: String, required: true },
  cancelText: { type: String, default: "ยกเลิก" },
  confirmText: { type: String, default: "ตกลง" },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["cancel", "confirm"]);
const dialog = ref(null);
onMounted(() => dialog.value?.showModal());
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
      class="confirm-modal"
      @cancel.prevent="!loading && emit('cancel')"
    >
      <div
        class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#efd39c] bg-[#fff0cf] text-[#a76a00]"
        aria-hidden="true"
      >
        <Pause :size="25" :stroke-width="3" />
      </div>

      <h2 id="confirm-modal-title" class="mt-3 text-base font-bold text-[#202b21]">
        {{ title }}
      </h2>
      <p id="confirm-modal-description" class="mt-3 whitespace-pre-line text-xs leading-relaxed text-[#7d8378]">
        {{ message }}
      </p>
      <div class="mt-5 flex justify-center gap-3">
        <BaseButton autofocus variant="secondary" :disabled="loading" @click="emit('cancel')">
          {{ cancelText }}
        </BaseButton>
        <BaseButton :loading="loading" loading-text="กำลังออก..." @click="emit('confirm')">
          {{ confirmText }}
        </BaseButton>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.confirm-modal {
  position: fixed;
  inset: 0;
  width: calc(100% - 40px);
  max-width: 380px;
  margin: auto;
  padding: 28px 24px;
  border: 0;
  border-radius: 22px;
  background: #faf7f2;
  text-align: center;
  box-shadow: 0 16px 28px rgb(35 40 24 / 28%);
}
.confirm-modal::backdrop {
  background: rgb(247 242 231 / 75%);
  backdrop-filter: blur(3px);
}
</style>
