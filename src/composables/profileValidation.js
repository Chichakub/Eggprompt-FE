const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{8,9}$/;
export function profileEmailRequired(role) {
  return !['Farm Staff', 'Finance Staff'].includes(role);
}
export function validateProfile(draft, role) {
  const errors = { fullName: '', email: '', phone: '' };
  const name = (draft.fullName || '').trim();
  const email = (draft.email || '').trim();
  const phone = (draft.phone || '').replace(/[\s-]/g, '');
  if (!name) errors.fullName = 'กรุณากรอกชื่อ - สกุล';
  else if (name.length > 255) errors.fullName = 'ชื่อ - สกุลต้องไม่เกิน 255 ตัวอักษร';
  if (!email && profileEmailRequired(role)) errors.email = 'กรุณากรอกอีเมล';
  else if (email && !EMAIL_RE.test(email)) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
  else if (email.length > 255) errors.email = 'อีเมลต้องไม่เกิน 255 ตัวอักษร';
  if (!phone) errors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
  else if (!PHONE_RE.test(phone)) errors.phone = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
  return errors;
}
