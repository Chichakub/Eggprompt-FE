<script setup>
import { onMounted, reactive, ref } from 'vue';
import { Check, SquarePen, X } from 'lucide-vue-next';
import { userService } from '@/services/userService';
import { useModalStore } from '@/stores/modalStore';
import ProfileCard from '@/components/profile/ProfileCard.vue';
import ProfileDetailForm from '@/components/profile/ProfileDetailForm.vue';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal.vue';

const profile = ref(null);
const loading = ref(true);
const errorMessage = ref('');
const showChangePassword = ref(false);
const modalStore = useModalStore();

const editing = ref(false);
const saving = ref(false);
const saveError = ref('');
const draft = reactive({ fullName: '', email: '', phone: '' });
const errors = reactive({ fullName: '', email: '', phone: '' });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{8,9}$/; // เบอร์ไทย 9–10 หลัก (ตัด - และเว้นวรรคก่อนตรวจ)

async function loadProfile() {
  loading.value = true;
  errorMessage.value = '';
  try {
    profile.value = await userService.getMyProfile();
  } catch (err) {
    errorMessage.value =
      err.response?.data?.message ?? 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง';
  } finally {
    loading.value = false;
  }
}

function clearErrors() {
  Object.keys(errors).forEach((k) => (errors[k] = ''));
  saveError.value = '';
}

function handleEdit() {
  if (!profile.value || editing.value) return;
  Object.assign(draft, {
    fullName: profile.value.fullName ?? '',
    email: profile.value.email ?? '',
    phone: profile.value.phone ?? '',
  });
  clearErrors();
  editing.value = true;
}

function handleCancel() {
  if (saving.value) return;
  editing.value = false;
  clearErrors();
}

function updateField(key, value) {
  draft[key] = value;
  if (key in errors) errors[key] = '';
  saveError.value = '';
}

function validate() {
  clearErrors();
  const email = draft.email.trim();
  const phone = draft.phone.replace(/[\s-]/g, '');

  if (!draft.fullName.trim()) errors.fullName = 'กรุณากรอกชื่อ - สกุล';
  else if (draft.fullName.trim().length > 255) errors.fullName = 'ชื่อ - สกุลต้องไม่เกิน 255 ตัวอักษร';

  if (!email) errors.email = 'กรุณากรอกอีเมล';
  else if (!EMAIL_RE.test(email)) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';

  if (!phone) errors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
  else if (!PHONE_RE.test(phone)) errors.phone = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';

  return !Object.values(errors).some(Boolean);
}

async function handleSave() {
  if (saving.value || !editing.value || !validate()) return;

  saving.value = true;
  try {
    profile.value = await userService.updateMyProfile({
      fullName: draft.fullName.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
    });
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.message;
    // 409 = อีเมลซ้ำ → ชี้ไปที่ช่องอีเมล
    if (status === 409 && message?.includes('อีเมล')) {
      errors.email = message;
    } else if (status === 400 && message === 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง') {
      errors.phone = message;
    } else {
      saveError.value = message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
    }
    return;
  } finally {
    saving.value = false;
  }

  editing.value = false;
  clearErrors();
  modalStore.openSuccess({ title: 'แก้ไขสำเร็จ', message: 'แก้ไขแล้ว', confirmText: 'ตกลง' });
}

function handleChangePassword() {
  if (!profile.value || loading.value || saving.value) return;

  showChangePassword.value = true;
}

onMounted(loadProfile);
</script>

<template>
  <div class="profile-page">
    <ChangePasswordModal v-if="showChangePassword" @close="showChangePassword = false" />
    <header class="page-head">
      <h1>บัญชีของฉัน</h1>
      <div v-if="editing" class="head-actions">
        <button type="button" class="edit-btn" :disabled="saving" @click="handleCancel">
          <X :size="18" />
          ยกเลิก
        </button>
        <button type="button" class="edit-btn primary" :disabled="saving" @click="handleSave">
          <Check :size="18" />
          {{ saving ? 'กำลังบันทึก...' : 'ยืนยันการแก้ไข' }}
        </button>
      </div>
      <button v-else type="button" class="edit-btn" :disabled="!profile" @click="handleEdit">
        <SquarePen :size="18" />
        แก้ไข
      </button>
    </header>

    <div v-if="saveError" class="error-box" role="alert">
      <span>{{ saveError }}</span>
    </div>

    <div v-if="errorMessage" class="error-box" role="alert">
      <span>{{ errorMessage }}</span>
      <button type="button" class="retry-btn" @click="loadProfile">ลองใหม่</button>
    </div>

    <div class="layout">
      <ProfileCard :profile="profile" :loading="loading" />
      <ProfileDetailForm
        :profile="profile"
        :loading="loading"
        :editing="editing"
        :draft="draft"
        :errors="errors"
        @update-field="updateField"
        @submit="handleSave"
        @change-password="handleChangePassword"
      />
    </div>
  </div>
</template>

<style scoped>

.profile-page {
  box-sizing: border-box;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 36px;
}

.page-head h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #243319;
}

.edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 0 28px;
  border: 1px solid #ddd8ca;
  border-radius: 12px;
  background: #f7f3ea;
  color: #243319;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.edit-btn:hover:not(:disabled) {
  background: #efe9da;
}

.head-actions {
  display: flex;
  gap: 12px;
}

.edit-btn.primary {
  border-color: #f6d390;
  background: #f6d390;
}

.edit-btn.primary:hover:not(:disabled) {
  background: #efc36c;
}

.edit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 16px;
  border: 1px solid #f3c1c1;
  border-radius: 12px;
  background: #fff1f1;
  color: #b42318;
  font-size: 14px;
}

.retry-btn {
  padding: 6px 14px;
  border: 1px solid #f3c1c1;
  border-radius: 8px;
  background: #fff;
  color: #b42318;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.layout {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(0, 2.1fr);
  gap: 32px;
  align-items: start;
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>