const DB="civildraft", STORE="state", SNAPS="snaps", KEY="doc", DBV=2;
export const LSK="civildraft.v1";
const OLD_LSK="mistar.v1";
let LSK_MIGD=false;
function migrateLSKey(){
if(LSK_MIGD)return; LSK_MIGD=true;
if(typeof localStorage==="undefined")return;
try{
if(localStorage.getItem(LSK)!==null)return;
const v=localStorage.getItem(OLD_LSK);
if(v!==null)localStorage.setItem(LSK,v);
}catch(e){}
}
const OLD_DB="mistar", MIG="__migrated", MIG_MS=4000;
const idbGet=(d,st,k)=>new Promise((res,rej)=>{
const rq=d.transaction(st,"readonly").objectStore(st).get(k);
rq.onsuccess=()=>res(rq.result||null);
rq.onerror  =()=>rej(rq.error);
});
const idbPut=(d,st,k,v)=>new Promise((res,rej)=>{
const tx=d.transaction(st,"readwrite");
tx.objectStore(st).put(v,k);
tx.oncomplete=()=>res();
tx.onerror=()=>rej(tx.error);
tx.onabort=()=>rej(tx.error);
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
rq.onupgradeneeded=()=>{
absent=true;
try{rq.transaction.abort()}catch(e){}
};
rq.onsuccess=()=>{
if(absent){try{rq.result.close()}catch(e){} res(null)}
else res(rq.result);
};
rq.onerror=e=>{
try{e&&e.preventDefault&&e.preventDefault()}catch(x){}
res(null);
};
rq.onblocked=()=>res(null);
});
}
function snapIds(){
try{
const a=JSON.parse(localStorage.getItem("mistar.snaps")||"[]");
return Array.isArray(a)?a.map(x=>x&&x.id).filter(x=>typeof x==="string"):[];
}catch(e){return []}
}
async function migrateIdb(d){
if(await idbGet(d,STORE,MIG))return;
let from=null;
if(!(await idbGet(d,STORE,KEY))){
const o=await legacyOpen(OLD_DB);
if(o){
try{
if(o.objectStoreNames.contains(STORE)){
const cur=await idbGet(o,STORE,KEY);
if(cur){
if(o.objectStoreNames.contains(SNAPS)){
for(const id of snapIds()){
const sn=await idbGet(o,SNAPS,id);
if(sn)await idbPut(d,SNAPS,id,sn);
}
}
await idbPut(d,STORE,KEY,cur);
from=OLD_DB;
}
}
}finally{try{o.close()}catch(e){}}
}
}
await idbPut(d,STORE,MIG,{from,t:Date.now()});
}
const guarded=(p,ms)=>new Promise(res=>{
const t=setTimeout(res,ms);
p.then(()=>{clearTimeout(t);res()},()=>{clearTimeout(t);res()});
});
let dbP=null, MODE="?", FAIL=0, LAST="";
export const mode=()=>MODE;
export const failed=()=>FAIL;
const OPEN_MS=5000;
function open(){
if(dbP)return dbP;
dbP=new Promise(res=>{
if(typeof indexedDB==="undefined"){MODE="ls"; res(null); return}
let rq, settled=false;
const finish=(v,mode)=>{
if(settled)return; settled=true; clearTimeout(guard);
if(mode)MODE=mode; res(v);
};
const guard=setTimeout(()=>finish(null,"ls"),OPEN_MS);
try{rq=indexedDB.open(DB,DBV)}
catch(e){finish(null,"ls"); return}
rq.onupgradeneeded=()=>{
const d=rq.result;
if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE);
if(!d.objectStoreNames.contains(SNAPS))d.createObjectStore(SNAPS);
};
rq.onsuccess=()=>{
if(settled)return;
const d=rq.result;
guarded(migrateIdb(d),MIG_MS).then(()=>finish(d,"idb"));
};
rq.onerror  =()=>finish(null,"ls");
rq.onblocked=()=>finish(null,"ls");
});
return dbP;
}
const stamp=(o,lite,rev)=>{
const r=Object.assign({},o,{__t:Date.now()});
if(lite)r.__lite=1; else delete r.__lite;
if(rev!=null)r.__rev=rev|0;
return r;
};
export const REVK="civildraft.rev";
export const CONFK="civildraft.v1.conflict";
const CHAN="civildraft.doc";
let REV=0;
let ONCONF=null, SUBS=[], CH=null, WIRED=false;
export const revision=()=>REV;
export const setRevision=n=>{REV=Math.max(0,n|0); return REV};
export const onConflict=f=>{ONCONF=(typeof f==="function")?f:null};
const revOf=o=>{const v=o&&+o.__rev; return (isFinite(v)&&v>0)?(v|0):0};
function chan(){
if(CH!==null)return CH;
CH=false;
try{
if(typeof BroadcastChannel==="function"){
CH=new BroadcastChannel(CHAN);
if(typeof CH.unref==="function")CH.unref();
}
}catch(e){CH=false}
return CH;
}
function fanout(msg){
SUBS.slice().forEach(f=>{try{f(msg)}catch(e){}});
}
export function watchDoc(fn){
if(typeof fn==="function"&&SUBS.indexOf(fn)<0)SUBS.push(fn);
if(!WIRED){
WIRED=true;
const c=chan();
if(c&&c.addEventListener)
c.addEventListener("message",e=>{
const d=e&&e.data;
if(d&&d.k==="doc"&&revOf(d)>REV)fanout({rev:revOf(d),via:"channel"});
});
if(typeof addEventListener==="function")
addEventListener("storage",e=>{
if(!e||e.key!==REVK)return;
const r=(+e.newValue)|0;
if(r>REV)fanout({rev:r,via:"storage"});
});
}
return ()=>{SUBS=SUBS.filter(x=>x!==fn)};
}
function announce(rev){
const c=chan();
if(c&&c.postMessage){try{c.postMessage({k:"doc",__rev:rev,t:Date.now()})}catch(e){}}
try{localStorage.setItem(REVK,String(rev))}catch(e){}
}
async function peekRev(){
let a=0,b=0;
const d=await open();
if(d){
try{a=revOf(await idbGet(d,STORE,KEY))}catch(e){}
}
b=peekRevLS();
return Math.max(a,b);
}
function peekRevLS(){
if(typeof localStorage==="undefined")return 0;
let r=0;
try{
const raw=localStorage.getItem(LSK);
if(raw)r=revOf(JSON.parse(raw));
}catch(e){}
try{r=Math.max(r,(+localStorage.getItem(REVK))|0)}catch(e){}
return r;
}
function stash(obj,rev){
if(typeof localStorage==="undefined")return 0;
try{
localStorage.setItem(CONFK,JSON.stringify(
Object.assign({},obj,{__t:Date.now(),__rev:rev|0})));
return 1;
}catch(e){return 0}
}
export function conflictGet(){
if(typeof localStorage==="undefined")return null;
try{
const raw=localStorage.getItem(CONFK);
if(!raw)return null;
const o=JSON.parse(raw);
return (o&&Array.isArray(o.walls))?o:null;
}catch(e){return null}
}
export function conflictClear(){
try{localStorage.removeItem(CONFK)}catch(e){}
}
const heal=(lite,full)=>{
if(!lite||!lite.__lite||!full||!full.ref)return lite;
const n=(full.ref.ents||[]).length;
if(!n)return lite;
const o=Object.assign({},lite,{ref:full.ref});
delete o.__lite;
o.__healed=n;
return o;
};
function saveLS(o){
migrateLSKey();
if(typeof localStorage==="undefined")return {ok:0,via:"none"};
try{
const s=JSON.stringify(o);
localStorage.setItem(LSK,s);
FAIL=0; LAST="ls";
return {ok:1,via:"ls",bytes:s.length};
}catch(e){
FAIL++;
return {ok:0,via:"ls",err:(e&&e.name)||"خطأ",
refs:(o&&o.ref&&o.ref.ents)?o.ref.ents.length:0};
}
}
export async function save(obj,opt){
const force=!!(opt&&opt.force);
const theirs=await peekRev();
if(!force&&theirs>REV){
const kept=stash(obj,theirs+1);
const c={ok:0,via:"conflict",conflict:1,theirs,ours:REV,kept};
if(ONCONF)ONCONF(c);
fanout({rev:theirs,via:"conflict"});
return c;
}
const rev=Math.max(theirs,REV)+1;
const o=stamp(obj,0,rev);
const d=await open();
if(d){
try{
await new Promise((res,rej)=>{
const tx=d.transaction(STORE,"readwrite");
tx.objectStore(STORE).put(o,KEY);
tx.oncomplete=res;
tx.onerror=()=>rej(tx.error);
tx.onabort =()=>rej(tx.error);
});
FAIL=0; LAST="idb"; REV=rev; announce(rev);
return {ok:1,via:"idb",rev};
}catch(e){MODE="ls"}
}
const r=saveLS(o);
if(r.ok){REV=rev; announce(rev); r.rev=rev}
return r;
}
export async function load(){
migrateLSKey();
let idb=null, ls=null;
const d=await open();
if(d){
try{
idb=await new Promise((res,rej)=>{
const tx=d.transaction(STORE,"readonly");
const rq=tx.objectStore(STORE).get(KEY);
rq.onsuccess=()=>res(rq.result||null);
rq.onerror  =()=>rej(rq.error);
});
}catch(e){}
}
if(typeof localStorage!=="undefined"){
try{
const raw=localStorage.getItem(LSK);
if(raw){
const o=JSON.parse(raw);
if(o&&Array.isArray(o.walls))ls=o;
}
}catch(e){}
}
const tI=(idb&&+idb.__t)||0, tL=(ls&&+ls.__t)||0;
if(ls&&ls.__lite&&idb&&tL>tI){
const h=heal(ls,idb);
if(h.__healed){REV=Math.max(REV,revOf(ls),revOf(idb));
return {data:h,via:"healed",refs:h.__healed}}
}
if(idb&&ls&&idb.__lite&&!ls.__lite&&tI>=tL){
const h=heal(idb,ls);
if(h.__healed){REV=Math.max(REV,revOf(ls),revOf(idb));
return {data:h,via:"healed",refs:h.__healed}}
}
if(idb&&(!ls||tI>tL)){REV=Math.max(REV,revOf(idb),peekRevLS()); return {data:idb,via:"idb"}}
if(ls){REV=Math.max(REV,revOf(ls),revOf(idb),peekRevLS()); return {data:ls,via:(d&&!idb)?"migrate":"ls"}}
return null;
}
export async function del(){
const d=await open();
if(d){
try{
await new Promise(res=>{
const tx=d.transaction(STORE,"readwrite");
tx.objectStore(STORE).delete(KEY);
tx.oncomplete=res; tx.onerror=res; tx.onabort=res;
});
}catch(e){}
}
try{localStorage.removeItem(LSK)}catch(e){}
try{localStorage.removeItem(REVK)}catch(e){}
conflictClear();
REV=0;
}
export function flushSync(obj,opt){
migrateLSKey();
if(typeof localStorage==="undefined")return {ok:0,via:"none"};
const force=!!(opt&&opt.force);
const theirs=peekRevLS();
if(!force&&theirs>REV){
const kept=stash(obj,theirs+1);
const c={ok:0,via:"conflict",conflict:1,theirs,ours:REV,kept};
if(ONCONF)ONCONF(c);
return c;
}
const rev=Math.max(theirs,REV)+1;
try{
localStorage.setItem(LSK,JSON.stringify(stamp(obj,0,rev)));
REV=rev; announce(rev);
return {ok:1,via:"ls",rev};
}catch(e){}
const n=(obj&&obj.ref&&obj.ref.ents)?obj.ref.ents.length:0;
try{
const lite=stamp(Object.assign({},obj,
{ref:Object.assign({},obj.ref||{},{ents:[]})}),1,rev);
localStorage.setItem(LSK,JSON.stringify(lite));
REV=rev; announce(rev);
return {ok:1,via:"ls",lite:1,refs:n,rev};
}catch(e2){FAIL++; return {ok:0,via:"ls",err:(e2&&e2.name)||"خطأ"}}
}
export const LSKEYS=[LSK,"civildraft.ui","civildraft.opts","civildraft.ai",
"civildraft.snaps","civildraft.code","civildraft.tour","civildraft:pricing",
"civildraft:pricing-cfg","civildraft.macros","civildraft.ribbon",
"civildraft.guide.usage",REVK,CONFK];
export const PREFV=1;
export const PREFVK="civildraft.prefv";
export function prefSchema(){
if(typeof localStorage==="undefined")return {v:PREFV,ours:PREFV,newer:0};
let v=PREFV;
try{
const raw=localStorage.getItem(PREFVK);
if(raw!=null&&isFinite(+raw))v=(+raw)|0;
}catch(e){}
return {v,ours:PREFV,newer:v>PREFV?1:0};
}
export function stampPrefSchema(){
const r=prefSchema();
if(r.newer)return r;
try{localStorage.setItem(PREFVK,String(PREFV))}catch(e){}
return r;
}
const LSKEYS_OLD=["mistar.ui","mistar.opts","mistar.ai",OLD_LSK,
"mistar.snaps","mistar.code","mistar.tour","mistar:pricing"];
const DBS=[DB,OLD_DB,"civildraft.autosave","mistar.autosave"];
export async function purge(){
const out={ls:0,idb:0,keys:[]};
if(typeof localStorage!=="undefined"){
const RE=/^(mistar|civildraft)[.:]/;
const all=[];
try{
const n=localStorage.length|0;
for(let i=0;i<n;i++){
const k=localStorage.key(i);
if(k!=null)all.push(k);
}
}catch(e){}
all.filter(k=>RE.test(k)).forEach(k=>{
try{
localStorage.removeItem(k);
out.ls++; out.keys.push(k);
}catch(e){}
});
}
try{await del()}catch(e){}
try{
const d=await open();
if(d&&d.close)d.close();
}catch(e){}
dbP=null; MODE="?";
if(typeof indexedDB!=="undefined"&&indexedDB.deleteDatabase){
const dels=DBS.map(n=>new Promise(res=>{
let done=false, t=null;
const fin=ok=>{ if(done)return; done=true; clearTimeout(t); res(!!ok); };
try{
const rq=indexedDB.deleteDatabase(n);
t=setTimeout(fin,800);
if(rq){ rq.onsuccess=()=>fin(true); rq.onerror=()=>fin(false); }
else fin(true);
}catch(e){ fin(false); }
}));
const oks=await Promise.all(dels);
out.idb=oks.every(Boolean)?1:0;
}
return out;
}
export async function snapPut(id,obj){
const d=await open();
if(!d)return {ok:0,via:"none"};
try{
await new Promise((res,rej)=>{
const tx=d.transaction(SNAPS,"readwrite");
tx.objectStore(SNAPS).put(obj,id);
tx.oncomplete=res; tx.onerror=()=>rej(tx.error); tx.onabort=()=>rej(tx.error);
});
return {ok:1,via:"idb"};
}catch(e){return {ok:0,via:"idb",err:(e&&e.name)||"خطأ"}}
}
export async function snapGet(id){
const d=await open();
if(!d)return null;
try{
return await new Promise((res,rej)=>{
const tx=d.transaction(SNAPS,"readonly");
const rq=tx.objectStore(SNAPS).get(id);
rq.onsuccess=()=>res(rq.result||null); rq.onerror=()=>rej(rq.error);
});
}catch(e){return null}
}
export async function snapDel(id){
const d=await open();
if(!d)return;
try{
await new Promise(res=>{
const tx=d.transaction(SNAPS,"readwrite");
tx.objectStore(SNAPS).delete(id);
tx.oncomplete=res; tx.onerror=res; tx.onabort=res;
});
}catch(e){}
}
