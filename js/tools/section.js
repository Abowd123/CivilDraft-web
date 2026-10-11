import "../core/state.js";
import {sectCmd,sectSay,sectWalls,sectRunSay,MINCUT,CUT}
from "../core/section.js";
import {sectFile} from "../io/sect.js";
import {dl} from "../io/project.js";
import {m2} from "../core/units.js";
import {defTool,H,ov,ovLen,ovOn,pvLine,pvBand,pvText}
from "./registry.js";
const tolOf=()=>Math.max(0,ovLen("section","tol")||CUT);
const optsOf=()=>({tol:tolOf(),
back:ovOn("section","back")?1:0,
unfold:ovOn("section","unfold")?1:0,
mark:String(ov("section","mark")||"").trim()});
export function runSect(a,b){
const o=optsOf();
const e=sectCmd(a,b,o);
H.rep("ok",sectSay(e));
e.runs.forEach(r=>H.rep("in",sectRunSay(r)));
e.warn.forEach(w=>H.rep("wr",w.msg));
const fmt=String(ov("section","fmt")||"none");
if(fmt==="none")return e;
const F=sectFile(fmt,e,o);
F.notes.forEach(s=>H.rep("wr",s));
if(F.bad)H.rep("wr",`${F.bad} محرفاً تعذّر ترميزه`);
if(ovOn("section","save")){
const size=dl(F.name,(F.txt!=null)?F.txt:F.bytes,F.mime);
H.rep("ok",`نُزّل ${F.name}`+(size?` · ${size} بايت`:""));
}else{
H.rep("in",`${F.name} جاهز — شغّل «نزّل الملفّ» ليُكتَب`);
}
return e;
}
function safeRun(a,b){
try{return runSect(a,b)}
catch(x){H.rep("er",x.message); return null}
}
defTool({
id:"section", alias:"مقطع قطاع sect",
label:"مقطع",
hint:"نقطتان لخطّ القطع · يُقطَع ما يعبره الخطّ بنطاقه — "
+"ولا يتحدّث تلقائياً بعدها",
opts:[
{k:"tol",    label:"نطاق القطع", type:"len", def:"0.30"},
{k:"back",   label:"النظر من الجهة الأخرى", type:"chk", def:0},
{k:"unfold", label:"فرد تراكميّ بدل الموضع الحقيقي",
type:"chk", def:0},
{k:"mark",   label:"رمز المقطع (A-A)", def:""},
{k:"fmt",    label:"التصدير", type:"sel", def:"none", items:[
["none","لا شيء"],["svg","SVG"],["dxf","DXF"],["pdf","PDF"]]},
{k:"save",   label:"نزّل الملفّ", type:"chk", def:1}],
steps:[
{p:"نقطة خطّ القطع الأولى", k:"a"},
{p:"النقطة الثانية", k:"b", restart:1,
each(ctx,p){safeRun(ctx.v.a,p)}}],
prev(ctx,g){
const a=ctx.v.a||ctx.pts[0];
if(!a||!g)return [];
const tol=tolOf();
const out=[pvLine(a,g), pvBand(a,g,Math.max(2,tol*2))];
const L=Math.hypot(g[0]-a[0],g[1]-a[1]);
let say=`${m2(L)} م`;
if(L<MINCUT)say+=" · أقصر من الحدّ";
else{
let n=0, m=0;
try{
const q=sectWalls(a,g,{tol,back:ovOn("section","back")?1:0});
n=q.list.length; m=q.miss.length;
}catch(e){}
say+=` · ${n} جدار`+(m?` · ${m} قارب`:"");
}
out.push(pvText([Math.round((a[0]+g[0])/2),
Math.round((a[1]+g[1])/2)], say));
return out;
}});
