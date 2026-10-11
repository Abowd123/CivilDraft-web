import {S,touchView,edit} from "./state.js";
import {clamp} from "./units.js";
import * as Store from "../io/store.js";
import {LIM} from "./limits.js";
let img=null, imgSrc=null, locked=false;
let notify=()=>{};
export const onChange=fn=>{notify=(typeof fn==="function")?fn:(()=>{})};
let warn=()=>{};
export const onWarn=fn=>{warn=(typeof fn==="function")?fn:(()=>{})};
export const MAX_SRC=LIM.imageBytes.max;
const WARN_LS=1.5*1024*1024;
function loadImg(src){
imgSrc=src;
if(!src||typeof Image==="undefined"){img=null; return}
const im=new Image();
im.onload=()=>{
if(imgSrc!==src)return;
if(!im.naturalWidth||!im.naturalHeight){
warn("الصورة المرجعية بأبعادٍ صفرية — رُفضت.");
img=null;
S.underlay.w=0; S.underlay.h=0; S.underlay.visible=0;
touchView(); notify();
return;
}
img=im;
S.underlay.w=im.naturalWidth; S.underlay.h=im.naturalHeight;
touchView(); notify();
};
im.src=src;
}
export function state(){
if(S.underlay.src!==imgSrc)loadImg(S.underlay.src);
return {...S.underlay,img,locked};
}
export function setImage(src){
const s=String(src||"");
if(s&&!/^data:image\//.test(s)){
warn("الصورة المرجعية يجب أن تكون data:image/… — رُفضت.");
return {ok:0,why:"ليست data:image/"};
}
if(s&&s.length>MAX_SRC){
warn(`الصورة المرجعية كبيرة (${(s.length/1e6).toFixed(1)} م.ب) — `
+`الحدّ ${(MAX_SRC/1e6).toFixed(0)} م.ب. صغّرها أو اقتطعها قبل `
+`التحميل.`);
return {ok:0,why:"تتجاوز الحدّ"};
}
edit(()=>{
S.underlay.src=s;
S.underlay.w=0; S.underlay.h=0;
S.underlay.visible=1;
},"تحميل صورة مرجعية");
if(s.length>WARN_LS&&Store.mode()==="ls")
warn(`الصورة المرجعية ${(s.length/1e6).toFixed(1)} م.ب — قد `
+`تتجاوز حجمَ المشروع حدّ التخزين الاحتياطيّ. احفظ ملفّاً بعد `
+`إتمام العمل.`);
loadImg(S.underlay.src);
notify();
return {ok:1};
}
export const setOpacity=v=>{
const n=Number(v);
if(v===""||v==null||!Number.isFinite(n))return false;
S.underlay.opacity=clamp(n,0,1); touchView(); notify();
return true;
};
export const setVisible=v=>{
S.underlay.visible=v?1:0; touchView(); notify();
return true;
};
export const setLocked=v=>{locked=!!v; notify()};
const num=v=>(v===""||v==null)?NaN:Number(v);
export function move(x,y){
if(locked)return false;
if(!S.underlay.w||!S.underlay.h)return false;
const nx=num(x), ny=num(y);
if(!Number.isFinite(nx)||!Number.isFinite(ny))return false;
const r=edit(()=>{
S.underlay.x=nx; S.underlay.y=ny;
return true;
},"نقل الصورة المرجعية",{bump:"view"});
if(r===true)notify();
return r===true;
}
export const setRotation=r=>{
const n=num(r);
if(!Number.isFinite(n))return false;
const out=edit(()=>{
S.underlay.rot=n;
return true;
},"دوران الصورة المرجعية",{bump:"view"});
if(out===true)notify();
return out===true;
};
export const setScale=mpp=>{
const n=num(mpp);
if(!Number.isFinite(n)||n<=0)return false;
const out=edit(()=>{
S.underlay.mpp=clamp(n,1e-9,1000);
return true;
},"مقياس الصورة المرجعية",{bump:"view"});
if(out===true)notify();
return out===true;
};
export function calibrate(p1,p2,realMeters){
const x1=num(p1&&p1.x), y1=num(p1&&p1.y);
const x2=num(p2&&p2.x), y2=num(p2&&p2.y);
const real=num(realMeters);
const cur=Math.hypot(x2-x1,y2-y1);
if(![x1,y1,x2,y2,real].every(Number.isFinite)||cur<=0||real<=0)
return S.underlay.mpp;
const r=edit(()=>{
S.underlay.mpp=clamp(S.underlay.mpp*real/cur,1e-9,1000);
return S.underlay.mpp;
},"معايرة الصورة المرجعية",{bump:"view"});
notify();
return r===undefined?S.underlay.mpp:r;
}
export function draw(ctx,worldToScreen,pxPerWorld){
const st=state();
if(!st.visible||!st.img)return;
const o=worldToScreen([st.x,st.y]);
const sw=st.w*st.mpp*pxPerWorld, sh=st.h*st.mpp*pxPerWorld;
ctx.save(); ctx.globalAlpha=st.opacity; ctx.translate(o[0],o[1]);
ctx.rotate(-st.rot);
ctx.drawImage(st.img,0,-sh,sw,sh); ctx.restore();
}
