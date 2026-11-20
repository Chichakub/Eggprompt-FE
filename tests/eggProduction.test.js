import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyEggEntry, eggSummary } from '../src/composables/eggProduction.js';
test('egg form starts at zero and includes all grades plus defective eggs',()=>{const form=emptyEggEntry('2026-11-21');assert.equal(form.collectionRound,'MORNING');assert.equal(eggSummary(form).totalEggCount,0);assert.equal(eggSummary(form).defectivePercent,0);});
test('live summary includes all grades and counts defective eggs only in total',()=>{const form={...emptyEggEntry('2026-11-21'),grade0Qty:50,grade2Qty:40,gradeJumboQty:8,defectiveQty:2};const s=eggSummary(form);assert.equal(s.saleableEggCount,98);assert.equal(s.totalEggCount,100);assert.equal(s.defectivePercent,2);assert.equal(Math.round(s.totalTrayCount*100)/100,3.27);});

test('defective eggs increase production total but never saleable trays',()=>{const base={...emptyEggEntry('2026-11-21'),grade0Qty:160};const before=eggSummary(base),after=eggSummary({...base,defectiveQty:50});assert.equal(after.totalTrayCount,before.totalTrayCount);assert.equal(after.totalEggCount,210);assert.equal(eggSummary({...emptyEggEntry('2026-11-21'),defectiveQty:50}).totalTrayCount,0);});
