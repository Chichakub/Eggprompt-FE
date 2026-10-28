// src/router/index.js
// C2-49: Route Guard + จำกัดหน้าตาม Role

import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import {
  SUPER_ADMIN as SA,
  FARM_ADMIN as FA,
  FARM_STAFF as FS,
  FINANCE_STAFF as FIN,
  ALL_ROLES,
  defaultPathFor,
} from '@/constants/roles';

// หน้าที่ยังไม่ได้ทำ ใช้ placeholder ไปก่อน แล้วค่อยสลับเป็น view จริงตามคอมเมนต์ท้ายบรรทัด
const Placeholder = () => import('@/views/PlaceholderView.vue');

const page = (path, name, title, roles, opts = {}) => ({
  path,
  name,
  component: opts.component ?? Placeholder,
  meta: {
    title,
    roles,
    farmScoped: !!opts.farmScoped,
    leavesInspection: !!opts.leavesInspection,
  },
});

const routes = [
  // ---------- ก่อนล็อกอิน (AuthLayout) ----------
  // ปรับ path ของไฟล์ให้ตรงกับโปรเจกต์จริง
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { public: true },
    children: [
      {
        path: 'login',
        name: 'login',
        component: Placeholder,
        // component: () => import('@/views/auth/LoginView.vue'),
        meta: { public: true, title: 'เข้าสู่ระบบ' },
      },
      // RegisterView, ResetPasswordView เพิ่มตรงนี้ (meta: { public: true })
    ],
  },

  // ---------- หลังล็อกอิน (MainLayout) ----------
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', redirect: '/superadmin' },

      // ---- หน้าแรกของแต่ละ role (ชั่วคราว) ----
      page('/superadmin', 'superadmin', 'หน้าแรก Super Admin', [SA]),
      page('/farmadmin', 'farmadmin', 'หน้าแรก Farm Admin', [FA]),
      page('/farmstaff', 'farmstaff', 'หน้าแรก Farm Staff', [FS]),
      page('/financestaff', 'financestaff', 'หน้าแรก Finance Staff', [FIN]),

      // Super Admin (ไม่ผูกกับฟาร์ม)
      page('/farms', 'all-farms', 'ฟาร์มทั้งหมด', [SA], { leavesInspection: true }), // AllFarmsView
      page('/farms/new', 'new-farm', 'ลงทะเบียนฟาร์มใหม่', [SA], { leavesInspection: true }), // NewFarmView

      // ทุก role
      page('/account', 'account', 'บัญชีและการตั้งค่า', ALL_ROLES), // UserProfileView

      // จัดการผู้ใช้ / ประวัติ (Super Admin + Farm Admin)
      page('/users', 'users', 'จัดการผู้ใช้งาน', [SA, FA]), // UserManagementView
      page('/audit-logs', 'audit-logs', 'ประวัติการใช้งาน', [SA, FA]),

      // ---------- หน้าที่ผูกกับฟาร์ม ----------
      page('/dashboard', 'dashboard', 'แดชบอร์ด', [SA, FA], { farmScoped: true }),
      page('/notifications', 'notifications', 'การแจ้งเตือน', [SA, FA, FS], { farmScoped: true }),

      // จัดการฟาร์ม
      page('/farm/info', 'farm-info', 'ข้อมูลฟาร์ม', [SA, FA], { farmScoped: true }), // FarmInfoView
      page('/farm/houses', 'farm-houses', 'ข้อมูลโรงเรือน', [SA, FA, FS], { farmScoped: true }), // HouseInfoView
      page('/farm/flocks', 'farm-flocks', 'ข้อมูลฝูงไก่', [SA, FA, FS], { farmScoped: true }), // FlockInfoView
      page('/farm/settings', 'farm-settings', 'ตั้งค่าฟาร์ม', [SA], { farmScoped: true }),

      // ดำเนินงานในฟาร์ม (DailyEggRecordView มี tab อาหาร/สุขภาพ/ไข่)
      page('/operations/feed', 'ops-feed', 'จัดการอาหาร', [SA, FA, FS], { farmScoped: true }),
      page('/operations/health', 'ops-health', 'ข้อมูลสุขภาพไก่', [SA, FA, FS], { farmScoped: true }),
      page('/operations/eggs', 'ops-eggs', 'จัดการผลผลิตไข่', [SA, FA, FS], { farmScoped: true }),
      page('/operations/maintenance', 'ops-maintenance', 'การบำรุงรักษา', [SA, FA, FS], { farmScoped: true }),

      // คลังสินค้า
      page('/inventory/supplies', 'inv-supplies', 'คลังยา อาหาร และวิตามิน', [SA, FA, FS, FIN], { farmScoped: true }),
      page('/inventory/suppliers', 'inv-suppliers', 'จัดการซัพพลายเออร์', [SA, FA, FIN], { farmScoped: true }),

      // การเงิน
      page('/finance/income', 'fin-income', 'รายรับ', [SA, FA, FIN], { farmScoped: true }),
      page('/finance/expense', 'fin-expense', 'รายจ่าย', [SA, FA, FIN], { farmScoped: true }),
      page('/finance/cost', 'fin-cost', 'ต้นทุน', [SA, FA, FIN], { farmScoped: true }),
      page('/finance/reports', 'fin-reports', 'รายงานทางการเงิน', [SA, FA, FIN], { farmScoped: true }),
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// TODO: ตอนต่อ backend ให้ใช้ guard เดิมแทน (เช็ก token + fetchProfile)
const DEV_PATHS = {
  '/superadmin': SA,
  '/farmadmin': FA,
  '/farmstaff': FS,
  '/financestaff': FIN,
};

router.beforeEach((to) => {
  if (to.meta.public) return true;

  const auth = useAuthStore();

  // เข้า 4 path นี้ = สลับเป็น role นั้นทันที
  const devRole = DEV_PATHS[to.path];
  if (devRole) {
    auth.setMockRole(devRole);
    return true;
  }

  // ยังไม่เคยเลือก role → ไปหน้า superadmin
  if (!auth.user) return '/superadmin';

  // role ไม่มีสิทธิ์ → กลับหน้าแรกของ role
  const { roles } = to.meta;
  if (roles && !roles.includes(auth.userRole)) {
    return defaultPathFor(auth.userRole);
  }

  return true;
});

export default router;