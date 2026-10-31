<script setup>
import { Building2, Mail, Phone, User } from 'lucide-vue-next';

defineProps({
  profile: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  editing: { type: Boolean, default: false },
  draft: { type: Object, default: () => ({}) },
  errors: { type: Object, default: () => ({}) },
});

defineEmits(['change-password', 'update-field', 'submit']);

const PASSWORD_MASK = '••••••••••••';
</script>

<template>
  <section class="detail-card" :aria-busy="loading">
    <h2 class="title">รายละเอียดข้อมูลผู้ใช้</h2>

    <form
      class="grid"
      :class="{ 'is-editing': editing }"
      novalidate
      @submit.prevent="editing && $emit('submit')"
    >
      <!-- ชื่อ-สกุล -->
      <div class="field">
        <label for="pf-name">ชื่อ - สกุล (Name - Last Name) <b class="req">*</b></label>
        <div class="control">
          <input
            id="pf-name"
            type="text"
            maxlength="255"
            :value="editing ? draft.fullName : (profile?.fullName ?? '')"
            :readonly="!editing"
            :class="{ editable: editing, invalid: errors.fullName }"
            @input="$emit('update-field', 'fullName', $event.target.value)"
          />
          <User class="icon" :size="16" />
        </div>
        <p v-if="errors.fullName" class="err" role="alert">{{ errors.fullName }}</p>
      </div>

      
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
          <input
            id="pf-email"
            type="email"
            maxlength="255"
            :value="editing ? draft.email : (profile?.email ?? '')"
            :readonly="!editing"
            :class="{ editable: editing, invalid: errors.email }"
            @input="$emit('update-field', 'email', $event.target.value)"
          />
          <Mail class="icon" :size="16" />
        </div>
        <p v-if="errors.email" class="err" role="alert">{{ errors.email }}</p>
      </div>

      <!-- เบอร์โทร -->
      <div class="field">
        <label for="pf-phone">เบอร์โทรศัพท์ (Phone Number) <b class="req">*</b></label>
        <div class="control">
          <input
            id="pf-phone"
            type="tel"
            maxlength="20"
            :value="editing ? draft.phone : (profile?.phone ?? '')"
            :readonly="!editing"
            :class="{ editable: editing, invalid: errors.phone }"
            @input="$emit('update-field', 'phone', $event.target.value)"
          />
          <Phone class="icon" :size="16" />
        </div>
        <p v-if="errors.phone" class="err" role="alert">{{ errors.phone }}</p>
      </div>

      <!-- Username -->
      <div class="field">
        <label for="pf-username">ชื่อผู้ใช้งาน (Username)</label>
        <div class="control">
          <input
            id="pf-username"
            type="text"
            maxlength="100"
            :value="editing ? draft.username : (profile?.username ?? '')"
            :readonly="!editing"
            :class="{ editable: editing, invalid: errors.username }"
            @input="$emit('update-field', 'username', $event.target.value)"
          />
        </div>
        <p v-if="errors.username" class="err" role="alert">{{ errors.username }}</p>
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

      
      <div class="field full">
        <label for="pf-position">ตำแหน่ง</label>
        <div class="control">
          <input
            id="pf-position"
            type="text"
            maxlength="255"
            :value="editing ? draft.position : (profile?.position ?? '')"
            :readonly="!editing"
            :class="{ editable: editing }"
            @input="$emit('update-field', 'position', $event.target.value)"
          />
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

.grid.is-editing .control input {
  background: #fff;
}
.control input.editable {
  cursor: text;
}
.control input.invalid {
  border-color: #e5484d;
}
.err {
  margin: 0;
  font-size: 12px;
  color: #b42318;
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