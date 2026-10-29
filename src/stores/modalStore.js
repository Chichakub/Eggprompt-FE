import { defineStore } from 'pinia';

export const useModalStore = defineStore('modal', {
  state: () => ({
    activeModal: null,
    title: '',
    message: '',
    confirmText: 'ตกลง',
    confirmTo: null,
  }),

  actions: {
    openSuccess({
      title = 'ดำเนินการสำเร็จ',
      message = '',
      confirmText = 'ตกลง',
      confirmTo = null,
    } = {}) {
      this.$reset();

      this.title = title;
      this.message = message;
      this.confirmText = confirmText;
      this.confirmTo = confirmTo;
      this.activeModal = 'success';
    },

    openError({
      title = 'ดำเนินการไม่สำเร็จ',
      message = 'กรุณาลองอีกครั้ง',
      confirmText = 'ลองอีกครั้ง',
    } = {}) {
      this.$reset();

      this.title = title;
      this.message = message;
      this.confirmText = confirmText;
      this.activeModal = 'error';
    },

    close() {
      this.$reset();
    },
  },
});