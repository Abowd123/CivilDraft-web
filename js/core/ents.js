import {S,touch,touchGeom,touchOpen,touchView} from "./state.js";
import {shapeInRect} from "./geom.js";
import {ENT,ORD,HORD,KINDS,COLL,NAME,entDef} from "./entreg.js";
import {pickable} from "./layers.js";
import * as SI from "./sindex.js";
export {COLL,NAME,KINDS,entDef};
export const KORDER=KINDS;
export function findById(id){
const q=String(id||"").trim().toUpperCase();
if(!q)return null;
for(const d of ORD){
const e=(S[d.coll]||[]).find(x=>
String(x.id).toUpperCase()===q);
if(e)return {k:d.k,id:e.id};
}
return null;
}
export function entOf(s){
if(!s)return null;
const d=ENT[s.k];
return d?d.byId(s.id):null;
}
const of=(s,fn,dflt)=>{
if(!s)return dflt;
const d=ENT[s.k];
if(!d||!d[fn])return dflt;
const e=d.byId(s.id);
return e?d[fn](e):dflt;
};
export function hitTest(x,y,tol,kinds){
const T=tol||150;
const only=kinds?[].concat(kinds):null;
const Q=SI.query(SI.boxAt(x,y,Math.max(T*1.25,220)));
for(const d of HORD){
if(only&&!only.includes(d.k))continue;
const c=Q[d.k];
if(!c||!c.length)continue;
const cand=c.map(r=>r.e);
const ok=id=>pickable({k:d.k,id});
const e=d.hit(x,y,T,tol,ok,cand);
if(!e)continue;
const s={k:d.k,id:e.id};
if(pickable(s))return s;
}
return null;
}
export const shapeOf  =s=>of(s,"shape",null);
export const outlineOf=s=>of(s,"outline",null);
export const gripsOf=s=>pickable(s)?of(s,"grips",[]):[];
const BW={geom:3,open:2,view:1};
export function bumpOf(list){
let best="view", bw=1;
(list||[]).forEach(s=>{
const d=s&&ENT[s.k];
const b=(d&&d.bump)||"geom";
const w=BW[b]||3;
if(w>bw){bw=w; best=b}
});
return best;
}
export const touchFn=b=>(b==="view")?touchView
:((b==="open")?touchOpen:touchGeom);
export const isGeom=s=>bumpOf([s])==="geom";
export const grabOf=s=>of(s,"grab",null);
export function dragGrip(g,o,p,dx,dy){
if(!o||!g||!g.s)return;
const d=ENT[g.s.k];
if(d&&d.drag)d.drag(o,g,p,dx,dy);
}
export function moveEnt(s,o,dx,dy){
if(!o||!s)return;
const d=ENT[s.k];
if(d&&d.move)d.move(o,dx,dy);
}
export function delEnts(list){
const c={};
ORD.forEach(d=>{c[d.coll]=0});
const done={};
let skip=0;
(list||[]).forEach(s=>{
if(!pickable(s)){skip++; return}
const d=ENT[s.k];
if(!d)return;
const e=d.byId(s.id);
if(!e||!d.del(e))return;
c[d.coll]++;
(done[d.k]=done[d.k]||new Set()).add(s.id);
});
ORD.forEach(d=>{
if(!d.cascade||!done[d.k]||!done[d.k].size)return;
const add=d.cascade(done[d.k])||{};
Object.keys(add).forEach(k=>{c[k]=(c[k]||0)+add[k]});
});
touch();
c.skipped=skip;
return c;
}
export function pickInRect(r,win,add,prev){
const out=add?(prev||[]).slice():[];
const has=s=>out.some(x=>x.k===s.k&&x.id===s.id)||!pickable(s);
const Q=SI.query(r);
ORD.forEach(d=>(Q[d.k]||[]).forEach(rec=>{
const s={k:d.k,id:rec.e.id};
if(has(s))return;
const sh=d.shape?d.shape(rec.e):null;
if(sh&&shapeInRect(sh,r,win))out.push(s);
}));
return out;
}
export const allEnts=()=>{
const out=[];
ORD.forEach(d=>(S[d.coll]||[]).forEach(e=>out.push({k:d.k,id:e.id})));
return out;
};
export const pickEnts=()=>allEnts().filter(pickable);
export const delSay=r=>{
const P=[];
ORD.forEach(d=>{if(r[d.coll])P.push(`${r[d.coll]} ${d.n}`)});
return P.join(" و ")||"لا شيء";
};
