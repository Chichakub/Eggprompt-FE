import test from 'node:test';
import assert from 'node:assert/strict';
import { registrationError } from '../src/composables/registrationRules.js';
const valid=()=>({username:'farm.owner',password:'MyPassword123!',confirmPassword:'MyPassword123!',email:'owner@example.com',accepted:true});
test('valid self registration includes matching confirmation and accepted terms',()=>{assert.equal(registrationError(valid()),'');});
test('rejects mistyped confirmation, invalid username, email and unaccepted terms',()=>{
 assert.match(registrationError({...valid(),confirmPassword:'Different123!'}),/ไม่ตรงกัน/);
 assert.match(registrationError({...valid(),username:'ชื่อไทย'}),/4–24/);
 assert.match(registrationError({...valid(),email:'invalid'}),/อีเมล/);
 assert.match(registrationError({...valid(),accepted:false}),/ยอมรับ/);
});
test('password bounds match BCrypt byte limit, including multibyte characters',()=>{
 assert.equal(registrationError({...valid(),password:'a'.repeat(72),confirmPassword:'a'.repeat(72)}),'');
 assert.match(registrationError({...valid(),password:'ก'.repeat(25),confirmPassword:'ก'.repeat(25)}),/72/);
 assert.match(registrationError({...valid(),password:'short',confirmPassword:'short'}),/8/);
});
