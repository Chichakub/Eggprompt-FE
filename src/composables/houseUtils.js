export const STATUS_LABEL = { ACTIVE: 'เลี้ยงอยู่', INACTIVE: 'พักเล้า' };

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
export const fmtNum = (n) => (n == null ? '-' : Number(n).toLocaleString('th-TH'));

export const apiMessage = (e, fallback = 'กรุณาลองอีกครั้ง') => e?.response?.data?.message || fallback;

export const emptyHouseForm = () => ({
  houseName: '', houseType: '', openingDate: '', widthM: '', lengthM: '', capacity: '',
  status: 'ACTIVE',
  ventilationFanCount: '', waterSystem: '', feedingSystem: '', eggCollectionSystem: '', lightingProgram: '',
  lastBuiltOrRenovatedDate: '',
});

// HouseResponse -> ค่าในฟอร์ม
export const fromHouse = (h) => ({
  houseName: h.houseName ?? '', houseType: h.houseType ?? '', openingDate: h.openingDate ?? '',
  widthM: String(h.widthM ?? ''), lengthM: String(h.lengthM ?? ''), capacity: String(h.capacity ?? ''),
  status: h.status ?? 'ACTIVE',
  ventilationFanCount: h.ventilationFanCount == null ? '' : String(h.ventilationFanCount),
  waterSystem: h.waterSystem ?? '', feedingSystem: h.feedingSystem ?? '',
  eggCollectionSystem: h.eggCollectionSystem ?? '', lightingProgram: h.lightingProgram ?? '',
  lastBuiltOrRenovatedDate: h.lastBuiltOrRenovatedDate ?? '',
});

// ค่าในฟอร์ม -> HouseRequest (ช่องเสริมที่ว่างส่งเป็น null = ล้างค่า)
export function toPayload(f, { farmId, withStatus = false } = {}) {
  const text = (v) => v.trim() || null;
  return {
    ...(farmId ? { farmId } : {}),
    houseName: f.houseName.trim(),
    houseType: f.houseType.trim(),
    openingDate: f.openingDate,
    widthM: Number(f.widthM),
    lengthM: Number(f.lengthM),
    capacity: Number(f.capacity),
    ...(withStatus ? { status: f.status } : {}),
    ventilationFanCount: f.ventilationFanCount.trim() === '' ? null : Number(f.ventilationFanCount),
    waterSystem: text(f.waterSystem),
    feedingSystem: text(f.feedingSystem),
    eggCollectionSystem: text(f.eggCollectionSystem),
    lightingProgram: text(f.lightingProgram),
    lastBuiltOrRenovatedDate: f.lastBuiltOrRenovatedDate || null,
  };
}

// ตรงกับ HouseRequest ฝั่ง BE -> คืน object error
export function validateHouse(f) {
  const e = {};
  const max100 = (key, label) => { if (f[key].trim().length > 100) e[key] = `${label}ต้องไม่เกิน 100 ตัวอักษร`; };

  if (!f.houseName.trim()) e.houseName = 'กรุณากรอกชื่อโรงเรือน';
  else max100('houseName', 'ชื่อโรงเรือน');
  if (!f.houseType.trim()) e.houseType = 'กรุณาระบุประเภทโรงเรือน';
  else max100('houseType', 'ประเภทโรงเรือน');
  if (!f.openingDate) e.openingDate = 'กรุณาระบุวันที่เปิดใช้งาน';

  const dim = (v, label) => {
    if (v.trim() === '') return `กรุณาระบุ${label}`;
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(v.trim())) return `${label}รูปแบบไม่ถูกต้อง`;
    if (!(Number(v) > 0)) return `${label}ต้องมากกว่า 0`;
  };
  const w = dim(f.widthM, 'ความกว้าง'); if (w) e.widthM = w;
  const l = dim(f.lengthM, 'ความยาว'); if (l) e.lengthM = l;

  if (f.capacity.trim() === '') e.capacity = 'กรุณาระบุความจุ';
  else if (!/^\d+$/.test(f.capacity.trim()) || Number(f.capacity) < 1) e.capacity = 'ความจุต้องเป็นจำนวนเต็มมากกว่า 0';

  if (f.ventilationFanCount.trim() !== '' && !/^\d+$/.test(f.ventilationFanCount.trim())) e.ventilationFanCount = 'จำนวนพัดลมต้องเป็นจำนวนเต็ม ไม่ติดลบ';
  max100('waterSystem', 'ระบบน้ำ');
  max100('feedingSystem', 'ระบบให้อาหาร');
  max100('eggCollectionSystem', 'การเก็บไข่');
  max100('lightingProgram', 'โปรแกรมแสง');
  return e;
}
