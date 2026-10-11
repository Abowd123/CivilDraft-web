export function project(p, cam){
const x=+p[0]||0, y=+p[1]||0, z=+p[2]||0;
const cy=Math.cos(cam.yaw||0), sy=Math.sin(cam.yaw||0);
const cp=Math.cos(cam.pitch==null?Math.PI/3:cam.pitch);
const sp=Math.sin(cam.pitch==null?Math.PI/3:cam.pitch);
const rx= x*cy - y*sy;
const ry= x*sy + y*cy;
const sx= rx;
const svy= ry*sp + z*cp;
const depth= ry*cp - z*sp;
return {sx, sy:svy, depth};
}
function toScreen(pr, cam){
const k=cam.scale||1;
return [ (cam.ox||0) + pr.sx*k, (cam.oy||0) - pr.sy*k ];
}
export const projScreen=(p,cam)=>toScreen(project(p,cam),cam);
export function projBBox(pts3, cam){
let x0=1/0,y0=1/0,x1=-1/0,y1=-1/0;
for(const p of (pts3||[])){
const pr=project(p,cam);
if(pr.sx<x0)x0=pr.sx; if(pr.sx>x1)x1=pr.sx;
if(pr.sy<y0)y0=pr.sy; if(pr.sy>y1)y1=pr.sy;
}
return (x0>x1)?null:{x0,y0,x1,y1};
}
export function shade(normal, light){
const n=norm3(normal), l=norm3(light||[0.4,-0.5,0.85]);
const d=n[0]*l[0]+n[1]*l[1]+n[2]*l[2];
return Math.max(0, Math.min(1, 0.35 + 0.65*Math.abs(d)));
}
function norm3(v){
const L=Math.hypot(v[0],v[1],v[2])||1;
return [v[0]/L, v[1]/L, v[2]/L];
}
export function rotN(n, cam){
const cy=Math.cos(cam.yaw||0), sy=Math.sin(cam.yaw||0);
return [n[0]*cy-n[1]*sy, n[0]*sy+n[1]*cy, n[2]];
}
export function facing(normal, cam){
const p=(cam.pitch==null)?Math.PI/3:cam.pitch;
const r=rotN(normal, cam);
const d=[0, Math.cos(p), -Math.sin(p)];
return -(r[0]*d[0]+r[1]*d[1]+r[2]*d[2]);
}
export function faceDepth(pts3, cam){
if(!pts3||!pts3.length)return 0;
let s=0;
for(const p of pts3)s+=project(p,cam).depth;
return s/pts3.length;
}
export function fitCam(pts3, cam, w, h, pad){
const bb=projBBox(pts3, cam);
if(!bb)return {scale:1, ox:w/2, oy:h/2};
const P=(pad==null)?24:pad;
const bw=Math.max(1e-6, bb.x1-bb.x0), bh=Math.max(1e-6, bb.y1-bb.y0);
const scale=Math.max(1e-6, Math.min((w-2*P)/bw, (h-2*P)/bh));
return {
scale,
ox: w/2 - ((bb.x0+bb.x1)/2)*scale,
oy: h/2 + ((bb.y0+bb.y1)/2)*scale
};
}
