import {jrMark,jrSince} from "./journal.js";
export const MACRO_LIM=Object.freeze({
macros:50, lines:400, line:200, name:40});
export const MKEY="civildraft.macros";
export const MAC={list:[],rec:null,loaded:0};
const okName=s=>String(s==null?"":s).replace(/\s+/g," ").trim()
.slice(0,MACRO_LIM.name);
const same=(a,b)=>okName(a).toLowerCase()===okName(b).toLowerCase();
const LS=()=>{try{return typeof localStorage!=="undefined"?localStorage:null}
catch(e){return null}};
export function cleanMacro(m){
if(!m||typeof m!=="object")return null;
const name=okName(m.name);
if(!name)return null;
if(!Array.isArray(m.lines)||!m.lines.length)return null;
if(m.lines.length>MACRO_LIM.lines)return null;
const lines=[];
for(const l of m.lines){
if(typeof l!=="string")return null;
const t=l.trim();
if(!t||t.length>MACRO_LIM.line||/[\r\n]/.test(t))return null;
lines.push(t);
}
return {name,lines,t:+m.t>0?Math.floor(+m.t):0};
}
export function loadMacros(){
MAC.loaded=1; MAC.list=[];
const ls=LS(); if(!ls)return 0;
try{
const raw=ls.getItem(MKEY); if(!raw)return 0;
const a=JSON.parse(raw);
if(!Array.isArray(a))return 0;
a.slice(0,MACRO_LIM.macros).forEach(x=>{
const c=cleanMacro(x);
if(c&&!MAC.list.some(y=>same(y.name,c.name)))MAC.list.push(c);
});
}catch(e){MAC.list=[]}
return MAC.list.length;
}
const ensure=()=>{if(!MAC.loaded)loadMacros()};
function persist(){
const ls=LS(); if(!ls)return true;
try{ls.setItem(MKEY,JSON.stringify(MAC.list)); return true}
catch(e){return false}
}
export const macroList=()=>{ensure(); return MAC.list.slice()};
export const macroCount=()=>{ensure(); return MAC.list.length};
export const macroByName=n=>{ensure(); return MAC.list.find(m=>same(m.name,n))||null};
export const macroText=m=>"```plan\n"+m.lines.join("\n")+"\n```";
export function addMacro(name,lines,opt){
ensure();
const nm=okName(name);
if(!nm)return {ok:0,error:"الماكرو يحتاج اسماً"};
const c=cleanMacro({name:nm,lines,t:Date.now()});
if(!c)return {ok:0,error:"أسطرٌ غير صالحة — فارغة أو فوق الحدّ أو ليست نصّاً"};
const i=MAC.list.findIndex(m=>same(m.name,nm));
if(i>=0&&!(opt&&opt.replace))
return {ok:0,error:`«${nm}» موجودٌ — اختر اسماً آخر أو استبدله صراحةً`};
if(i<0&&MAC.list.length>=MACRO_LIM.macros)
return {ok:0,error:`بلغتَ حدّ ${MACRO_LIM.macros} ماكرو — احذف بعضها`};
const keep=i>=0?MAC.list.splice(i,1)[0]:null;
MAC.list.push(c);
if(!persist()){
MAC.list.pop(); if(keep)MAC.list.splice(i,0,keep);
return {ok:0,error:"تعذّر الحفظ في المتصفّح (ممتلئ أو ممنوع)"};
}
return {ok:1,macro:c};
}
export function delMacro(name){
ensure();
const i=MAC.list.findIndex(m=>same(m.name,name));
if(i<0)return false;
const gone=MAC.list.splice(i,1)[0];
if(!persist()){MAC.list.splice(i,0,gone); return false}
return true;
}
export function uniqueName(base){
ensure();
const b=okName(base)||"ماكرو";
if(!macroByName(b))return b;
for(let k=2;k<1000;k++){
const n=okName(b.slice(0,MACRO_LIM.name-4)+" "+k);
if(!macroByName(n))return n;
}
return okName(b+" "+Date.now());
}
export const recActive=()=>!!MAC.rec;
export const recLineCount=()=>MAC.rec?jrSince(MAC.rec.mark).lines.length:0;
export function recStart(){
if(MAC.rec)return {ok:0,error:"التسجيل جارٍ بالفعل"};
MAC.rec={mark:jrMark()};
return {ok:1};
}
export function recCancel(){const was=!!MAC.rec; MAC.rec=null; return was}
export function recStop(name){
if(!MAC.rec)return {ok:0,error:"لا تسجيل جارٍ"};
const seg=jrSince(MAC.rec.mark);
MAC.rec=null;
if(seg.lost)
return {ok:0,error:"ضاع مقطع التسجيل (مُسح السجلّ أو تجاوز حدّه) — لم يُحفَظ شيء"};
if(seg.taint.length){
const why=[...new Set(seg.taint)].join(" · ");
return {ok:0,tainted:1,
error:`رُفض التسجيل — فيه ما لا يُعبَّر عنه بسطر (${why}). `
+`الإعادة كانت ستختلف، فلا يُحفَظ ماكرو غير أمين.`};
}
if(!seg.lines.length)return {ok:0,error:"لا شيء سُجِّل — الماكرو فارغ"};
if(seg.lines.length>MACRO_LIM.lines)
return {ok:0,error:`الماكرو ${seg.lines.length} سطراً — الحدّ ${MACRO_LIM.lines}`};
return addMacro(name||uniqueName("ماكرو"),seg.lines);
}
export const recReset=()=>{MAC.rec=null};
