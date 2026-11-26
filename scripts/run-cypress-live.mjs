import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const open = process.argv.includes('--open');
const headed = process.argv.includes('--headed');
const fast = process.argv.includes('--fast');
const env = { ...process.env };
if(fast){
  env.CYPRESS_STEP_DELAY_MS='0';env.CYPRESS_PAGE_PAUSE_MS='0';env.CYPRESS_TYPE_DELAY_MS='0';
}
const credentialsPath = fileURLToPath(new URL('../cypress.env.json', import.meta.url));
if(fs.existsSync(credentialsPath)){
  const local=JSON.parse(fs.readFileSync(credentialsPath,'utf8'));
  for(const key of ['qaPassword','superPassword']){
    if(!env[`CYPRESS_${key}`] && typeof local[key]==='string')env[`CYPRESS_${key}`]=local[key];
  }
}
env.CYPRESS_qaPassword ||= 'Postman@123';

async function secret(prompt) {
  if (!process.stdin.isTTY) throw new Error('Set CYPRESS_qaPassword and CYPRESS_superPassword locally, or run this command in Terminal to enter passwords privately.');
  process.stdout.write(prompt);
  const input = process.stdin;
  const wasRaw = input.isRaw;
  input.setRawMode(true); input.resume(); input.setEncoding('utf8');
  return new Promise((resolve, reject) => {
    let value = '';
    const cleanup = () => { input.off('data', read); input.setRawMode(wasRaw); input.pause(); process.stdout.write('\n'); };
    const read = (chunk) => {
      for (const char of chunk) {
        if (char === '\u0003') { cleanup(); reject(new Error('Cancelled')); return; }
        if (char === '\r' || char === '\n') { cleanup(); resolve(value); return; }
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else if (char >= ' ') value += char;
      }
    };
    input.on('data', read);
  });
}
try {
  console.log('Release 1: 38 real UI cases. Email workflows are excluded.');
  if(!env.CYPRESS_superPassword)env.CYPRESS_superPassword=await secret('Super Admin password (hidden): ');
  if(!env.CYPRESS_superPassword)throw new Error('Super Admin password is empty. Nothing was run.');
  const args=[fileURLToPath(new URL('../node_modules/cypress/bin/cypress',import.meta.url)),open?'open':'run','--config-file','cypress.config.js'];
  if(headed&&!open)args.push('--headed');
  const child=spawn(process.execPath,args,{cwd:fileURLToPath(new URL('../',import.meta.url)),env,stdio:'inherit'});
  child.on('error',error=>{console.error(error.message);process.exitCode=1;});
  child.on('exit',code=>{process.exitCode=code??1;});
}catch(error){console.error(error.message);process.exitCode=1;}
