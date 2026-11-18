import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import { AxiosHeaders } from 'axios';
import * as roles from '../src/constants/roles.js';

const source = (file) => readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
  .replace(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
const storage = () => {
  const values = new Map();
  return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k) };
};
function setup(farmApi = { detail: async id => ({ data: { farmId:id, farmName:`Farm ${id}`, active:true } }) }) {
  setActivePinia(createPinia());
  const local = storage(), session = storage();
  const authApi = { me: async () => ({ data: { userId: 7, username: 'tester', role: roles.FARM_STAFF } }), logout: async () => {} };
  const useStore = new Function('defineStore', 'authApi', 'localStorage', 'sessionStorage', ...Object.keys(roles),
    source('stores/authStore.js').replaceAll('export const ', 'const ') + '\nreturn useAuthStore;')
    (defineStore, authApi, local, session, ...Object.values(roles));
  const auth = useStore();
  let guard;
  new Function('adminFarmApi', 'createRouter', 'createWebHistory', 'useAuthStore', 'SA', 'FA', 'FS', 'FIN', 'ALL_ROLES', 'defaultPathFor',
    source('router/index.js').replace('export default router;', '').replaceAll('import.meta.env.BASE_URL', JSON.stringify('/')))
    (farmApi, () => ({ beforeEach: fn => { guard = fn; } }), () => {}, useStore,
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
    source('services/api.js').replace('import.meta.env.VITE_API_URL', "''").replaceAll('import.meta.env.BASE_URL', JSON.stringify('/')).replaceAll('export const ', 'const '))
    ({ create: () => api }, () => auth, local, session, window);
  assert.equal(request({ headers: {} }).headers.Authorization, 'Bearer session-jwt');
  await assert.rejects(rejected({ response: { status: 401 }, config: request({ url: '/api/v1/auth/me', headers: {} }) }));
  assert.equal(auth.token, null);
  assert.equal(session.getItem('token'), null);
  assert.equal(window.location.href, '/login');
});

test('API sends the verified farm header only during Super Admin inspection', () => {
  const { auth, local, session } = setup();
  let request;
  const api = { interceptors: { request: { use: fn => { request = fn; } }, response: { use() {} } } };
  new Function('axios', 'useAuthStore', 'localStorage', 'sessionStorage',
    source('services/api.js').replace('import.meta.env.VITE_API_URL', "''").replaceAll('import.meta.env.BASE_URL', JSON.stringify('/')).replaceAll('export const ', 'const '))
    ({ create: () => api }, () => auth, local, session);
  const farmHeader = (url = 'api/v1/houses') => request({ url, method: 'post', headers: new AxiosHeaders() }).headers.get('farm_id');

  auth.setLoginSession({ token: 'jwt', user: { user_id: 1, user_role: roles.SUPER_ADMIN } });
  assert.equal(farmHeader(), undefined);
  auth.inspectFarm({ farmId: 'F1' });
  assert.equal(farmHeader(), 'F1');
  assert.equal(farmHeader('api/v1/auth/login'), undefined);
  auth.restoreSession();
  assert.equal(farmHeader(), undefined);
  auth.inspectFarm({ farmId: 'F2' });
  assert.equal(farmHeader(), 'F2');
  auth.leaveInspection();
  assert.equal(farmHeader(), undefined);
});

test('deployment base is preserved for API requests, router history and login redirects', async () => {
  const base = '/capstone26/cp26cs1/';
  const { auth, local, session } = setup();
  auth.setLoginSession({ token: 'deployment-jwt', user: {} }, false);
  let options, rejected;
  const urls = [];
  const api = {
    post: url => urls.push(url), get: url => urls.push(url), put: url => urls.push(url), delete: url => urls.push(url),
    interceptors: { request: { use() {} }, response: { use: (_, fn) => { rejected = fn; } } },
  };
  const window = { location: { pathname: `${base}users`, href: '' } };
  const apis = new Function('axios', 'useAuthStore', 'localStorage', 'sessionStorage', 'window',
    source('services/api.js').replace('import.meta.env.VITE_API_URL', "''")
      .replaceAll('import.meta.env.BASE_URL', JSON.stringify(base))
      .replaceAll('export const ', 'const ') + '\nreturn { authApi, userManagementApi };')
    ({ create: config => { options = config; return api; } }, () => auth, local, session, window);
  apis.authApi.login({}); apis.authApi.me(); apis.userManagementApi.list({}); apis.userManagementApi.update(5, {});
  assert.equal(options.baseURL, base);
  assert.deepEqual(urls.map(url => new URL(url, `https://example.com${options.baseURL}`).pathname), [
    `${base}api/v1/auth/login`, `${base}api/v1/auth/me`, `${base}api/v1/admin/users`, `${base}api/v1/admin/users/5`,
  ]);
  await assert.rejects(rejected({ response: { status: 401 }, config: { url: 'api/v1/auth/me', headers: { Authorization: 'Bearer deployment-jwt' } } }));
  assert.equal(window.location.href, `${base}login`);
  let historyBase;
  new Function('adminFarmApi', 'createRouter', 'createWebHistory', 'useAuthStore', 'SA', 'FA', 'FS', 'FIN', 'ALL_ROLES', 'defaultPathFor',
    source('router/index.js').replace('export default router;', '').replaceAll('import.meta.env.BASE_URL', JSON.stringify(base)))
    ({}, () => ({ beforeEach() {} }), value => { historyBase = value; }, () => auth,
      roles.SUPER_ADMIN, roles.FARM_ADMIN, roles.FARM_STAFF, roles.FINANCE_STAFF, roles.ALL_ROLES, roles.defaultPathFor);
  assert.equal(historyBase, base);
});

test('inspection retains Super Admin role and context through refresh, then clears on logout', () => {
  const { auth, session } = setup();
  auth.setLoginSession({ token:'jwt', user:{ user_id:1, user_role:roles.SUPER_ADMIN } });
  auth.inspectFarm({ farmId:'F1', farmName:'First farm', active:true });
  assert.equal(auth.userRole, roles.SUPER_ADMIN);
  assert.equal(auth.effectiveFarmId, 'F1');
  auth.inspectedFarm = null;
  auth.restoreSession();
  assert.equal(auth.isInspecting, true);
  assert.equal(auth.inspectionVerified, false);
  auth.clearLoginSession();
  assert.equal(auth.isInspecting, false);
  assert.equal(session.getItem('inspectedFarm'), null);
});
test('inspection guard requires a farm, validates direct URL, and clears when returning to all farms', async () => {
  let fetched;
  const { auth, guard } = setup({ detail:async id => { fetched=id; return { data:{ farmId:id, farmName:id } }; } });
  auth.setLoginSession({ token:'jwt', user:{ user_id:1, user_role:roles.SUPER_ADMIN } });
  auth.profileLoaded = true;
  const destination = { path:'/farm/info', fullPath:'/farm/info', query:{}, meta:{ farmScoped:true, roles:[roles.SUPER_ADMIN] } };
  assert.equal((await guard(destination)).name,'all-farms');
  assert.equal(await guard({ ...destination, query:{farmId:'F2'} }),true);
  assert.equal(fetched,'F2');
  assert.equal(auth.effectiveFarmId,'F2');
  assert.equal((await guard({ ...destination, path:'/dashboard' })).query.farmId,'F2');
  await guard({ path:'/farms', fullPath:'/farms', query:{}, meta:{ leavesInspection:true, roles:[roles.SUPER_ADMIN] } });
  assert.equal(auth.isInspecting,false);
});
test('farm staff cannot activate inspection and invalid farm IDs clear the selected farm', async () => {
  const { auth, guard } = setup({ detail:async () => { throw { response:{status:404} }; } });
  auth.setLoginSession({ token:'jwt', user:{ user_id:2, user_role:roles.FARM_STAFF } });
  auth.inspectFarm({farmId:'forbidden'});
  assert.equal(auth.inspectedFarm,null);
  auth.setLoginSession({ token:'jwt', user:{ user_id:1, user_role:roles.SUPER_ADMIN } });auth.profileLoaded=true;
  const result = await guard({path:'/farm/info',query:{farmId:'missing'},meta:{farmScoped:true,roles:[roles.SUPER_ADMIN]}});
  assert.equal(result.name,'all-farms');assert.equal(auth.isInspecting,false);
});

test('inspection sidebar reuses the exact Farm Admin menu', () => {
  const getMenu = new Function('SUPER_ADMIN','FARM_ADMIN','FARM_STAFF','FINANCE_STAFF',
    source('constants/menuConfig.js').replace('export function getMenu','function getMenu')+'\nreturn getMenu;')
    (roles.SUPER_ADMIN,roles.FARM_ADMIN,roles.FARM_STAFF,roles.FINANCE_STAFF);
  assert.deepEqual(getMenu(roles.SUPER_ADMIN,true), getMenu(roles.FARM_ADMIN));
  assert.notDeepEqual(getMenu(roles.SUPER_ADMIN,false),getMenu(roles.FARM_ADMIN));
});

test('Farm Admin resumes the database setup step and cannot skip by URL', async () => {
  const { auth, authApi, guard } = setup();
  auth.token = 'jwt';
  auth.profileLoaded = true;
  auth.user = { user_id: 7, user_role: roles.FARM_ADMIN, farm_id: null };
  for (const [step, name] of [[1, 'farm-info'], [2, 'farm-houses'], [3, 'farm-flocks']]) {
    authApi.setupStatus = async () => ({ data: { step, farmId: step === 1 ? null : 'farm-1' } });
    assert.deepEqual(await guard({ name: 'dashboard', meta: {} }), { name, replace: true });
    assert.equal(await guard({ name, meta: { roles: [roles.FARM_ADMIN] } }), true);
  }
  authApi.setupStatus = async () => ({ data: { step: 0, farmId: 'farm-1' } });
  assert.equal(await guard({ name: 'dashboard', meta: { roles: [roles.FARM_ADMIN] } }), true);
  assert.equal(auth.isFarmSetupRequired, false);
  assert.equal(roles.defaultPathFor(roles.FARM_ADMIN), '/dashboard');
});

test('Farm Admin can return to saved farm details while setup remains required', async () => {
  const { auth, authApi, guard } = setup();
  auth.token = 'jwt';
  auth.profileLoaded = true;
  auth.user = { user_id: 7, user_role: roles.FARM_ADMIN, farm_id: 'farm-1' };
  authApi.setupStatus = async () => ({ data: { step: 2, farmId: 'farm-1' } });
  assert.equal(await guard({ name: 'farm-info', meta: { roles: [roles.FARM_ADMIN] } }), true);
  assert.deepEqual(await guard({ name: 'dashboard', meta: {} }), { name: 'farm-houses', replace: true });
});

test('Farm Admin can return from flock setup to saved houses', async () => {
  const { auth, authApi, guard } = setup();
  auth.token = 'jwt';
  auth.profileLoaded = true;
  auth.user = { user_id: 7, user_role: roles.FARM_ADMIN, farm_id: 'farm-1' };
  authApi.setupStatus = async () => ({ data: { step: 3, farmId: 'farm-1' } });
  assert.equal(await guard({ name: 'farm-houses', meta: { roles: [roles.FARM_ADMIN] } }), true);
  assert.deepEqual(await guard({ name: 'dashboard', meta: {} }), { name: 'farm-flocks', replace: true });
});

test('existing Farm Admin uses flock menu normally and new sessions do not inherit setup state', async () => {
  const {auth, authApi, guard} = setup();
  auth.token='jwt';auth.profileLoaded=true;auth.user={user_id:7,user_role:roles.FARM_ADMIN,farm_id:'F1'};
  authApi.setupStatus=async()=>({data:{step:0,farmId:'F1'}});
  assert.equal(await guard({name:'farm-flocks',meta:{roles:[roles.FARM_ADMIN],farmScoped:true}}),true);
  assert.equal(await guard({name:'farm-flocks-new',meta:{roles:[roles.FARM_ADMIN],farmScoped:true}}),true);
  auth.setupStep=3;
  auth.setLoginSession({token:'another',user:{user_id:9,user_role:roles.FARM_ADMIN,farm_id:'F2'}});
  assert.equal(auth.setupStep,null);
});


test('late 401 responses after logout or a new login do not clear the current session', async () => {
  const { auth, local, session } = setup();
  let rejected;
  const api = { interceptors: { request: { use() {} }, response: { use: (_, fn) => { rejected = fn; } } } };
  const window = { location: { pathname: '/farm/flocks', href: '' } };
  new Function('axios', 'useAuthStore', 'localStorage', 'sessionStorage', 'window',
    source('services/api.js').replace('import.meta.env.VITE_API_URL', "''").replaceAll('import.meta.env.BASE_URL', JSON.stringify('/')).replaceAll('export const ', 'const '))
    ({ create: () => api }, () => auth, local, session, window);
  const oldResponse = { response: { status: 401 }, config: { url: 'api/v1/flocks', headers: { Authorization: 'Bearer old-jwt' } } };
  auth.clearLoginSession();
  await assert.rejects(rejected(oldResponse));
  assert.equal(window.location.href, '');
  auth.setLoginSession({ token: 'new-jwt', user: {} }, false);
  await assert.rejects(rejected(oldResponse));
  assert.equal(auth.token, 'new-jwt');
  assert.equal(window.location.href, '');
});

test('farm and flock loaders do not request protected data after logout', async () => {
  for (const [file, end] of [['views/flocks/FlocksView.vue', '\nconst '], ['views/farms/FarmInfoView.vue', '\nonBeforeUnmount']]) {
    const text = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
    const start = text.indexOf('async function load(');
    const body = file.includes('FlocksView') ? text.slice(start, text.indexOf('\n', start)) : text.slice(start, text.indexOf(end, start));
    const rows = { value: ['previous data'] }, farm = { value: {} }, loading = { value: true };
    let calls = 0;
    const api = { list: () => { calls++; }, detail: () => { calls++; }, myFarm: () => { calls++; } };
    await new Function('auth', 'rows', 'farm', 'loading', 'error', 'flockApi', 'adminFarmApi', 'authApi', `let request = 0; ${body}; return load();`)
      ({ isAuthenticated: false }, rows, farm, loading, { value: '' }, api, api, api);
    assert.equal(calls, 0, file);
    assert.equal(loading.value, false);
  }
});
