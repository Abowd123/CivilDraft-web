import {S,touchView} from "./state.js";
import {V} from "./validate.js";
import {newId,clamp} from "./units.js";
import {nearOnSeg,pip,pArea,bboxOf} from "./geom.js";
import {bulgeArc,inSweep} from "./arcmath.js";
import {normLevel} from "./level.js";
const R=v=>Math.round(v);
const dist_pt=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
export const plineById=id=>S.plines.find(p=>p.id===id)||null;
export const plineLen=p=>{
const P=(p&&p.pts)||[], n=P.length;
let s=0;
for(let i=0;i+1<n;i++){
const a=P[i], b=P[i+1];
const bg=(p.bulge&&p.bulge[i])?+p.bulge[i]:0;
const A=bulgeArc(a,b,bg);
s+=A?A.r*Math.abs(A.sweep):dist_pt(a,b);
}
if(p&&p.closed===1&&n>2){
const bg=(p.bulge&&p.bulge[n-1])?+p.bulge[n-1]:0;
const A=bulgeArc(P[n-1],P[0],bg);
s+=A?A.r*Math.abs(A.sweep):dist_pt(P[n-1],P[0]);
}
return s;
};
export const plineBox=p=>{
const P=(p&&p.pts)||[];
const B=bboxOf(P);
if(!B)return null;
let sag=0;
const n=P.length, m=(p.closed===1&&n>2)?n:n-1;
for(let i=0;i<m;i++){
const bg=(p.bulge&&p.bulge[i])?Math.abs(+p.bulge[i]):0;
if(bg)sag=Math.max(sag,bg*dist_pt(P[i],P[(i+1)%n])/2);
}
return sag?{x0:B.x0-sag,y0:B.y0-sag,x1:B.x1+sag,y1:B.y1+sag}:B;
};
export const plineArea=p=>(p&&p.closed===1&&(p.pts||[]).length>2)
? Math.abs(pArea(p.pts)) : 0;
function cleanPts(pts,tol){
const T=Math.max(0,tol||0), a=[];
(pts||[]).forEach(p=>{
if(!Array.isArray(p)||!isFinite(p[0])||!isFinite(p[1]))return;
const q=[R(p[0]),R(p[1])];
if(a.length&&dist_pt(a[a.length-1],q)<=T)return;
a.push(q);
});
return a;
}
export function addPline(pts,opt){
const o=opt||{};
V("pline",{pts:pts||[],closed:o.closed?1:0,bulge:o.bulge});
const P=cleanPts(pts,1);
if(P.length<2)throw new Error("الخطّ المتعدّد يحتاج نقطتين على الأقل");
const p={id:newId("PL"), pts:P,
closed:o.closed?1:0,
level:normLevel(S.meta.level)};
if(Array.isArray(o.bulge)&&o.bulge.length){
const bg=o.bulge.slice(0,P.length).map(v=>{
const b=+v;
return (!isFinite(b)||Math.abs(b)<1e-4)?0:clamp(b,-8,8);
});
if(p.closed===1&&bg.length===P.length&&!bg[P.length-1])bg.pop();
p.bulge=bg;
}
S.plines.push(p); touchView();
return p;
}
export function delPline(p){
const i=S.plines.indexOf(p);
if(i<0)return false;
S.plines.splice(i,1); touchView();
return true;
}
export const plineAt=(x,y,cand,tol)=>{
let best=null, bd=(tol==null)?150:tol;
(cand||S.plines).forEach(p=>{
const P=p.pts||[], n=P.length;
if(n<2)return;
if(p.closed===1&&n>2&&pip(P,x,y)){best=p;bd=0;return}
const m=p.closed===1?n:n-1;
for(let i=0;i<m;i++){
const a=P[i], b=P[(i+1)%n];
const bg=(p.bulge&&p.bulge[i])?+p.bulge[i]:0;
const A=bulgeArc(a,b,bg);
if(!A){
const d=nearOnSeg(a,b,x,y).d;
if(d<bd){bd=d;best=p}
}else{
const ang=Math.atan2(y-A.cy,x-A.cx);
if(!inSweep(A,ang))continue;
const d=Math.abs(Math.hypot(x-A.cx,y-A.cy)-A.r);
if(d<bd){bd=d;best=p}
}
}
});
return best;
};
export const plineSegs=p=>{
const n=((p&&p.pts)||[]).length;
if(n<2)return 0;
return (p.closed===1&&n>2)?n:n-1;
};
export function segNearest(p,x,y){
const P=(p&&p.pts)||[], n=P.length, m=plineSegs(p);
if(!m)return null;
let bi=-1, bd=Infinity, bt=0;
for(let i=0;i<m;i++){
const a=P[i], b=P[(i+1)%n];
const bg=(p.bulge&&p.bulge[i])?+p.bulge[i]:0;
const A=bulgeArc(a,b,bg);
let d, t=0.5;
if(!A){
const q=nearOnSeg(a,b,x,y);
d=q.d; t=q.t==null?0.5:q.t;
}else{
const ang=Math.atan2(y-A.cy,x-A.cx);
d=inSweep(A,ang)
?Math.abs(Math.hypot(x-A.cx,y-A.cy)-A.r)
:Math.min(dist_pt([x,y],a),dist_pt([x,y],b));
}
if(d<bd){bd=d; bi=i; bt=t}
}
return (bi<0)?null:{i:bi,d:R(bd),t:bt};
}
export function vertNearest(p,x,y){
const P=(p&&p.pts)||[];
if(!P.length)return null;
let bi=-1, bd=Infinity;
P.forEach((q,i)=>{
const d=dist_pt(q,[x,y]);
if(d<bd){bd=d; bi=i}
});
return {i:bi,d:R(bd)};
}
function bulArr(p){
const m=plineSegs(p);
const a=new Array(m).fill(0);
(p.bulge||[]).forEach((v,i)=>{if(i<m)a[i]=+v||0});
return a;
}
function setBul(p,a){
const any=a.some(v=>Math.abs(v)>1e-4);
if(!any){delete p.bulge; return}
p.bulge=a.map(v=>(Math.abs(v)<1e-4)?0:clamp(v,-8,8));
}
export function segBulge(p,i,bg){
const m=plineSegs(p);
if(!p||!m)throw new Error("الخطّ لا يصلح للتحرير");
if(!(i>=0&&i<m))
throw new Error(`الضلع ${i+1} غير موجود — للخطّ ${m} ضلعاً`);
const b=+bg;
if(!isFinite(b))throw new Error("انحناءٌ غير رقميّ");
const a=bulArr(p);
a[i]=(Math.abs(b)<1e-4)?0:clamp(b,-8,8);
setBul(p,a);
touchView();
return {i,bulge:a[i],straight:a[i]?0:1};
}
export function insertVert(p,i,at){
const P=(p&&p.pts)||[], n=P.length, m=plineSegs(p);
if(!m)throw new Error("الخطّ لا يصلح للتحرير");
if(!(i>=0&&i<m))
throw new Error(`الضلع ${i+1} غير موجود — للخطّ ${m} ضلعاً`);
if(n>=LIM_VERTS)
throw new Error(`${n} رأساً — الحدّ ${LIM_VERTS}`);
const a=P[i], b=P[(i+1)%n];
const A=bulgeArc(a,b,(p.bulge&&p.bulge[i])?+p.bulge[i]:0);
const arr=bulArr(p);
let q, b1, b2;
if(A){
const u=A.a0+A.sweep/2;
q=[R(A.cx+A.r*Math.cos(u)), R(A.cy+A.r*Math.sin(u))];
const h=Math.tan(A.sweep/8);
b1=h; b2=h;
}else{
const t=(at&&isFinite(at[0]))?nearOnSeg(a,b,at[0],at[1]).t:0.5;
const f=clamp(t==null?0.5:t,0.02,0.98);
q=[R(a[0]+(b[0]-a[0])*f), R(a[1]+(b[1]-a[1])*f)];
b1=0; b2=0;
}
if(dist_pt(q,a)<1||dist_pt(q,b)<1)
throw new Error("الرأسُ الجديد يلتصق برأسٍ قائم — انقر أبعد");
P.splice(i+1,0,q);
arr.splice(i,1,b1,b2);
setBul(p,arr);
touchView();
return {i:i+1,p:q.slice(),verts:P.length};
}
export function delVert(p,i){
const P=(p&&p.pts)||[], n=P.length;
const closed=(p&&p.closed===1&&n>2);
const min=closed?4:3;
if(n<min)
throw new Error(closed
?"الخطّ المغلق لا ينزل عن ثلاثة رؤوس — احذف الخطّ كلَّه"
:"الخطّ لا ينزل عن نقطتين — احذف الخطّ كلَّه");
if(!(i>=0&&i<n))
throw new Error(`الرأس ${i+1} غير موجود — للخطّ ${n} رأساً`);
const arr=bulArr(p);
P.splice(i,1);
if(i===0)arr.splice(0,1);
else if(i>=arr.length)arr.splice(arr.length-1,1);
else{arr.splice(i-1,2,0)}
setBul(p,arr);
touchView();
return {i,verts:P.length};
}
export const LIM_VERTS=200;
export function plinePrims(p){
const L="A-PLINE", out=[], P=p.pts||[], n=P.length;
if(n<2)return out;
const m=p.closed===1?n:n-1;
for(let i=0;i<m;i++){
const a=P[i], b=P[(i+1)%n];
const bg=(p.bulge&&p.bulge[i])?+p.bulge[i]:0;
const A=bulgeArc(a,b,bg);
if(A)out.push({t:"arc",L,cx:R(A.cx),cy:R(A.cy),r:R(A.r),
a0:A.a0*180/Math.PI,a1:A.a1*180/Math.PI,oid:p.id});
else out.push({t:"line",L,a,b,oid:p.id});
}
return out;
}
