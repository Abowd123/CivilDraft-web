import {S,touch,edit,inTransaction} from "./state.js";
import {newId,clamp,D2R,R2D,deg,m2,m3,rng,rng3} from "./units.js";
import {dist,lineX,nearOnSeg,mid,bboxOf} from "./geom.js";
import {dir,wallById,wallLen,addWall,MINW,isArc} from "./walls.js";
import {opensOf,span,delOpen,invalidateOpens,EDGE} from "./opens.js";
import "./areas.js";
import "./dims.js";
import {CMIN,CMAX} from "./cols.js";
import "./fixt.js";
import {SMIN_W} from "./stairs.js";
import {grabOf,entOf,moveEnt,shapeOf,outlineOf,NAME} from "./ents.js";
import {bulgeArc} from "./arcmath.js";
import {pickable} from "./layers.js";
import {ENT} from "./entreg.js";
import {expandGroups} from "./groups.js";
import {LIM} from "./limits.js";
const R=v=>Math.round(v);
export const ARC_OK="نقل · نسخ · دوران · مرآة · مصفوفات · حذف";
const noArc=(w,verb)=>{
if(w&&isArc(w))throw new Error(
`${verb}: ${w.id} جدارٌ قوسيّ — لا تدعمه هذه العملية بعد `
+`(تُنتج شكلاً لا يطابق الأصل). المدعوم للقوس: ${ARC_OK}`);
};
const P2=p=>[R(p[0]),R(p[1])];
export function grab(list){
const out=[];
expandGroups(list||[]).forEach(s=>{
if(!s||s.k==="open")return;
if(!pickable(s))return;
const o=grabOf(s);
if(o)out.push({s,o});
});
return out;
}
export const segsOf=G=>(G||[])
.filter(g=>g.s.k==="wall"&&g.o.a)
.map(g=>[g.o.a,g.o.b]);
function dupEntRaw(s,withOpens){
const e=entOf(s);
if(!e)return null;
const d=ENT[s.k];
if(!d||d.noDup)return null;
const cp=JSON.parse(JSON.stringify(e));
cp.id=newId(d.pre);
if(s.k==="wall"){
S.walls.push(cp);
let no=0;
if(withOpens!==false){
opensOf(s.id).forEach(o=>{
S.opens.push(Object.assign({},o,{id:newId("O"),wall:cp.id}));
no++;
});
}
invalidateOpens();
touch();
return {e:cp,opens:no};
}
(d.dupDrop||[]).forEach(k=>{delete cp[k]});
S[d.coll].push(cp);
touch();
return {e:cp,opens:0};
}
function atomic(label,fn,opt){
if(inTransaction())return fn();
let err=null;
const r=edit(()=>{
try{return fn()}
catch(e){err=e; throw e}
},label,opt);
if(err)throw err;
return r;
}
export function dupEnt(s,withOpens){
const e=entOf(s), d=e&&ENT[s.k];
if(!e||!d||d.noDup)return null;
return atomic("نسخ عنصر",()=>dupEntRaw(s,withOpens));
}
export const dupWall=(id,withOpens)=>{
const r=dupEnt({k:"wall",id},withOpens);
return r?{wall:r.e,opens:r.opens}:null;
};
function moveAll_(G,dx,dy){
(G||[]).forEach(({s,o})=>moveEnt(s,o,dx,dy));
touch();
return (G||[]).length;
}
function copyOne(s,o,withOpens,xf){
const r=dupEntRaw(s,withOpens);
if(!r)return null;
const ns={k:s.k,id:r.e.id};
const g=grabOf(ns);
if(g){
Object.keys(o).forEach(k=>{if(k!=="e")g[k]=o[k]});
xf(ns,g);
}
return {ns,opens:r.opens};
}
function copyAll_(G,dx,dy,n,withOpens){
n=clamp(R(n||1),1,200);
if((G||[]).length*n>500)throw new Error("أكثر من 500 نسخة");
let nw=0, no=0;
const made=[];
for(let i=1;i<=n;i++){
(G||[]).forEach(({s,o})=>{
const q=copyOne(s,o,withOpens,(ns,g)=>moveEnt(ns,g,dx*i,dy*i));
if(!q)return;
nw++; no+=q.opens; made.push(q.ns);
});
}
touch();
return {walls:nw,opens:no,made};
}
export const rotP=(p,c,degv)=>{
const a=degv*D2R, ca=Math.cos(a), sa=Math.sin(a);
const dx=p[0]-c[0], dy=p[1]-c[1];
return [R(c[0]+dx*ca-dy*sa), R(c[1]+dx*sa+dy*ca)];
};
const q90=a=>{
const d=deg(a);
return (Math.abs(d%90)<0.01)?Math.round(d/90)%4:-1;
};
const rotOk=(k,kind,degv)=>{
if(k==="dim")return (kind==="al")||q90(degv)>=0;
if(k==="chain")return q90(degv)>=0;
return true;
};
export const canRotate=(s,degv)=>{
const e=entOf(s);
return !!e&&rotOk(s&&s.k,e.kind,degv);
};
function rotEnt(s,o,c,a){
const e=o.e;
if(s.k==="wall"){
e.a=rotP(o.a,c,a); e.b=rotP(o.b,c,a);
return true;
}
if(s.k==="stair"){
e.flights=o.fl.map(f=>({a:rotP(f.a,c,a),b:rotP(f.b,c,a),n:f.n}));
return true;
}
if(s.k==="area"){
e.ring=o.ring.map(p=>rotP(p,c,a));
if(o.lp)e.lp=rotP(o.lp,c,a);
return true;
}
if(s.k==="col"){
const p=rotP([o.x,o.y],c,a);
e.x=p[0]; e.y=p[1];
if(e.kind!=="circ")e.rot=deg(o.rot+a);
return true;
}
if(s.k==="blk"){
const p=rotP([o.x,o.y],c,a);
e.x=p[0]; e.y=p[1];
e.rot=o.rot+a*Math.PI/180;
return true;
}
if(s.k==="fix"){
const p=rotP([o.x,o.y],c,a);
e.x=p[0]; e.y=p[1];
e.rot=deg(o.rot+a);
return true;
}
if(s.k==="anno"){
if(o.pts){e.pts=o.pts.map(p=>rotP(p,c,a)); return true}
const p=rotP([o.x,o.y],c,a);
e.x=p[0]; e.y=p[1];
if(e.kind==="text")e.rot=deg((e.rot||0)+a);
return true;
}
if(s.k==="dim"){
if(!rotOk("dim",o.kind,a))return false;
if(o.kind==="al"){
e.a=rotP(o.a,c,a); e.b=rotP(o.b,c,a);
return true;
}
const ref=(o.kind==="h")?[o.a[0],o.pos]:[o.pos,o.a[1]];
const M=rotP(ref,c,a);
e.a=rotP(o.a,c,a); e.b=rotP(o.b,c,a);
if(q90(a)%2===1)e.kind=(o.kind==="h")?"v":"h";
e.pos=(e.kind==="h")?M[1]:M[0];
return true;
}
if(s.k==="chain"){
if(!rotOk("chain",null,a))return false;
const b=rotP(o.base,c,a);
const p0=rotP(chainRef(o),c,a);
e.base=b;
if(q90(a)%2===1)e.axis=(e.axis==="h")?"v":"h";
e.pos=(e.axis==="h")?p0[1]:p0[0];
return true;
}
return false;
}
const chainRef=o=>(o.axis==="h")
? [o.base[0],o.pos] : [o.pos,o.base[1]];
export const SCL_MIN=0.01, SCL_MAX=100;
const sclP=(p,c,k)=>[R(c[0]+(p[0]-c[0])*k), R(c[1]+(p[1]-c[1])*k)];
function sclWhy(s,o,k,keep){
const e=o.e;
if(s.k==="wall"&&keep){
const L=R(dist(o.a,o.b)*k);
if(L<MINW)
return `${s.id}: الطولُ يصير ${m3(L)} م — الأدنى ${m3(MINW)} م`;
if(L>LIM.length.max)
return `${s.id}: الطولُ يصير ${m3(L)} م — الأقصى `
+`${m3(LIM.length.max)} م`;
const ops=opensOf(e.id).slice().sort((x,y)=>x.s-y.s);
let prev=-Infinity;
for(const op of ops){
const c=R(op.s*k), a=c-(op.w||0)/2, b=c+(op.w||0)/2;
if(a<EDGE-1||b>L-EDGE+1)
return `${s.id}: الفتحة ${op.id} بعرضها ${m3(op.w||0)} م لا تتّسع `
+`في جدارٍ طولُه ${m3(L)} م — أطفئ «ثبّت المقاسات» أو كبّر أكثر`;
if(a<prev-1)
return `${s.id}: الفتحة ${op.id} تتراكب مع جارتها بعد المقياس`;
prev=b;
}
return "";
}
if(keep&&(s.k==="col"||s.k==="stair"))return "";
if(s.k==="wall"){
const t=R((e.t||0)*k);
if(t<LIM.thickness.min||t>LIM.thickness.max)
return `${s.id}: السماكةُ تصير ${m3(t)} م — المدى `
+rng3(LIM.thickness.min,LIM.thickness.max,"م");
const L=R(dist(o.a,o.b)*k);
if(L<MINW)
return `${s.id}: الطولُ يصير ${m3(L)} م — الأدنى ${m3(MINW)} م`;
if(L>LIM.length.max)
return `${s.id}: الطولُ يصير ${m3(L)} م — الأقصى `
+`${m3(LIM.length.max)} م`;
}
if(s.k==="col"){
const w=R((o.w||0)*k);
if(w<CMIN||w>CMAX)
return `${s.id}: المقطعُ يصير ${m3(w)} م — المدى `
+rng3(CMIN,CMAX,"م");
}
if(s.k==="stair"){
const w=R((o.w||0)*k);
if(w<SMIN_W)
return `${s.id}: عرضُ الدرج يصير ${m3(w)} م — الأدنى `
+`${m3(SMIN_W)} م`;
}
return "";
}
function sclEnt(s,o,c,k,keep){
const e=o.e, M=p=>sclP(p,c,k);
if(s.k==="wall"){
e.a=M(o.a); e.b=M(o.b);
if(keep){
opensOf(e.id).forEach(op=>{op.s=R(op.s*k)});
return true;
}
e.t=clamp(R((e.t||0)*k),LIM.thickness.min,LIM.thickness.max);
opensOf(e.id).forEach(op=>{
op.s=R(op.s*k);
if(op.w)op.w=R(op.w*k);
});
return true;
}
if(s.k==="stair"){
e.flights=o.fl.map(f=>({a:M(f.a),b:M(f.b),n:f.n}));
if(!keep)e.w=Math.max(SMIN_W,R((o.w||0)*k));
return true;
}
if(s.k==="area"){
e.ring=o.ring.map(M);
if(o.lp)e.lp=M(o.lp);
return true;
}
if(s.k==="col"){
const p=M([o.x,o.y]);
e.x=p[0]; e.y=p[1];
if(keep)return true;
e.w=clamp(R((o.w||0)*k),CMIN,CMAX);
e.h=(e.kind==="circ")?e.w:clamp(R((o.h||0)*k),CMIN,CMAX);
return true;
}
if(s.k==="blk"){
const p=M([o.x,o.y]);
e.x=p[0]; e.y=p[1];
if(!keep)e.scale=clamp(Math.round(o.scale*k*1000)/1000,0.01,100);
return true;
}
if(s.k==="fix"){
const p=M([o.x,o.y]);
e.x=p[0]; e.y=p[1];
if(keep)return true;
if(o.w)e.w=Math.max(80,R(o.w*k));
if(o.d)e.d=Math.max(80,R(o.d*k));
return true;
}
if(s.k==="anno"){
if(o.pts){e.pts=o.pts.map(M); return true}
const p=M([o.x,o.y]);
e.x=p[0]; e.y=p[1];
return true;
}
if(s.k==="dim"){
if(o.kind==="ang"||o.kind==="rad"||o.kind==="dia")return false;
const ref=(o.kind==="h")?[o.a[0],o.pos]:[o.pos,o.a[1]];
const Mr=M(ref);
e.a=M(o.a); e.b=M(o.b);
e.pos=(o.kind==="h")?Mr[1]:Mr[0];
return true;
}
if(s.k==="chain"){
const b=M(o.base);
const p0=M(chainRef(o));
e.base=b;
e.pos=(o.axis==="h")?p0[1]:p0[0];
e.vals=(e.vals||[]).map(v=>Math.max(10,R(v*k)));
return true;
}
return false;
}
function scaleAll_(G,c,k,copy,withOpens,keep){
keep=!!keep;
const K=+k;
if(!isFinite(K)||K<=0)
throw new Error("المقياسُ يجب أن يكون رقماً موجباً");
if(K<SCL_MIN||K>SCL_MAX)
throw new Error(`المقياس ${K} خارج المدى `
+rng(SCL_MIN,SCL_MAX)+" — قسّمه على خطوتين");
if(Math.abs(K-1)<1e-9)
throw new Error("المقياس ١ — لا شيءَ يتغيّر");
const why=[];
(G||[]).forEach(({s,o})=>{
const w=sclWhy(s,o,K,keep);
if(w)why.push(w);
});
if(why.length)
throw new Error(`المقياس ${K} لا يصحّ:\n`+why.slice(0,6).join("\n")
+(why.length>6?`\n…و${why.length-6} غيرها`:""));
let nw=0,no=0,ref=[];
const work=copy?[]:null;
if(copy){
(G||[]).forEach(({s,o})=>{
const r=dupEntRaw(s,withOpens);
if(!r)return;
const ns={k:s.k,id:r.e.id};
const g=grabOf(ns);
if(!g)return;
Object.keys(o).forEach(x=>{if(x!=="e")g[x]=o[x]});
work.push({s:ns,o:g});
no+=r.opens;
});
}
(work||G||[]).forEach(({s,o})=>{
if(sclEnt(s,o,c,K,keep))nw++;
else ref.push(`${s.id} ${NAME[s.k]||s.k}`);
});
touch();
return {walls:nw,opens:no,refused:ref,k:K,keep:keep?1:0,
made:work?work.map(x=>x.s):[]};
}
function rotateAll_(G,c,degv,copy,withOpens){
let nw=0,no=0,ref=[];
const work=copy?[]:null;
if(copy){
(G||[]).forEach(({s,o})=>{
const r=dupEntRaw(s,withOpens);
if(!r)return;
const ns={k:s.k,id:r.e.id};
const g=grabOf(ns);
if(!g)return;
Object.keys(o).forEach(k=>{if(k!=="e")g[k]=o[k]});
work.push({s:ns,o:g});
no+=r.opens;
});
}
(work||G||[]).forEach(({s,o})=>{
if(rotEnt(s,o,c,degv))nw++;
else ref.push(`${s.id} ${NAME[s.k]||s.k}`);
});
touch();
return {walls:nw,opens:no,refused:ref,
made:work?work.map(x=>x.s):[]};
}
const flipAlign=a=>(a==="l")?"r":((a==="r")?"l":"c");
function mirEnt(s,o,M,axisKind,rotDelta){
const e=o.e;
if(s.k==="wall"){
e.a=M(o.a); e.b=M(o.b);
e.align=flipAlign(e.align);
if(o.bulge!=null)e.bulge=-o.bulge;
opensOf(e.id).forEach(op=>{
op.swing=(op.swing==="left")?"right":"left";
if(op.face)op.face=(op.face==="l")?"r":"l";
});
return true;
}
if(s.k==="stair"){
e.flights=o.fl.map(f=>({a:M(f.a),b:M(f.b),n:f.n}));
return true;
}
if(s.k==="area"){
e.ring=o.ring.map(M).reverse();
if(o.lp)e.lp=M(o.lp);
return true;
}
if(s.k==="col"){
const p=M([o.x,o.y]);
e.x=p[0]; e.y=p[1];
if(e.kind!=="circ")e.rot=deg(rotDelta-o.rot);
return true;
}
if(s.k==="blk"){
const p=M([o.x,o.y]);
e.x=p[0]; e.y=p[1];
e.rot=(rotDelta+180)*Math.PI/180-o.rot;
e.mirror=o.mirror?0:1;
return true;
}
if(s.k==="fix"){
const p=M([o.x,o.y]);
e.x=p[0]; e.y=p[1];
e.rot=deg(rotDelta+180-o.rot);
if(e.mir)delete e.mir; else e.mir=1;
return true;
}
if(s.k==="anno"){
if(o.pts){e.pts=o.pts.map(M); return true}
const p=M([o.x,o.y]);
e.x=p[0]; e.y=p[1];
if(e.kind==="text")e.rot=deg(rotDelta-(e.rot||0));
return true;
}
if(s.k==="dim"){
if(o.kind==="al"){e.a=M(o.a); e.b=M(o.b); return true}
if(!axisKind)return false;
const A=M(o.a), B=M(o.b);
const Q=M((o.kind==="h")?[o.a[0],o.pos]:[o.pos,o.a[1]]);
e.a=A; e.b=B;
if(axisKind==="d")e.kind=(o.kind==="h")?"v":"h";
e.pos=(e.kind==="h")?Q[1]:Q[0];
return true;
}
if(s.k==="chain"){
if(!axisKind)return false;
const b=M(o.base);
const q=M(chainRef(o));
e.base=b;
if(axisKind==="d")e.axis=(e.axis==="h")?"v":"h";
e.pos=(e.axis==="h")?q[1]:q[0];
return true;
}
return false;
}
function mirrorAll_(G,a,b,keep,withOpens){
const dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy);
if(L<1)throw new Error("محور المرآة صفري");
const ux=dx/L, uy=dy/L;
const M=p=>{
const px=p[0]-a[0], py=p[1]-a[1], t=px*ux+py*uy;
return [R(a[0]+2*ux*t-px), R(a[1]+2*uy*t-py)];
};
const ang=deg(Math.atan2(uy,ux)*R2D);
const at=(v,m)=>{const r=((v%m)+m)%m; return Math.min(r,m-r)<0.01};
const m90=at(ang,90), m45=at(ang-45,90);
const axisKind=m90?"s":(m45?"d":null);
const rotDelta=2*ang;
let nw=0,no=0,ref=[];
const work=keep?[]:null;
if(keep){
(G||[]).forEach(({s,o})=>{
const r=dupEntRaw(s,withOpens);
if(!r)return;
const ns={k:s.k,id:r.e.id};
const g=grabOf(ns);
if(!g)return;
Object.keys(o).forEach(k=>{if(k!=="e")g[k]=o[k]});
work.push({s:ns,o:g});
no+=r.opens;
});
}
(work||G||[]).forEach(({s,o})=>{
if(mirEnt(s,o,M,axisKind,rotDelta))nw++;
else ref.push(`${s.id} ${NAME[s.k]||s.k}`);
});
touch();
return {walls:nw,opens:no,refused:ref,
made:work?work.map(x=>x.s):[]};
}
function offsetWall_(id,d,side,clear,t,type,withOpens){
const w=wallById(id);
if(!w)throw new Error("الجدار غير موجود");
noArc(w,"الإزاحة");
const u=dir(w);
if(!u)throw new Error("الجدار صفري");
const t2=clamp(R(t||w.t),50,1000);
const D=d+(clear?(w.t+t2)/2:0);
const sg=(side<0)?-1:1;
const px=u.nx*sg*D, py=u.ny*sg*D;
const r=dupEntRaw({k:"wall",id},withOpens);
if(!r)throw new Error("تعذّر النسخ");
r.e.a=[R(w.a[0]+px),R(w.a[1]+py)];
r.e.b=[R(w.b[0]+px),R(w.b[1]+py)];
r.e.t=t2;
if(type)r.e.type=type;
touch();
return {wall:r.e,opens:r.opens,d:D};
}
function dropOpensIn(id,lo,hi){
const kill=opensOf(id).filter(o=>{
const [a,b]=span(o);
return a<hi-1&&lo<b-1;
});
kill.forEach(o=>delOpen(o));
return kill.length;
}
function shiftOpensTo(id,newId2,lo,hi,ds){
let n=0;
opensOf(id).forEach(o=>{
const [a,b]=span(o);
if(a<lo-1||b>hi+1)return;
o.wall=newId2;
o.s=R(o.s-ds);
n++;
});
if(n)invalidateOpens();
return n;
}
function breakWall_(id,p){
const w=wallById(id);
if(!w)throw new Error("الجدار غير موجود");
noArc(w,"القطع");
const u=dir(w);
if(!u)throw new Error("الجدار صفري");
const s=R((p[0]-w.a[0])*u.ux+(p[1]-w.a[1])*u.uy);
if(s<MINW||s>u.L-MINW)
throw new Error(`نقطة القطع على ${m2(s)} م — يجب أن تبعد `
+`${m2(MINW)} م عن الطرفين على الأقل`);
const lost=dropOpensIn(id,s,s);
const n=Object.assign({},w,{id:newId("W"),
a:[R(w.a[0]+u.ux*s),R(w.a[1]+u.uy*s)], b:w.b.slice()});
S.walls.push(n);
const moved=shiftOpensTo(id,n.id,s,u.L,s);
w.b=n.a.slice();
touch();
return {nw:n,a:s,b:u.L-s,lost,moved};
}
function trimWall_(id,cuts,p){
const w=wallById(id);
if(!w)throw new Error("الجدار غير موجود");
noArc(w,"القصّ");
(cuts||[]).forEach(c=>noArc(wallById(c),"القصّ (الحدّ)"));
const u=dir(w);
if(!u)throw new Error("الجدار صفري");
const T=[];
(cuts||[]).forEach(c=>{
const o=wallById(c);
if(!o||o.id===id)return;
const x=lineX(w.a,w.b,o.a,o.b);
if(!x)return;
if(nearOnSeg(o.a,o.b,x[0],x[1]).d>2)return;
const s=R((x[0]-w.a[0])*u.ux+(x[1]-w.a[1])*u.uy);
if(s>2&&s<u.L-2)T.push(s);
});
if(!T.length)
throw new Error("لا حدّ من المحدَّدة يعبر هذا الجدار");
T.sort((a,b)=>a-b);
const sp=clamp((p[0]-w.a[0])*u.ux+(p[1]-w.a[1])*u.uy,0,u.L);
let lo=null, hi=null;
T.forEach(v=>{
if(v<=sp&&(lo==null||v>lo))lo=v;
if(v>=sp&&(hi==null||v<hi))hi=v;
});
const gl=(lo!=null), gh=(hi!=null);
if(!gl&&!gh)throw new Error("انقر على جزء بين حدَّين أو خارجهما");
if(gl&&gh){
if(hi-lo<20)throw new Error("الجزء المحدَّد أرقّ من 2 سم");
const lost=dropOpensIn(id,lo,hi);
const n=Object.assign({},w,{id:newId("W"),
a:[R(w.a[0]+u.ux*hi),R(w.a[1]+u.uy*hi)], b:w.b.slice()});
S.walls.push(n);
const moved=shiftOpensTo(id,n.id,hi,u.L,hi);
w.b=[R(w.a[0]+u.ux*lo),R(w.a[1]+u.uy*lo)];
touch();
return {mode:"mid",cut:hi-lo,nw:n,lost,moved};
}
if(!gl){
const lost=dropOpensIn(id,0,hi);
let moved=0;
opensOf(id).forEach(o=>{o.s=R(o.s-hi); moved++});
w.a=[R(w.a[0]+u.ux*hi),R(w.a[1]+u.uy*hi)];
touch();
return {mode:"start",cut:hi,lost,moved};
}
const lost=dropOpensIn(id,lo,u.L);
w.b=[R(w.a[0]+u.ux*lo),R(w.a[1]+u.uy*lo)];
touch();
return {mode:"end",cut:u.L-lo,lost,moved:0};
}
function extendWall_(id,bnds,p){
const w=wallById(id);
if(!w)throw new Error("الجدار غير موجود");
noArc(w,"التمديد");
(bnds||[]).forEach(c=>noArc(wallById(c),"التمديد (الحدّ)"));
const u=dir(w);
if(!u)throw new Error("الجدار صفري");
const atEnd=((p[0]-w.a[0])*u.ux+(p[1]-w.a[1])*u.uy)>u.L/2;
let best=null;
(bnds||[]).forEach(c=>{
const o=wallById(c);
if(!o||o.id===id)return;
const x=lineX(w.a,w.b,o.a,o.b);
if(!x)return;
if(nearOnSeg(o.a,o.b,x[0],x[1]).d>2)return;
const s=(x[0]-w.a[0])*u.ux+(x[1]-w.a[1])*u.uy;
if(atEnd){if(s>u.L+10&&(best==null||s<best))best=s}
else{if(s<-10&&(best==null||s>best))best=s}
});
if(best==null)
throw new Error("لا حدّ من المحدَّدة في هذا الاتجاه");
if(atEnd){
w.b=[R(w.a[0]+u.ux*best),R(w.a[1]+u.uy*best)];
touch();
return {mode:"end",add:best-u.L};
}
const add=-best;
w.a=[R(w.a[0]+u.ux*best),R(w.a[1]+u.uy*best)];
opensOf(id).forEach(o=>{o.s=R(o.s+add)});
touch();
return {mode:"start",add};
}
export function stretchGrab(r){
const G=[];
const inR=p=>p[0]>=r.x0&&p[0]<=r.x1&&p[1]>=r.y0&&p[1]<=r.y1;
S.walls.forEach(w=>{
if(!pickable({k:"wall",id:w.id}))return;
const a=inR(w.a), b=inR(w.b);
if(isArc(w)&&(a!==b))noArc(w,"الشدّ (طرفٌ واحد داخل الإطار)");
if(a||b)G.push({e:w,a,b,o:{a:w.a.slice(),b:w.b.slice()}});
});
return G;
}
function stretchApply_(G,dx,dy){
(G||[]).forEach(g=>{
if(g.a)g.e.a=[g.o.a[0]+dx,g.o.a[1]+dy];
if(g.b)g.e.b=[g.o.b[0]+dx,g.o.b[1]+dy];
});
touch();
return (G||[]).length;
}
export const stretchPrev=(G,dx,dy)=>(G||[]).map(g=>[
g.a?[g.o.a[0]+dx,g.o.a[1]+dy]:g.o.a,
g.b?[g.o.b[0]+dx,g.o.b[1]+dy]:g.o.b]);
export function weldPlan(ids,tol){
const T=clamp(tol||30,1,2000);
const W=(ids||[]).map(id=>wallById(id)).filter(Boolean);
const fixed=w=>isArc(w);
const ends=[];
W.forEach(w=>{
ends.push({w,k:"a",p:w.a.slice()});
ends.push({w,k:"b",p:w.b.slice()});
});
const shared=e=>ends.some(x=>x!==e&&x.w!==e.w&&dist(x.p,e.p)<=1);
const moves=[], done=new Set();
const key=e=>e.w.id+"/"+e.k;
for(let i=0;i<ends.length;i++){
const e=ends[i];
if(done.has(key(e))||shared(e))continue;
let best=null,bd=T;
for(let j=0;j<ends.length;j++){
const f=ends[j];
if(f===e||f.w===e.w||done.has(key(f))||shared(f))continue;
const d=dist(e.p,f.p);
if(d>0.5&&d<=bd){bd=d;best=f}
}
if(!best)continue;
if(fixed(e.w)&&fixed(best.w))continue;
const m=fixed(e.w)?P2(e.p):fixed(best.w)?P2(best.p)
:[R((e.p[0]+best.p[0])/2), R((e.p[1]+best.p[1])/2)];
[e,best].forEach(x=>{
const d=dist(x.p,m);
if(d>0.5)moves.push({id:x.w.id,end:x.k,from:x.p.slice(),
to:m.slice(),d:R(d),why:"node"});
done.add(key(x));
});
}
ends.forEach(e=>{
if(done.has(key(e))||shared(e)||fixed(e.w))return;
let best=null,bd=T;
W.forEach(o=>{
if(o===e.w||fixed(o))return;
const r=nearOnSeg(o.a,o.b,e.p[0],e.p[1]);
if(r.d>bd||r.d<=0.5)return;
if(r.t<=0.002||r.t>=0.998)return;
const x=lineX(e.w.a,e.w.b,o.a,o.b);
const q=x||r.p;
const d=dist(e.p,q);
if(d<=T&&d>0.5&&d<bd){bd=d;best={q,why:"axis"}}
else if(r.d<bd){bd=r.d;best={q:r.p,why:"tee"}}
});
if(!best)return;
moves.push({id:e.w.id,end:e.k,from:e.p.slice(),
to:P2(best.q),d:R(dist(e.p,best.q)),why:best.why});
done.add(key(e));
});
return {moves,tol:T};
}
function weldApply_(plan){
let n=0;
((plan&&plan.moves)||[]).forEach(m=>{
const w=wallById(m.id);
if(!w)return;
const cur=(m.end==="a")?w.a:w.b;
if(dist(cur,m.from)>1)return;
if(m.end==="a")w.a=m.to.slice(); else w.b=m.to.slice();
n++;
});
const short=S.walls.filter(w=>wallLen(w)<MINW).map(w=>w.id);
touch();
return {moved:n,short};
}
export const WHY={node:"طرفان يلتقيان",axis:"إسقاط على محور",
tee:"إسقاط على جسم"};
function arrayRect_(G,nx,ny,dx,dy,withOpens){
const NX=clamp(R(nx||1),1,100), NY=clamp(R(ny||1),1,100);
const cop=NX*NY-1;
if(cop<1)
throw new Error("صفٌّ واحدٌ وعمودٌ واحد — لا نسخةَ تُنشَأ");
if(NX>1&&!dx)
throw new Error(`تباعد X صفرٌ مع ${NX} أعمدة — النسخُ تتراكب`);
if(NY>1&&!dy)
throw new Error(`تباعد Y صفرٌ مع ${NY} صفوف — النسخُ تتراكب`);
const src=(G||[]);
if(src.length*cop>500)
throw new Error(`${src.length*cop} نسخة — الحدّ 500`);
let nw=0, no=0;
const made=[];
for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){
if(!i&&!j)continue;
src.forEach(({s,o})=>{
const q=copyOne(s,o,withOpens,(ns,g)=>moveEnt(ns,g,dx*i,dy*j));
if(!q)return;
nw++; no+=q.opens; made.push(q.ns);
});
}
touch();
return {walls:nw,opens:no,made,cells:cop,nx:NX,ny:NY};
}
function anchorOf(s){
const bx=r=>{
const b=bboxOf(r||[]);
return b?[R((b.x0+b.x1)/2),R((b.y0+b.y1)/2)]:null;
};
const o=outlineOf(s);
if(o&&o.length){
const p=bx(o);
if(p)return p;
}
const sh=shapeOf(s);
if(!sh)return null;
if(sh.t==="pt")return sh.p.slice();
if(sh.t==="seg")return mid(sh.a,sh.b).map(R);
return bx(sh.pts);
}
function boxOf(s){
const o=outlineOf(s);
if(o&&o.length){
const b=bboxOf(o);
if(b)return b;
}
const sh=shapeOf(s);
if(!sh)return null;
if(sh.t==="pt")return {x0:sh.p[0],y0:sh.p[1],x1:sh.p[0],y1:sh.p[1]};
if(sh.t==="seg")return bboxOf([sh.a,sh.b]);
return bboxOf(sh.pts||[]);
}
export const ALIGN_MODES=["min","mid","max","dist"];
export const ALIGN_AXES=["x","y"];
const ALIGN_WHY={
min:"إلى الأدنى", mid:"إلى الوسط", max:"إلى الأقصى",
dist:"توزيعٌ متساوي التباعد"};
export const alignWhy=m=>ALIGN_WHY[m]||m;
export function alignPlan(G,axis,mode){
const AX=(axis==="y")?"y":"x";
const MD=ALIGN_MODES.indexOf(mode)>=0?mode:"min";
const src=(G||[]).map(g=>{
const b=boxOf(g.s);
return b?{g,b}:null;
}).filter(Boolean);
if(src.length<2)
throw new Error("التسويةُ تحتاج عنصرَين على الأقل");
if(MD==="dist"&&src.length<3)
throw new Error("التوزيعُ يحتاج ثلاثةَ عناصرَ على الأقل — "
+"الطرفانِ يثبتان وما بينهما يُوزَّع");
const lo=x=>(AX==="x")?x.b.x0:x.b.y0;
const hi=x=>(AX==="x")?x.b.x1:x.b.y1;
const ct=x=>(lo(x)+hi(x))/2;
const moves=[];
if(MD==="dist"){
const A=src.slice().sort((p,q)=>ct(p)-ct(q));
const c0=ct(A[0]), c1=ct(A[A.length-1]);
const step=(c1-c0)/(A.length-1);
if(Math.abs(step)<1)
throw new Error("الطرفانِ في موضعٍ واحدٍ — لا مدًى يُوزَّع فيه");
A.forEach((x,i)=>{
const d=R(c0+step*i-ct(x));
if(d)moves.push({g:x.g,d,at:ct(x)});
});
return {axis:AX,mode:MD,n:src.length,step:R(step),
moves,why:ALIGN_WHY[MD]};
}
const vals=src.map(x=>(MD==="min")?lo(x):(MD==="max")?hi(x):ct(x));
const t=(MD==="min")?Math.min(...vals)
:(MD==="max")?Math.max(...vals)
:vals.reduce((a,b)=>a+b,0)/vals.length;
src.forEach((x,i)=>{
const d=R(t-vals[i]);
if(d)moves.push({g:x.g,d,at:vals[i]});
});
return {axis:AX,mode:MD,n:src.length,target:R(t),
moves,why:ALIGN_WHY[MD]};
}
function alignAll_(G,axis,mode){
const P=alignPlan(G,axis,mode);
if(!P.moves.length)return {moved:0,plan:P};
P.moves.forEach(({g,d})=>{
moveEnt(g.s,g.o,(P.axis==="x")?d:0,(P.axis==="x")?0:d);
});
touch();
return {moved:P.moves.length,plan:P};
}
const PATH_SEGS=48;
export function pathSamples(pl){
const P=(pl&&pl.pts)||[];
if(P.length<2)return [];
const closed=(pl.closed===1&&P.length>2);
const n=P.length;
const m=closed?n:n-1;
const out=[{p:P[0].slice(),t:0,ang:0}];
let acc=0;
for(let i=0;i<m;i++){
const a=P[i], b=P[(i+1)%n];
const bg=(pl.bulge&&pl.bulge[i])?+pl.bulge[i]:0;
const A=bulgeArc(a,b,bg);
if(!A){
const L=Math.hypot(b[0]-a[0],b[1]-a[1]);
const ang=Math.atan2(b[1]-a[1],b[0]-a[0])/D2R;
if(out.length)out[out.length-1].ang=ang;
acc+=L;
out.push({p:b.slice(),t:acc,ang});
continue;
}
for(let k=1;k<=PATH_SEGS;k++){
const u=A.a0+A.sweep*(k/PATH_SEGS);
const q=[A.cx+A.r*Math.cos(u), A.cy+A.r*Math.sin(u)];
const pr=out[out.length-1].p;
acc+=Math.hypot(q[0]-pr[0],q[1]-pr[1]);
const tg=(u+(A.sweep>0?Math.PI/2:-Math.PI/2))/D2R;
out[out.length-1].ang=tg;
out.push({p:[R(q[0]),R(q[1])],t:acc,ang:tg});
}
}
if(out.length>1)out[out.length-1].ang=out[out.length-2].ang;
return out;
}
export const pathLength=pl=>{
const S_=pathSamples(pl);
return S_.length?S_[S_.length-1].t:0;
};
export function pathAt(SM,t){
if(!SM||!SM.length)return null;
const last=SM[SM.length-1].t;
const u=clamp(t,0,last);
for(let i=0;i+1<SM.length;i++){
const a=SM[i], b=SM[i+1];
if(u>b.t)continue;
const span=b.t-a.t;
const f=span>1e-9?(u-a.t)/span:0;
return {p:[R(a.p[0]+(b.p[0]-a.p[0])*f),
R(a.p[1]+(b.p[1]-a.p[1])*f)], ang:a.ang, t:u};
}
const z=SM[SM.length-1];
return {p:z.p.slice(),ang:z.ang,t:u};
}
function arrayPath_(G,pl,n,rot,withOpens){
const N=clamp(R(n||2),2,200);
const SM=pathSamples(pl);
if(SM.length<2)throw new Error("المسارُ لا يصلح — نقطتان على الأقل");
const L=SM[SM.length-1].t;
if(L<1)throw new Error("طولُ المسار صفر — لا توزيعَ يقع");
const closed=(pl.closed===1&&(pl.pts||[]).length>2);
const step=L/(closed?N:(N-1));
const src=[], ref=[];
(G||[]).forEach(g=>{
if(rot&&!canRotate(g.s,45)){
ref.push(`${g.s.id} ${NAME[g.s.k]||g.s.k}`);
return;
}
src.push(g);
});
if(!src.length)
throw new Error("لا عنصرَ يقبل الدورانَ مع المسار — البُعدُ "
+"الأفقيُّ والرأسيُّ والسلسلةُ لا تدور إلّا بمضاعفات 90°. "
+"أطفئ «يتبع ميلَ المسار»");
const cop=N-1;
if(src.length*cop>500)
throw new Error(`${src.length*cop} نسخة — الحدّ 500`);
const base=pathAt(SM,0);
const lead=anchorOf(src[0].s);
let nw=0, no=0;
const made=[];
for(let k=1;k<=cop;k++){
const q=pathAt(SM,step*k);
if(!q)continue;
const da=rot?(q.ang-base.ang):0;
src.forEach(({s,o})=>{
const an=lead||anchorOf(s);
if(!an)return;
const r=copyOne(s,o,withOpens,(ns,g)=>{
moveEnt(ns,g,q.p[0]-an[0],q.p[1]-an[1]);
if(da&&Math.abs(da)>0.01){
const ns2=grabOf(ns);
if(ns2)rotateAll([{s:ns,o:ns2}],q.p,da,0,withOpens);
}
});
if(!r)return;
nw++; no+=r.opens; made.push(r.ns);
});
}
touch();
return {walls:nw,opens:no,made,refused:ref,
n:N, len:R(L), step:R(step), closed:closed?1:0, rot:rot?1:0};
}
function arrayPolar_(G,c,total,n,rot,withOpens){
const N=clamp(R(n||2),2,200);
const T=+total||0;
if(Math.abs(T)<0.01)
throw new Error("الزاوية الإجمالية صفر — لا توزيعَ يقع");
const full=Math.abs(Math.abs(T)-360)<0.05;
const stepA=T/(full?N:(N-1));
const cop=N-1;
const src=[], ref=[];
(G||[]).forEach(g=>{
if(rot&&!canRotate(g.s,stepA)){
ref.push(`${g.s.id} ${NAME[g.s.k]||g.s.k}`);
return;
}
src.push(g);
});
if(!src.length)
throw new Error(`لا عنصرَ يقبل التوزيعَ بخطوة `
+`${stepA.toFixed(1)}° — البُعدُ الأفقيُّ والرأسيُّ والسلسلةُ `
+`لا تدور إلّا بمضاعفات 90°`);
if(src.length*cop>500)
throw new Error(`${src.length*cop} نسخة — الحدّ 500`);
let nw=0, no=0;
const made=[];
for(let k=1;k<=cop;k++){
const a=stepA*k;
if(rot){
const r=rotateAll(src,c,a,1,withOpens);
nw+=r.walls; no+=r.opens;
(r.made||[]).forEach(x=>made.push(x));
continue;
}
src.forEach(({s,o})=>{
const an=anchorOf(s);
const q=copyOne(s,o,withOpens,(ns,g)=>{
if(!an)return;
const p=rotP(an,c,a);
moveEnt(ns,g,p[0]-an[0],p[1]-an[1]);
});
if(!q)return;
nw++; no+=q.opens; made.push(q.ns);
});
}
touch();
return {walls:nw,opens:no,made,refused:ref,
step:Math.round(stepA*100)/100, n:N, full};
}
export function chamferPlan(id1,id2,d1,d2,p1,p2){
const w1=wallById(id1), w2=wallById(id2);
if(!w1||!w2)throw new Error("الجدار غير موجود");
noArc(w1,"كسر الركن"); noArc(w2,"كسر الركن");
if(w1===w2)throw new Error("الجداران واحدٌ — انقر جدارين مختلفين");
const u1=dir(w1), u2=dir(w2);
if(!u1||!u2)throw new Error("جدارٌ صفريُّ الطول");
const X=lineX(w1.a,w1.b,w2.a,w2.b);
if(!X)throw new Error(`${id1} و ${id2} متوازيان — لا ركنَ بينهما`);
const D1=Math.max(1,R(d1||0)), D2=Math.max(1,R(d2||d1||0));
const side=(w,u,d,p)=>{
const s =(X[0]-w.a[0])*u.ux+(X[1]-w.a[1])*u.uy;
const sc=(p[0]-w.a[0])*u.ux+(p[1]-w.a[1])*u.uy;
const keepB=sc>s;
const sg=keepB?1:-1;
return {id:w.id, d, L:R(u.L),
end:keepB?"a":"b",
from:(keepB?w.a:w.b).slice(),
to:[R(X[0]+u.ux*sg*d), R(X[1]+u.uy*sg*d)],
cut:R(s+sg*d),
remain:keepB?(u.L-s-d):(s-d),
grow:keepB?Math.max(0,-s):Math.max(0,s-u.L),
dirIn:[u.ux*sg,u.uy*sg]};
};
const A=side(w1,u1,D1,p1||mid(w1.a,w1.b));
const B=side(w2,u2,D2,p2||mid(w2.a,w2.b));
const cs=A.dirIn[0]*B.dirIn[0]+A.dirIn[1]*B.dirIn[1];
const ang=Math.acos(clamp(cs,-1,1))*R2D;
if(ang<5||ang>175)
throw new Error(`الجداران يلتقيان بزاوية ${ang.toFixed(1)}° — `
+`لا ركنَ يُكسَر`);
[A,B].forEach(x=>{
if(x.remain<MINW)
throw new Error(`${x.id}: يبقى منه ${m3(x.remain)} م بعد `
+`الكسر — الأدنى ${m3(MINW)} م. صغّر المسافة، أو انقره في `
+`الجهة التي تريد إبقاءها`);
});
const len=dist(A.to,B.to);
if(len<MINW)
throw new Error(`ضلعُ الكسر ${m3(len)} م — الأدنى ${m3(MINW)} م`);
return {a:A,b:B,X:P2(X),len:R(len),
ang:Math.round(ang*10)/10, t:w1.t, type:w1.type};
}
function chamferApply_(plan){
const P=plan||{}, A=P.a, B=P.b;
if(!A||!B)throw new Error("لا خطّةَ كسر");
const W1=wallById(A.id), W2=wallById(B.id);
if(!W1||!W2)throw new Error("الجدارُ لم يبقَ — أعِد الأداة");
[[W1,A],[W2,B]].forEach(([w,x])=>{
if(dist((x.end==="a")?w.a:w.b,x.from)>1)
throw new Error(`${x.id} تحرّك بعد التخطيط — أعِد الأداة`);
});
let lost=0;
[[W1,A],[W2,B]].forEach(([w,x])=>{
if(x.end==="a"){
lost+=dropOpensIn(w.id,0,x.cut);
opensOf(w.id).forEach(o=>{o.s=R(o.s-x.cut)});
w.a=x.to.slice();
}else{
lost+=dropOpensIn(w.id,x.cut,x.L);
w.b=x.to.slice();
}
});
const nw=addWall(A.to,B.to,P.t,P.type,"c");
touch();
return {wall:nw,lost,len:P.len};
}
export function filletPlan(id1,id2,r,p1,p2){
const w1=wallById(id1), w2=wallById(id2);
if(!w1||!w2)throw new Error("الجدار غير موجود");
noArc(w1,"الاستدارة"); noArc(w2,"الاستدارة");
if(w1===w2)throw new Error("الجداران واحدٌ — انقر جدارين مختلفين");
const u1=dir(w1), u2=dir(w2);
if(!u1||!u2)throw new Error("جدارٌ صفريُّ الطول");
const X=lineX(w1.a,w1.b,w2.a,w2.b);
if(!X)throw new Error(`${id1} و ${id2} متوازيان — لا ركنَ بينهما`);
const Rr=clamp(Math.round(Math.abs(+r||0)),1,1e6);
const side=(w,u,p)=>{
const s =(X[0]-w.a[0])*u.ux+(X[1]-w.a[1])*u.uy;
const sc=(p[0]-w.a[0])*u.ux+(p[1]-w.a[1])*u.uy;
const keepB=sc>s;
const sg=keepB?1:-1;
const to=[R(X[0]+u.ux*sg*Rr), R(X[1]+u.uy*sg*Rr)];
const cut=R(s+sg*Rr);
return {id:w.id, L:R(u.L),
end:keepB?"a":"b",
from:(keepB?w.a:w.b).slice(),
to, cut,
remain:keepB?(u.L-s-Rr):(s-Rr),
dirIn:[u.ux*sg,u.uy*sg]};
};
const A=side(w1,u1,p1||mid(w1.a,w1.b));
const B=side(w2,u2,p2||mid(w2.a,w2.b));
const cs=A.dirIn[0]*B.dirIn[0]+A.dirIn[1]*B.dirIn[1];
const ang=Math.acos(clamp(cs,-1,1))*R2D;
if(ang<5||ang>175)
throw new Error(`الجداران يلتقيان بزاوية ${ang.toFixed(1)}° — `
+`لا استدارةَ تُبنى`);
[A,B].forEach(x=>{
if(x.remain<MINW)
throw new Error(`${x.id}: يبقى منه ${m3(x.remain)} م بعد `
+`الاستدارة — الأدنى ${m3(MINW)} م. صغّر نصف القطر، أو انقره `
+`في الجهة التي تريد إبقاءها`);
});
const t=w1.t;
if(Rr< t/2+1)
throw new Error(`الاستدارة: نصف قطرها ${m3(Rr)} م لا يكفي سماكةَ `
+`الجدار ${m3(t)} م — الأدنى ${m3(t/2+1)} م. كبّر نصف القطر `
+`أو صغّر السماكة`);
const th1=Math.atan2(A.dirIn[1],A.dirIn[0]);
const th2=Math.atan2(B.dirIn[1],B.dirIn[0]);
let sweep=th2-th1;
while(sweep>Math.PI)sweep-=2*Math.PI;
while(sweep<=-Math.PI)sweep+=2*Math.PI;
const bulge=clamp(Math.tan(sweep/4),-8,8);
return {a:A,b:B,X:P2(X),r:Rr,bulge,
ang:Math.round(ang*10)/10, t, type:w1.type};
}
function filletApply_(plan){
const P=plan||{}, A=P.a, B=P.b;
if(!A||!B)throw new Error("لا خطّةَ استدارة");
const W1=wallById(A.id), W2=wallById(B.id);
if(!W1||!W2)throw new Error("الجدارُ لم يبقَ — أعِد الأداة");
[[W1,A],[W2,B]].forEach(([w,x])=>{
if(dist((x.end==="a")?w.a:w.b,x.from)>1)
throw new Error(`${x.id} تحرّك بعد التخطيط — أعِد الأداة`);
});
let lost=0;
[[W1,A],[W2,B]].forEach(([w,x])=>{
if(x.end==="a"){
lost+=dropOpensIn(w.id,0,x.cut);
opensOf(w.id).forEach(o=>{o.s=R(o.s-x.cut)});
w.a=x.to.slice();
}else{
lost+=dropOpensIn(w.id,x.cut,x.L);
w.b=x.to.slice();
}
});
const nw=addWall(A.to,B.to,P.t,P.type,"c",undefined,P.bulge);
touch();
return {wall:nw,lost,r:P.r};
}
export const moveAll=(...a)=>atomic("نقل العناصر",()=>moveAll_(...a));
export const copyAll=(...a)=>atomic("نسخ العناصر",()=>copyAll_(...a));
export const rotateAll=(...a)=>atomic("دوران العناصر",()=>rotateAll_(...a));
export const mirrorAll=(...a)=>atomic("مرآة العناصر",()=>mirrorAll_(...a));
export const offsetWall=(...a)=>atomic("إزاحة جدار",()=>offsetWall_(...a));
export const breakWall=(...a)=>atomic("قطع جدار",()=>breakWall_(...a));
export const trimWall=(...a)=>atomic("قصّ جدار",()=>trimWall_(...a));
export const extendWall=(...a)=>atomic("تمديد جدار",()=>extendWall_(...a));
export const stretchApply=(...a)=>atomic("شدّ بإطار",()=>stretchApply_(...a));
export const weldApply=(...a)=>atomic("لحم الجدران",()=>weldApply_(...a));
export const arrayRect=(...a)=>atomic("مصفوفة مستطيلة",()=>arrayRect_(...a));
export const arrayPolar=(...a)=>atomic("مصفوفة قطبية",()=>arrayPolar_(...a));
export const alignAll=(...a)=>atomic("تسوية العناصر",()=>alignAll_(...a));
export const arrayPath=(...a)=>atomic("مصفوفة على مسار",()=>arrayPath_(...a));
export const chamferApply=(...a)=>atomic("كسر زاوية",()=>chamferApply_(...a));
export const filletApply=(...a)=>atomic("استدارة زاوية",()=>filletApply_(...a));
export const scaleAll=(...a)=>atomic("مقياس العناصر",()=>scaleAll_(...a));
