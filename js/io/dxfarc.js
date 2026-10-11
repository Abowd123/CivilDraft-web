import {isArc,arcParams} from "../core/walls.js";
export function arcCircles(walls){
const out=[];
(walls||[]).forEach(w=>{
const P=arcParams(w);
if(!P||!isArc(w))return;
const h=(+w.t||0)/2;
[P.R+h, P.R-h].forEach(R=>{
if(R>1)out.push({cx:P.cx,cy:P.cy,R});
});
});
return out;
}
const TAU=2*Math.PI;
const norm=a=>{ while(a<=-Math.PI)a+=TAU; while(a>Math.PI)a-=TAU; return a };
function circLine(c,x,y){
const dx=y[0]-x[0], dy=y[1]-x[1];
const fx=x[0]-c.cx, fy=x[1]-c.cy;
const A=dx*dx+dy*dy;
if(A<1e-9)return null;
const B=2*(fx*dx+fy*dy), Cc=fx*fx+fy*fy-c.R*c.R;
const D=B*B-4*A*Cc;
if(D<0)return null;
const q=Math.sqrt(D);
const t=[(-B-q)/(2*A),(-B+q)/(2*A)].sort((a,b)=>Math.abs(a)-Math.abs(b))[0];
return [x[0]+t*dx, x[1]+t*dy];
}
export function arcifyRing(ring, circles, opt){
const O=opt||{}, tol=O.tol||1.6, maxStep=O.maxStep||(20*Math.PI/180);
const extStep=O.extStep||(9*Math.PI/180);
const n=(ring||[]).length;
const plain=()=>(ring||[]).map(p=>({p,b:0}));
if(n<4||!circles||!circles.length)return plain();
const cid=ring.map(p=>{
let best=-1, bd=tol;
for(let k=0;k<circles.length;k++){
const c=circles[k];
const d=Math.abs(Math.hypot(p[0]-c.cx,p[1]-c.cy)-c.R);
if(d<=bd){bd=d; best=k}
}
return best;
});
if(cid.every(v=>v===-1))return plain();
const angOf=(c,p)=>Math.atan2(p[1]-c.cy,p[0]-c.cx);
let s0=0;
if(cid.every(v=>v===cid[0])){
const c=circles[cid[0]];
let mx=0, at=0, pos=0, neg=0, big=false;
for(let i=0;i<n;i++){
const st=norm(angOf(c,ring[(i+1)%n])-angOf(c,ring[i]));
if(st>1e-9)pos++; else if(st<-1e-9)neg++;
if(Math.abs(st)>maxStep)big=true;
if(Math.abs(st)>mx){mx=Math.abs(st); at=(i+1)%n}
}
if(!big&&(pos===0||neg===0))return plain();
s0=at;
}else{
for(let i=0;i<n;i++){
if(cid[i]!==cid[(i-1+n)%n]){s0=i;break}
}
}
const Rg=[], C=[];
for(let i=0;i<n;i++){Rg.push(ring[(s0+i)%n]); C.push(cid[(s0+i)%n])}
const ang=angOf;
const runs=[];
let i=0;
while(i<n){
if(C[i]<0){i++; continue}
const c=circles[C[i]];
let j=i, sgn=0, sweep=0;
while(j+1<n&&C[j+1]===C[i]){
const st=norm(ang(c,Rg[j+1])-ang(c,Rg[j]));
if(Math.abs(st)<1e-9||Math.abs(st)>maxStep)break;
const sg=st>0?1:-1;
if(sgn&&sg!==sgn)break;
sgn=sg; sweep+=st; j++;
}
if(j-i>=2&&Math.abs(sweep)<TAU-0.05)
runs.push({i,j,c,sgn,sweep,s:i,e:j,ps:Rg[i],pe:Rg[j]});
i=(j>i)?j+1:i+1;
}
const claimed=new Set();
runs.forEach(r=>{for(let m=r.i;m<=r.j;m++)claimed.add(m)});
const lim=r=>0.0035*r.c.R+tol;
runs.forEach(r=>{
const k=(r.j+1)%n, y=(k+1)%n;
let extE=false, extS=false;
if(C[k]<0&&!claimed.has(k)){
const x=circLine(r.c,Rg[k],Rg[y]);
if(x&&Math.hypot(x[0]-Rg[k][0],x[1]-Rg[k][1])<=lim(r)*4){
const st=norm(ang(r.c,x)-ang(r.c,Rg[r.j]));
if(st*r.sgn>0&&Math.abs(st)<=extStep){
r.e=k; r.pe=x; r.sweep+=st; claimed.add(k); extE=true;
}
}
}
const k2=(r.i-1+n)%n, y2=(k2-1+n)%n;
if(C[k2]<0&&!claimed.has(k2)){
const x=circLine(r.c,Rg[k2],Rg[y2]);
if(x&&Math.hypot(x[0]-Rg[k2][0],x[1]-Rg[k2][1])<=lim(r)*4){
const st=norm(ang(r.c,Rg[r.i])-ang(r.c,x));
if(st*r.sgn>0&&Math.abs(st)<=extStep){
r.s=k2; r.ps=x; r.sweep+=st; claimed.add(k2); extS=true;
}
}
}
if(!extE){
const x=circLine(r.c,Rg[r.j],Rg[k]);
if(x&&Math.hypot(x[0]-Rg[r.j][0],x[1]-Rg[r.j][1])<=2*tol){
const st=norm(ang(r.c,x)-ang(r.c,Rg[r.j]));
r.pe=x; r.sweep+=st;
}
}
if(!extS){
const x=circLine(r.c,Rg[r.i],Rg[k2]);
if(x&&Math.hypot(x[0]-Rg[r.i][0],x[1]-Rg[r.i][1])<=2*tol){
const st=norm(ang(r.c,Rg[r.i])-ang(r.c,x));
r.ps=x; r.sweep+=st;
}
}
});
const skip=new Array(n).fill(false), pt=Rg.slice(), bg=new Array(n).fill(0);
runs.forEach(r=>{
pt[r.s]=r.ps; pt[r.e]=r.pe;
bg[r.s]=Math.tan(r.sweep/4);
for(let m=(r.s+1)%n;m!==r.e;m=(m+1)%n)skip[m]=true;
});
const out=[];
for(let m=0;m<n;m++)if(!skip[m])out.push({p:pt[m],b:bg[m]});
return out;
}
export const arcCount=vs=>(vs||[]).filter(v=>v.b!==0).length;
export function flattenBulged(vs, closed, seg){
const N=seg||24, pts=[];
const m=vs.length;
for(let i=0;i<m;i++){
const a=vs[i], nx=vs[(i+1)%m];
pts.push(a.p);
if(a.b&&(closed||i<m-1)){
const A=a.p, B=nx.p, bg=a.b;
const dx=B[0]-A[0], dy=B[1]-A[1];
const k=(1-bg*bg)/(2*bg);
const cx=A[0]+dx/2-dy/2*k, cy=A[1]+dy/2+dx/2*k;
const r=Math.hypot(A[0]-cx,A[1]-cy);
const a0=Math.atan2(A[1]-cy,A[0]-cx), sw=4*Math.atan(bg);
for(let s=1;s<N;s++){
const t=a0+sw*s/N;
pts.push([cx+r*Math.cos(t),cy+r*Math.sin(t)]);
}
}
}
return pts;
}
