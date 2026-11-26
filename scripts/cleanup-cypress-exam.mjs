// Soft-delete only fixtures from a single known CY41 run. No SQL or broad QA matching.
import fs from 'node:fs';
const run = process.argv[2];
if (!/^\d{10}$/.test(run || '')) throw new Error('Usage: node scripts/cleanup-cypress-exam.mjs <10-digit-run-id> [--apply]');
const prefix=`CY41-${run}-`, userPrefix=`cy41.${run}.`,apply=process.argv.includes('--apply');
const base='https://bscit.sit.kmutt.ac.th/capstone26/cp26cs1/';
const local=JSON.parse(fs.readFileSync(new URL('../cypress.env.json',import.meta.url),'utf8'));
const auth=await fetch(new URL('api/v1/auth/login',base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'pm.admin.a',password:local.qaPassword || 'Postman@123'})});
if(!auth.ok)throw new Error('QA cleanup login failed');const token=(await auth.json()).accessToken;
async function call(path,method='GET'){
 const r=await fetch(new URL(path,base),{method,headers:{Authorization:`Bearer ${token}`}});
 if(method==='GET'){if(!r.ok)throw new Error(`Cannot inspect fixtures: ${r.status}`);return r.json();}return r.status;
}
const houses=(await call('api/v1/houses')).filter(h=>h.houseName.startsWith(prefix)&&h.farmId==='PM-EXAM-A');
const flocks=(await call('api/v1/flocks')).filter(f=>f.flockCode.startsWith(prefix)&&houses.some(h=>h.houseId===f.houseId));
const users=(await call(`api/v1/admin/users?search=${encodeURIComponent(userPrefix)}&size=50`)).content.filter(u=>u.username.startsWith(userPrefix)&&u.farmId==='PM-EXAM-A'&&u.role==='Farm Staff');
console.log(JSON.stringify({run,apply,houses:houses.map(h=>({id:h.houseId,name:h.houseName})),flocks:flocks.map(f=>({id:f.flockId,code:f.flockCode})),users:users.map(u=>({id:u.userId,name:u.username}))},null,2));
if(apply){
 const outcomes=[];
 const manifest=new URL(`../cypress/results/fixtures-${run}.json`,import.meta.url);
 if(fs.existsSync(manifest)){
   const saved=JSON.parse(fs.readFileSync(manifest,'utf8'));
   if(typeof saved.originalAddress==='string'){
     const farm=await call('api/v1/farms/me');
     if(farm.farmId==='PM-EXAM-A'&&farm.address===`Cypress QA ${run}`){
       const restored=await fetch(new URL('api/v1/farms/me',base),{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({...farm,address:saved.originalAddress})});
       outcomes.push({type:'restore QA address',status:restored.status});
     }
   }
 }
 for(const f of flocks)outcomes.push({type:'flock',id:f.flockId,status:await call(`api/v1/flocks/${f.flockId}`,'DELETE')});
 for(const h of houses)outcomes.push({type:'house',id:h.houseId,status:await call(`api/v1/houses/${h.houseId}`,'DELETE')});
 for(const u of users)outcomes.push({type:'user',id:u.userId,status:await call(`api/v1/admin/users/${u.userId}`,'DELETE')});
 const file=new URL(`../cypress/results/cleanup-${run}.json`,import.meta.url);fs.mkdirSync(new URL('../cypress/results/',import.meta.url),{recursive:true});fs.writeFileSync(file,JSON.stringify(outcomes,null,2));
 console.log('Cleanup statuses:',JSON.stringify(outcomes));
}
