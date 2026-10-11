import {S} from "./state.js";
import {netArea,netPerim,isStale} from "./areas.js";
import {okName,okOf,panOf,openState} from "./opens.js";
import {wallLen,WTYPE,isLow,lowH} from "./walls.js";
import {vis,plots} from "./layers.js";
import {CK,CT,colW,colArea} from "./cols.js";
import {fixName} from "./fixt.js";
import {stGeoms,stCheck} from "./stairs.js";
import {levelOf,activeLevel,levelTag,levelsOf} from "./level.js";
const inScope=L=>vis(L)&&plots(L);
function levelFilter(arr,lvl,res){
if(lvl==null)return arr;
const out=[];
arr.forEach(e=>{
if(levelOf(e)===lvl){
if(e!=null&&e.level==null)res.nolevel++;
out.push(e);
}
});
return out;
}
const wallLay=w=>isLow(w)?"A-WALL-LOW":"A-WALL";
export function modeOf(vals){
const m=new Map();
(vals||[]).forEach(v=>{
const k=Math.round(+v||0);
m.set(k,(m.get(k)||0)+1);
});
let best=0, bn=-1;
m.forEach((c,k)=>{
if(c>bn||(c===bn&&k>best)){bn=c; best=k}
});
return {v:m.size?best:0, n:m.size};
}
export function areaRows(level){
const L="A-AREA", scope=inScope(L);
const res={nolevel:0};
const src=levelFilter(S.areas,level,res);
const hidden=scope?0:(vis(L)?0:src.length);
const noplot=scope?0:(vis(L)?src.length:0);
const rows=(scope?src:[]).map(a=>{
const ar=netArea(a), st=isStale(a)?1:0;
let valid="سليمة";
if(st)valid="قديمة";
else if(ar<1000)valid="صفرية";
return {id:a.id, name:a.name||"(بلا اسم)", area:ar,
perim:netPerim(a), stale:st, valid};
});
rows.sort((x,y)=>(y.area-x.area)||x.id.localeCompare(y.id));
return {rows,
total:rows.reduce((s,r)=>s+r.area,0),
stale:rows.reduce((s,r)=>s+r.stale,0),
n:rows.length,
hidden, noplot, nolevel:res.nolevel};
}
export function openRows(level){
const G=new Map();
const res={nolevel:0};
const src=levelFilter(S.opens,level,res);
let hidden=0, noplot=0, total=0, bad=0;
src.forEach(o=>{
const k=o.kind, L=okOf(k).lay;
if(!inScope(L)){
if(!vis(L))hidden++; else noplot++;
return;
}
total++;
const isBad=openState(o)!=="ok";
if(isBad)bad++;
let r=G.get(k);
if(!r){
r={kind:k, name:okName(k), n:0, ar:0,
wMin:1/0, wMax:0, hMin:1/0, hMax:0, pan:0, bad:0};
G.set(k,r);
}
r.n++;
if(isBad)r.bad++;
r.ar+=(+o.w||0)*(+o.h||0);
if(o.w<r.wMin)r.wMin=o.w;
if(o.w>r.wMax)r.wMax=o.w;
if(o.h<r.hMin)r.hMin=o.h;
if(o.h>r.hMax)r.hMax=o.h;
if(okOf(k).pan)r.pan+=panOf(o);
});
const rows=[...G.values()].map(r=>{
if(!isFinite(r.wMin))r.wMin=0;
if(!isFinite(r.hMin))r.hMin=0;
return r;
});
rows.sort((a,b)=>(b.n-a.n)||a.kind.localeCompare(b.kind));
return {rows,
total,
ar:rows.reduce((s,r)=>s+r.ar,0),
n:rows.length,
hidden, noplot, bad, nolevel:res.nolevel};
}
export function wallRows(level){
const G=new Map();
const byId=new Map();
const res={nolevel:0};
const srcW=levelFilter(S.walls,level,res);
let hidden=0, noplot=0;
srcW.forEach(w=>{
byId.set(w.id,w);
const L=wallLay(w);
if(!inScope(L)){if(!vis(L))hidden++; else noplot++}
});
const opn=new Map();
levelFilter(S.opens,level,{nolevel:0}).forEach(o=>{
const w=byId.get(o.wall);
if(!w)return;
const L=okOf(o.kind).lay;
if(!inScope(L))return;
const t=w.type;
opn.set(t,(opn.get(t)||0)+1);
});
srcW.forEach(w=>{
if(!inScope(wallLay(w)))return;
const t=w.type;
let r=G.get(t);
if(!r){
r={type:t, name:(WTYPE[t]||{}).n||t, n:0, len:0, face:0, vol:0,
ts:[], hs:[], t:0, tn:0, h:0, opens:0};
G.set(t,r);
}
const len=wallLen(w);
const h=isLow(w)?lowH(w):(+S.meta.wallH||3000);
r.n++;
r.len+=len;
r.face+=Math.round(len*h);
r.vol+=Math.round(len*h*w.t);
r.ts.push(w.t);
r.hs.push(h);
});
const rows=[...G.values()].map(r=>{
const M=modeOf(r.ts);
r.t=M.v; r.tn=M.n;
r.h=modeOf(r.hs).v;
r.len=Math.round(r.len);
r.opens=opn.get(r.type)||0;
delete r.ts; delete r.hs;
return r;
});
const ORD={ext:0,int:1,low:2};
rows.sort((a,b)=>((ORD[a.type]==null?9:ORD[a.type])
-(ORD[b.type]==null?9:ORD[b.type]))||a.type.localeCompare(b.type));
return {rows,
len:rows.reduce((s,r)=>s+r.len,0),
face:rows.reduce((s,r)=>s+r.face,0),
vol:rows.reduce((s,r)=>s+r.vol,0),
n:rows.reduce((s,r)=>s+r.n,0),
hidden, noplot, nolevel:res.nolevel};
}
export function wallDetailRows(){
const cnt=new Map();
S.opens.forEach(o=>cnt.set(o.wall,(cnt.get(o.wall)||0)+1));
return S.walls.map(w=>{
const len=wallLen(w);
const h=isLow(w)?lowH(w):(+S.meta.wallH||3000);
const L=wallLay(w);
let state="سليم";
if(!vis(L))state="طبقة مخفية";
else if(!plots(L))state="غير قابلة للطباعة";
return {id:w.id, type:w.type, name:(WTYPE[w.type]||{}).n||w.type,
len, t:w.t, h, face:Math.round(len*h), vol:Math.round(len*h*w.t),
state, valid:state, opens:cnt.get(w.id)||0, level:levelOf(w)};
});
}
export function openDetailRows(){
return S.opens.map(o=>{
const st=openState(o);
const valid={ok:"سليم", orphan:"يتيم", over:"خارج المدى",
clash:"متراكب"}[st]||st;
const L=okOf(o.kind).lay;
let layValid="سليم";
if(!vis(L))layValid="طبقة مخفية";
else if(!plots(L))layValid="غير قابلة للطباعة";
return {id:o.id, wall:o.wall, kind:o.kind, name:okName(o.kind),
w:o.w, h:o.h, sill:o.sill||0, s:o.s, state:st, valid, layValid,
level:levelOf(o)};
});
}
export function colRows(level){
const L="A-COLS", scope=inScope(L), G=new Map();
const res={nolevel:0};
const src=levelFilter(S.cols,level,res);
const hidden=scope?0:(vis(L)?0:src.length);
const noplot=scope?0:(vis(L)?src.length:0);
(scope?src:[]).forEach(c=>{
const k=(c.kind==="circ")?"circ":"rect", ty=c.type||"conc";
const key=k+"|"+ty;
let r=G.get(key);
if(!r){
r={kind:k, type:ty, name:`${CK[k]||k} · ${CT[ty]||ty}`,
n:0, area:0, wMin:1/0, wMax:0};
G.set(key,r);
}
r.n++; r.area+=colArea(c);
const w=colW(c);
if(w<r.wMin)r.wMin=w;
if(w>r.wMax)r.wMax=w;
});
const rows=[...G.values()].map(r=>{
if(!isFinite(r.wMin))r.wMin=0;
return r;
});
rows.sort((a,b)=>(b.n-a.n)||a.kind.localeCompare(b.kind));
return {rows,
n:rows.reduce((s,r)=>s+r.n,0),
area:rows.reduce((s,r)=>s+r.area,0),
hidden, noplot, nolevel:res.nolevel};
}
export function fixRows(level){
const L="A-FIXT", scope=inScope(L), G=new Map();
const res={nolevel:0};
const src=levelFilter(S.fixt,level,res);
const hidden=scope?0:(vis(L)?0:src.length);
const noplot=scope?0:(vis(L)?src.length:0);
(scope?src:[]).forEach(f=>{
const k=f.kind;
let r=G.get(k);
if(!r){r={kind:k, name:fixName(f), n:0}; G.set(k,r)}
r.n++;
});
const rows=[...G.values()];
rows.sort((a,b)=>(b.n-a.n)||a.kind.localeCompare(b.kind));
return {rows, n:rows.reduce((s,r)=>s+r.n,0),
hidden, noplot, nolevel:res.nolevel};
}
export function stairRows(level){
const L="A-STRS", scope=inScope(L);
const res={nolevel:0};
const src=levelFilter(S.stairs,level,res);
const hidden=scope?0:(vis(L)?0:src.length);
const noplot=scope?0:(vis(L)?src.length:0);
let bad=0;
const rows=(scope?src:[]).map(st=>{
const gs=stGeoms(st), c=stCheck(st);
if(!c.ok)bad++;
return {id:st.id, type:st.type||"straight", w:st.w, n:c.n,
len:gs.reduce((s,g)=>s+g.L,0), ok:c.ok};
});
return {rows,
n:rows.length,
len:rows.reduce((s,r)=>s+r.len,0),
bad, hidden, noplot, nolevel:res.nolevel};
}
export function boq(){
return {
level:activeLevel(S.meta), levels:levelsOf(S),
name:String(S.meta.name||"PLAN"),
scale:+S.meta.scale||100,
date:String(S.meta.date||""),
wallH:+S.meta.wallH||3000,
areas:areaRows(),
opens:openRows(),
walls:wallRows(),
cols:colRows(),
fixt:fixRows(),
stairs:stairRows(),
wallsDetail:wallDetailRows(),
opensDetail:openDetailRows()};
}
export function boqLevel(level){
const L=level==null?activeLevel(S.meta):Math.round(+level||0);
return {
level:L, tag:levelTag(L),
name:String(S.meta.name||"PLAN"),
scale:+S.meta.scale||100,
date:String(S.meta.date||""),
wallH:+S.meta.wallH||3000,
areas:areaRows(L), opens:openRows(L),
walls:wallRows(L), cols:colRows(L),
fixt:fixRows(L), stairs:stairRows(L),
wallsDetail:wallDetailRows().filter(r=>r.level===L),
opensDetail:openDetailRows().filter(r=>r.level===L)};
}
export function levelGroups(){
const ls=levelsOf(S), act=activeLevel(S.meta);
return {active:act, levels:ls,
common:{},
groups:ls.map(L=>({level:L, tag:levelTag(L), active:L===act?1:0,
walls:wallRows(L), opens:openRows(L),
areas:areaRows(L), cols:colRows(L),
stairs:stairRows(L), fixt:fixRows(L)}))};
}
export const boqLine=B=>{
const ex=(B.walls.hidden+B.walls.noplot+B.opens.hidden+B.opens.noplot
+B.areas.hidden+B.areas.noplot+B.cols.hidden+B.cols.noplot
+B.fixt.hidden+B.fixt.noplot+B.stairs.hidden+B.stairs.noplot);
return `${B.walls.n} جداراً · `
+`${B.opens.total} فتحة · ${B.areas.n} منطقة`
+(B.cols.n?` · ${B.cols.n} عموداً`:"")
+(B.fixt.n?` · ${B.fixt.n} أداة`:"")
+(B.stairs.n?` · ${B.stairs.n} درجاً`:"")
+(B.opens.bad?` · ${B.opens.bad} معطوبة`:"")
+(B.areas.stale?` · ${B.areas.stale} قديمة`:"")
+(B.stairs.bad?` · ${B.stairs.bad} درجاً خارج المدى`:"")
+(ex?` · ${ex} خارج الطباعة`:"");
};
