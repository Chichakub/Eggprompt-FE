import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProfile } from '../src/composables/profileValidation.js';
const draft = { fullName: 'Somchai Test', email: '', phone: '081-234-5678' };
test('both staff roles can save a complete profile without an email', () => {
  for (const role of ['Farm Staff', 'Finance Staff']) assert.deepEqual(validateProfile(draft, role), { fullName:'', email:'', phone:'' });
});
test('admin roles still require an email', () => {
  for (const role of ['Farm Admin', 'Super Admin']) assert.equal(validateProfile(draft, role).email, 'กรุณากรอกอีเมล');
});
test('optional staff email must be valid when provided', () => {
  assert.equal(validateProfile({ ...draft, email:'invalid' }, 'Farm Staff').email, 'รูปแบบอีเมลไม่ถูกต้อง');
  assert.equal(validateProfile({ ...draft, email:'staff@example.com' }, 'Farm Staff').email, '');
});
test('name and phone remain required when email is optional', () => {
  const errors = validateProfile({ ...draft, fullName:'   ', phone:'' }, 'Farm Staff');
  assert.equal(errors.fullName, 'กรุณากรอกชื่อ - สกุล');
  assert.equal(errors.phone, 'กรุณากรอกเบอร์โทรศัพท์');
  assert.equal(errors.email, '');
});
