const OLD_DB="mistar.autosave";
const NEW_DB="civildraft.autosave";
const STORE="snapshots";
const KEY="current";
const MIG="__migrated";
const MS=4000;
const getIn=(db,k)=>new Promise((res,rej)=>{
const rq=db.transaction(STORE,"readonly").objectStore(STORE).get(k);
rq.onsuccess=()=>res(rq.result||null);
rq.onerror=()=>rej(rq.error);
});
const putIn=(db,k,v)=>new Promise((res,rej)=>{
const tx=db.transaction(STORE,"readwrite");
tx.objectStore(STORE).put(v,k);
tx.oncomplete=()=>res(true);
tx.onerror=()=>rej(tx.error);
});
async function legacyOpen(name){
if(typeof indexedDB==="undefined")return null;
try{
if(typeof indexedDB.databases==="function"){
const l=await indexedDB.databases();
if(Array.isArray(l)&&!l.some(x=>x&&x.name===name))return null;
}
}catch(e){}
return new Promise(res=>{
let rq, absent=false;
try{rq=indexedDB.open(name)}catch(e){res(null);return}
rq.onupgradeneeded=()=>{absent=true; try{rq.transaction.abort()}catch(e){}};
rq.onsuccess=()=>{
if(absent){try{rq.result.close()}catch(e){} res(null);}
else res(rq.result);
};
rq.onerror=e=>{try{e&&e.preventDefault&&e.preventDefault()}catch(x){} res(null);};
rq.onblocked=()=>res(null);
});
}
function openDB(){
return new Promise((res,rej)=>{
if(typeof indexedDB==="undefined"){rej(new Error("لا IndexedDB")); return;}
const rq=indexedDB.open(NEW_DB,1);
rq.onupgradeneeded=()=>{
const db=rq.result;
if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);
};
rq.onsuccess=()=>res(rq.result);
rq.onerror=()=>rej(rq.error||new Error("فشل فتح القاعدة"));
});
}
async function migrateOnce(){
const db=await openDB();
try{
if(await getIn(db,MIG))return {from:null,why:"مضت مرّةً"};
let from=null;
if(!(await getIn(db,KEY))){
const o=await legacyOpen(OLD_DB);
if(o){
try{
if(o.objectStoreNames.contains(STORE)){
const cur=await getIn(o,KEY);
if(cur){await putIn(db,KEY,cur); from=OLD_DB;}
}
}finally{try{o.close()}catch(e){}}
}
}
await putIn(db,MIG,{from,t:Date.now()});
return {from,why:from?"نُقلت":"لا لقطة قديمة"};
}finally{try{db.close()}catch(e){}}
}
let P=null;
export function migrateAutosave(){
if(P)return P;
P=new Promise(res=>{
const t=setTimeout(()=>res({from:null,why:"مهلة"}),MS);
let p;
try{p=migrateOnce()}catch(e){p=Promise.resolve({from:null,why:"خطأ"})}
p.then(r=>{clearTimeout(t); res(r||{from:null,why:"فراغ"})},
()=>  {clearTimeout(t); res({from:null,why:"رفض"})});
});
return P;
}
export function peekOldAutosave(){
return legacyOpen(OLD_DB).then(o=>{
if(!o)return null;
return getIn(o,KEY).then(s=>{try{o.close()}catch(e){} return s})
.catch(()=>{try{o.close()}catch(e){} return null});
});
}
