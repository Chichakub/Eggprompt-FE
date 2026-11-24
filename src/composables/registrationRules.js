export const usernamePattern = '[A-Za-z0-9._-]{4,24}';
export const usernameHelp = '4–24 ตัว ใช้ตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง';
export function registrationError(form) {
  if (!new RegExp(`^${usernamePattern}$`).test(form.username.trim())) return 'ชื่อผู้ใช้ต้องยาว 4–24 ตัว และใช้ตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง';
  if (form.password.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
  if (new TextEncoder().encode(form.password).length > 72) return 'รหัสผ่านต้องไม่เกิน 72 ไบต์';
  if (form.password !== form.confirmPassword) return 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
  if (!/^[^\s@]+@[^\s@]+$/.test(form.email.trim())) return 'กรุณากรอกอีเมลให้ถูกต้อง';
  if (!form.accepted) return 'กรุณายอมรับเงื่อนไขการใช้งาน';
  return '';
}
