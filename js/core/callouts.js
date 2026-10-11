import {S,touchView,txtH} from "./state.js";
import {V} from "./validate.js";
import {newId} from "./units.js";
const R=v=>Math.round(v);
const AZ=i=>{let s="";i++;while(i>0){
const m=(i-1)%26; s=String.fromCharCode(65+m)+s; i=(i-m-1)/26}
return s||"A"};
export const nextCalloutLabel=()=>{
const used=new Set((S.callouts||[]).map(c=>String(c.label||"").toUpperCase()));
let i=0;
while(used.has(AZ(i)))i++;
return AZ(i);
};
export const calloutById=id=>(S.callouts||[]).find(c=>c.id===id)||null;
export function addCallout(o){
const p=o||{};
const v=V("callout",p);
const ok=(sid,vid)=>(S.sheets||[]).some(
s=>s.id===sid&&(s.viewports||[]).some(x=>x.id===vid));
if(!ok(v.srcSheet,v.srcVp))
throw new Error("منفذ المصدر غير موجود في ورقة المصدر");
if(!ok(v.tgtSheet,v.tgtVp))
throw new Error("منفذ الهدف غير موجود في ورقة الهدف");
if(!Array.isArray(S.callouts))S.callouts=[];
const c={id:newId("DC"),
label:(p.label!=null&&String(p.label).trim())
?String(p.label).trim().slice(0,4):nextCalloutLabel(),
srcSheet:v.srcSheet, srcVp:v.srcVp,
tgtSheet:v.tgtSheet, tgtVp:v.tgtVp,
pos:v.pos.slice()};
S.callouts.push(c); touchView();
return c;
}
export function delCallout(id){
if(!Array.isArray(S.callouts))return false;
const i=S.callouts.findIndex(c=>c.id===id);
if(i<0)return false;
S.callouts.splice(i,1); touchView();
return true;
}
export function calloutPrims(c){
const L="A-CALLOUT", h=txtH(), p=c.pos;
return [
{t:"arc",L,cx:p[0],cy:p[1],r:R(h*2.2),a0:0,a1:359.9,
covp:c.srcVp, oid:c.id},
{t:"text",L,s:c.label,x:R(p[0]),y:R(p[1]+h*0.2),
h:R(h*1.1),al:"mc",covp:c.srcVp,oid:c.id}
];
}
export const calloutTitleLine=c=>{
const sh=(S.sheets||[]).find(s=>s.id===c.srcSheet);
return `تفصيلة ${c.label} — ${sh?sh.name:c.srcSheet}`;
};
