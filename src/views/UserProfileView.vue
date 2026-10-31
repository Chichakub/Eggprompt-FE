<script setup>
import { onMounted, ref } from 'vue';
import { SquarePen } from 'lucide-vue-next';
import { userService } from '@/services/userService';
import ProfileCard from '@/components/profile/ProfileCard.vue';
import ProfileDetailForm from '@/components/profile/ProfileDetailForm.vue';

const profile = ref(null);
const loading = ref(true);
const errorMessage = ref('');

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

function handleEdit() {
  // TODO: โหมดแก้ไขโปรไฟล์ (นอกขอบเขต task นี้)
}
function handleChangePassword() {
  // TODO: เปิด modal เปลี่ยนรหัสผ่าน (นอกขอบเขต task นี้)
}

onMounted(loadProfile);
</script>

<template>
  <div class="profile-page">
    <header class="page-head">
      <h1>บัญชีของฉัน</h1>
      <button type="button" class="edit-btn" :disabled="!profile" @click="handleEdit">
        <SquarePen :size="18" />
        แก้ไข
      </button>
    </header>

    <div v-if="errorMessage" class="error-box" role="alert">
      <span>{{ errorMessage }}</span>
      <button type="button" class="retry-btn" @click="loadProfile">ลองใหม่</button>
    </div>

    <div class="layout">
      <ProfileCard :profile="profile" :loading="loading" />
      <ProfileDetailForm
        :profile="profile"
        :loading="loading"
        @change-password="handleChangePassword"
      />
    </div>
  </div>
</template>

<style scoped>
/* padding และพื้นหลังมาจาก MainLayout (.content) แล้ว */
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

/* ซ้ายแคบ ขวากว้าง ตามดีไซน์ (~ 1 : 2) */
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