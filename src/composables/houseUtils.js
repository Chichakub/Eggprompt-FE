import { isValidFormDate } from './dateValidation.js';

export const STATUS_LABEL = { ACTIVE: 'เลี้ยงอยู่', INACTIVE: 'พักเล้า' };

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
export const fmtNum = (n) => (n == null ? '-' : Number(n).toLocaleString('th-TH'));

export const apiMessage = (e, fallback = 'กรุณาลองอีกครั้ง') => e?.response?.data?.message || fallback;

export const emptyHouseForm = () => ({
  houseName: '',
  widthM: '', lengthM: '', capacity: '',
  lastBuiltOrRenovatedDate: '',
});

// HouseResponse -> ค่าในฟอร์ม
export const fromHouse = (h) => ({
  houseName: h.houseName ?? '',
  status: h.status ?? 'ACTIVE',
  widthM: String(h.widthM ?? ''), lengthM: String(h.lengthM ?? ''), capacity: String(h.capacity ?? ''),
  lastBuiltOrRenovatedDate: h.lastBuiltOrRenovatedDate ?? '',
});

// ค่าในฟอร์ม -> HouseRequest (ช่องเสริมที่ว่างส่งเป็น null = ล้างค่า)
export function toPayload(f, { farmId, withStatus = false } = {}) {
  return {
    ...(farmId ? { farmId } : {}),
    houseName: f.houseName.trim(),
    ...(withStatus ? { status: f.status } : {}),
    widthM: Number(f.widthM),
    lengthM: Number(f.lengthM),
    capacity: Number(f.capacity),
    lastBuiltOrRenovatedDate: f.lastBuiltOrRenovatedDate || null,
  };
}

// ตรงกับ HouseRequest ฝั่ง BE -> คืน object error
export function validateHouse(f) {
  const e = {};
  const houseName = f.houseName.trim();
  if (!houseName) e.houseName = 'กรุณากรอกชื่อโรงเรือน';
  else if (houseName.length > 100) e.houseName = 'ชื่อโรงเรือนต้องไม่เกิน 100 ตัวอักษร';

  const dim = (v, label) => {
    if (v.trim() === '') return `กรุณาระบุ${label}`;
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(v.trim())) return `${label}รูปแบบไม่ถูกต้อง`;
    if (!(Number(v) > 0)) return `${label}ต้องมากกว่า 0`;
  };
  const w = dim(f.widthM, 'ความกว้าง'); if (w) e.widthM = w;
  const l = dim(f.lengthM, 'ความยาว'); if (l) e.lengthM = l;

  if (f.capacity.trim() === '') e.capacity = 'กรุณาระบุความจุ';
  else if (!/^\d+$/.test(f.capacity.trim()) || Number(f.capacity) < 1 || Number(f.capacity) > 2147483647) {
    e.capacity = 'ความจุต้องเป็นจำนวนเต็มตั้งแต่ 1 ถึง 2,147,483,647';
  }

  if (f.lastBuiltOrRenovatedDate && !isValidFormDate(f.lastBuiltOrRenovatedDate)) {
    e.lastBuiltOrRenovatedDate = 'กรุณาระบุวันที่ให้ถูกต้อง โดยใช้ปี ค.ศ. 4 หลัก เช่น 2026';
  }
  return e;
}
