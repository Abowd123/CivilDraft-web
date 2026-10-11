import {S} from "./state.js";
import {clamp} from "./units.js";
import {nearOnSeg,lineX} from "./geom.js";
import {dir,faces,isLow,isArc,arcPoint,arcMidPoint,arcNear,arcPerp} from "./walls.js";
import {arcParams,arcLineInt,arcArcInt,inSweep} from "./arcmath.js";
import {opensOf,span,openPt} from "./opens.js";
import {colPoly,colW} from "./cols.js";
import {stPolys,stGeoms} from "./stairs.js";
import {vis} from "./layers.js";
import {refSnap} from "./ref.js";
import * as SI from "./sindex.js";
export const MODES=[
{k:"end", n:"نهاية", mk:"sq"},
{k:"mid", n:"منتصف", mk:"tri"},
{k:"cen", n:"مركز", mk:"cen"},
{k:"int", n:"تقاطع", mk:"x"},
{k:"nod", n:"عقدة",  mk:"plus"},
{k:"per", n:"عمودي", mk:"per"},
{k:"par", n:"موازٍ", mk:"parl"},
{k:"tan", n:"مماس", mk:"tan"},
{k:"near",n:"أقرب",  mk:"near"},
{k:"ref", n:"مرجع",  mk:"ref"}];
export const MNAME={};
MODES.forEach(m=>{MNAME[m.k]=m.n});
export const osOn=()=>MODES.some(m=>+S.os[m.k]);
export const osSummary=()=>{
const on=MODES.filter(m=>+S.os[m.k]);
return on.length?on.map(m=>m.n).join(" · "):"لا أنماط";
};
const visW=w=>vis(isLow(w)?"A-WALL-LOW":"A-WALL");
const wallsVis=list=>(list||S.walls).filter(visW);
const nearRing=(ring,x,y)=>{
if(!ring||ring.length<2)return null;
let best=null,bd=1/0;
for(let i=0;i<ring.length;i++){
const r=nearOnSeg(ring[i],ring[(i+1)%ring.length],x,y);
if(r.d<bd){bd=r.d;best={p:r.p,d:r.d}}
}
return best;
};
function tangentFromPt(cx,cy,R,px,py){
const dx=px-cx,dy=py-cy,d2=dx*dx+dy*dy,R2=R*R;
if(d2<=R2+1e-6)return [];
const d=Math.sqrt(d2);
const alpha=Math.acos(clamp(R/d,-1,1));
const theta=Math.atan2(dy,dx);
return [theta+alpha,theta-alpha];
}
export function osnap(x,y,tol,from){
if(!osOn())return null;
const best={};
const isBase=p=>from&&Math.hypot(p[0]-from[0],p[1]-from[1])<1;
const T=(m,p,ex)=>{
if(!+S.os[m]||isBase(p))return;
const d=Math.hypot(p[0]-x,p[1]-y);
if(d>tol)return;
if(!best[m]||d<best[m].d)
best[m]=Object.assign(
{m,d,p:[Math.round(p[0]),Math.round(p[1])]},ex||{});
};
const Tf=(m,p,ex)=>{
if(!+S.os[m]||isBase(p))return;
const d=Math.hypot(p[0]-x,p[1]-y);
if(!best[m]||d<best[m].d)
best[m]=Object.assign(
{m,d,p:[Math.round(p[0]),Math.round(p[1])]},ex||{});
};
const box=SI.boxAt(x,y,tol);
const WV=wallsVis(SI.entsIn(box,"wall"));
WV.forEach(w=>{
T("end",w.a); T("end",w.b);
if(isArc(w)){
const mp=arcMidPoint(w);
if(mp)T("mid",mp);
[w.t/2,-w.t/2].forEach(off=>{
[0,1].forEach(u=>{const q=arcPoint(w,u,off); if(q)T("end",q)});
const q=arcPoint(w,0.5,off);
if(q)T("mid",q);
});
if(+S.os.near){
const r=arcNear(w,x,y);
if(r.d<=tol)T("near",r.p);
}
if(from&&+S.os.per)
arcPerp(w,from[0],from[1]).forEach(q=>T("per",q,{from}));
if(+S.os.cen){
const P=arcParams(w);
if(P)Tf("cen",[P.cx,P.cy]);
}
if(from&&+S.os.tan){
const P=arcParams(w);
if(P)tangentFromPt(P.cx,P.cy,P.R,from[0],from[1]).forEach(th=>{
if(inSweep(P,th))
Tf("tan",[P.cx+P.R*Math.cos(th),P.cy+P.R*Math.sin(th)],{from});
});
}
return;
}
T("mid",[(w.a[0]+w.b[0])/2,(w.a[1]+w.b[1])/2]);
const F=faces(w);
if(F){
[F.l,F.r].forEach(f=>{
T("end",f[0]); T("end",f[1]);
T("mid",[(f[0][0]+f[1][0])/2,(f[0][1]+f[1][1])/2]);
});
}
const d=dir(w);
if(!d)return;
const s=(x-w.a[0])*d.ux+(y-w.a[1])*d.uy;
if(s>=0&&s<=d.L)T("near",[w.a[0]+d.ux*s,w.a[1]+d.uy*s]);
if(from){
const t=clamp((from[0]-w.a[0])*d.ux+(from[1]-w.a[1])*d.uy,0,d.L);
T("per",[w.a[0]+d.ux*t,w.a[1]+d.uy*t],{from});
if(+S.os.par){
const dx=x-from[0], dy=y-from[1];
const across=Math.abs(dx*d.uy-dy*d.ux);
const along=dx*d.ux+dy*d.uy;
if(across<=tol&&along>1)
T("par",[from[0]+d.ux*along, from[1]+d.uy*along],{from});
}
}
opensOf(w.id).forEach(o=>{
const [a,b]=span(o);
T("end",openPt(w,a)); T("end",openPt(w,b));
T("mid",openPt(w,o.s));
});
});
if(vis("A-COLS"))SI.entsIn(box,"col").forEach(c=>{
const p=colPoly(c);
if(!p)return;
T("nod",[c.x,c.y]);
if(c.kind!=="circ")p.forEach(q=>T("end",q));
if(c.kind==="circ"){
const Rc=colW(c)/2;
if(+S.os.cen)Tf("cen",[c.x,c.y]);
if(from&&+S.os.per){
const dx=from[0]-c.x,dy=from[1]-c.y,d0=Math.hypot(dx,dy);
if(d0>1e-6)T("per",[c.x+dx/d0*Rc,c.y+dy/d0*Rc],{from});
}
if(from&&+S.os.tan)
tangentFromPt(c.x,c.y,Rc,from[0],from[1]).forEach(th=>
Tf("tan",[c.x+Rc*Math.cos(th),c.y+Rc*Math.sin(th)],{from}));
}
if(+S.os.near){
if(c.kind==="circ"){
const Rc=colW(c)/2;
const dx=x-c.x, dy=y-c.y, d0=Math.hypot(dx,dy);
if(d0>1e-6){
const ux=dx/d0, uy=dy/d0;
const q={p:[Math.round(c.x+ux*Rc),Math.round(c.y+uy*Rc)],
d:Math.abs(d0-Rc)};
T("near",q.p);
}
}else{
const q=nearRing(p,x,y);
if(q)T("near",q.p);
}
}
});
if(vis("A-STRS"))SI.entsIn(box,"stair").forEach(s=>{
stPolys(s).forEach(p=>{
if(!p)return;
p.forEach(q=>T("end",q));
if(+S.os.near){const q=nearRing(p,x,y); if(q)T("near",q.p)}
});
stGeoms(s).forEach(g=>{T("end",g.a); T("end",g.b)});
});
if(vis("A-AREA"))SI.entsIn(box,"area").forEach(a=>{
a.ring.forEach(q=>T("end",q));
if(+S.os.near){const q=nearRing(a.ring,x,y); if(q)T("near",q.p)}
});
if(+S.os.int){
const near=wallsVis(SI.entsIn(SI.boxAt(x,y,tol*4),"wall"))
.filter(w=>isArc(w)
? arcNear(w,x,y).d<tol*4
: nearOnSeg(w.a,w.b,x,y).d<tol*4)
.slice(0,50);
for(let i=0;i<near.length;i++)for(let j=i+1;j<near.length;j++){
const wi=near[i], wj=near[j];
let pts=[];
if(isArc(wi)&&isArc(wj)){
pts=arcArcInt(wi,wj);
}else if(isArc(wi)&&!isArc(wj)){
pts=arcLineInt(wi,wj.a,wj.b);
}else if(!isArc(wi)&&isArc(wj)){
pts=arcLineInt(wj,wi.a,wi.b);
}else{
const p=lineX(wi.a,wi.b,wj.a,wj.b);
if(p){
const on=q=>nearOnSeg(q.a,q.b,p[0],p[1]).d<2;
if(on(wi)&&on(wj))pts=[p];
}
}
pts.forEach(p=>T("int",p));
}
}
if(vis("A-GRID")){
const X=S.grid.xs.filter(v=>Math.abs(v-x)<=tol);
const Y=S.grid.ys.filter(v=>Math.abs(v-y)<=tol);
X.forEach(gx=>Y.forEach(gy=>T("nod",[gx,gy])));
}
if(+S.os.ref&&vis("A-REFR")){
const rf=refSnap(x,y,tol);
if(rf&&(!best.ref||rf.d*1.05<best.ref.d))
best.ref={m:"ref",d:rf.d*1.05,p:rf.p,kind:rf.kind};
}
for(const m of MODES)if(best[m.k])return best[m.k];
return null;
}
