import {S} from "../core/state.js";
import {Mx,Nx,clamp} from "../core/units.js";
import {addWall,wallById,isWType,ALIGN} from "../core/walls.js";
import {addOpen,OK} from "../core/opens.js";
import {addArea,regionAt,areaAt,netArea} from "../core/areas.js";
import {addText} from "../core/dims.js";
import {regionLoops} from "../core/render.js";
import {FLD,applyField,fldOf,sayApply} from "../core/batch.js";
import {findById,NAME} from "../core/ents.js";
import {pickable,hiddenLayers,lockedLayers} from "../core/layers.js";
import {DATA,stripFence} from "./ctx.js";
import {sanitizeExternal} from "../core/escape.js";
import {LIM} from "../core/limits.js";
const isN=v=>typeof v==="number"&&isFinite(v);
const CHK_OK=new Set([0,1,true,false,"0","1","true","false"]);
const CHK_TRUE=new Set([1,true,"1","true"]);
const PT=v=>{
if(!Array.isArray(v)||v.length!==2)return null;
if(!isN(v[0])&&typeof v[0]!=="string")return null;
if(!isN(v[1])&&typeof v[1]!=="string")return null;
const x=Mx(v[0]), y=Mx(v[1]);
return (x==null||y==null)?null:[x,y];
};
const ID=/^[A-Z]+\d+$/;
export const ALLOWED_KEYS=Object.freeze({
note:["op","s"],
wall:["op","a","b","t","type","align","bulge"],
open:["op","wall","at","kind","w","h","sill","dep"],
area:["op","at","name"],
text:["op","at","s","hm"],
field:["op","kind","ids","field","value"]
});
const extraKeys=(o,allowed)=>
Object.keys(o).filter(k=>!allowed.includes(k));
export const hasExtraKeys=(o,allowed)=>extraKeys(o,allowed).length>0;
export const SPEC=`أعِد JSON فقط: {"ops":[...],"why":"سطر واحد"}
لا نصّ خارج JSON. الأطوال والإحداثيات بالمتر (أرقام لا نصوص).
العمليات المسموحة وحدها:
{"op":"wall","a":[x,y],"b":[x,y],"t":0.2,"type":"ext|int|low","align":"c|l|r","bulge":0.2}
bulge اختياريّ (جدارٌ قوسي): tan(θ/4)، رقمٌ لا طول، مداه −8..8.
{"op":"open","wall":"W7","at":2.4,"kind":"door|double|sliding|window|fixed|opening|arch|niche","w":0.9,"h":2.1,"sill":0,"dep":0.12}
{"op":"area","at":[x,y],"name":"مجلس"}
{"op":"text","at":[x,y],"s":"نصّ","hm":1}
{"op":"field","kind":"wall|open|col|fix|stair|area|dim|chain|anno","ids":["O3"],"field":"swing","value":"right"}
{"op":"note","s":"ملاحظة بلا أثر"}
أي مفتاح آخر أو أي عملية أخرى تُرفَض ولا تُنفَّذ.
وما كان على طبقةٍ مخفيّة أو مقفلة يُرفَض ولا يُعدَّل.`;
export function validate(list){
const ok=[], bad=[];
const no=(i,w)=>bad.push({i,why:w});
if(!Array.isArray(list)){no(0,"العمليات ليست قائمة");return {ok,bad}}
if(list.length>LIM.aiOps.max){
no(0,`${list.length} عملية — الحدّ ${LIM.aiOps.max}. `
+"اطلب التنفيذ على دفعات");
return {ok,bad};
}
list.forEach((o,i)=>{
if(!o||typeof o!=="object"||Array.isArray(o)){
no(i,"ليست كائناً");return}
const op=String(o.op||"");
const AK=ALLOWED_KEYS[op];
if(AK){
const ex=extraKeys(o,AK);
if(ex.length){
no(i,`مفتاحٌ غير مسموح في ${op}: `
+ex.slice(0,3).map(k=>String(k).slice(0,30)).join("، "));
return;
}
}
if(op==="note"){
if(!String(o.s||"").trim()){no(i,"ملاحظة فارغة");return}
ok.push({op,s:sanitizeExternal(stripFence(o.s)).slice(0,300)}); return;
}
if(op==="wall"){
const A=PT(o.a), B=PT(o.b);
if(!A||!B){no(i,"a أو b ليست نقطة [x,y] صالحة داخل الحدّ");return}
let t=null;
if(o.t!=null){
t=Mx(o.t);
if(t==null||t<=0){no(i,"سماكة غير صالحة");return}
}
if(o.type!=null&&!isWType(o.type)){no(i,"نوع جدار مجهول");return}
if(o.align!=null&&!ALIGN[o.align]){no(i,"محاذاة مجهولة");return}
let bulge=null;
if(o.bulge!=null){
bulge=Nx(o.bulge);
if(bulge==null){no(i,"bulge ليس رقماً منتهياً");return}
if(bulge<-8||bulge>8){no(i,"bulge خارج المدى −8..8");return}
if(Math.abs(bulge)<1e-4)bulge=null;
}
ok.push({op,a:A,b:B,
t,type:o.type||null,align:o.align||null,bulge});
return;
}
if(op==="open"){
const id=String(o.wall||"").toUpperCase();
if(!/^W\d+$/.test(id)){no(i,"wall يجب أن يكون معرّف جدار مثل W7");
return}
if(!OK[o.kind]){no(i,"نوع فتحة مجهول");return}
const at=Mx(o.at);
if(at==null){no(i,"at ليس طولاً");return}
const W=Mx(o.w);
if(W==null||W<=0){no(i,"عرض غير صالح");return}
const Hh=(o.h==null)?2100:Mx(o.h);
if(Hh==null||Hh<=0){no(i,"ارتفاع غير صالح");return}
const sl=(o.sill==null)?0:Mx(o.sill);
if(sl==null||sl<0){no(i,"جلسة غير صالحة");return}
const rec={op,wall:id,kind:o.kind,at,w:W,h:Hh,sill:sl};
if(o.dep!=null){
const dp=Mx(o.dep);
if(dp==null||dp<=0){no(i,"عمق غير صالح");return}
rec.dep=dp;
}
ok.push(rec);
return;
}
if(op==="area"){
const AT=PT(o.at);
if(!AT){no(i,"at ليست نقطةً صالحة داخل الحدّ");return}
ok.push({op,at:AT,
name:sanitizeExternal(stripFence(o.name)).slice(0,40)});
return;
}
if(op==="text"){
const AT=PT(o.at);
if(!AT){no(i,"at ليست نقطةً صالحة داخل الحدّ");return}
if(!String(o.s||"").trim()){no(i,"نصّ فارغ");return}
ok.push({op,at:AT,s:sanitizeExternal(stripFence(o.s)).slice(0,120),
hm:clamp(+o.hm||1,0.4,6)});
return;
}
if(op==="field"){
if(!FLD[o.kind]){no(i,"نوعٌ لا حقولَ له");return}
const F=fldOf(o.kind,o.field);
if(!F){no(i,`لا حقل «${o.field}» في `
+`${NAME[o.kind]||o.kind}`);return}
const ids=(Array.isArray(o.ids)?o.ids:[])
.map(x=>String(x).toUpperCase()).filter(x=>ID.test(x));
if(!ids.length){no(i,"ids فارغة أو معرّفاتٌ غير صالحة");return}
if(ids.length>200){no(i,"أكثر من 200 معرّف");return}
const v=o.value;
if(v!=null&&typeof v==="object"){no(i,"value كائنٌ لا قيمة");
return}
if(F.t==="sel"){
if(!(F.items||[]).some(([k])=>String(k)===String(v))){
no(i,`«${v}» ليس من: `
+(F.items||[]).map(x=>x[0]).join(" · "));
return;
}
}else if(F.t==="len"){
if(Mx(v)==null){no(i,`«${v}» ليس طولاً`);return}
}else if(F.t==="num"){
if(Nx(v)==null){no(i,`«${v}» ليس رقماً`);return}
}else if(F.t==="text"){
if(String(v==null?"":v).length>120){no(i,"نصٌّ أطول من 120");
return}
}else if(F.t==="chk"){
if(!CHK_OK.has(v)){no(i,`«${v}» ليست 0/1/true/false`);return}
}
ok.push({op,kind:o.kind,field:o.field,ids,
value:(F.t==="chk")?(CHK_TRUE.has(v)?1:0)
:((F.t==="text")?sanitizeExternal(stripFence(v)):v)});
return;
}
no(i,`عملية مجهولة «${op}»`);
});
return {ok,bad};
}
export function applyOps(list,opt){
const atomic=!!(opt&&opt.atomic);
const V=validate(list);
const made=[], refused=V.bad.map(b=>`#${b.i}: ${b.why}`);
const notes=[];
let done=0;
if(atomic&&refused.length)
throw new Error("رُفضت "+refused.length+" عملية — لم يُكتَب شيء: "
+refused.slice(0,3).join(" · "));
V.ok.forEach((o,i)=>{
const fail=m=>refused.push(`${o.op} #${i}: ${m}`);
try{
if(o.op==="note"){notes.push(o.s); return}
if(o.op==="wall"){
const w=addWall(o.a,o.b,o.t,o.type||"int",o.align||"c",
undefined,(o.bulge==null)?undefined:o.bulge);
made.push({k:"wall",id:w.id}); done++; return;
}
if(o.op==="open"){
const w=wallById(o.wall);
if(!w)throw new Error(`${o.wall} غير موجود`);
if(!pickable({k:"wall",id:w.id}))
throw new Error(`${w.id} على طبقةٍ مخفيّة أو مقفلة`);
const ex=(o.dep!=null)?{dep:o.dep}:null;
const p=addOpen(w,o.at,o.kind,o.w,o.h,o.sill,ex);
made.push({k:"open",id:p.id}); done++; return;
}
if(o.op==="area"){
if(areaAt(o.at[0],o.at[1]))
throw new Error("توجد منطقة هنا سلفاً");
const r=regionAt(regionLoops(),o.at[0],o.at[1]);
if(!r)throw new Error("لا حلقة مغلقة عند هذه النقطة");
const a=addArea(r,o.name);
made.push({k:"area",id:a.id}); done++; return;
}
if(o.op==="text"){
const a=addText(o.at,o.s,o.hm,0,"bc");
made.push({k:"anno",id:a.id}); done++; return;
}
if(o.op==="field"){
const L=[];
o.ids.forEach(id=>{
const f=findById(id);
if(!f){refused.push(`field: لا عنصر «${id}»`); return}
if(f.k!==o.kind){refused.push(`field: ${id} `
+`${NAME[f.k]||f.k} لا ${NAME[o.kind]||o.kind}`); return}
if(!pickable(f)){refused.push(`field: ${id} مخفيّ أو مقفل`);
return}
L.push(f);
});
if(!L.length)throw new Error("لا هدف صالح");
const r=applyField(o.kind,L,o.field,o.value);
r.refused.forEach(x=>refused.push(`field ${x.id}: ${x.msg}`));
done+=r.done;
notes.push(sayApply(r));
return;
}
}catch(e){
if(atomic)throw new Error(`${o.op} #${i}: ${e.message}`);
fail(e.message);
}
});
if(atomic&&refused.length)
throw new Error("رُفضت "+refused.length+" عملية: "
+refused.slice(0,3).join(" · "));
return {done, made, refused, notes,
say:`نُفِّذ ${done} من ${(list||[]).length} عملية`
+(refused.length?` · رُفض ${refused.length}`:"")};
}
export function contextOf(o){
const O=Object.assign({walls:1,opens:1,areas:1,parts:0,
ref:0,anno:0},o||{});
const R3=v=>+((v||0)/1000).toFixed(3);
const P=p=>[R3(p[0]),R3(p[1])];
const c={unit:"م", scale:S.meta.scale};
if(O.walls)c.walls=S.walls.map(w=>({id:w.id,a:P(w.a),b:P(w.b),
t:R3(w.t),type:w.type,align:w.align,
...(w.bulge!=null?{bulge:+w.bulge.toFixed(4)}:{})}));
if(O.opens)c.opens=S.opens.map(x=>({id:x.id,wall:x.wall,
kind:x.kind,at:R3(x.s),w:R3(x.w),h:R3(x.h),sill:R3(x.sill||0),
swing:x.swing}));
if(O.areas)c.areas=S.areas.map(a=>({id:a.id,name:DATA(a.name),
m2:+((netArea(a))/1e6).toFixed(2)}));
if(O.parts){
c.cols=S.cols.map(k=>({id:k.id,tag:DATA(k.tag||""),
at:P([k.x,k.y]), w:R3(k.w),h:R3(k.h)}));
c.fixt=S.fixt.map(f=>({id:f.id,kind:f.kind,at:P([f.x,f.y])}));
c.stairs=S.stairs.map(s=>({id:s.id,type:s.type,
flights:s.flights.map(f=>({a:P(f.a),b:P(f.b),n:f.n}))}));
}
if(O.anno)c.anno=S.anno.filter(a=>a.kind!=="lead")
.map(a=>({id:a.id,kind:a.kind,s:DATA(a.s||""),
at:P([a.x||0,a.y||0])}));
if(O.ref&&S.ref&&S.ref.ents&&S.ref.ents.length)
c.refLayers=Object.keys(S.ref.src||{})
.map(n=>({name:DATA(n),n:S.ref.src[n]}));
const hd=hiddenLayers(), lk=lockedLayers();
if(hd.length)c.hiddenLayers=hd;
if(lk.length)c.lockedLayers=lk;
c.note="ما على طبقةٍ مخفيّة أو مقفلة لا يُعدَّل";
return c;
}
export const bytesOf=c=>{
const s=JSON.stringify(c||{});
return {n:s.length, txt:s};
};
