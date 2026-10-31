<script setup>
import { computed } from 'vue';
import { CircleUser } from 'lucide-vue-next';

const props = defineProps({
  profile: { type: Object, default: null },
  loading: { type: Boolean, default: false },
});

// active → ใช้งานปกติ, inactive → ระงับ  (ปรับให้ตรงกับค่าที่ backend ส่งมา)
const STATUS_MAP = {
  active: { label: 'ใช้งานปกติ', tone: 'ok' },
  inactive: { label: 'ปิดใช้งาน', tone: 'off' },
  suspended: { label: 'ระงับ', tone: 'warn' },
};

const status = computed(
  () => STATUS_MAP[props.profile?.status] ?? { label: props.profile?.status ?? '-', tone: 'off' }
);
</script>

<template>
  <section class="profile-card" aria-label="ข้อมูลโปรไฟล์">
    <div class="card-body" :class="{ 'is-loading': loading }">
      <div class="avatar">
        <img
          v-if="profile?.avatarUrl"
          :src="profile.avatarUrl"
          :alt="profile.fullName"
        />
        <CircleUser v-else :size="126" :stroke-width="1.4" />
      </div>

      <h2 class="name">{{ profile?.fullName ?? '—' }}</h2>
      <p class="code">ID: {{ profile?.employeeCode ?? '—' }}</p>

      <div class="badges">
        <span class="badge role">
          <i class="dot" />{{ profile?.roleLabel ?? '—' }}
        </span>
        <span class="badge status" :class="status.tone">{{ status.label }}</span>
      </div>
    </div>

    <div class="position">
      <span class="position-label">ตำแหน่งปัจจุบัน:</span>
      <strong class="position-value">{{ profile?.positionShort ?? profile?.position ?? '—' }}</strong>
    </div>
  </section>
</template>

<style scoped>
.profile-card {
  --pc-line: #e9e5da;
  --pc-green: #8c9c70;
  --pc-ink: #243319;
  --pc-muted: #8a93a0;

  background: #fff;
  border: 1px solid var(--pc-line);
  border-top: 6px solid var(--pc-green);
  border-radius: 20px;
  padding: 36px 24px 24px;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(36, 51, 25, 0.04);
}

.card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.card-body.is-loading {
  opacity: 0.5;
}

.avatar {
  display: grid;
  place-items: center;
  width: 128px;
  height: 128px;
  border-radius: 50%;
  overflow: hidden;
  color: #111;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  margin: 28px 0 4px;
  font-size: 20px;
  font-weight: 700;
  color: var(--pc-ink);
}
.code {
  margin: 0 0 14px;
  font-size: 12px;
  color: var(--pc-muted);
}

.badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  border-radius: 999px;
  border: 1px solid;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}
.badge.role {
  color: #b45309;
  border-color: #e9a23b;
  background: #fffaf0;
}
.badge.role .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e9a23b;
}
.badge.status.ok {
  color: #0f766e;
  border-color: #5fc9b8;
  background: #effcf9;
}
.badge.status.warn {
  color: #b45309;
  border-color: #f0c070;
  background: #fff8e6;
}
.badge.status.off {
  color: #6b7280;
  border-color: #d1d5db;
  background: #f3f4f6;
}

.position {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--pc-line);
  font-size: 12px;
}
.position-label {
  color: #6b7280;
  white-space: nowrap;
}
.position-value {
  color: var(--pc-ink);
  text-align: right;
}
</style>