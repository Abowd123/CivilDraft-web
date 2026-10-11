import {S,pack,loadState,ensureShape,clearHistory,snapshot,COLLS,shapeNotes} from "../core/state.js";
import {toJSON as blocksJSON,fromJSON as blocksLoad,
checkDefs as blocksCheck} from "../core/blocks.js";
import {toJSON as priceJSON,fromJSON as priceLoad} from "../core/pricing.js";
import {stripTitle} from "../core/sheet.js";
export const VERSION=2;
export const migrations={
0:d=>d,
1:d=>{
if(!Array.isArray(d.roofs))d.roofs=[];
if(!Array.isArray(d.levelDefs))
d.levelDefs=[{n:0,name:"أرضي",elev:0,h:3000,slab:200,color:"#cccccc"}];
return d;
},
};
export function migrate(d){
let v=d.__ver||0;
while(v<VERSION){
const f=migrations[v];
if(typeof f!=="function")
throw new Error(`لا ترحيلَ معرَّف من إصدار الملفّ ${v} إلى ${v+1}`);
const r=f(d);
if(!r||typeof r!=="object"||Array.isArray(r))
throw new Error(`ترحيل الإصدار ${v} أعاد ما ليس كائناً`);
d=r; v++;
}
return d;
}
let LASTBODY=null, LASTSAVED="";
export const resetSaveStamp=()=>{LASTBODY=null; LASTSAVED=""};
export function toJSON(opts){
const strip=!!(opts&&opts.stripAuthor);
const keepLog=S.__shapeLog;
ensureShape();
if(keepLog===undefined)delete S.__shapeLog; else S.__shapeLog=keepLog;
const d=pack();
if(strip)d.title=stripTitle(d.title||S.title);
const body=Object.assign({__app:"civildraft",__ver:VERSION},d,
{blockDefs:blocksJSON(), pricing:priceJSON()});
const key=JSON.stringify(body);
if(key!==LASTBODY){LASTBODY=key; LASTSAVED=new Date().toISOString()}
return JSON.stringify(Object.assign({__app:"civildraft",
__ver:VERSION, __saved:LASTSAVED},d,
{blockDefs:blocksJSON(), pricing:priceJSON()}));
}
export const DUPSCAN_MAX=8*1024*1024;
export function dupKeys(txt){
const s=String(txt||"");
if(s.length>DUPSCAN_MAX)return [];
const out=[], stack=[];
let i=0, n=s.length, pend=null, inObj=false;
while(i<n){
const c=s[i];
if(c==='"'){
let j=i+1, buf="";
while(j<n){
const q=s[j];
if(q==="\\"){buf+=s[j+1]||""; j+=2; continue}
if(q==='"')break;
buf+=q; j++;
}
let k=j+1;
while(k<n&&/\s/.test(s[k]))k++;
if(inObj&&s[k]===":"){
const top=stack[stack.length-1];
if(top){
if(top.has(buf)&&out.indexOf(buf)<0)out.push(buf);
top.add(buf);
}
}
i=j+1; continue;
}
if(c==="{"){stack.push(new Set()); inObj=true; i++; continue}
if(c==="["){stack.push(null); inObj=false; i++; continue}
if(c==="}"||c==="]"){
stack.pop();
inObj=!!stack[stack.length-1];
i++; continue;
}
i++;
}
return out;
}
export function fromJSON(txt){
let d=null;
const dups=dupKeys(txt);
if(dups.length)
throw new Error(`مفاتيح مكرّرة في الملفّ: ${dups.slice(0,4).join("، ")}`
+`${dups.length>4?` و${dups.length-4} غيرها`:""}`
+" — الملفّ فاسدٌ ولم يُغيَّر المشروع");
try{d=JSON.parse(txt)}
catch(e){throw new Error("الملفّ ليس JSON صالحاً")}
if(!d||typeof d!=="object")throw new Error("الملفّ فارغ");
if(d.__app&&d.__app!=="civildraft"&&d.__app!=="mistar")
throw new Error(`الملفّ من «${d.__app}» لا من CivilDraft`);
if(!Array.isArray(d.walls))
throw new Error("لا مصفوفة جدران — ليس ملفّ CivilDraft");
if(d.__ver!=null&&(!Number.isInteger(d.__ver)||d.__ver<0))
throw new Error(`رقم إصدار الملفّ غير صالح: ${JSON.stringify(d.__ver).slice(0,20)}`);
if(d.__ver>VERSION)
throw new Error(`الملفّ من إصدارٍ أحدث (${d.__ver}) من هذا البرنامج `
+`(${VERSION}) — حدِّث البرنامج ولا تفتحه هنا`);
const fileVer=d.__ver||0;
d=migrate(d);
const allIds=new Set();
let dupCross=null;
COLLS.forEach(k=>{
if(d[k]===undefined)return;
if(!Array.isArray(d[k]))
throw new Error(`«${k}» في الملفّ ليست مصفوفة — لم يُغيَّر المشروع`);
const seen=new Set();
d[k].forEach(e=>{
const id=e&&e.id;
if(id==null)return;
if(seen.has(id))
throw new Error(`معرّف «${id}» مكرّر في «${k}» — لم يُغيَّر المشروع`);
seen.add(id);
if(allIds.has(id))dupCross=id;
allIds.add(id);
});
});
if(dupCross)
throw new Error(`معرّف «${dupCross}» مكرّر عبر المجموعات — لم يُغيَّر المشروع`);
if(Array.isArray(d.blocks)){
d.blocks.forEach(b=>{
if(b&&b.id&&allIds.has(b.id))
throw new Error(`معرّف «${b.id}» مكرّر عبر المجموعات — لم يُغيَّر المشروع`);
});
}
let defsData=null;
if(d.blockDefs!==undefined&&d.blockDefs!==null)defsData=d.blockDefs;
else if(d.blocks&&typeof d.blocks==="object"&&!Array.isArray(d.blocks)
&&Array.isArray(d.blocks.defs))defsData=d.blocks;
if(defsData){
const c=blocksCheck(defsData);
if(!c.ok)
throw new Error(`تعريفات الكتل فاسدة — لم يُغيَّر المشروع: ${c.why}`);
}
const pre=snapshot(), prePrice=priceJSON();
try{
loadState(d,false);
if(defsData){
const r=blocksLoad(defsData);
if(!r.ok)throw new Error(`تعريفات الكتل: ${r.why}`);
}
if(d.pricing)priceLoad(d.pricing);
ensureShape();
}catch(e){
loadState(JSON.parse(pre),false);
priceLoad(prePrice);
throw e;
}
clearHistory();
const notes=shapeNotes();
return {walls:S.walls.length, opens:S.opens.length,
areas:S.areas.length, dims:S.dims.length,
chains:S.chains.length, anno:S.anno.length,
cols:S.cols.length, fixt:S.fixt.length,
stairs:S.stairs.length,
blocks:Array.isArray(S.blocks)?S.blocks.length:0,
ref:(S.ref&&S.ref.ents)?S.ref.ents.length:0,
ver:fileVer, notes};
}
export function dl(name,data,mime){
const b=(data instanceof Blob)?data
:new Blob([data],{type:mime||"application/octet-stream"});
const u=URL.createObjectURL(b);
const a=document.createElement("a");
a.href=u; a.download=name;
document.body.appendChild(a);
a.click();
setTimeout(()=>{URL.revokeObjectURL(u); a.remove()},1200);
return b.size;
}
export const MAXFILE=24*1024*1024;
export const PROJECT_ACCEPT=".cdraft,.json,.mistar,application/json";
export function pickFile(cb,max){
const i=document.createElement("input");
i.type="file"; i.accept=PROJECT_ACCEPT;
i.onchange=()=>{
const f=i.files&&i.files[0];
if(!f){cb(null,null);return}
const lim=max||MAXFILE;
if(f.size>lim&&!confirm(
`الملفّ ${humanSize(f.size)} — أكبر من ${humanSize(lim)}. `
+`متابعة؟`)){cb(null,null); return}
const r=new FileReader();
r.onload=()=>cb(String(r.result||""),f.name);
r.onerror=()=>cb(null,null);
r.readAsText(f,"utf-8");
};
i.click();
}
export function pickBin(accept,cb,max){
const i=document.createElement("input");
i.type="file";
i.accept=accept||".dxf";
i.onchange=()=>{
const f=i.files&&i.files[0];
if(!f){cb(null,null);return}
const lim=max||MAXFILE;
if(f.size>lim&&!confirm(
`الملفّ ${humanSize(f.size)} — أكبر من ${humanSize(lim)}. `
+`تحليله قد يُجمِّد الصفحة دقائق ولا يمكن إلغاؤه. متابعة؟`)){
cb(null,null); return;
}
const r=new FileReader();
r.onload=()=>cb(r.result,f.name);
r.onerror=()=>cb(null,null);
r.readAsArrayBuffer(f);
};
i.click();
}
export const humanSize=n=>(n<1024)?`${n} بايت`
:((n<1048576)?`${(n/1024).toFixed(1)} ك.ب`
:`${(n/1048576).toFixed(2)} م.ب`);
