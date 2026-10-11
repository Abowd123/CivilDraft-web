import "../core/state.js";
import {boq,boqLine,levelGroups,boqLevel} from "../core/boq.js";
import {toCSV,csvName} from "../io/boq.js";
import {dl} from "../io/project.js";
import {sqm,m2} from "../core/units.js";
import {price} from "../core/pricing.js";
import {boqToCSV} from "../io/boqcsv.js";
import {defTool,H,ovOn} from "./registry.js";
const WALL_KEYS={ext:"wall_ext", int:"wall_int", low:"wall_low"};
export const boqWallKey=t=>WALL_KEYS[t]||"wall";
export const boqOpenKey=kind=>
((kind==="window"||kind==="fixed")?"window":"door");
export function pricingItems(B){
const items=[
...B.walls.rows.map(r=>({key:boqWallKey(r.type),
qty:r.face/1000000})),
...B.areas.rows.map(r=>({key:"area",qty:r.area/1000000})),
...B.opens.rows.map(r=>({key:boqOpenKey(r.kind),qty:r.n})),
...(B.cols.n?[{key:"column",qty:B.cols.n}]:[]),
...(B.fixt.n?[{key:"fixture",qty:B.fixt.n}]:[]),
...(B.stairs.n?[{key:"stair",qty:B.stairs.n}]:[])
];
return items;
}
defTool({
id:"boq", stay:1, alias:"كميات جدولكميات",
label:"جدول الكميات",
hint:"يقرأ الحالة الحالية ويصدّر CSV",
opts:[
{k:"save", label:"نزّل الملفّ", type:"chk", def:1},
{k:"price",label:"أضف التسعير والضريبة",type:"chk",def:1}],
start(ctx){
const B=boq();
const excl=B.walls.hidden+B.walls.noplot+B.opens.hidden+B.opens.noplot
+B.areas.hidden+B.areas.noplot+B.cols.hidden+B.cols.noplot
+B.fixt.hidden+B.fixt.noplot+B.stairs.hidden+B.stairs.noplot;
const empty=!B.walls.n&&!B.opens.total&&!B.areas.n
&&!B.cols.n&&!B.fixt.n&&!B.stairs.n;
if(empty&&!excl){
H.rep("in","المشروع فارغ — لا كميّات تُحصى");
return false;
}
if(empty&&excl){
H.rep("wr",`لا عنصر داخل نطاق الطباعة — ${excl} عنصراً `
+`مخفيّاً أو غير قابلٍ للطباعة (انظر الملاحظات)`);
}
H.rep("ok",boqLine(B));
B.areas.rows.forEach(r=>{
H.rep(r.stale?"wr":"in",`${r.id} ${r.name}: `
+`${sqm(r.area)} م²${r.stale?" · قديمة":""}`);
});
B.opens.rows.forEach(r=>{
H.rep(r.bad?"wr":"in",`${r.name}: ${r.n}`
+(r.bad?` · ${r.bad} معطوبة`:""));
});
B.walls.rows.forEach(r=>{
H.rep("in",`${r.name}: ${m2(r.len)} م · `
+`سماكة ${m2(r.t)} م${r.tn>1?` (${r.tn} سماكات)`:""}`);
});
B.cols.rows.forEach(r=>{
H.rep("in",`${r.name}: ${r.n} · ${sqm(r.area)} م²`);
});
B.fixt.rows.forEach(r=>{
H.rep("in",`${r.name}: ${r.n}`);
});
B.stairs.rows.forEach(r=>{
H.rep(r.ok?"in":"wr",`${r.id}: ${m2(r.len)} م · ${r.n} قائمة`
+(r.ok?"":" · خارج المدى المريح"));
});
const C=toCSV(B);
C.notes.forEach(s=>H.rep("wr",s));
if(ovOn("boq","save")){
const nm=csvName(B);
let text=C.txt, finalName=nm;
if(ovOn("boq","price")){
const P=price(pricingItems(B));
text=boqToCSV(P); finalName=nm.replace(/\.csv$/i,"-مسعّر.csv");
H.rep("ok",`الإجمالي المسعّر: ${P.total.toFixed(2)} ${P.currency}`);
}
const size=dl(finalName,text,"text/csv;charset=utf-8");
H.rep("ok",`نُزّل ${finalName} · ${size} بايت`);
}
return false;
},
steps:[]});
defTool({
id:"boqlvl", stay:1,
alias:"كميات_الطوابق كميات_بالطابق",
label:"حصر لكل طابق",
hint:"يقرأ الحالة ويصدّر CSV لكل مستوى حيّ فيه كميّات",
opts:[
{k:"save", label:"نزّل الملفّات", type:"chk", def:1},
{k:"price",label:"أضف التسعير والضريبة",type:"chk",def:1}],
start(ctx){
const excl=B=>B.walls.hidden+B.walls.noplot+B.opens.hidden
+B.opens.noplot+B.areas.hidden+B.areas.noplot+B.cols.hidden
+B.cols.noplot+B.fixt.hidden+B.fixt.noplot+B.stairs.hidden
+B.stairs.noplot;
const empty=B=>!B.walls.n&&!B.opens.total&&!B.areas.n
&&!B.cols.n&&!B.fixt.n&&!B.stairs.n&&!excl(B);
const g=levelGroups();
const items=g.groups.map(gr=>({tag:gr.tag,B:boqLevel(gr.level)}))
.filter(o=>!empty(o.B));
if(!items.length){
H.rep("in","لا مستويات فيها كميّات داخل نطاق الطباعة");
return false;
}
if(items.length<g.groups.length)
H.rep("in",`${g.groups.length-items.length} مستوى بلا كميّات `
+`داخل نطاق الطباعة`);
items.forEach(o=>{
H.rep("ok",`${o.tag}: ${boqLine(o.B)}`);
if(ovOn("boqlvl","save")){
const C=toCSV(o.B);
C.notes.forEach(s=>H.rep("wr",s));
let text=C.txt;
let nm=csvName(o.B);
const tagSafe=String(o.tag||o.B.level||"level")
.replace(/\s+/g,"_").replace(/[\\/:*?"<>|]+/g,"_");
nm=nm.replace(/-BOQ\.csv$/i,`-${tagSafe}-BOQ.csv`);
if(ovOn("boqlvl","price")){
const P=price(pricingItems(o.B));
text=boqToCSV(P);
nm=nm.replace(/-BOQ\.csv$/i,"-مسعّر-BOQ.csv");
}
const size=dl(nm,text,"text/csv;charset=utf-8");
H.rep("ok",`نُزّل ${nm} · ${size} بايت`);
}
});
return false;
},
steps:[]});
