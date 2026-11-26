// Explicit pacing keeps Cypress action subjects intact during recordings.
const stepDelay = Number(Cypress.expose('stepDelayMs')) || 0;
const pagePause = Number(Cypress.expose('pagePauseMs')) || 0;
export function demoPause() {
  if (stepDelay > 0) cy.wait(stepDelay, { log: false });
}
if (pagePause > 0) afterEach(() => cy.wait(pagePause, { log: false }));


let loginSerial = 0;
function login(username, password, landing) {
  const alias = `liveLogin${++loginSerial}`;
  if (!password) throw new Error('Password missing: use npm run cy:exam and enter it locally.');
  cy.intercept('POST', '**/api/v1/auth/login').as(alias);
  demoPause();
  cy.visit('login');
  demoPause();
  cy.get('#username').type(username);
  demoPause();
  cy.get('#password').should('have.attr', 'type', 'password').type(password, { log: false });
  demoPause();
  cy.get('button[type=submit]').click();
  cy.wait(`@${alias}`).then(({ response }) => {
    expect(response?.statusCode, 'real login response status').to.eq(200);
  });
  cy.location('pathname').should('match', new RegExp(`${landing}$`));
}

export const run = String(Date.now()).slice(-10);
export const state = { run, prefix: `CY41-${run}`, fixtures: [], users: [] };
export const tempPassword = 'Postman@123';
export const personalPassword = 'Changed@123';
export const date = offset => new Date(Date.now() + offset * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
let settings;
const tokens = {};
export function initialize() {
  return cy.env(['superPassword','qaPassword'], { log: false }).then(value => {
    settings = value;
    return apiLogin('superadmin', value.superPassword).then(token => { tokens.super = token; });
  }).then(() => apiLogin('pm.admin.a', settings.qaPassword || tempPassword).then(token => { tokens.admin = token; }))
    .then(() => request('GET','api/v1/flocks/breeds').then(r => { expect(r.status).eq(200); state.breedId = r.body[0].breedId; }))
    .then(() => request('GET','api/v1/admin/farms/PM-EXAM-A', null, 'super').then(r => { expect(r.status).eq(200); state.farmA = r.body; }))
    .then(() => request('GET','api/v1/admin/farms/PM-EXAM-B', null, 'super').then(r => { expect(r.status).eq(200); state.farmB = r.body; }))
    .then(() => ensureInspectionHouse('PM-EXAM-A'))
    .then(() => ensureInspectionHouse('PM-EXAM-B'))
    .then(() => cy.task('examState', state, { log: false }));
}
function ensureInspectionHouse(farmId) {
  return request('GET',`api/v1/houses?farmId=${farmId}`,null,'super').then(r=>{
    expect(r.status,'inspection prerequisites').eq(200);
    if(r.body.length)return null;
    return request('POST','api/v1/houses',{farmId,houseName:`${state.prefix}-SCOPE-${farmId.endsWith('A')?'A':'B'}`,widthM:10,lengthM:20,capacity:100,lastBuiltOrRenovatedDate:'2024-01-01'},'super').then(created=>{
      expect(created.status,'create missing isolated inspection house').eq(201);
      state.fixtures.push({type:'house',...created.body});return saveState();
    });
  });
}
export function apiLogin(username,password) {
  return cy.request({ method:'POST',url:'api/v1/auth/login',body:{username,password},log:false,failOnStatusCode:false }).then(r => {
    if(r.status!==200) throw new Error(`Cannot start Release 1: QA login ${username} returned HTTP ${r.status}. Restore the QA prerequisites using Eggprompt-BE/tests/postman/release1-CP26CS1/setup-excel41-fixtures.sql. Existing passwords are not reset by that file. No functional cases have run yet.`);
    return r.body.accessToken;
  });
}
export function request(method,url,body,role='admin') {
  return cy.request({ method,url,body:body || undefined,headers:{Authorization:`Bearer ${tokens[role]}`},log:false,failOnStatusCode:false });
}
function clearSession() { cy.clearAllCookies({log:false});cy.clearAllLocalStorage({log:false});cy.clearAllSessionStorage({log:false}); }
export function signIn(role='admin') {
  clearSession();
  const map = { admin:['pm.admin.a',settings.qaPassword||tempPassword,'/dashboard'],staff:['pm.staff.a',settings.qaPassword||tempPassword,'/farmstaff'],super:['superadmin',settings.superPassword,'/superadmin'] };
  login(...map[role]);
}
export function signInAs(username,password,landing='/farmstaff') { clearSession();login(username,password,landing); }
export function page(path) { demoPause(); cy.visit(path); }
export function fill(selector,value) { demoPause(); cy.get(selector).should('not.be.disabled').clear();cy.get(selector).type(String(value)); }
export function click(text,selector='button') { demoPause(); const match=text instanceof RegExp ? new RegExp(text.source.replace(/^\^/, '^\\s*').replace(/\$$/,'\\s*$'),text.flags) : text; cy.contains(selector,match).click(); }
export function ok() { click('ตกลง'); }
export function expectResponse(alias,status) { return cy.wait(alias).then(({response,request}) => { expect(response?.statusCode,alias).eq(status);return {response,request}; }); }
export function saveState() { return cy.task('examState',state,{log:false}); }
export function house(label,capacity=100) {
  return request('POST','api/v1/houses',{houseName:`${state.prefix}-${label}`,widthM:10,lengthM:20,capacity,lastBuiltOrRenovatedDate:'2024-01-01'}).then(r => {
    expect(r.status,'isolated QA house prerequisite').eq(201);state.fixtures.push({type:'house',...r.body}); return saveState().then(()=>r.body);
  });
}
export function flock(h,label,count=100,received=date(-7)) {
  return request('POST','api/v1/flocks',{flockCode:`${state.prefix}-${label}`,houseId:h.houseId,breedId:state.breedId,supplier:'Cypress isolated QA',pricePerBird:100,receivedDate:received,initialAgeWeeks:18,initialCount:count,initialAverageWeightG:1000,vaccinated:true}).then(r => {
    expect(r.status,'isolated QA flock prerequisite').eq(201);state.fixtures.push({type:'flock',...r.body});return saveState().then(()=>r.body);
  });
}
export function occupied(label) { return house(label).then(h => flock(h,label).then(f => ({h,f}))); }
export function createStaff(label) {
  const username = `cy41.${run}.${label}`.slice(0,24);
  return request('POST','api/v1/admin/users',{username,password:tempPassword,role:'Farm Staff'}).then(r => {
    expect(r.status).eq(201);const user={...r.body,username};state.users.push(user);return saveState().then(()=>user);
  });
}
export function houseForm(name,capacity=100) {
  fill('input[id$="-name"]',name);fill('input[id$="-w"]',10);fill('input[id$="-l"]',20);fill('input[id$="-cap"]',capacity);fill('input[id$="-built"]','2024-01-01');
}
export function flockForm(h,code,count=100,received=date(-7)) {
  fill('input[placeholder="เช่น F69-01"]',code);fill('input[placeholder="เช่น ฟาร์มแม่ไก่สาว นครปฐม"]','Cypress QA');
  cy.contains('label','ราคาต่อตัว').find('input').type('100');
  cy.contains('label','โรงเรือนที่นำเข้า').find('select').select(String(h.houseId));
  fill('input[type=date]',received);fill('input[placeholder="เช่น 10"]',18);fill('input[placeholder="เช่น 1500"]',count);fill('input[placeholder="เช่น 1059"]',1000);
  cy.contains('label','โปรแกรมวัคซีน').find('select').select('true');
}
export function passwordForm(current,next,confirmation=next) {
  cy.get('#change-current-password').type(current,{log:false});cy.get('#change-new-password').type(next,{log:false});cy.get('#change-confirm-password').type(confirmation,{log:false});
}
export function changeFirstLogin(user) {
  signInAs(user.username,tempPassword,'/first-login-password');passwordForm(tempPassword,personalPassword);
  cy.intercept('POST','**/api/v1/auth/change-password').as('firstPassword');click(/^ยืนยัน$/,'[aria-labelledby="change-password-title"] button');expectResponse('@firstPassword',200);ok();
}
export function userForm(username) {
  click('เพิ่มผู้ใช้งาน');cy.contains('label','กำหนดสิทธิ์ผู้ใช้').find('select').select('Farm Staff');
  cy.contains('label','ชื่อผู้ใช้ (Username)').find('input').should('not.be.disabled').type(username);
  cy.get('input[placeholder="ระบุรหัสผ่านอย่างน้อย 8 ตัวอักษร"]').should('not.be.disabled').type(tempPassword,{log:false});
}
export function farmForm(name,username,role='Farm Admin') {
  fill('#farmName',name);fill('#address','Cypress QA Bangkok');fill('#farmRegistrationNumber',`CY${run}`);fill('#taxId','0105565012345');fill('#operationStartDate','2024-01-01');fill('#ownerName','Cypress QA Owner');fill('#contactPhone','0812345678');
  cy.get('#farm-account-1-role').select(role);fill('#farm-account-1-username',username);
  if(role==='Farm Admin')fill('#farm-account-1-email',`negative-${run}@example.invalid`);
  cy.get('#farm-account-1-password').type(tempPassword,{log:false});
}
export function eggForm(h,lot,round='MORNING',recordDate=date(0)) {
  cy.contains('.houses button',h.houseName).click();fill('input[aria-label="วันที่บันทึก"]',recordDate);
  for(const [label,n] of [['ไข่แฝด',10],['เบอร์ 0',20],['เบอร์ 1',30],['ไข่เสีย / คัดทิ้ง',3]])fill(`input[aria-label="${label}"]`,n);
  cy.get('.entry-panel select').select(round);fill('input[placeholder="เช่น EGG-1121-H1"]',lot);
}
let eggSerial=0;
export function submitEgg(status=201,method='POST') {
  const alias=`saveEgg${++eggSerial}`;
  cy.intercept(method,method==='POST'?'**/api/v1/egg-production':'**/api/v1/egg-production/*').as(alias);
  click(method==='POST'?'บันทึกข้อมูลโรงเรือนนี้':'ตรวจสอบการแก้ไข');
  click('ยืนยันและบันทึก','dialog[open] button');
  return expectResponse(`@${alias}`,status).then(result=>{if(status<300){ok();return cy.wrap(result,{log:false});}return result;});
}
export function selectHealth(h) { cy.contains('.house-picker label',h.houseName).find('input').check(); }
let lossSerial=0;
export function loss(h,count,mode='ไก่ตาย') {
  const alias=`saveLoss${++lossSerial}`;
  selectHealth(h);cy.contains('.modes label',mode).find('input').check();fill('.count-input input',count);
  cy.get('.record-panel .fields select').select('เจ็บป่วย');cy.intercept('POST','**/api/health-logs').as(alias);click('ตรวจสอบก่อนบันทึก');click('ยืนยันและบันทึก','dialog[open] button');expectResponse(`@${alias}`,201);ok();
}
export function assertCount(f,count) {
  request('GET','api/v1/flocks').then(r=>{expect(r.status).eq(200);expect(r.body.find(x=>x.flockId===f.flockId)?.currentCount).eq(count);});
  page('farm/flocks');cy.contains('tbody tr',f.flockCode).find('td').eq(3).find('strong').should('have.text',String(count));
}
