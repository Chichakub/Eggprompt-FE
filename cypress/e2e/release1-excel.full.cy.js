import * as x from '../support/excel41';
// Each it maps to ONE original Excel case. Requests observe or prepare real QA data;
// the action under test always uses the deployed browser UI. No response stubs.
let staff, passwordUser;
const test = (id,title,fn) => {
  const selected = Cypress.expose('examCases');
  const excluded = Array.isArray(selected) && selected.length && !selected.includes(id);
  const register = excluded ? it.skip : it;
  register(`${id} | ${title}`,fn);
};
const scope = id => `?farmId=${encodeURIComponent(id)}`;
const noWrites = (pattern, action, method='POST') => {
  const calls=[];cy.intercept(method,pattern,req=>{calls.push(req);});action();
  cy.then(()=>expect(calls,'invalid form must not submit').to.have.length(0));
};

describe('Release 1 — 38 UI cases, email excluded',()=>{
  before(()=>x.initialize());
  afterEach(function(){ if(this.currentTest?.err) cy.task('examFailure',{id:this.currentTest.title.match(/R1-\d+-\d+/)?.[0],message:this.currentTest.err.message.slice(0,700)},{log:false}); });
  test('R1-01-01','Role login, masked password and correct landing',()=>{
    for(const role of ['super','admin','staff'])x.signIn(role);
  });
  test('R1-01-02','Wrong password leaves no authenticated session',()=>{
    x.page('login');x.fill('#username','pm.admin.a');cy.get('#password').type('DefinitelyWrong!41',{log:false});
    cy.intercept('POST','**/api/v1/auth/login').as('badLogin');cy.get('button[type=submit]').click();
    x.expectResponse('@badLogin',401);cy.location('pathname').should('match',/\/login$/);cy.get('[role=alert]').should('be.visible');
    x.page('dashboard');cy.location('pathname').should('match',/\/login$/);
  });
  test('R1-01-03','Logout, back and refresh require login',()=>{
    x.signIn();cy.intercept('POST','**/api/v1/auth/logout').as('logout');x.click('ออกจากระบบ');
    cy.wait('@logout').its('response.statusCode').should('be.oneOf',[200,204]);x.page('dashboard');cy.location('pathname').should('match',/\/login$/);cy.reload();cy.location('pathname').should('match',/\/login$/);
  });

  test('R1-03-01','Create Farm Staff with correct farm and role',()=>{
    x.signIn();x.page('users');const username=`cy41.${x.run}.ui`;x.userForm(username);
    cy.intercept('POST','**/api/v1/admin/users').as('createUser');x.click('สร้างผู้ใช้ใหม่');
    x.expectResponse('@createUser',201).then(({response})=>{staff={...response.body,username};x.state.users.push(staff);x.saveState();expect(response.body.role).eq('Farm Staff');expect(response.body.farmId).eq('PM-EXAM-A');});
    x.ok();x.fill('input[aria-label="ค้นหา Username"]',username);cy.contains('tbody tr',username).should('contain','Farm Staff');
  });
  test('R1-02-05','First login forces password change before business access',()=>{
    x.createStaff('first').then(user=>{passwordUser=user;x.signInAs(user.username,x.tempPassword,'/first-login-password');});
    x.page('farm/flocks');cy.location('pathname').should('match',/\/first-login-password$/);
    x.passwordForm(x.tempPassword,x.personalPassword);cy.intercept('POST','**/api/v1/auth/change-password').as('changeFirst');
    x.click(/^ยืนยัน$/,'[aria-labelledby="change-password-title"] button');x.expectResponse('@changeFirst',200);x.ok();
    cy.then(()=>x.signInAs(passwordUser.username,x.personalPassword));x.page('farm/flocks');cy.get('h1').should('contain','ข้อมูลฝูงไก่');
  });
  test('R1-02-01','Change account password and log in with the new password',()=>{
    cy.then(()=>{expect(passwordUser,'first-login QA account').to.exist;x.signInAs(passwordUser.username,x.personalPassword);});
    x.page('account');cy.get('#pf-username').should('not.have.value','');x.click('เปลี่ยนรหัสผ่าน');x.passwordForm(x.personalPassword,'ExamNext@123');
    cy.intercept('POST','**/api/v1/auth/change-password').as('changePassword');x.click(/^ยืนยัน$/,'[aria-labelledby="change-password-title"] button');x.expectResponse('@changePassword',200);x.ok();
    cy.then(()=>x.signInAs(passwordUser.username,'ExamNext@123'));
  });
  test('R1-02-02','Mismatched confirmation rejected; password unchanged',()=>{
    cy.then(()=>x.signInAs(passwordUser.username,'ExamNext@123'));x.page('account');cy.get('#pf-username').should('not.have.value','');x.click('เปลี่ยนรหัสผ่าน');
    x.passwordForm('ExamNext@123','ExamOther@123','Mismatch@123');
    noWrites('**/api/v1/auth/change-password',()=>x.click(/^ยืนยัน$/,'[aria-labelledby="change-password-title"] button'));
    cy.contains('รหัสผ่านทั้งสองช่องไม่ตรงกัน').should('be.visible');cy.then(()=>x.signInAs(passwordUser.username,'ExamNext@123'));
  });
  test('R1-03-02','Duplicate username rejected without another account',()=>{
    x.signIn();x.page('users');x.userForm('pm.staff.a');cy.intercept('POST','**/api/v1/admin/users').as('duplicateUser');x.click('สร้างผู้ใช้ใหม่');x.expectResponse('@duplicateUser',409);
    cy.get('[role=alert]').should('be.visible');x.request('GET','api/v1/admin/users?search=pm.staff.a&size=100').then(r=>expect(r.body.content.filter(u=>u.username==='pm.staff.a')).to.have.length(1));
  });
  test('R1-03-03','Suspend blocks login; reactivate allows login',()=>{
    // Independent fixture prevents a failed earlier create-user case causing cascades.
    x.createStaff('active').then(user=>{staff=user;x.changeFirstLogin(user);});
    x.signIn();x.page('users');cy.then(()=>x.fill('input[aria-label="ค้นหา Username"]',staff.username));
    cy.intercept('PUT','**/api/v1/admin/users/*').as('toggleUser');cy.then(()=>cy.get(`[aria-label="สถานะ ${staff.username}"]`).click());x.expectResponse('@toggleUser',200);x.click('ออกจากระบบ');cy.location('pathname').should('match',/\/login$/);
    cy.then(()=>{x.page('login');x.fill('#username',staff.username);cy.get('#password').type(x.personalPassword,{log:false});});
    cy.intercept('POST','**/api/v1/auth/login').as('suspended');cy.get('button[type=submit]').click();x.expectResponse('@suspended',403);
    x.signIn();x.page('users');cy.then(()=>x.fill('input[aria-label="ค้นหา Username"]',staff.username));cy.intercept('PUT','**/api/v1/admin/users/*').as('toggleUser');cy.then(()=>cy.get(`[aria-label="สถานะ ${staff.username}"]`).click());x.expectResponse('@toggleUser',200);cy.then(()=>x.signInAs(staff.username,x.personalPassword));
  });
  test('R1-03-04','Farm Staff has no user-management menu or route access',()=>{
    x.signIn('staff');cy.get('a[href$="/users"]').should('not.exist');x.page('users');cy.location('pathname').should('match',/\/farmstaff$/);
  });
  test('R1-04-01','Farm overview summary, search and clear',()=>{
    x.signIn('super');x.page('farms');cy.get('.stat-grid article').should('have.length',4);
    x.fill('[aria-label="ค้นหาฟาร์ม"]','PM-EXAM-A');cy.contains('tbody tr','PM-EXAM-A').should('be.visible');
    cy.get('[aria-label="ค้นหาฟาร์ม"]').clear();cy.get('tbody .farm-id').should('have.length.greaterThan',1);
    x.fill('[aria-label="ค้นหาฟาร์ม"]','PM-EXAM-B');cy.contains('tbody tr','PM-EXAM-B').should('be.visible');
  });
  test('R1-04-02','Farm status filter and empty search result',()=>{
    x.signIn('super');x.page('farms');x.click(/^ระงับบริการ$/,'.filters button');
    cy.get('tbody').should('not.contain','กำลังโหลด');cy.get('tbody .status').each(el=>expect(el.text()).to.include('ระงับ'));
    x.fill('[aria-label="ค้นหาฟาร์ม"]',`NO-SUCH-${x.run}`);cy.get('tbody .empty').should('be.visible');
  });
  test('R1-04-03','Pagination 10 rows, distinct next page, return',()=>{
    x.signIn('super');x.page('farms');
    const search='R1-PAGE-';
    const match=page=>({method:'GET',pathname:'**/api/v1/admin/farms',query:{search,page:String(page)}});
    cy.intercept(match(0)).as('paginationFirst');
    x.fill('[aria-label="ค้นหาฟาร์ม"]',search);
    x.expectResponse('@paginationFirst',200).then(({response})=>{
      expect(response.body.totalElements,'pagination fixture contains more than 10 farms').greaterThan(10);
      const first=response.body.content.map(f=>f.farmId);
      expect(first).length(10);
      cy.get('tbody .farm-id').should(cells=>expect([...cells].map(c=>c.textContent.trim())).deep.eq(first));
      cy.intercept(match(1)).as('paginationNext');cy.get('[aria-label="หน้าถัดไป"]').should('not.be.disabled').click();
      x.expectResponse('@paginationNext',200).then(({response:next})=>{
        const ids=next.body.content.map(f=>f.farmId);
        expect(ids).length(Math.min(10,response.body.totalElements-10));
        ids.forEach(id=>expect(first).not.include(id));
        cy.get('tbody .farm-id').should(cells=>expect([...cells].map(c=>c.textContent.trim())).deep.eq(ids));
      });
      cy.intercept(match(0)).as('paginationBack');cy.get('[aria-label="หน้าก่อนหน้า"]').should('not.be.disabled').click();
      x.expectResponse('@paginationBack',200);
      cy.get('tbody .farm-id').should(cells=>expect([...cells].map(c=>c.textContent.trim())).deep.eq(first));
    });
  });
  test('R1-05-02','Farm requires at least one Farm Admin',()=>{
    x.signIn('super');x.page('farms/new');x.farmForm(`${x.state.prefix}-NOADMIN`,`cy41.${x.run}.no`,'Farm Staff');
    noWrites('**/api/v1/farms',()=>x.click('ถัดไป'));cy.contains('กรุณาเพิ่มบัญชี Farm Admin อย่างน้อย 1 บัญชี').should('be.visible');
    x.request('GET',`api/v1/admin/farms?search=${x.state.prefix}-NOADMIN` ,null,'super').then(r=>expect(r.body.content).to.have.length(0));
  });
  test('R1-05-03','Duplicate owner username creates no orphan farm',()=>{
    x.signIn('super');x.page('farms/new');x.farmForm(`${x.state.prefix}-DUPLICATE`,'pm.admin.a');
    cy.intercept('POST','**/api/v1/farms').as('duplicateFarm');x.click('ถัดไป');x.expectResponse('@duplicateFarm',409);cy.contains('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว').should('be.visible');
    x.request('GET',`api/v1/admin/farms?search=${x.state.prefix}-DUPLICATE`,null,'super').then(r=>expect(r.body.content).to.have.length(0));
  });
  test('R1-06-01','Switch farm A → B → A, names and house isolation',()=>{
    x.signIn('super');for(const [index,id] of ['PM-EXAM-A','PM-EXAM-B','PM-EXAM-A'].entries()){
      cy.then(()=>{x.page(`farm/info${scope(id)}`);cy.contains(id==='PM-EXAM-A'?x.state.farmA.farmName:x.state.farmB.farmName).should('be.visible');});
      cy.intercept({method:'GET',url:'**/api/v1/houses*',headers:{'x-farm-id':id}}).as(`scopedHouses${index}`);x.page(`farm/houses${scope(id)}`);
      cy.wait(`@scopedHouses${index}`).then(({request,response})=>{expect(request.headers['x-farm-id']).eq(id);expect(response.statusCode).eq(200);expect(response.body).not.empty;response.body.forEach(h=>expect(h.farmId).eq(id));cy.contains('[role=option]',response.body[0].houseName).should('be.visible');});
    }
  });
  test('R1-06-02','Refresh preserves context; menus and overview return',()=>{
    x.signIn('super');x.page('farm/houses?farmId=PM-EXAM-A');cy.reload();cy.location('search').should('contain','PM-EXAM-A');
    cy.get('a[href*="farm/flocks"]').first().click();cy.location('search').should('contain','PM-EXAM-A');
    x.page('farms');cy.get('[aria-label="ค้นหาฟาร์ม"]').should('be.visible');cy.location('search').should('not.contain','farmId');
  });
  test('R1-07-01','Edit farm details, preserve ID and persist after reload',()=>{
    x.signIn();x.page('farm/info');x.click('แก้ไขข้อมูล');
    cy.get('#address').should('not.be.disabled').should('not.have.value','').invoke('val').then(original=>{x.state.originalAddress=original;x.saveState();});
    x.fill('#address',`Cypress QA ${x.run}`);cy.intercept('PUT','**/api/v1/farms/me').as('editFarm');x.click(/^บันทึก$/);x.expectResponse('@editFarm',200);cy.reload();cy.contains(`Cypress QA ${x.run}`).should('be.visible');cy.contains('PM-EXAM-A').should('be.visible');
    // Restore only the field changed by this case, through the same UI.
    x.click('แก้ไขข้อมูล');cy.then(()=>x.fill('#address',x.state.originalAddress));x.click(/^บันทึก$/);x.expectResponse('@editFarm',200);
  });
  test('R1-07-02','Blank farm name rejected and original retained',()=>{
    x.signIn();x.page('farm/info');x.click('แก้ไขข้อมูล');cy.get('#farmName').should('not.be.disabled').should('not.have.value','').invoke('val').then(name=>{
      cy.get('#farmName').clear();noWrites('**/api/v1/farms*',()=>x.click(/^บันทึก$/),'PUT');cy.get('#farmName').should('have.attr','aria-invalid','true');cy.reload();cy.contains(name).should('be.visible');
    });
  });

  test('R1-08-01','Create house capacity 100; edit to 120; reload',()=>{
    x.signIn();x.page('farm/houses/new');const name=`${x.state.prefix}-EDIT`;x.houseForm(name);
    cy.intercept('POST','**/api/v1/houses').as('houseCreate');x.click(/^บันทึก$/);x.expectResponse('@houseCreate',201).then(({response})=>{x.state.fixtures.push({type:'house',...response.body});x.saveState();});x.ok();
    cy.contains('[role=option]',name).click();x.click('แก้ไขข้อมูล');x.fill('#edit-cap',120);cy.intercept('PUT','**/api/v1/houses/*').as('editHouse');x.click(/^ยืนยัน$/);x.expectResponse('@editHouse',200);x.ok();cy.reload();cy.contains('[role=option]',name).click();cy.contains('120 ตัว').should('be.visible');
  });
  test('R1-08-02','Capacity 0 rejected; boundary 1 accepted',()=>{
    x.signIn();x.page('farm/houses/new');x.houseForm(`${x.state.prefix}-MIN`,0);noWrites('**/api/v1/houses',()=>x.click(/^บันทึก$/));
    cy.get('input[id$="-cap"]').should('have.attr','aria-invalid','true');x.fill('input[id$="-cap"]',1);cy.intercept('POST','**/api/v1/houses').as('minHouse');x.click(/^บันทึก$/);x.expectResponse('@minHouse',201).then(({response})=>{expect(response.body.capacity).eq(1);x.state.fixtures.push({type:'house',...response.body});x.saveState();});x.ok();
  });
  test('R1-08-03','Duplicate house name rejected, one record remains',()=>{
    x.house('DUP').then(h=>{x.signIn();x.page('farm/houses/new');x.houseForm(h.houseName);cy.intercept('POST','**/api/v1/houses').as('dupHouse');x.click(/^บันทึก$/);x.expectResponse('@dupHouse',409);cy.contains('เพิ่มโรงเรือนไม่สำเร็จ').should('be.visible');x.request('GET','api/v1/houses').then(r=>expect(r.body.filter(row=>row.houseName===h.houseName)).to.have.length(1));});
  });
  test('R1-08-04','Occupied house cannot be deleted; flock remains',()=>{
    x.occupied('OCC').then(({h,f})=>{x.signIn();x.page('farm/houses');cy.contains('[role=option]',h.houseName).click();x.click('ลบโรงเรือน');cy.intercept('DELETE','**/api/v1/houses/*').as('occupiedDelete');x.click(/^ยืนยัน$/,'dialog[open] button');cy.wait('@occupiedDelete').its('response.statusCode').should('be.oneOf',[400,409]);x.ok();cy.reload();cy.contains('[role=option]',h.houseName).should('exist');x.assertCount(f,100);});
  });
  test('R1-09-01','Receive flock 100 in capacity-100 house',()=>{
    x.house('INTAKE').then(h=>{x.signIn();x.page('farm/flocks/new');const code=`${x.state.prefix}-F100`;x.flockForm(h,code);cy.intercept('POST','**/api/v1/flocks').as('createFlock');x.click(/^ยืนยัน$/);x.expectResponse('@createFlock',201).then(({response})=>{expect(response.body.initialCount).eq(100);x.state.fixtures.push({type:'flock',...response.body});x.saveState();});x.ok();cy.location('pathname').should('match',/\/farm\/flocks$/);cy.reload();cy.contains('tbody tr',code).should('contain',h.houseName).and('contain','100');});
  });
  test('R1-09-02','Flock 101 rejected in capacity-100 house',()=>{
    x.house('OVER').then(h=>{x.signIn();x.page('farm/flocks/new');const code=`${x.state.prefix}-F101`;x.flockForm(h,code,101);cy.intercept('POST','**/api/v1/flocks').as('overCapacity');x.click(/^ยืนยัน$/);cy.wait('@overCapacity').its('response.statusCode').should('be.oneOf',[400,409]);cy.get('[role=alert]').should('be.visible');x.request('GET','api/v1/flocks').then(r=>expect(r.body.filter(f=>f.flockCode===code)).length(0));});
  });
  test('R1-09-03','Occupied house excluded from second active flock',()=>{
    x.occupied('SECOND').then(({h})=>{x.signIn();x.page('farm/flocks/new');cy.contains('label','โรงเรือนที่นำเข้า').find('select').should('be.visible').find(`option[value="${h.houseId}"]`).should('not.exist');x.request('GET','api/v1/flocks').then(r=>expect(r.body.filter(f=>f.houseId===h.houseId&&f.status!=='RETIRED')).length(1));});
  });
  test('R1-09-04','Intake date immutable after a daily record exists',()=>{
    x.occupied('IMMUTABLE').then(({h,f})=>{
      x.request('POST','api/feed-logs',{houseId:h.houseId,weightKg:1,lotNumber:`${x.state.prefix}-LOCK`}).its('status').should('eq',201);
      x.signIn();x.page('farm/flocks');cy.get(`[aria-label="แก้ไข ${f.flockCode}"]`).click();
      cy.get('.flock-drawer input[type=date]').then(input=>{
        if(input.prop('disabled')){expect(input.val()).eq(dateValue(f.receivedDate));return;}
        x.fill('.flock-drawer input[type=date]',x.date(-6));cy.intercept('PUT','**/api/v1/flocks/*').as('changeDate');x.click(/^บันทึก$/,'dialog[open] button');cy.wait('@changeDate').its('response.statusCode').should('be.oneOf',[400,409]);cy.get('.flock-drawer [role=alert]').should('be.visible');
      });x.request('GET','api/v1/flocks').then(r=>expect(r.body.find(row=>row.flockId===f.flockId).receivedDate).eq(f.receivedDate));
    });
  });

  test('R1-10-01','Save feed 12.50 kg and lot; verify Bangkok date/history',()=>{
    x.occupied('FEED').then(({h})=>{x.signIn('staff');x.page('operations/feed');cy.get('.picker-track').should('have.css','display','flex').and('have.css','overflow-x','auto');cy.contains('label',h.houseName).click();cy.get('.picker-track').invoke('outerHeight').should('be.lessThan',200);x.fill('#feed-weight','12.50');const lot=`${x.state.prefix}-FEED`;x.fill('#feed-lot-number',lot);cy.intercept('POST','**/api/feed-logs').as('feed');x.click('บันทึกข้อมูลโรงเรือนนี้');x.click('ยืนยันและบันทึก','dialog[open] button');x.expectResponse('@feed',201).then(({request})=>expect(request.body).include({houseId:h.houseId,weightKg:12.5,lotNumber:lot}));x.ok();x.request('GET',`api/houses/${h.houseId}/feed-logs`).then(r=>{expect(r.status).eq(200);expect(r.body.some(log=>Number(log.weightKg)===12.5&&log.lotNumber===lot&&log.recordDate===x.date(0))).eq(true);});});
  });
  test('R1-10-02','Zero feed and blank lot rejected without history',()=>{
    x.occupied('BADFEED').then(({h})=>{x.signIn('staff');x.page('operations/feed');cy.contains('label',h.houseName).click();x.fill('#feed-weight',0);noWrites('**/api/feed-logs',()=>x.click('บันทึกข้อมูลโรงเรือนนี้'));cy.get('[role=alert]').should('be.visible');x.fill('#feed-weight',1);noWrites('**/api/feed-logs',()=>x.click('บันทึกข้อมูลโรงเรือนนี้'));cy.get('[role=alert]').should('be.visible');x.request('GET',`api/houses/${h.houseId}/feed-logs`).then(r=>expect(r.body).length(0));});
  });
  test('R1-10-03','Empty house cannot receive a feed record',()=>{
    x.house('EMPTY').then(h=>{x.signIn('staff');x.page('operations/feed');cy.contains('label',h.houseName).click();cy.contains('ไม่มีฝูงที่กำลังเลี้ยง').should('be.visible');cy.get('#feed-weight').should('not.exist');x.request('GET',`api/houses/${h.houseId}/feed-logs`).then(r=>expect(r.body).length(0));});
  });
  test('R1-11-01','Egg totals 60 saleable, 63 total, 2 trays, 4.76%; save',()=>{
    x.occupied('EGGS').then(({h})=>{x.signIn('staff');x.page('operations/eggs');const lot=`${x.state.prefix}-EGG`;x.eggForm(h,lot);for(const [label,value]of [['ไข่ดีรอบนี้','60 ฟอง'],['รวมไข่ทั้งหมดรอบนี้','63 ฟอง'],['จำนวนแผงไข่ดี','2'],['ไข่เสีย','4.76%']])cy.contains('.summary-strip > div',label).find('strong').should('contain',value);x.submitEgg();cy.reload();x.fill('[aria-label="ค้นหาประวัติ"]',lot);cy.contains('tbody tr',lot).should('contain','63');});
  });
  test('R1-11-02','Duplicate morning rejected; afternoon accepted',()=>{
    x.occupied('ROUNDS').then(({h,f})=>{x.signIn('staff');x.page('operations/eggs');x.eggForm(h,`${x.state.prefix}-AM`);x.submitEgg();x.eggForm(h,`${x.state.prefix}-DUPAM`);x.submitEgg(409);cy.get('[role=alert]').should('be.visible');cy.get('.entry-panel select').select('AFTERNOON');x.submitEgg();x.request('GET','api/v1/egg-production').then(r=>{const own=r.body.filter(row=>row.values.flockId===f.flockId);expect(own).length(2);expect(new Set(own.map(row=>row.values.collectionRound)).size).eq(2);});});
  });
  test('R1-11-03','Dates D−8 and D+1 rejected; intake D−7 accepted',()=>{
    x.occupied('DATES').then(({h})=>{x.signIn('staff');x.page('operations/eggs');for(const offset of [-8,1]){x.eggForm(h,`${x.state.prefix}-BADDATE`,'MORNING',x.date(offset));noWrites('**/api/v1/egg-production',()=>x.click('บันทึกข้อมูลโรงเรือนนี้'));cy.get('[aria-label="วันที่บันทึก"]').then(el=>expect(el[0].validity.valid).eq(false));}x.eggForm(h,`${x.state.prefix}-BOUNDARY`,'MORNING',x.date(-7));x.submitEgg();cy.contains('tbody tr',`${x.state.prefix}-BOUNDARY`).should('be.visible');});
  });
  test('R1-11-04','Edit egg totals then delete; reload confirms removal',()=>{
    x.occupied('EDIT-EGG').then(({h})=>{x.signIn();x.page('operations/eggs');const lot=`${x.state.prefix}-EDIT-EGG`;x.eggForm(h,lot);x.submitEgg().then(({response})=>{
      const id=response.body.eggLogId;cy.get(`[aria-label="แก้ไข EGG-${id}"]`).click();x.fill('[aria-label="เบอร์ 1"]',40);cy.contains('.summary-strip > div','รวมไข่ทั้งหมดรอบนี้').find('strong').should('contain','73');x.submitEgg(200,'PUT');cy.reload();cy.contains('tbody tr',lot).should('contain','73');cy.get(`[aria-label="ลบ EGG-${id}"]`).click();cy.intercept('DELETE','**/api/v1/egg-production/*').as('deleteEgg');x.click(/^ยืนยัน$/,'dialog[open] button');x.expectResponse('@deleteEgg',204);x.ok();cy.reload();x.fill('[aria-label="ค้นหาประวัติ"]',lot);cy.contains('tbody tr',lot).should('not.exist');
    });});
  });
  test('R1-12-01','Deaths 2 and cull 1 leave 97; verify history',()=>{
    x.occupied('HEALTH97').then(({h,f})=>{x.signIn('staff');x.page('operations/health');x.loss(h,2);x.loss(h,1,'ไก่คัดทิ้ง');x.assertCount(f,97);x.request('GET','api/health-logs/loss-history').then(r=>{expect(r.status).eq(200);expect(JSON.stringify(r.body)).to.include(f.flockCode);});});
  });
  test('R1-12-02','Same-day deaths accumulate to 3, culls 1, remaining 96',()=>{
    x.occupied('HEALTH96').then(({h,f})=>{x.signIn('staff');x.page('operations/health');x.loss(h,2);x.loss(h,1,'ไก่คัดทิ้ง');x.loss(h,1);x.assertCount(f,96);x.request('GET','api/health-logs/loss-history').then(r=>{expect(r.status).eq(200);const own=r.body.filter(row=>row.flockCode===f.flockCode);expect(own.reduce((n,row)=>n+Number(row.deadCount||0),0)).eq(3);expect(own.reduce((n,row)=>n+Number(row.cullCount||0),0)).eq(1);});});
  });
  test('R1-12-03','Death/cull requires a cause and must not reduce flock',()=>{
    x.occupied('CAUSE').then(({h,f})=>{x.signIn('staff');x.page('operations/health');x.selectHealth(h);for(const mode of ['ไก่ตาย','ไก่คัดทิ้ง']){
      cy.contains('.modes label',mode).find('input').check();x.fill('.count-input input',1);cy.get('.record-panel .fields select').should(el=>expect(el[0].value).eq(''));
      // Intentionally strict: current deployed UI may permit an unspecified cause.
      // Fail BEFORE saving, rather than corrupting a QA flock to demonstrate the defect.
      cy.contains('button','ตรวจสอบก่อนบันทึก').should('be.disabled');
    }x.assertCount(f,100);});
  });
  test('R1-12-04','Sick count 101 rejected for fresh flock of 100',()=>{
    x.occupied('SICK').then(({h,f})=>{x.signIn('staff');x.page('operations/health');x.selectHealth(h);x.click('บันทึกเหตุการณ์ใหม่');cy.get('.incident select').eq(0).select(String(f.flockId));cy.get('.incident select').eq(1).select('เจ็บป่วย');x.fill('.incident input[type=number]',101);noWrites('**/api/health-cases',()=>x.click('บันทึกเหตุการณ์','dialog[open] button'));cy.get('.incident input[type=number]').then(el=>expect(el[0].validity.valid).eq(false));x.request('GET','api/health-cases').then(r=>expect(r.body.filter(row=>row.flockId===f.flockId)).length(0));x.assertCount(f,100);});
  });

});
function dateValue(value){return String(value).slice(0,10);}
