export const roundLabels={MORNING:'รอบเช้า',AFTERNOON:'รอบบ่าย',EVENING:'รอบเย็น',DAILY:'รวมทั้งวัน (บันทึกเดิม)'};
export const eggFields=[
 {key:'grade0Qty',badge:'0',label:'เบอร์ 0',note:'จำนวนไข่เบอร์ 0'},
 {key:'grade1Qty',badge:'1',label:'เบอร์ 1',note:'จำนวนไข่เบอร์ 1'},
 {key:'grade2Qty',badge:'2',label:'เบอร์ 2',note:'จำนวนไข่เบอร์ 2'},
 {key:'grade3Qty',badge:'3',label:'เบอร์ 3',note:'จำนวนไข่เบอร์ 3'},
 {key:'grade4Qty',badge:'4',label:'เบอร์ 4',note:'จำนวนไข่เบอร์ 4'},
 {key:'grade5Qty',badge:'5',label:'เบอร์ 5',note:'จำนวนไข่เบอร์ 5'},
 {key:'gradeJumboQty',badge:'แฝด',label:'ไข่แฝด',note:'นับแยกจากไข่เบอร์ 0–5'},
 {key:'defectiveQty',badge:'×',label:'ไข่เสีย / คัดทิ้ง',note:'ไม่นับเป็นไข่ขายได้'},
];
export function emptyEggEntry(date){return {...Object.fromEntries(eggFields.map(f=>[f.key,0])),recordDate:date,collectionRound:'MORNING',eggLotNumber:''};}
export function eggSummary(form){const defectiveQty=Number(form.defectiveQty)||0;const saleableEggCount=eggFields.filter(f=>f.key!=='defectiveQty').reduce((n,f)=>n+(Number(form[f.key])||0),0);const totalEggCount=saleableEggCount+defectiveQty;return {saleableEggCount,defectiveQty,totalEggCount,totalTrayCount:saleableEggCount/30,defectivePercent:totalEggCount?defectiveQty*100/totalEggCount:0};}
