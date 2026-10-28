/** SKG FOOTBALL AR PENALTY V1 — Google Apps Script backend.
 * Create this as a BOUND SCRIPT from the leaderboard spreadsheet.
 * Run setup() once, authorize, then deploy as Web App.
 * Executing as Me, access Anyone. Classroom use; not fraud-proof.
 */
const SHEET_NAME = 'LEADERBOARD';
const HEADERS = ['Timestamp','Nama','Kelas','Gol','Sepakan','MasaSaat','Tahap'];
function sheet_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss)throw new Error('Buka Apps Script melalui Extensions > Apps Script di Google Sheets.');
  let sheet=ss.getSheetByName(SHEET_NAME);
  if(!sheet)sheet=ss.insertSheet(SHEET_NAME);
  if(sheet.getLastRow()===0){sheet.appendRow(HEADERS);sheet.setFrozenRows(1);sheet.getRange(1,1,1,HEADERS.length).setBackground('#123449').setFontColor('white').setFontWeight('bold');}
  return sheet;
}
function setup(){sheet_();return 'SKG leaderboard ready';}
function clean_(v,max){return String(v||'').replace(/[\x00-\x1f<>]/g,'').replace(/^[=+@\-\t\r]+/,'').trim().slice(0,max);}
function number_(v,min,max){const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw new Error('Nilai tidak sah');return Math.round(n);}
function doPost(e){
  try{
    const p=e.parameter||{};if(p.action!=='save')throw new Error('Unknown action');
    const name=clean_(p.name,35),klass=clean_(p.klass,25),level=clean_(p.level,12);
    if(!name||!klass||!['easy','medium','hard'].includes(level))throw new Error('Nama, kelas atau tahap tidak sah');
    const goals=number_(p.goals,0,5),shots=number_(p.shots,5,5),seconds=number_(p.seconds,0,3600);
    const lock=LockService.getScriptLock();lock.waitLock(15000);
    try{sheet_().appendRow([new Date(),name,klass,goals,shots,seconds,level]);}finally{lock.releaseLock();}
    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  }catch(err){return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err.message)})).setMimeType(ContentService.MimeType.JSON);}
}
function doGet(e){
  const p=(e&&e.parameter)||{};let result;
  try{
    if(p.action!=='leaderboard')throw new Error('Unknown action');
    const sheet=sheet_();const rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,7).getValues():[];
    const list=rows.map(r=>({name:String(r[1]),klass:String(r[2]),goals:Number(r[3]),shots:Number(r[4]),seconds:Number(r[5]),level:String(r[6])}));
    list.sort((a,b)=>b.goals-a.goals||a.seconds-b.seconds);
    result={ok:true,rows:list.slice(0,10)};
  }catch(err){result={ok:false,error:String(err.message)}}
  const json=JSON.stringify(result);
  // JSONP allows reading public leaderboard from Vercel without GAS CORS changes.
  const callback=String(p.callback||'');
  if(/^skgCallback\d{10,20}$/.test(callback))return ContentService.createTextOutput(callback+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
