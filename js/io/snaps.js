import {S,pack,loadState,edit,editFailed} from "../core/state.js";
import {snapPut,snapGet,snapDel,mode} from "./store.js";
const K="civildraft.snaps";
const OLD_K="mistar.snaps";
let MIGD=false;
function migrateKey(){
if(MIGD)return; MIGD=true;
if(typeof localStorage==="undefined")return;
try{
if(localStorage.getItem(K)!==null)return;
const v=localStorage.getItem(OLD_K);
if(v!==null)localStorage.setItem(K,v);
}catch(e){}
}
export const SNAP={max:12,list:[]};
const read=()=>{
migrateKey();
try{const a=JSON.parse(localStorage.getItem(K)||"[]");return Array.isArray(a)?a:[]}
catch(e){return []}
};
let ONFAIL=null, WARNED=false;
export const setSnapError=f=>{ONFAIL=(typeof f==="function")?f:null};
const write=a=>{
try{
localStorage.setItem(K,JSON.stringify(a));
return {ok:1};
}catch(e){
const n=(e&&e.name)||"خطأ";
if(ONFAIL&&!WARNED){WARNED=true; ONFAIL(n)}
return {ok:0,err:n};
}
};
export const snapList=()=>SNAP.list.slice();
export const snapsLoad=()=>{
SNAP.list=read();
snapsClean().catch(()=>{});
return SNAP.list;
};
export async function snapsClean(){
const dead=new Set();
let checked=false;
for(const e of SNAP.list.slice()){
if(!e||!e.id){ dead.add(e); continue; }
let d=null;
try{ d=await snapGet(e.id); }catch(err){ return {ok:0,err:"تعذّر القراءة"}; }
if(!checked){
checked=true;
if(mode()!=="idb")return {ok:0,err:"IndexedDB غير متاح — لا تنظيف"};
}
if(!d)dead.add(e);
}
if(!dead.size)return {ok:1,dropped:0};
SNAP.list=SNAP.list.filter(x=>!dead.has(x));
write(SNAP.list);
return {ok:1,dropped:dead.size};
}
let Q=Promise.resolve();
export function snapQueue(fn){
const run=Q.then(fn,fn);
Q=run.then(()=>{},()=>{});
return run;
}
export const snapBusy=()=>Q!==undefined&&PEND>0;
let PEND=0;
export function snapTake(why){
PEND++;
return snapQueue(()=>takeNow(why)).finally(()=>{PEND--});
}
async function takeNow(why){
if(!S.walls.length&&!S.areas.length)return {ok:0,err:"فارغ"};
const id="s"+Date.now()+"_"+Math.random().toString(36).slice(2,6);
try{
const r=await snapPut(id,pack());
if(!r.ok)return r;
}catch(e){ return {ok:0,err:(e&&e.message)||"خطأ"}; }
SNAP.list.unshift({id,t:Date.now(),why:String(why||"يدوية").slice(0,40),
w:S.walls.length,o:S.opens.length,a:S.areas.length});
while(SNAP.list.length>SNAP.max){
const old=SNAP.list.pop();
try{ await snapDel(old.id); }catch(e){}
}
const w=write(SNAP.list);
if(!w.ok)return {ok:0,id,err:w.err,
msg:"اللقطةُ كُتبت في المخزن ولم يتّسع الفهرس — قد لا تظهر في القائمة"};
return {ok:1,id};
}
export async function snapRestore(id){
let d=null;
try{ d=await snapGet(id); }catch(e){ return {ok:0,err:"تعذّر القراءة"}; }
if(!d||!Array.isArray(d.walls))return {ok:0,err:"اللقطة مفقودة"};
let ok=false;
try{ edit(()=>{loadState(d,false); ok=true;},"استعادة لقطة"); }
catch(e){ return {ok:0,err:(e&&e.message)||"تعذّر التطبيق"}; }
if(!ok||editFailed())return {ok:0,err:"تعذّر التطبيق"};
return {ok:1,w:d.walls.length};
}
export function snapDrop(id){
return snapQueue(async()=>{
try{ await snapDel(id); }catch(e){}
SNAP.list=SNAP.list.filter(x=>x.id!==id);
return write(SNAP.list);
});
}
let T=null,lastV=-1;
export function snapAutoStart(min){
if(T)clearInterval(T);
lastV=S.__ver;
T=setInterval(()=>{
if(S.__ver===lastV)return;
lastV=S.__ver;
snapTake("تلقائية").catch(()=>{});
},Math.max(2,+min||10)*60000);
}
export function snapAutoStop(){
if(T){ clearInterval(T); T=null; }
}
