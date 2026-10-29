<!--
  src/components/layout/AppSidebar.vue
  C2-51  Sidebar component (เมนูตาม role)
  C2-52  แสดง username + role badge
  C2-53  ปุ่มออกจากระบบ
-->
<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Bell,
  ChevronDown,
  CircleUser,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  Wallet,
  Warehouse,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/authStore';
import { getMenu } from '@/constants/menuConfig';

const ICONS = {
  LayoutDashboard,
  Warehouse,
  ClipboardList,
  Package,
  Wallet,
  UserPlus,
  History,
  SlidersHorizontal,
};

const router = useRouter();
const auth = useAuthStore();

const menu = computed(() => getMenu(auth.userRole));

const profileIcon = computed(() => (auth.isSuperAdmin ? CircleUser : ShieldCheck));

// การ์ดแจ้งเตือน: Farm Admin และ Farm Staff
const showNotifications = computed(
  () => auth.isFarmAdmin || auth.isFarmStaff
);
const notificationCount = ref(0); // TODO: ดึงจาก API การแจ้งเตือนเมื่อมี

// เปิด/ปิดกลุ่มเมนู (เริ่มต้นให้พับปิดไว้ก่อนทั้งหมด)
const closedGroups = ref(
  new Set(
    menu.value
      .filter((item) => item.type !== 'link' && item.key)
      .map((item) => item.key)
  )
);

const isOpen = (key) => !closedGroups.value.has(key);
function toggleGroup(key) {
  if (closedGroups.value.has(key)) closedGroups.value.delete(key);
  else closedGroups.value.add(key);
}

async function handleLogout() {
  await auth.logout();
  router.replace({ name: 'login' });
}
</script>

<template>
  <aside class="sidebar">
    <!-- โลโก้ -->
    <div class="brand">
      <span class="brand-logo">🥚</span>
      <div class="brand-text">
        <strong>ไข่พร้อม</strong>
        <small>ศูนย์ควบคุมระบบกลาง</small>
      </div>
    </div>

    <!-- บัญชี + โปรไฟล์ (C2-52) -->
    <router-link to="/account" class="menu-link account-link" exact-active-class="active">
      <Settings :size="18" />
      <span>บัญชีและการตั้งค่า</span>
    </router-link>

    <div class="profile-card">
      <span class="avatar">
        <component :is="profileIcon" :size="18" />
      </span>
      <div class="profile-text">
        <strong>{{ auth.user?.username ?? '...' }}</strong>
        <span class="role-badge">{{ auth.userRole }}</span>
      </div>
    </div>

    <!-- การแจ้งเตือน -->
    <router-link
      v-if="showNotifications"
      to="/notifications"
      class="notice-card"
    >
      <span class="notice-icon">
        <Bell :size="16" />
        <i v-if="notificationCount" class="notice-dot" />
      </span>
      <strong class="notice-title">การแจ้งเตือน</strong>
      <span v-if="notificationCount" class="notice-badge">{{ notificationCount }} ใหม่</span>
      <span class="notice-more">ดูทั้งหมด ›</span>
    </router-link>

    <!-- เมนูหลัก (C2-51) -->
    <p class="section-label">เมนูหลัก</p>

    <nav>
      <ul class="menu">
        <li v-for="item in menu" :key="item.key ?? item.to">
          <!-- เมนูเดี่ยว -->
          <router-link
            v-if="item.type === 'link'"
            :to="item.to"
            class="menu-link"
            exact-active-class="active"
          >
            <component :is="ICONS[item.icon]" :size="18" />
            <span>{{ item.label }}</span>
          </router-link>

          <!-- เมนูกลุ่ม -->
          <template v-else>
            <button type="button" class="group-btn" @click="toggleGroup(item.key)">
              <component :is="ICONS[item.icon]" :size="18" />
              <span>{{ item.label }}</span>
              <ChevronDown :size="16" class="chevron" :class="{ flipped: !isOpen(item.key) }" />
            </button>

            <ul v-show="isOpen(item.key)" class="sub-menu">
              <li v-for="child in item.children" :key="child.to">
                <router-link :to="child.to" class="sub-link" exact-active-class="active">
                  {{ child.label }}
                </router-link>
              </li>
            </ul>
          </template>
        </li>
      </ul>
    </nav>

    <!-- ออกจากระบบ (C2-53) -->
    <button type="button" class="logout-btn" @click="handleLogout">
      <LogOut :size="18" />
      ออกจากระบบ
    </button>
  </aside>
</template>

<style scoped>
.sidebar {
  --sb-bg: #3b4a2a;
  --sb-text: #e8ecdf;
  --sb-muted: #a9b596;
  --sb-accent: #e9a23b;
  --sb-surface: rgba(255, 255, 255, 0.08);
  --sb-active-bg: #f8f4e8;
  --sb-active-text: #2f3a20;

  width: 260px;
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 14px;
  box-sizing: border-box;
  overflow-y: auto;
  background: var(--sb-bg);
  color: var(--sb-text);
  font-size: 14px;
}

/* ---------- Brand ---------- */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--sb-surface);
}
.brand-logo {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--sb-accent);
  font-size: 22px;
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.brand-text strong {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}
.brand-text small {
  font-size: 12px;
  color: var(--sb-muted);
}

/* ---------- Profile ---------- */
.profile-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--sb-surface);
  border-radius: 12px;
  background: var(--sb-surface);
}
.avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
}
.profile-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.profile-text strong {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.role-badge {
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--sb-accent);
  color: #3b2a05;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

/* ---------- Notification ---------- */
.notice-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--sb-surface);
  border-radius: 12px;
  background: var(--sb-surface);
  color: #fff;
  text-decoration: none;
}
.notice-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
}
.notice-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--sb-accent);
}
.notice-title {
  font-size: 13px;
  font-weight: 600;
}
.notice-badge {
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(233, 162, 59, 0.25);
  color: var(--sb-accent);
  font-size: 12px;
  font-weight: 600;
}
.notice-more {
  margin-left: auto;
  font-size: 12px;
  color: var(--sb-muted);
}

/* ---------- Menu ---------- */
.section-label {
  margin: 6px 4px 2px;
  font-size: 12px;
  font-weight: 500;
  color: var(--sb-muted);
}
.menu,
.sub-menu {
  margin: 0;
  padding: 0;
  list-style: none;
}
.menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-link,
.group-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--sb-text);
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  box-sizing: border-box;
}
.menu-link:hover,
.sub-link:hover {
  background: var(--sb-surface);
}
.group-btn:hover {
  background: var(--sb-surface);
  font-weight: 600;
}
.chevron {
  margin-left: auto;
  transition: transform 0.2s;
}
.chevron.flipped {
  transform: rotate(-90deg);
}

.sub-menu {
  margin: 4px 0 4px 20px;
  padding-left: 10px;
  border-left: 1px solid var(--sb-surface);
}
.sub-link {
  display: block;
  padding: 8px 12px;
  border-radius: 10px;
  color: var(--sb-text);
  font-size: 13px;
  font-weight: 400;
  text-decoration: none;
}

.menu-link.active,
.sub-link.active {
  background: var(--sb-active-bg);
  color: var(--sb-active-text);
  font-weight: 700;
}

/* ---------- Logout ---------- */
.logout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding: 10px 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #f4a7a7;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.logout-btn:hover {
  background: rgba(244, 167, 167, 0.12);
}
</style>