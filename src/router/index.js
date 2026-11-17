import { createRouter, createWebHistory } from "vue-router";
import { adminFarmApi } from "@/services/api";
import { useModalStore } from "@/stores/modalStore";
import { useAuthStore } from "@/stores/authStore";
import {
  SUPER_ADMIN as SA,
  FARM_ADMIN as FA,
  FARM_STAFF as FS,
  FINANCE_STAFF as FIN,
  ALL_ROLES,
  defaultPathFor,
} from "@/constants/roles";

const Placeholder = () => import("@/views/PlaceholderView.vue");

const page = (path, name, title, roles, opts = {}) => ({
  path,
  name,
  component: opts.component ?? Placeholder,
  meta: {
    title,
    roles,
    farmScoped: !!opts.farmScoped,
    leavesInspection: !!opts.leavesInspection,
    inspectionAware: !!opts.inspectionAware,
  },
});

const routes = [
  {
    path: '/reset-password',
    component: () => import('@/layouts/PasswordRecoveryLayout.vue'),
    meta: { public: true },
    children: [
      {
        path: '',
        name: 'reset-password',
        component: () => import('@/views/auth/ResetPasswordView.vue'),
        meta: { public: true, title: 'ตั้งค่ารหัสผ่านใหม่' },
      },
    ],
  },
  {
    path: '/forgot-password',
    component: () => import('@/layouts/PasswordRecoveryLayout.vue'),
    meta: { public: true },
    children: [
      {
        path: '',
        name: 'forgot-password',
        component: () => import('@/views/auth/ForgotPasswordView.vue'),
        meta: { public: true, title: 'ลืมรหัสผ่าน' },
      },
    ],
  },
  {
    path: "/",
    name: "home",
    redirect: () => {
      const auth = useAuthStore();
      if (!auth.token) auth.restoreSession();
      return auth.isAuthenticated ? defaultPathFor(auth.userRole) : "/login";
    },
  },
  {
    path: "/",
    component: () => import("@/layouts/AuthLayout.vue"),
    meta: { public: true },
    children: [
      {
        path: "register",
        name: "register",
        component: () => import("@/views/auth/RegisterView.vue"),
        meta: { public: true, title: "ลงทะเบียน" },
      },
      {
        path: "login",
        name: "login",
        component: () => import("@/views/auth/LoginView.vue"),
        meta: { public: true, title: "เข้าสู่ระบบ" },
      },
    ],
  },

  {
    path: "/",
    component: () => import("@/layouts/MainLayout.vue"),
    children: [

      page("/superadmin", "superadmin", "หน้าแรก Super Admin", [SA], { component: () => import("@/views/farms/AllFarmsView.vue"), leavesInspection: true }),
      { path: "/farmadmin", redirect: "/dashboard" },
      page("/farmstaff", "farmstaff", "หน้าแรก Farm Staff", [FS]),
      page("/financestaff", "financestaff", "หน้าแรก Finance Staff", [FIN]),

      page("/farms", "all-farms", "ฟาร์มทั้งหมด", [SA], {
        component: () => import("@/views/farms/AllFarmsView.vue"),
        leavesInspection: true,
      }), 
      page("/farms/new/flocks", "new-flock", "เพิ่มฝูงไก่", [SA, FA], {
        component: () => import("@/views/farms/FlockCreateView.vue"),
        leavesInspection: true,
      }),
      page("/farms/new/houses", "new-house", "เพิ่มโรงเรือน", [SA, FA], {
        component: () => import("@/views/farms/HouseCreateView.vue"),
        leavesInspection: true,
      }),
      page("/farms/new", "new-farm", "ลงทะเบียนฟาร์มใหม่", [SA], {
        component: () => import("@/views/farms/FarmCreateView.vue"),
        leavesInspection: true,
      }), 

      // ทุก role
      //page("/account", "account", "บัญชีและการตั้งค่า", ALL_ROLES), // UserProfileView
      page("/account", "account", "บัญชีและการตั้งค่า", ALL_ROLES, {
        component: () => import("@/views/UserProfileView.vue"),
      }),

      page("/users", "users", "จัดการผู้ใช้งาน", [SA, FA], { component: () => import("@/views/users/UserManagementView.vue"), inspectionAware: true }),
      page("/audit-logs", "audit-logs", "ประวัติการใช้งาน", [SA, FA], { inspectionAware: true }),

      page("/dashboard", "dashboard", "แดชบอร์ด", [SA, FA], {
        farmScoped: true,
      }),
      page("/notifications", "notifications", "การแจ้งเตือน", [SA, FA, FS], {
        farmScoped: true,
      }), 

      page("/farm/info", "farm-info", "ข้อมูลฟาร์ม", [SA, FA], {
        component: () => import("@/views/farms/FarmInfoEntry.vue"),
        farmScoped: true,
      }), 
      page("/farm/houses", "farm-houses", "ข้อมูลโรงเรือน", [SA, FA, FS], {
        component: () => import("@/views/farms/HouseEntry.vue"),
        farmScoped: true,
      }),
      page("/farm/houses/new", "farm-houses-new", "เพิ่มโรงเรือน", [SA, FA], {
        component: () => import("@/views/houses/AddHouseView.vue"),
        farmScoped: true,
      }), 
      page("/farm/flocks", "farm-flocks", "ข้อมูลฝูงไก่", [SA, FA, FS], {
        component: () => import("@/views/farms/FlockCreateView.vue"),
        farmScoped: true,
      }), 
      page("/farm/settings", "farm-settings", "ตั้งค่าฟาร์ม", [SA], {
        farmScoped: true,
      }), 

      page("/operations/feed", "ops-feed", "จัดการอาหาร", [SA, FA, FS], {
        farmScoped: true,
      }), 
      page(
        "/operations/health",
        "ops-health",
        "ข้อมูลสุขภาพไก่",
        [SA, FA, FS],
        { farmScoped: true },
      ),
      page("/operations/eggs", "ops-eggs", "จัดการผลผลิตไข่", [SA, FA, FS], {
        farmScoped: true,
      }), 
      page(
        "/operations/maintenance",
        "ops-maintenance",
        "การบำรุงรักษา",
        [SA, FA, FS],
        { farmScoped: true },
      ),

      page(
        "/inventory/supplies",
        "inv-supplies",
        "คลังยา อาหาร และวิตามิน",
        [SA, FA, FS, FIN],
        { farmScoped: true },
      ),
      page(
        "/inventory/suppliers",
        "inv-suppliers",
        "จัดการซัพพลายเออร์",
        [SA, FA, FIN],
        { farmScoped: true },
      ),

      page("/finance/income", "fin-income", "รายรับ", [SA, FA, FIN], {
        farmScoped: true,
      }), 
      page("/finance/expense", "fin-expense", "รายจ่าย", [SA, FA, FIN], {
        farmScoped: true,
      }),
      page("/finance/cost", "fin-cost", "ต้นทุน", [SA, FA, FIN], {
        farmScoped: true,
      }), 
      page(
        "/finance/reports",
        "fin-reports",
        "รายงานทางการเงิน",
        [SA, FA, FIN],
        { farmScoped: true },
      ),
    ],
  },

  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!auth.token) {
    auth.restoreSession();
  }

  if (auth.token && !auth.profileLoaded) {
    try {
      await auth.fetchProfile();
    } catch (error) {
      if (!auth.token || [401, 403, 404].includes(error.response?.status)) {
        auth.clearLoginSession();
      } else {
        if (to.meta.public) return true;
        return { name: 'login', query: { redirect: to.fullPath } };
      }
    }
  }
  if (auth.isAuthenticated && auth.isFarmAdmin) {
    try {
      await auth.fetchSetupStatus();
    } catch {
      useModalStore().openError({ message: "โหลดขั้นตอนตั้งค่าฟาร์มไม่สำเร็จ กรุณาลองใหม่" });
      return false;
    }
    const setupRoutes = { 1: "farm-info", 2: "farm-houses", 3: "farm-flocks" };
    const required = setupRoutes[auth.setupStep];
    const viewingSavedFarm = auth.setupStep >= 2 && to.name === "farm-info";
    const viewingSavedHouses = auth.setupStep === 3 && to.name === "farm-houses";
    if (required && to.name !== required && !viewingSavedFarm && !viewingSavedHouses) {
      return { name: required, replace: true };
    }
    if (!required && ["new-farm", "new-house", "new-flock"].includes(to.name)) {
      return { name: "dashboard", replace: true };
    }
  }

  if (to.meta.public) {
    if (auth.isAuthenticated && auth.profileLoaded && auth.userRole) {
        return defaultPathFor(auth.userRole);
    }
    return true;
}

  if (!auth.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  const { roles } = to.meta;
  if (roles && !roles.includes(auth.userRole)) {
    return defaultPathFor(auth.userRole);
  }

  if (!auth.isSuperAdmin) auth.leaveInspection();
  if (auth.isSuperAdmin && to.meta.leavesInspection) auth.leaveInspection();
  if (auth.isSuperAdmin && (to.meta.farmScoped || to.meta.inspectionAware)) {
    const selected = typeof to.query.farmId === 'string' ? to.query.farmId : auth.inspectedFarm?.farmId;
    if (!selected && to.meta.farmScoped) return { name: 'all-farms' };
    if (selected && (!auth.inspectionVerified || auth.inspectedFarm?.farmId !== selected)) {
      try {
        const { data } = await adminFarmApi.detail(selected);
        auth.inspectFarm(data);
      } catch (error) {
        auth.leaveInspection();
        return { name: 'all-farms', query: { error: error.response?.status === 404 ? 'missing' : 'unavailable' } };
      }
    }
    if (selected && to.query.farmId !== selected) return { path: to.path, query: { ...to.query, farmId: selected }, hash: to.hash, replace: true };
  }
  return true;
});

export default router;
