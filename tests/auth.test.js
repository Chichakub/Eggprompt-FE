import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import * as roles from '../src/constants/roles.js';

const source = (file) => readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
  .replace(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
const storage = () => {
  const values = new Map();
  return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k) };
};
function setup() {
  setActivePinia(createPinia());
  const local = storage(), session = storage();
  const authApi = { me: async () => ({ data: { userId: 7, username: 'tester', role: roles.FARM_STAFF } }), logout: async () => {} };
  const useStore = new Function('defineStore', 'authApi', 'localStorage', 'sessionStorage', ...Object.keys(roles),
    source('stores/authStore.js').replace('export const ', 'const ') + '\nreturn useAuthStore;')
    (defineStore, authApi, local, session, ...Object.values(roles));
  const auth = useStore();
  let guard;
  new Function('createRouter', 'createWebHistory', 'useAuthStore', 'SA', 'FA', 'FS', 'FIN', 'ALL_ROLES', 'defaultPathFor',
    source('router/index.js').replace('export default router;', ''))
    (() => ({ beforeEach: fn => { guard = fn; } }), () => {}, useStore,
      roles.SUPER_ADMIN, roles.FARM_ADMIN, roles.FARM_STAFF, roles.FINANCE_STAFF, roles.ALL_ROLES, roles.defaultPathFor);
  return { auth, authApi, local, session, guard };
}
const protectedPage = { fullPath: '/users', meta: { roles: [roles.FARM_ADMIN, roles.SUPER_ADMIN] } };

test('remember choice, refresh and direct profile response', async () => {
  for (const remember of [true, false]) {
    const { auth, local, session } = setup();
    auth.setLoginSession({ token: 'jwt', user: { username: 'stale' } }, remember);
    assert.equal((remember ? local : session).getItem('token'), 'jwt');
    assert.equal((remember ? session : local).getItem('token'), null);
    auth.token = null;
    auth.restoreSession();
    await auth.fetchProfile();
    assert.equal(auth.user.username, 'tester');
    assert.equal(auth.userRole, roles.FARM_STAFF);
    assert.equal(auth.profileLoaded, true);
  }
});
test('malformed storage clears session without crashing', () => {
  const { auth, local } = setup();
  local.setItem('token', 'jwt'); local.setItem('user', '{');
  auth.restoreSession();
  assert.equal(auth.token, null);
});
test('guard redirects anonymous users and denies wrong role after fetching profile', async () => {
  const { auth, guard } = setup();
  assert.equal((await guard(protectedPage)).name, 'login');
  auth.setLoginSession({ token: 'jwt', user: { user_role: roles.SUPER_ADMIN } });
  assert.equal(await guard(protectedPage), '/farmstaff');
  assert.equal(await guard({ fullPath: '/operations/eggs', meta: { roles: [roles.FARM_STAFF] } }), true);
});
test('expired token and unknown role clear session', async () => {
  for (const invalidRole of [true, false]) {
    const { auth, authApi, guard } = setup();
    auth.setLoginSession({ token: 'jwt', user: {} });
    authApi.me = invalidRole ? async () => ({ data: { role: 'unknown' } }) : async () => { throw { response: { status: 401 } }; };
    assert.equal((await guard(protectedPage)).name, 'login');
    assert.equal(auth.token, null);
  }
});
test('network failure does not grant access or erase session', async () => {
  const { auth, authApi, guard } = setup();
  auth.setLoginSession({ token: 'jwt', user: {} });
  authApi.me = async () => { throw new Error('offline'); };
  assert.equal((await guard(protectedPage)).name, 'login');
  assert.equal(auth.token, 'jwt');
  assert.equal(await guard({ fullPath: '/login', meta: { public: true } }), true);
});
test('logout clears state and both storage locations even if API fails', async () => {
  const { auth, authApi, local, session } = setup();
  auth.setLoginSession({ token: 'jwt', user: {} }, false);
  local.setItem('user', '{}'); session.setItem('inspectedFarm', 'farm');
  authApi.logout = async () => { throw new Error('offline'); };
  await auth.logout();
  assert.equal(auth.token, null);
  for (const store of [local, session]) for (const key of ['user', 'token']) assert.equal(store.getItem(key), null);
  assert.equal(session.getItem('inspectedFarm'), null);
});
test('API sends sessionStorage token and clears all session data on 401', async () => {
  const { auth, local, session } = setup();
  auth.setLoginSession({ token: 'session-jwt', user: {} }, false);
  let request, rejected;
  const api = { interceptors: { request: { use: fn => { request = fn; } }, response: { use: (_, fn) => { rejected = fn; } } } };
  const window = { location: { pathname: '/users', href: '' } };
  new Function('axios', 'useAuthStore', 'localStorage', 'sessionStorage', 'window',
    source('services/api.js').replace('import.meta.env.VITE_API_URL', "''").replace('export const ', 'const '))
    ({ create: () => api }, () => auth, local, session, window);
  assert.equal(request({ headers: {} }).headers.Authorization, 'Bearer session-jwt');
  await assert.rejects(rejected({ response: { status: 401 }, config: { url: '/api/v1/auth/me' } }));
  assert.equal(auth.token, null);
  assert.equal(session.getItem('token'), null);
  assert.equal(window.location.href, '/login');
});
