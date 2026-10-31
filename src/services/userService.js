import { authApi } from '@/services/api';
import { SUPER_ADMIN, FARM_ADMIN, FARM_STAFF, FINANCE_STAFF } from '@/constants/roles';

const ROLE_NAME_TH = {
  [SUPER_ADMIN]: 'ผู้ดูแลระบบ',
  [FARM_ADMIN]: 'ผู้ดูแลฟาร์ม',
  [FARM_STAFF]: 'พนักงานฟาร์ม',
  [FINANCE_STAFF]: 'พนักงานการเงิน',
};

export function toProfile(raw) {
  return {
    id: raw.userId,
    employeeCode: raw.userCode, // users.user_code
    fullName: raw.fullName,
    role: raw.role,
    roleLabel: raw.role, // Role Badge แสดงค่าเดียวกับใน Sidebar
    roleName: ROLE_NAME_TH[raw.role] ?? raw.role,
    status: raw.status,
    email: raw.email,
    phone: raw.phoneNumber, 
    username: raw.username,
    position: raw.position,
    avatarUrl: null, // ยังไม่มีคอลัมน์รูปโปรไฟล์ใน DB → ใช้ไอคอนเริ่มต้น
  };
}

export const userService = {
  // GET /v1/auth/me
  async getMyProfile() {
    const res = await authApi.me();
    return toProfile(res.data?.data ?? res.data);
  },

  // PUT /v1/users/me — ส่งเฉพาะฟิลด์ที่แก้ได้ (role/status ไม่ส่ง)
  async updateMyProfile({ fullName, email, phone }) {
    const res = await authApi.updateMe({
      fullName,
      email,
      phoneNumber: phone,
    });
    return toProfile(res.data?.data ?? res.data);
  },
};