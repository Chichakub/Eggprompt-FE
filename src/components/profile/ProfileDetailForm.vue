<script setup>
import { Building2, Mail, Phone, User } from 'lucide-vue-next';

defineProps({
  profile: { type: Object, default: null },
  loading: { type: Boolean, default: false },
});

defineEmits(['change-password']);

const PASSWORD_MASK = '••••••••••••';
</script>

<template>
  <section class="detail-card" :aria-busy="loading">
    <h2 class="title">รายละเอียดข้อมูลผู้ใช้</h2>

    <form class="grid" @submit.prevent>
      <!-- ชื่อ-สกุล -->
      <div class="field">
        <label for="pf-name">ชื่อ - สกุล (Name - Last Name) <b class="req">*</b></label>
        <div class="control">
          <input id="pf-name" type="text" :value="profile?.fullName ?? ''" readonly />
          <User class="icon" :size="16" />
        </div>
      </div>

      <!-- สิทธิ์ -->
      <div class="field">
        <label for="pf-role">สิทธิ์ผู้ใช้งาน</label>
        <div class="control">
          <input id="pf-role" type="text" :value="profile?.roleName ?? ''" readonly />
        </div>
      </div>

      <!-- อีเมล -->
      <div class="field">
        <label for="pf-email">อีเมล (Email) <b class="req">*</b></label>
        <div class="control">
          <input id="pf-email" type="email" :value="profile?.email ?? ''" readonly />
          <Mail class="icon" :size="16" />
        </div>
      </div>

      <!-- เบอร์โทร -->
      <div class="field">
        <label for="pf-phone">เบอร์โทรศัพท์ (Phone Number) <b class="req">*</b></label>
        <div class="control">
          <input id="pf-phone" type="tel" :value="profile?.phone ?? ''" readonly />
          <Phone class="icon" :size="16" />
        </div>
      </div>

      <!-- Username -->
      <div class="field">
        <label for="pf-username">ชื่อผู้ใช้งาน (Username)</label>
        <div class="control">
          <input id="pf-username" type="text" :value="profile?.username ?? ''" readonly />
        </div>
      </div>

      <!-- Password (masked) -->
      <div class="field">
        <div class="label-row">
          <label for="pf-password">รหัสผ่าน (Password)</label>
          <button type="button" class="link-btn" @click="$emit('change-password')">
            เปลี่ยนรหัสผ่าน
          </button>
        </div>
        <div class="control">
          <input id="pf-password" type="text" :value="PASSWORD_MASK" readonly tabindex="-1" />
        </div>
      </div>

      <!-- ตำแหน่ง (เต็มแถว) -->
      <div class="field full">
        <label for="pf-position">ตำแหน่ง</label>
        <div class="control">
          <input id="pf-position" type="text" :value="profile?.position ?? ''" readonly />
          <Building2 class="icon" :size="16" />
        </div>
      </div>
    </form>
  </section>
</template>

<style scoped>
.detail-card {
  background: #fff;
  border: 1px solid #e9e5da;
  border-radius: 20px;
  padding: 28px;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(36, 51, 25, 0.04);
}

.title {
  margin: 0 0 22px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ece8de;
  font-size: 16px;
  font-weight: 700;
  color: #243319;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 20px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.field.full {
  grid-column: 1 / -1;
}

label {
  font-size: 12px;
  color: #3b4a2a;
}
.req {
  color: #e5484d;
  font-weight: 400;
}
.label-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.link-btn {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: #e08a00;
  cursor: pointer;
}
.link-btn:hover {
  text-decoration: underline;
}

.control {
  position: relative;
}
.control input {
  width: 100%;
  height: 46px;
  padding: 0 40px 0 16px;
  border: 1px solid #e0dccf;
  border-radius: 12px;
  background: #f1ede3;
  color: #243319;
  font: inherit;
  font-size: 14px;
  box-sizing: border-box;
  text-overflow: ellipsis;
  cursor: default;
}
.control input:focus {
  outline: 2px solid #8c9c70;
  outline-offset: 1px;
}
.icon {
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  color: #8a93a0;
  pointer-events: none;
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .detail-card {
    padding: 20px;
  }
}
</style>