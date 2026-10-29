<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Check } from 'lucide-vue-next';
import { useModalStore } from '@/stores/modalStore';

const modalStore = useModalStore();
const router = useRouter();
const dialog = ref(null);

onMounted(() => dialog.value?.showModal());

function confirm() {
  const destination = modalStore.confirmTo;
  dialog.value?.close();
  modalStore.close();
  if (destination) router.push(destination);
}
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      aria-labelledby="global-success-title"
      aria-describedby="global-success-description"
      class="success-modal"
      @cancel.prevent="modalStore.close()"
    >
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#c8ebcf] bg-[#def5e3] text-[#238432]" aria-hidden="true">
        <Check :size="25" :stroke-width="3" />
      </div>
      <h2 id="global-success-title" class="mt-3 text-base font-bold text-[#202b21]">
        {{ modalStore.title }}
      </h2>
      <p id="global-success-description" class="mt-1 text-xs leading-relaxed text-[#7d8378]">
        {{ modalStore.message }}
      </p>
      <button autofocus type="button" class="mt-5 min-h-10 w-full rounded-xl bg-[#f6d390] px-4 py-2 text-xs font-semibold text-[#202b21] transition hover:bg-[#efc36c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a76a00]" @click="confirm">
        {{ modalStore.confirmText }}
      </button>
    </dialog>
  </Teleport>
</template>

<style scoped>
.success-modal {
  position: fixed;
  inset: 0;
  width: calc(100% - 40px);
  max-width: 300px;
  margin: auto;
  padding: 28px 24px 24px;
  border: 0;
  border-radius: 22px;
  background: #faf7f2;
  text-align: center;
  box-shadow: 0 16px 28px rgb(35 40 24 / 28%);
}
.success-modal::backdrop {
  background: rgb(247 242 231 / 75%);
  backdrop-filter: blur(3px);
}
</style>
